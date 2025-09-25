import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  Percent, 
  Star,
  ChartLine
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardMetrics } from "@shared/schema";

interface MetricsCardsProps {
  metrics?: DashboardMetrics;
  isLoading: boolean;
}

interface MetricCardProps {
  title: string;
  value: string;
  growth: number;
  growthLabel: string;
  icon: React.ReactNode;
  color: string;
  isLoading?: boolean;
}

function MetricCard({ title, value, growth, growthLabel, icon, color, isLoading }: MetricCardProps) {
  if (isLoading) {
    return (
      <Card className="metric-card bg-card rounded-xl p-6 border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-3 rounded-lg", color)}>
            <Skeleton className="h-6 w-6" />
          </div>
          <Badge variant="secondary" className="ai-badge">AI</Badge>
        </div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-4 w-40" />
      </Card>
    );
  }

  const isPositive = growth >= 0;
  const GrowthIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card className="metric-card bg-card rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-lg", color)}>
          {icon}
        </div>
        <Badge variant="secondary" className="ai-badge text-xs">AI</Badge>
      </div>
      
      <h3 className="text-2xl font-bold text-foreground mb-1" data-testid={`metric-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
        {value}
      </h3>
      
      <p className="text-sm text-muted-foreground mb-2">{title}</p>
      
      <div className="flex items-center text-sm">
        <GrowthIcon className={cn(
          "h-4 w-4 mr-1",
          isPositive ? "text-green-500" : "text-red-500"
        )} />
        <span className={cn(
          "font-medium",
          isPositive ? "text-green-500" : "text-red-500"
        )}>
          {isPositive ? "+" : ""}{growth.toFixed(1)}%
        </span>
        <span className="text-muted-foreground ml-1">{growthLabel}</span>
      </div>
    </Card>
  );
}

export default function MetricsCards({ metrics, isLoading }: MetricsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 10000000) return (num / 10000000).toFixed(1) + 'Cr';
    if (num >= 100000) return (num / 100000).toFixed(1) + 'L';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const cards = [
    {
      title: "Total Revenue",
      value: metrics ? formatCurrency(metrics.totalRevenue) : "₹0",
      growth: metrics?.revenueGrowth || 0,
      growthLabel: "from last month",
      icon: <ChartLine className="text-blue-600 h-6 w-6" />,
      color: "bg-blue-100"
    },
    {
      title: "Products Tracked",
      value: metrics ? formatNumber(metrics.totalProducts) : "0",
      growth: metrics?.productGrowth || 0,
      growthLabel: "new this week",
      icon: <ShoppingCart className="text-green-600 h-6 w-6" />,
      color: "bg-green-100"
    },
    {
      title: "Avg Profit Margin",
      value: metrics ? `${metrics.avgProfitMargin.toFixed(1)}%` : "0%",
      growth: metrics?.marginGrowth || 0,
      growthLabel: "optimized",
      icon: <Percent className="text-purple-600 h-6 w-6" />,
      color: "bg-purple-100"
    },
    {
      title: "Avg Rating",
      value: metrics ? metrics.avgRating.toFixed(1) : "0.0",
      growth: metrics?.ratingGrowth || 0,
      growthLabel: "improvement",
      icon: <Star className="text-orange-600 h-6 w-6" />,
      color: "bg-orange-100"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <MetricCard
          key={index}
          title={card.title}
          value={card.value}
          growth={card.growth}
          growthLabel={card.growthLabel}
          icon={card.icon}
          color={card.color}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
