import { type User, type InsertUser, type Product, type InsertProduct, type Analytics, type InsertAnalytics, type ChatMessage, type InsertChatMessage, type ProductWithMetrics, type CategoryPerformance, type GeographicData, type DashboardMetrics, insertProductSchema } from "@shared/schema";
import { randomUUID } from "crypto";
import csv from "csv-parser";
import { Readable } from "stream";
import fs from "fs";
import path from "path";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";
import { products, users, chatMessages, analytics } from "@shared/schema";
import { eq, and, desc, sql, gte, lte, ilike } from "drizzle-orm";

// --- INTERFACE ---
export interface IStorage {
  seed(): Promise<void>;
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getProducts(limit?: number, offset?: number, filters?: any): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined>;
  getProductsByCategory(category: string): Promise<Product[]>;
  getTrendingProducts(limit?: number): Promise<ProductWithMetrics[]>;
  getTopProfitProducts(limit?: number): Promise<ProductWithMetrics[]>;
  getUnderperformingProducts(limit?: number): Promise<ProductWithMetrics[]>;
  importProductsFromCsv(stream: Readable): Promise<number>;
  getAnalytics(productId?: string, startDate?: Date, endDate?: Date): Promise<Analytics[]>;
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
  getDashboardMetrics(): Promise<DashboardMetrics>;
  getCategoryPerformance(): Promise<CategoryPerformance[]>;
  getGeographicData(): Promise<GeographicData[]>;
  getChatMessages(userId: string, limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  searchProducts(query: string): Promise<Product[]>;
  getProductCount(): Promise<number>;
}

// --- DRIZZLE STORAGE IMPLEMENTATION ---
class DrizzleStorage implements IStorage {
    private db: NodePgDatabase<typeof schema>;

    constructor(db: NodePgDatabase<typeof schema>) {
        this.db = db;
    }

    async seed(): Promise<void> {
        const productCount = await this.getProductCount();
        if (productCount === 0) {
            console.log("No products found. Seeding database from data/products.csv...");
            const csvPath = path.join(process.cwd(), "data", "products.csv");
            if (!fs.existsSync(csvPath)) {
                console.warn("data/products.csv not found. Skipping seeding.");
                return;
            }
            const stream = fs.createReadStream(csvPath);
            const count = await this.importProductsFromCsv(stream);
            console.log(`Successfully seeded ${count} products.`);
        } else {
            console.log(`${productCount} products found. Skipping database seeding.`);
        }
    }

    async getUser(id: string): Promise<User | undefined> {
        const result = await this.db.select().from(users).where(eq(users.id, id));
        return result[0];
    }
    async getUserByEmail(email: string): Promise<User | undefined> {
        const result = await this.db.select().from(users).where(eq(users.email, email));
        return result[0];
    }
    async createUser(user: InsertUser): Promise<User> {
        const result = await this.db.insert(users).values(user).returning();
        return result[0];
    }
    async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
        const result = await this.db.update(users).set(updates).where(eq(users.id, id)).returning();
        return result[0];
    }
    async getProducts(limit = 50, offset = 0, filters: any = {}): Promise<Product[]> {
        const query = this.db.select().from(products).limit(limit).offset(offset);
        const conditions = [];
        if (filters.category) { conditions.push(eq(products.category, filters.category)); }
        if (filters.minPrice) { conditions.push(gte(products.price, filters.minPrice.toString())); }
        if (filters.maxPrice) { conditions.push(lte(products.price, filters.maxPrice.toString())); }
        if (conditions.length > 0) { query.where(and(...conditions)); }
        return query;
    }
    async getProduct(id: string): Promise<Product | undefined> {
        const result = await this.db.select().from(products).where(eq(products.product_id, id));
        return result[0];
    }
    async createProduct(product: InsertProduct): Promise<Product> {
        const result = await this.db.insert(products).values(product).returning();
        return result[0];
    }
    async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
        const result = await this.db.update(products).set(updates).where(eq(products.product_id, id)).returning();
        return result[0];
    }
    async getProductsByCategory(category: string): Promise<Product[]> {
        return this.db.select().from(products).where(eq(products.category, category));
    }
    async getTrendingProducts(limit = 10): Promise<ProductWithMetrics[]> {
        const result = await this.db.select().from(products).orderBy(desc(products.event_impact)).limit(limit);
        return result.map((p: Product) => ({ ...p, salesGrowth: 0, revenueGrowth: 0, competitivePosition: "leading" }));
    }
    async getTopProfitProducts(limit = 10): Promise<ProductWithMetrics[]> {
        const result = await this.db.select().from(products).orderBy(desc(products.profit_margin)).limit(limit);
        return result.map((p: Product) => ({ ...p, salesGrowth: 0, revenueGrowth: 0, competitivePosition: "profitable" }));
    }
    async getUnderperformingProducts(limit = 10): Promise<ProductWithMetrics[]> {
        const result = await this.db.select().from(products).orderBy(products.estimated_demand).limit(limit);
        return result.map((p: Product) => ({ ...p, salesGrowth: 0, revenueGrowth: 0, competitivePosition: "needs attention" }));
    }
    async importProductsFromCsv(stream: Readable): Promise<number> {
      return new Promise((resolve, reject) => {
        const productsToInsert: InsertProduct[] = [];
        stream.pipe(csv()).on("data", (row: any) => {
            try {
              const productData = insertProductSchema.parse({
                product_id: row.product_id, date: new Date(row.date), title: row.title, category: row.category, price: String(row.price), rating: String(row.rating), reviews: parseInt(row.reviews, 10), availability: row.availability?.toLowerCase() === 'true', competitor_price: row.competitor_price ? String(row.competitor_price) : null, promotion_flag: row.promotion_flag?.toLowerCase() === 'true', estimated_demand: parseInt(row.estimated_demand, 10), cost_price: row.cost_price ? String(row.cost_price) : null, profit_margin: String(row.profit_margin), event: row.event && row.event !== 'NULL' ? row.event : null, event_impact: row.event_impact ? String(row.event_impact) : null, ad_spend: row.ad_spend ? String(row.ad_spend) : null, market_share: row.market_share ? String(row.market_share) : null,
              });
              productsToInsert.push(productData);
            } catch (error: any) { console.warn("Skipping invalid CSV row:", row, error.message); }
          }).on("end", async () => {
            if (productsToInsert.length > 0) {
              await this.db.insert(products).values(productsToInsert).onConflictDoUpdate({
                target: products.product_id,
                set: { date: sql`excluded.date`, title: sql`excluded.title`, category: sql`excluded.category`, price: sql`excluded.price`, rating: sql`excluded.rating`, reviews: sql`excluded.reviews`, availability: sql`excluded.availability`, competitor_price: sql`excluded.competitor_price`, promotion_flag: sql`excluded.promotion_flag`, estimated_demand: sql`excluded.estimated_demand`, cost_price: sql`excluded.cost_price`, profit_margin: sql`excluded.profit_margin`, event: sql`excluded.event`, event_impact: sql`excluded.event_impact`, ad_spend: sql`excluded.ad_spend`, market_share: sql`excluded.market_share` }
              });
            }
            resolve(productsToInsert.length);
          }).on("error", (error: Error) => { reject(error); });
      });
    }
    async getAnalytics(productId?: string, startDate?: Date, endDate?: Date): Promise<Analytics[]> { return []; }
    async createAnalytics(analyticsData: InsertAnalytics): Promise<Analytics> { return {} as Analytics; }
    async getDashboardMetrics(): Promise<DashboardMetrics> { return {} as DashboardMetrics; }
    async getCategoryPerformance(): Promise<CategoryPerformance[]> { return []; }
    async getGeographicData(): Promise<GeographicData[]> { return []; }
    async getChatMessages(userId: string, limit = 50): Promise<ChatMessage[]> { return []; }
    async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> { return {} as ChatMessage; }
    async searchProducts(query: string): Promise<Product[]> {
      return this.db.select().from(products).where(ilike(products.title, `%${query}%`));
    }
    async getProductCount(): Promise<number> {
        const result = await this.db.select({ count: sql`count(*)` }).from(products);
        return Number(result[0].count);
    }
}

// --- MEMORY STORAGE IMPLEMENTATION ---
class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private products: Map<string, Product> = new Map();
  private analytics: Map<string, Analytics> = new Map();
  private chatMessages: Map<string, ChatMessage> = new Map();

  async seed(): Promise<void> {
    const productCount = await this.getProductCount();
    if (productCount === 0) {
        console.log("No products found. Seeding from data/products.csv...");
        const csvPath = path.join(process.cwd(), "data", "products.csv");
         if (!fs.existsSync(csvPath)) {
            console.warn("data/products.csv not found. Skipping seeding.");
            return;
        }
        const stream = fs.createReadStream(csvPath);
        const count = await this.importProductsFromCsv(stream);
        console.log(`Successfully seeded ${count} products.`);
    } else {
        console.log(`${productCount} products found. Skipping seeding.`);
    }
  }

    async getUser(id: string): Promise<User | undefined> { return this.users.get(id); }
    async getUserByEmail(email: string): Promise<User | undefined> { return Array.from(this.users.values()).find(user => user.email === email); }
    async createUser(insertUser: InsertUser): Promise<User> {
        const id = randomUUID();
        const user: User = { ...(insertUser as any), id, subscriptionTier: "free", createdAt: new Date() };
        this.users.set(id, user);
        return user;
    }
    async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
        const user = this.users.get(id);
        if (!user) return undefined;
        const updatedUser = { ...user, ...updates };
        this.users.set(id, updatedUser);
        return updatedUser;
    }
    async getProducts(limit = 50, offset = 0, filters: any = {}): Promise<Product[]> {
        let prods = Array.from(this.products.values());
        if (filters.category) { prods = prods.filter(p => p.category === filters.category); }
        if (filters.minPrice) { prods = prods.filter(p => parseFloat(p.price) >= filters.minPrice); }
        if (filters.maxPrice) { prods = prods.filter(p => parseFloat(p.price) <= filters.maxPrice); }
        return prods.slice(offset, offset + limit);
    }
    async getProduct(id: string): Promise<Product | undefined> { return this.products.get(id); }
    async createProduct(insertProduct: InsertProduct): Promise<Product> {
        const product: Product = { ...(insertProduct as any) };
        this.products.set(product.product_id, product);
        return product;
    }
    async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
        const product = this.products.get(id);
        if (!product) return undefined;
        const updatedProduct = { ...product, ...updates };
        this.products.set(id, updatedProduct);
        return updatedProduct;
    }
    async getProductsByCategory(category: string): Promise<Product[]> { return Array.from(this.products.values()).filter(p => p.category === category); }
    async getTrendingProducts(limit = 10): Promise<ProductWithMetrics[]> {
        const prods = Array.from(this.products.values()).sort((a, b) => (b.event_impact ? parseFloat(b.event_impact) : 0) - (a.event_impact ? parseFloat(a.event_impact) : 0)).slice(0, limit);
        return prods.map(p => ({ ...p, salesGrowth: 0, revenueGrowth: 0, competitivePosition: "leading" }));
    }
    async getTopProfitProducts(limit = 10): Promise<ProductWithMetrics[]> {
        const prods = Array.from(this.products.values()).sort((a, b) => parseFloat(b.profit_margin) - parseFloat(a.profit_margin)).slice(0, limit);
        return prods.map(p => ({ ...p, salesGrowth: 0, revenueGrowth: 0, competitivePosition: "profitable" }));
    }
    async getUnderperformingProducts(limit = 10): Promise<ProductWithMetrics[]> {
        const prods = Array.from(this.products.values()).sort((a, b) => a.estimated_demand - b.estimated_demand).slice(0, limit);
        return prods.map(p => ({ ...p, salesGrowth: 0, revenueGrowth: 0, competitivePosition: "needs attention" }));
    }
    async importProductsFromCsv(stream: Readable): Promise<number> {
      return new Promise((resolve, reject) => {
        const productsToInsert: InsertProduct[] = [];
        stream.pipe(csv()).on("data", (row: any) => {
            try {
              const productData = insertProductSchema.parse({
                product_id: row.product_id, date: new Date(row.date), title: row.title, category: row.category, price: String(row.price), rating: String(row.rating), reviews: parseInt(row.reviews, 10), availability: row.availability?.toLowerCase() === 'true', competitor_price: row.competitor_price ? String(row.competitor_price) : null, promotion_flag: row.promotion_flag?.toLowerCase() === 'true', estimated_demand: parseInt(row.estimated_demand, 10), cost_price: row.cost_price ? String(row.cost_price) : null, profit_margin: String(row.profit_margin), event: row.event && row.event !== 'NULL' ? row.event : null, event_impact: row.event_impact ? String(row.event_impact) : null, ad_spend: row.ad_spend ? String(row.ad_spend) : null, market_share: row.market_share ? String(row.market_share) : null,
              });
              productsToInsert.push(productData);
            } catch (error: any) { console.warn("Skipping invalid CSV row:", row, error.message); }
          }).on("end", async () => {
            productsToInsert.forEach(p => this.createProduct(p));
            resolve(productsToInsert.length);
          }).on("error", (error: Error) => { reject(error); });
      });
    }
    async getAnalytics(productId?: string, startDate?: Date, endDate?: Date): Promise<Analytics[]> { return []; }
    async createAnalytics(analyticsData: InsertAnalytics): Promise<Analytics> { return {} as Analytics; }
    async getDashboardMetrics(): Promise<DashboardMetrics> { return {} as DashboardMetrics; }
    async getCategoryPerformance(): Promise<CategoryPerformance[]> { return []; }
    async getGeographicData(): Promise<GeographicData[]> { return []; }
    async getChatMessages(userId: string, limit = 50): Promise<ChatMessage[]> { return []; }
    async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> { return {} as ChatMessage; }
    async searchProducts(query: string): Promise<Product[]> {
        return Array.from(this.products.values()).filter(p => p.title.toLowerCase().includes(query));
    }
    async getProductCount(): Promise<number> { return this.products.size; }
}

// --- STORAGE INITIALIZATION ---
let storage: IStorage;

if (process.env.DATABASE_URL) {
    console.log("DATABASE_URL found. Initializing DrizzleStorage.");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });
    storage = new DrizzleStorage(db);
} else {
    console.log("DATABASE_URL not found. Initializing MemStorage for development.");
    storage = new MemStorage();
}

export { storage };