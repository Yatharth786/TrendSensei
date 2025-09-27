import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// USERS TABLE
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  businessName: text("business_name"),
  location: text("location"),
  subscriptionTier: text("subscription_tier").notNull().default("free"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// PRODUCTS TABLE (NEW SCHEMA)
export const products = pgTable("products", {
  product_id: varchar("product_id").primaryKey(),
  date: timestamp("date").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }).notNull(),
  reviews: integer("reviews").notNull(),
  availability: boolean("availability").notNull().default(true),
  competitor_price: decimal("competitor_price", { precision: 10, scale: 2 }),
  promotion_flag: boolean("promotion_flag").notNull().default(false),
  estimated_demand: integer("estimated_demand").notNull(),
  cost_price: decimal("cost_price", { precision: 10, scale: 2 }),
  profit_margin: decimal("profit_margin", { precision: 5, scale: 2 }).notNull(),
  event: text("event"),
  event_impact: decimal("event_impact", { precision: 5, scale: 2 }),
  ad_spend: decimal("ad_spend", { precision: 10, scale: 2 }),
  market_share: decimal("market_share", { precision: 5, scale: 4 }),
});

// ANALYTICS TABLE
export const analytics = pgTable("analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.product_id), // Corrected reference
  date: timestamp("date").notNull(),
  sales: integer("sales").notNull(),
  revenue: decimal("revenue", { precision: 12, scale: 2 }).notNull(),
  views: integer("views").notNull(),
  conversions: integer("conversions").notNull(),
  location: text("location").notNull(),
});

// CHAT MESSAGES TABLE
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  message: text("message").notNull(),
  response: text("response").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// --- ZOD SCHEMAS FOR INSERT ---

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products);

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

// --- INFERRED TYPES ---

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

// --- API RESPONSE TYPES ---

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