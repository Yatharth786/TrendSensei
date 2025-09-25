import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductWithMetrics } from "@shared/schema";

interface ProductRankingsProps {
  trendingProducts?: ProductWithMetrics[];
  topProfitProducts?: ProductWithMetrics[];
  underperformingProducts?: ProductWithMetrics[];
}

interface ProductCardProps {
  product: ProductWithMetrics;
  index: number;
  type: 'trending' | 'profit' | 'underperforming';
}

function ProductCard({ product, index, type }: ProductCardProps) {
  const getGradientColor = (index: number, type: string) => {
    if (type === 'trending') {
      const colors = [
        'from-green-50 to-green-100',
        'from-blue-50 to-blue-100',
        'from-purple-50 to-purple-100'
      ];
      return colors[index % colors.length];
    } else if (type === 'profit') {
      const colors = [
        'from-emerald-50 to-emerald-100',
        'from-teal-50 to-teal-100',
        'from-indigo-50 to-indigo-100'
      ];
      return colors[index % colors.length];
    } else {
      const colors = [
        'from-red-50 to-red-100',
        'from-orange-50 to-orange-100',
        'from-yellow-50 to-yellow-100'
      ];
      return colors[index % colors.length];
    }
  };

  const getBadgeColor = (index: number, type: string) => {
    if (type === 'trending') {
      const colors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500'];
      return colors[index % colors.length];
    } else if (type === 'profit') {
      const colors = ['bg-emerald-500', 'bg-teal-500', 'bg-indigo-500'];
      return colors[index % colors.length];
    } else {
      const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500'];
      return colors[index % colors.length];
    }
  };

  const getMetricValue = () => {
    if (type === 'trending' || type === 'underperforming') {
      return `${product.salesGrowth >= 0 ? '+' : ''}${product.salesGrowth.toFixed(0)}%`;
    } else {
      return `${product.profitMargin}%`;
    }
  };

  const getMetricColor = () => {
    if (type === 'trending') return 'text-green-600';
    if (type === 'profit') return 'text-emerald-600';
    return 'text-red-600';
  };

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numPrice);
  };

  return (
    <div 
      className={cn(
        "flex items-center justify-between p-3 rounded-lg bg-gradient-to-r",
        getGradientColor(index, type)
      )}
      data-testid={`product-card-${type}-${index}`}
    >
      <div className="flex items-center space-x-3">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold",
          getBadgeColor(index, type)
        )}>
          {type === 'underperforming' ? '!' : index + 1}
        </div>
        <div>
          <p className="font-medium text-sm" data-testid={`text-product-name-${index}`}>
            {product.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {product.category}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={cn("text-sm font-semibold", getMetricColor())}>
          {getMetricValue()}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatPrice(product.price)}
        </p>
      </div>
    </div>
  );
}

function RankingSection({ 
  title, 
  type, 
  products, 
  isLoading 
}: { 
  title: string; 
  type: 'trending' | 'profit' | 'underperforming';
  products?: ProductWithMetrics[];
  isLoading?: boolean;
}) {
  return (
    <Card className="bg-card rounded-xl p-6 border hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between mb-4 p-0">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <Badge variant="secondary" className="ai-badge text-xs">
          AI Ranked
        </Badge>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-12 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))
          ) : products?.length ? (
            products.slice(0, 3).map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                type={type}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No products available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProductRankings({
  trendingProducts,
  topProfitProducts,
  underperformingProducts
}: ProductRankingsProps) {
  const isLoading = !trendingProducts && !topProfitProducts && !underperformingProducts;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <RankingSection
        title="Top Trending"
        type="trending"
        products={trendingProducts}
        isLoading={isLoading}
      />
      
      <RankingSection
        title="Best Margins"
        type="profit"
        products={topProfitProducts}
        isLoading={isLoading}
      />
      
      <RankingSection
        title="Needs Attention"
        type="underperforming"
        products={underperformingProducts}
        isLoading={isLoading}
      />
    </div>
  );
}
