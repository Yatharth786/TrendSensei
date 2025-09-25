import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import MetricsCards from "@/components/dashboard/metrics-cards";
import ChartsGrid from "@/components/dashboard/charts-grid";
import ProductRankings from "@/components/dashboard/product-rankings";
import AIRecommendations from "@/components/dashboard/ai-recommendations";
import FiltersPanel from "@/components/dashboard/filters-panel";
import Chatbot from "@/components/chatbot/chatbot";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Filter, Bell } from "lucide-react";
import { useState } from "react";
import type { DashboardMetrics } from "@shared/schema";

export default function Dashboard() {
  const user = { location: "Mumbai" }; // Mock user for demo
  const [showFilters, setShowFilters] = useState(false);

  // Initialize data if needed
  const initDataMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/init-data");
      return response.json();
    },
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  }) as { data?: DashboardMetrics; isLoading: boolean };

  const { data: trendingProducts } = useQuery({
    queryKey: ["/api/products/trending"],
    queryFn: async () => {
      const response = await fetch("/api/products/trending?limit=10");
      return response.json();
    },
  });

  const { data: topProfitProducts } = useQuery({
    queryKey: ["/api/products/top-profit"],
    queryFn: async () => {
      const response = await fetch("/api/products/top-profit?limit=10");
      return response.json();
    },
  });

  const { data: underperformingProducts } = useQuery({
    queryKey: ["/api/products/underperforming"],
    queryFn: async () => {
      const response = await fetch("/api/products/underperforming?limit=10");
      return response.json();
    },
  });

  useEffect(() => {
    // Initialize sample data on first load
    initDataMutation.mutate();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-xl font-semibold" data-testid="text-pageTitle">
                Dashboard
              </h2>
              <p className="text-sm text-muted-foreground">
                AI-powered e-commerce insights
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" data-testid="button-notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              data-testid="button-filters"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Filters Panel */}
          {showFilters && <FiltersPanel />}

          {/* Metrics Cards */}
          <MetricsCards metrics={metrics} isLoading={metricsLoading} />

          {/* Charts Grid */}
          <ChartsGrid />

          {/* Product Rankings */}
          <ProductRankings
            trendingProducts={trendingProducts}
            topProfitProducts={topProfitProducts}
            underperformingProducts={underperformingProducts}
          />

          {/* AI Recommendations */}
          <AIRecommendations userLocation={user?.location || "Mumbai"} />
        </div>
      </div>

      {/* AI Chatbot */}
      <Chatbot />
    </div>
  );
}
