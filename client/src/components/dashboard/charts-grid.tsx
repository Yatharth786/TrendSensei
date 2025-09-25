import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, Bot } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import { apiRequest } from "@/lib/queryClient";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  aiInsight?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
}

function ChartCard({ title, children, aiInsight, isLoading, onRefresh }: ChartCardProps) {
  return (
    <Card className="bg-card rounded-xl p-6 border hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="ai-badge text-xs">
            AI Insights
          </Badge>
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="chart-container relative h-80 w-full mb-4">
          {children}
        </div>
        
        {aiInsight && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <Bot className="inline mr-2 h-4 w-4" />
              <strong>AI Analysis:</strong> {aiInsight}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ChartsGrid() {
  const [chartInsights, setChartInsights] = useState<Record<string, string>>({});

  // Sales trends data
  const { data: salesTrends, isLoading: salesLoading, refetch: refetchSales } = useQuery({
    queryKey: ["/api/analytics/sales-trends"],
    staleTime: 5 * 60 * 1000,
  });

  // Category performance data
  const { data: categoryData, isLoading: categoryLoading, refetch: refetchCategory } = useQuery({
    queryKey: ["/api/analytics/category-performance"],
    staleTime: 5 * 60 * 1000,
  });

  // Geographic data
  const { data: geoData, isLoading: geoLoading, refetch: refetchGeo } = useQuery({
    queryKey: ["/api/analytics/geographic"],
    staleTime: 5 * 60 * 1000,
  });

  // AI insights mutation
  const insightMutation = useMutation({
    mutationFn: async ({ chartType, data }: { chartType: string; data: any }) => {
      const response = await apiRequest("POST", "/api/ai/chart-insight", {
        chartType,
        data
      });
      return response.json();
    },
    onSuccess: (result, variables) => {
      setChartInsights(prev => ({
        ...prev,
        [variables.chartType]: result.insight
      }));
    },
  });

  // Generate insights when data loads
  useEffect(() => {
    if (salesTrends && Array.isArray(salesTrends) && !chartInsights.sales) {
      insightMutation.mutate({
        chartType: "sales",
        data: salesTrends.slice(0, 6)
      });
    }
  }, [salesTrends]);

  useEffect(() => {
    if (categoryData && Array.isArray(categoryData) && !chartInsights.category) {
      insightMutation.mutate({
        chartType: "category",
        data: categoryData.slice(0, 5)
      });
    }
  }, [categoryData]);

  useEffect(() => {
    if (geoData && Array.isArray(geoData) && !chartInsights.geographic) {
      insightMutation.mutate({
        chartType: "geographic",
        data: geoData.slice(0, 6)
      });
    }
  }, [geoData]);

  // Chart configurations
  const commonOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
      },
    },
  };

  // Sales trends chart
  const salesChartData = {
    labels: Array.isArray(salesTrends) ? salesTrends.map((item: any) => {
      const date = new Date(item.month);
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }) : [],
    datasets: [
      {
        label: 'Revenue (₹)',
        data: Array.isArray(salesTrends) ? salesTrends.map((item: any) => item.revenue) : [],
        borderColor: 'hsl(221.2 83.2% 53.3%)',
        backgroundColor: 'hsl(221.2 83.2% 53.3% / 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Category performance chart
  const categoryChartData = {
    labels: Array.isArray(categoryData) ? categoryData.map((item: any) => item.category) : [],
    datasets: [
      {
        data: Array.isArray(categoryData) ? categoryData.map((item: any) => item.sales) : [],
        backgroundColor: [
          'hsl(221.2 83.2% 53.3%)',
          'hsl(142.1 76.2% 36.3%)',
          'hsl(24.6 95% 53.1%)',
          'hsl(280 80% 55%)',
          'hsl(38.7 92% 50%)',
        ],
        borderWidth: 2,
        borderColor: 'hsl(var(--background))',
      },
    ],
  };

  // Geographic chart
  const geoChartData = {
    labels: Array.isArray(geoData) ? geoData.map((item: any) => item.location) : [],
    datasets: [
      {
        label: 'Sales by Location',
        data: Array.isArray(geoData) ? geoData.map((item: any) => item.sales) : [],
        backgroundColor: [
          'hsl(221.2 83.2% 53.3%)',
          'hsl(142.1 76.2% 36.3%)',
          'hsl(24.6 95% 53.1%)',
          'hsl(280 80% 55%)',
          'hsl(38.7 92% 50%)',
          'hsl(200 80% 55%)',
        ],
      },
    ],
  };

  // Profit margins radar chart data
  const profitChartData = {
    labels: Array.isArray(categoryData) ? categoryData.map((item: any) => item.category) : [],
    datasets: [
      {
        label: 'Profit Margin %',
        data: Array.isArray(categoryData) ? categoryData.map((item: any) => item.profitMargin) : [],
        borderColor: 'hsl(280 80% 55%)',
        backgroundColor: 'hsl(280 80% 55% / 0.2)',
        pointBackgroundColor: 'hsl(280 80% 55%)',
        pointBorderColor: 'hsl(280 80% 55%)',
      },
    ],
  };

  const radarOptions: ChartOptions<'radar'> = {
    ...commonOptions,
    scales: {
      r: {
        beginAtZero: true,
        max: 60,
        ticks: {
          stepSize: 10,
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Sales Trends Chart */}
      <ChartCard
        title="Sales Trends"
        aiInsight={chartInsights.sales}
        isLoading={salesLoading}
        onRefresh={() => refetchSales()}
      >
        {salesLoading ? (
          <Skeleton className="w-full h-full" />
        ) : (
          <Line data={salesChartData} options={commonOptions} />
        )}
      </ChartCard>

      {/* Category Performance */}
      <ChartCard
        title="Category Performance"
        aiInsight={chartInsights.category}
        isLoading={categoryLoading}
        onRefresh={() => refetchCategory()}
      >
        {categoryLoading ? (
          <Skeleton className="w-full h-full" />
        ) : (
          <Doughnut data={categoryChartData} options={commonOptions} />
        )}
      </ChartCard>

      {/* Geographic Distribution */}
      <ChartCard
        title="Geographic Sales"
        aiInsight={chartInsights.geographic}
        isLoading={geoLoading}
        onRefresh={() => refetchGeo()}
      >
        {geoLoading ? (
          <Skeleton className="w-full h-full" />
        ) : (
          <Bar data={geoChartData} options={commonOptions} />
        )}
      </ChartCard>

      {/* Profit Margins */}
      <ChartCard
        title="Profit Margins by Category"
        aiInsight="Home & Garden category shows highest margins at 45%. Consider increasing inventory allocation for optimal profit optimization."
        isLoading={categoryLoading}
        onRefresh={() => refetchCategory()}
      >
        {categoryLoading ? (
          <Skeleton className="w-full h-full" />
        ) : (
          <Radar data={profitChartData} options={radarOptions} />
        )}
      </ChartCard>
    </div>
  );
}
