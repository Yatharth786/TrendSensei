import { type User, type InsertUser, type Product, type InsertProduct, type Analytics, type InsertAnalytics, type ChatMessage, type InsertChatMessage, type ProductWithMetrics, type CategoryPerformance, type GeographicData, type DashboardMetrics } from "@shared/schema";
import { randomUUID } from "crypto";

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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private products: Map<string, Product>;
  private analytics: Map<string, Analytics>;
  private chatMessages: Map<string, ChatMessage>;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.analytics = new Map();
    this.chatMessages = new Map();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      location: insertUser.location || null,
      businessName: insertUser.businessName || null,
      id, 
      subscriptionTier: "free",
      createdAt: new Date() 
    };
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

  // Product methods
  async getProducts(limit = 50, offset = 0, filters?: any): Promise<Product[]> {
    let products = Array.from(this.products.values());
    
    if (filters) {
      if (filters.category) {
        products = products.filter(p => p.category === filters.category);
      }
      if (filters.minPrice) {
        products = products.filter(p => parseFloat(p.price) >= filters.minPrice);
      }
      if (filters.maxPrice) {
        products = products.filter(p => parseFloat(p.price) <= filters.maxPrice);
      }
      if (filters.minRating) {
        products = products.filter(p => parseFloat(p.rating) >= filters.minRating);
      }
      if (filters.location) {
        products = products.filter(p => 
          p.locationData && typeof p.locationData === 'object' && 
          Object.keys(p.locationData).includes(filters.location.toLowerCase())
        );
      }
    }
    
    return products.slice(offset, offset + limit);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = { 
      ...insertProduct,
      description: insertProduct.description || null,
      trending: insertProduct.trending || false,
      id, 
      createdAt: new Date() 
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...updates };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.category === category);
  }

  async getTrendingProducts(limit = 10): Promise<ProductWithMetrics[]> {
    const products = Array.from(this.products.values())
      .filter(p => p.trending)
      .sort((a, b) => b.salesVolume - a.salesVolume)
      .slice(0, limit);

    return products.map(p => ({
      ...p,
      salesGrowth: Math.random() * 50 + 10, // Mock growth percentage
      revenueGrowth: Math.random() * 40 + 5,
      competitivePosition: "leading"
    }));
  }

  async getTopProfitProducts(limit = 10): Promise<ProductWithMetrics[]> {
    const products = Array.from(this.products.values())
      .sort((a, b) => parseFloat(b.profitMargin) - parseFloat(a.profitMargin))
      .slice(0, limit);

    return products.map(p => ({
      ...p,
      salesGrowth: Math.random() * 30 + 5,
      revenueGrowth: Math.random() * 25 + 3,
      competitivePosition: "profitable"
    }));
  }

  async getUnderperformingProducts(limit = 10): Promise<ProductWithMetrics[]> {
    const products = Array.from(this.products.values())
      .sort((a, b) => a.salesVolume - b.salesVolume)
      .slice(0, limit);

    return products.map(p => ({
      ...p,
      salesGrowth: -(Math.random() * 30 + 5), // Negative growth
      revenueGrowth: -(Math.random() * 25 + 3),
      competitivePosition: "needs attention"
    }));
  }

  // Analytics methods
  async getAnalytics(productId?: string, startDate?: Date, endDate?: Date): Promise<Analytics[]> {
    let analytics = Array.from(this.analytics.values());
    
    if (productId) {
      analytics = analytics.filter(a => a.productId === productId);
    }
    
    if (startDate) {
      analytics = analytics.filter(a => a.date >= startDate);
    }
    
    if (endDate) {
      analytics = analytics.filter(a => a.date <= endDate);
    }
    
    return analytics;
  }

  async createAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    const id = randomUUID();
    const analytics: Analytics = { 
      ...insertAnalytics,
      productId: insertAnalytics.productId || null,
      id 
    };
    this.analytics.set(id, analytics);
    return analytics;
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const products = Array.from(this.products.values());
    const analytics = Array.from(this.analytics.values());
    
    const totalRevenue = analytics.reduce((sum, a) => sum + parseFloat(a.revenue), 0);
    const avgProfitMargin = products.reduce((sum, p) => sum + parseFloat(p.profitMargin), 0) / products.length;
    const avgRating = products.reduce((sum, p) => sum + parseFloat(p.rating), 0) / products.length;
    
    return {
      totalRevenue,
      revenueGrowth: 12.3,
      totalProducts: products.length,
      productGrowth: 8.7,
      avgProfitMargin,
      marginGrowth: 2.1,
      avgRating,
      ratingGrowth: 0.3
    };
  }

  async getCategoryPerformance(): Promise<CategoryPerformance[]> {
    const products = Array.from(this.products.values());
    const categories = Array.from(new Set(products.map(p => p.category)));
    
    return categories.map(category => {
      const categoryProducts = products.filter(p => p.category === category);
      const sales = categoryProducts.reduce((sum, p) => sum + p.salesVolume, 0);
      const revenue = categoryProducts.reduce((sum, p) => sum + (p.salesVolume * parseFloat(p.price)), 0);
      const profitMargin = categoryProducts.reduce((sum, p) => sum + parseFloat(p.profitMargin), 0) / categoryProducts.length;
      
      return {
        category,
        sales,
        revenue,
        profitMargin,
        growth: Math.random() * 40 + 5 // Mock growth
      };
    });
  }

  async getGeographicData(): Promise<GeographicData[]> {
    const locations = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune'];
    
    return locations.map(location => ({
      location,
      sales: Math.floor(Math.random() * 50000 + 10000),
      revenue: Math.floor(Math.random() * 1000000 + 200000),
      conversionRate: Math.random() * 10 + 2
    }));
  }

  // Chat methods
  async getChatMessages(userId: string, limit = 50): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(m => m.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = { 
      ...insertMessage,
      userId: insertMessage.userId || null,
      id, 
      timestamp: new Date() 
    };
    this.chatMessages.set(id, message);
    return message;
  }

  // Search methods
  async searchProducts(query: string): Promise<Product[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.products.values()).filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery) ||
      p.brand.toLowerCase().includes(lowerQuery)
    );
  }

  async getProductCount(): Promise<number> {
    return this.products.size;
  }
}

export const storage = new MemStorage();
