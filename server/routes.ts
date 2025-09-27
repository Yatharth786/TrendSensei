import type { Express } from "express";
import { createServer, type Server } from "http";
import { IStorage } from "./storage.js";
import { generateChartInsight, generateDashboardRecommendations, chatbotResponse } from "./services/openai.js";
import { insertUserSchema, insertChatMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express, storage: IStorage): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      const user = await storage.createUser(userData);
      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(400).json({ message: "Invalid user data", details: error.issues });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Dashboard metrics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // Products routes
  app.get("/api/products", async (req, res) => {
    try {
      const { limit = "50", offset = "0", category, minPrice, maxPrice, minRating } = req.query;
      
      const filters: any = {};
      if (category) filters.category = category;
      if (minPrice) filters.minPrice = parseFloat(minPrice as string);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
      if (minRating) filters.minRating = parseFloat(minRating as string);
      
      const products = await storage.getProducts(
        parseInt(limit as string), 
        parseInt(offset as string),
        filters
      );
      
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/trending", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const products = await storage.getTrendingProducts(limit);
      res.json(products);
    } catch (error) {
      console.error("Error fetching trending products:", error);
      res.status(500).json({ message: "Failed to fetch trending products" });
    }
  });

  app.get("/api/products/top-profit", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const products = await storage.getTopProfitProducts(limit);
      res.json(products);
    } catch (error) {
      console.error("Error fetching top profit products:", error);
      res.status(500).json({ message: "Failed to fetch top profit products" });
    }
  });

  app.get("/api/products/underperforming", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const products = await storage.getUnderperformingProducts(limit);
      res.json(products);
    } catch (error) {
      console.error("Error fetching underperforming products:", error);
      res.status(500).json({ message: "Failed to fetch underperforming products" });
    }
  });

  app.get("/api/products/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query required" });
      }
      
      const products = await storage.searchProducts(q);
      res.json(products);
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({ message: "Failed to search products" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/category-performance", async (req, res) => {
    try {
      const performance = await storage.getCategoryPerformance();
      res.json(performance);
    } catch (error) {
      console.error("Error fetching category performance:", error);
      res.status(500).json({ message: "Failed to fetch category performance" });
    }
  });

  app.get("/api/analytics/geographic", async (req, res) => {
    try {
      const geographic = await storage.getGeographicData();
      res.json(geographic);
    } catch (error) {
      console.error("Error fetching geographic data:", error);
      res.status(500).json({ message: "Failed to fetch geographic data" });
    }
  });

  app.get("/api/analytics/sales-trends", async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      
      const monthlyData: Record<string, number> = {};
      analytics.forEach((item: any) => {
        const month = item.date.toISOString().substring(0, 7); // YYYY-MM
        monthlyData[month] = (monthlyData[month] || 0) + parseFloat(item.revenue);
      });
      
      const salesTrends = Object.entries(monthlyData).map(([month, revenue]) => ({
        month,
        revenue,
        growth: Math.random() * 20 + 5 // Mock growth percentage
      }));
      
      res.json(salesTrends);
    } catch (error) {
      console.error("Error fetching sales trends:", error);
      res.status(500).json({ message: "Failed to fetch sales trends" });
    }
  });

  // AI routes
  app.post("/api/ai/chart-insight", async (req, res) => {
    try {
      const { chartType, data } = req.body;
      if (!chartType || !data) {
        return res.status(400).json({ message: "Chart type and data required" });
      }
      
      const insight = await generateChartInsight(chartType, data);
      res.json({ insight });
    } catch (error) {
      console.error("Error generating chart insight:", error);
      res.status(500).json({ message: "Failed to generate insight" });
    }
  });

  app.post("/api/ai/recommendations", async (req, res) => {
    try {
      const { userLocation = "Mumbai" } = req.body;
      
      const products = await storage.getProducts(50);
      const analytics = await storage.getAnalytics();
      
      const recommendations = await generateDashboardRecommendations(
        userLocation, 
        products, 
        analytics.slice(0, 20)
      );
      
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  // Chat routes
  app.post("/api/chat", async (req, res) => {
    try {
      const messageData = insertChatMessageSchema.parse(req.body);
      
      const userContext = {
        location: "Mumbai", // Default or from user profile
        subscriptionTier: "free"
      };
      
      const aiResponse = await chatbotResponse(messageData.message, userContext);
      
      const chatMessage = await storage.createChatMessage({
        ...messageData,
        response: aiResponse.message
      });
      
      res.json({ 
        message: aiResponse.message,
        suggestions: aiResponse.suggestions,
        chatId: chatMessage.id
      });
    } catch (error: any) {
      console.error("Error processing chat:", error);
      res.status(500).json({ message: "Failed to process chat message", details: error.issues });
    }
  });

  app.get("/api/chat/history/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const messages = await storage.getChatMessages(userId, limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  // User routes
  app.get("/api/user/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch("/api/user/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      delete updates.id;
      delete updates.password;
      delete updates.createdAt;
      
      const user = await storage.updateUser(id, updates);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

    app.patch("/api/user/:id/subscription", async (req, res) => {
    try {
      const { id } = req.params;
      const { subscriptionTier } = req.body;

      if (!subscriptionTier || !["free", "basic", "premium"].includes(subscriptionTier)) {
        return res.status(400).json({ message: "Invalid subscription tier" });
      }

      const user = await storage.updateUser(id, { subscriptionTier });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}