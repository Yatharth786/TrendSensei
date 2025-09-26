import { type User, type InsertUser, type Product, type InsertProduct, type Analytics, type InsertAnalytics, type ChatMessage, type InsertChatMessage, type ProductWithMetrics, type CategoryPerformance, type GeographicData, type DashboardMetrics, insertProductSchema } from "@shared/schema";
import { randomUUID } from "crypto";
import csv from "csv-parser";
import { Readable } from "stream";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@shared/schema";
import { products, users, chatMessages, analytics } from "@shared/schema";
import { eq, and, desc, sql, gte, lte, ilike } from "drizzle-orm";

const client = neon(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });


export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Product methods
  getProducts(limit?: number, offset?: number, filters?: any): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined>;
  getProductsByCategory(category: string): Promise<Product[]>;
  getTrendingProducts(limit?: number): Promise<ProductWithMetrics[]>;
  getTopProfitProducts(limit?: number): Promise<ProductWithMetrics[]>;
  getUnderperformingProducts(limit?: number): Promise<ProductWithMetrics[]>;
  importProductsFromCsv(stream: Readable): Promise<number>;

  // Analytics methods
  getAnalytics(productId?: string, startDate?: Date, endDate?: Date): Promise<Analytics[]>;
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
  getDashboardMetrics(): Promise<DashboardMetrics>;
  getCategoryPerformance(): Promise<CategoryPerformance[]>;
  getGeographicData(): Promise<GeographicData[]>;

  // Chat methods
  getChatMessages(userId: string, limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // Search and filter methods
  searchProducts(query: string): Promise<Product[]>;
  getProductCount(): Promise<number>;
}

export class DrizzleStorage implements IStorage {
    // User methods
    async getUser(id: string): Promise<User | undefined> {
        const result = await db.select().from(users).where(eq(users.id, id));
        return result[0];
    }

    async getUserByEmail(email: string): Promise<User | undefined> {
        const result = await db.select().from(users).where(eq(users.email, email));
        return result[0];
    }

    async createUser(user: InsertUser): Promise<User> {
        const result = await db.insert(users).values(user).returning();
        return result[0];
    }

    async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
        const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
        return result[0];
    }

    // Product methods
    async getProducts(limit = 50, offset = 0, filters?: any): Promise<Product[]> {
        const query = db.select().from(products).limit(limit).offset(offset);
        const conditions = [];
        if (filters) {
            if (filters.category) {
                conditions.push(eq(products.category, filters.category));
            }
            if (filters.minPrice) {
                conditions.push(gte(products.price, filters.minPrice.toString()));
            }
            if (filters.maxPrice) {
                conditions.push(lte(products.price, filters.maxPrice.toString()));
            }
            if (filters.minRating) {
                conditions.push(gte(products.rating, filters.minRating.toString()));
            }
        }
        if (conditions.length > 0) {
            query.where(and(...conditions));
        }
        return query;
    }

    async getProduct(id: string): Promise<Product | undefined> {
        const result = await db.select().from(products).where(eq(products.id, id));
        return result[0];
    }

    async createProduct(product: InsertProduct): Promise<Product> {
        const result = await db.insert(products).values(product).returning();
        return result[0];
    }

    async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
        const result = await db.update(products).set(updates).where(eq(products.id, id)).returning();
        return result[0];
    }

    async getProductsByCategory(category: string): Promise<Product[]> {
        return db.select().from(products).where(eq(products.category, category));
    }

    async getTrendingProducts(limit = 10): Promise<ProductWithMetrics[]> {
        const result = await db.select().from(products).where(eq(products.trending, true)).orderBy(desc(products.salesVolume)).limit(limit);
        return result.map(p => ({
            ...p,
            salesGrowth: 0,
            revenueGrowth: 0,
            competitivePosition: "leading"
        }));
    }

    async getTopProfitProducts(limit = 10): Promise<ProductWithMetrics[]> {
        const result = await db.select().from(products).orderBy(desc(products.profitMargin)).limit(limit);
        return result.map(p => ({
            ...p,
            salesGrowth: 0,
            revenueGrowth: 0,
            competitivePosition: "profitable"
        }));
    }

    async getUnderperformingProducts(limit = 10): Promise<ProductWithMetrics[]> {
        const result = await db.select().from(products).orderBy(products.salesVolume).limit(limit);
        return result.map(p => ({
            ...p,
            salesGrowth: 0,
            revenueGrowth: 0,
            competitivePosition: "needs attention"
        }));
    }

    async importProductsFromCsv(stream: Readable): Promise<number> {
      return new Promise((resolve, reject) => {
        const productsToInsert: InsertProduct[] = [];
        stream
          .pipe(csv())
          .on("data", (row) => {
            try {
              const productData = insertProductSchema.parse({
                name: row.name,
                category: row.category,
                brand: row.brand,
                description: row.description || null,
                price: String(row.price),
                rating: String(row.rating),
                profitMargin: String(row.profitMargin),
                salesVolume: parseInt(row.salesVolume, 10),
                stockLevel: parseInt(row.stock, 10), // 'stock' from CSV maps to 'stockLevel'
                reviewCount: parseInt(row.reviewCount, 10),
                trending: row.trending?.toLowerCase() === 'true',
                competitorPrices: row.competitorPrices ? JSON.parse(row.competitorPrices) : {},
                locationData: row.locationData ? JSON.parse(row.locationData) : {},
                launchDate: row.launchDate ? new Date(row.launchDate) : new Date(),
              });
              productsToInsert.push(productData);
            } catch (error) {
              console.warn("Skipping invalid CSV row:", row, error);
            }
          })
          .on("end", async () => {
            if (productsToInsert.length > 0) {
              await db.insert(products).values(productsToInsert);
            }
            resolve(productsToInsert.length);
          })
          .on("error", (error) => {
            reject(error);
          });
      });
    }

    // Analytics methods
    async getAnalytics(productId?: string, startDate?: Date, endDate?: Date): Promise<Analytics[]> {
        const conditions = [];
        if (productId) {
            conditions.push(eq(analytics.productId, productId));
        }
        if (startDate) {
            conditions.push(gte(analytics.date, startDate));
        }
        if (endDate) {
            conditions.push(lte(analytics.date, endDate));
        }

        const query = db.select().from(analytics);
        if (conditions.length > 0) {
            query.where(and(...conditions));
        }
        return query;
    }

    async createAnalytics(analyticsData: InsertAnalytics): Promise<Analytics> {
        const result = await db.insert(analytics).values(analyticsData).returning();
        return result[0];
    }

    async getDashboardMetrics(): Promise<DashboardMetrics> {
        // This is a simplified implementation. A real implementation would involve more complex queries.
        const totalRevenueResult = await db.select({ total: sql`sum(${analytics.revenue})` }).from(analytics);
        const totalProductsResult = await db.select({ count: sql`count(*)` }).from(products);
        const avgProfitMarginResult = await db.select({ avg: sql`avg(${products.profitMargin})` }).from(products);
        const avgRatingResult = await db.select({ avg: sql`avg(${products.rating})` }).from(products);

        return {
            totalRevenue: parseFloat(totalRevenueResult[0].total as string) || 0,
            revenueGrowth: 0, // Placeholder
            totalProducts: Number(totalProductsResult[0].count) || 0,
            productGrowth: 0, // Placeholder
            avgProfitMargin: parseFloat(avgProfitMarginResult[0].avg as string) || 0,
            marginGrowth: 0, // Placeholder
            avgRating: parseFloat(avgRatingResult[0].avg as string) || 0,
            ratingGrowth: 0, // Placeholder
        };
    }

    async getCategoryPerformance(): Promise<CategoryPerformance[]> {
        const result = await db.select({
            category: products.category,
            sales: sql`sum(${products.salesVolume})`.as('sales'),
            revenue: sql`sum(${products.salesVolume} * ${products.price})`.as('revenue'),
            profitMargin: sql`avg(${products.profitMargin})`.as('profitMargin'),
        }).from(products).groupBy(products.category);

        return result.map(r => ({
            ...r,
            sales: Number(r.sales),
            revenue: parseFloat(r.revenue as string),
            profitMargin: parseFloat(r.profitMargin as string),
            growth: 0 // Placeholder
        }));
    }

    async getGeographicData(): Promise<GeographicData[]> {
        // This would require location data in the database, which is not currently present.
        return [];
    }

    // Chat methods
    async getChatMessages(userId: string, limit = 50): Promise<ChatMessage[]> {
        return db.select().from(chatMessages).where(eq(chatMessages.userId, userId)).orderBy(desc(chatMessages.timestamp)).limit(limit);
    }

    async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
        const result = await db.insert(chatMessages).values(message).returning();
        return result[0];
    }

    // Search methods
    async searchProducts(query: string): Promise<Product[]> {
        return db.select().from(products).where(ilike(products.name, `%${query}%`));
    }

    async getProductCount(): Promise<number> {
        const result = await db.select({ count: sql`count(*)` }).from(products);
        return Number(result[0].count);
    }
}


export const storage = new DrizzleStorage();