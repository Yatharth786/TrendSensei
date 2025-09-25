import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  businessName: text("business_name"),
  location: text("location"),
  subscriptionTier: text("subscription_tier").notNull().default("free"), // free, basic, premium
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(),
  brand: text("brand").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  competitorPrices: jsonb("competitor_prices").notNull(), // { amazon: 2999, flipkart: 2899 }
  rating: decimal("rating", { precision: 3, scale: 2 }).notNull(),
  reviewCount: integer("review_count").notNull(),
  salesVolume: integer("sales_volume").notNull(),
  profitMargin: decimal("profit_margin", { precision: 5, scale: 2 }).notNull(),
  stockLevel: integer("stock_level").notNull(),
  locationData: jsonb("location_data").notNull(), // { mumbai: 150, delhi: 120 }
  launchDate: timestamp("launch_date").notNull(),
  trending: boolean("trending").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const analytics = pgTable("analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id),
  date: timestamp("date").notNull(),
  sales: integer("sales").notNull(),
  revenue: decimal("revenue", { precision: 12, scale: 2 }).notNull(),
  views: integer("views").notNull(),
  conversions: integer("conversions").notNull(),
  location: text("location").notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  message: text("message").notNull(),
  response: text("response").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

// Additional types for API responses
export type ProductWithMetrics = Product & {
  salesGrowth: number;
  revenueGrowth: number;
  competitivePosition: string;
};

export type CategoryPerformance = {
  category: string;
  sales: number;
  revenue: number;
  profitMargin: number;
  growth: number;
};

export type GeographicData = {
  location: string;
  sales: number;
  revenue: number;
  conversionRate: number;
};

export type DashboardMetrics = {
  totalRevenue: number;
  revenueGrowth: number;
  totalProducts: number;
  productGrowth: number;
  avgProfitMargin: number;
  marginGrowth: number;
  avgRating: number;
  ratingGrowth: number;
};
