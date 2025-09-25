import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  Target, 
  TrendingUp, 
  MapPin, 
  Lightbulb, 
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { AIInsight } from "@/../../server/services/openai";

interface AIRecommendationsProps {
  userLocation: string;
}

interface RecommendationCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: string;
  gradient: string;
}

function RecommendationCard({ icon, title, description, action, gradient }: RecommendationCardProps) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-lg p-4 text-white`}>
      <div className="flex items-center mb-2">
        {icon}
        <h4 className="font-semibold ml-2">{title}</h4>
      </div>
      <p className="text-sm mb-2 text-white/90">{description}</p>
      {action && (
        <p className="text-xs font-medium text-white/95 bg-white/20 px-2 py-1 rounded">
          {action}
        </p>
      )}
    </div>
  );
}

export default function AIRecommendations({ userLocation }: AIRecommendationsProps) {
  const { data: recommendations, isLoading, refetch } = useQuery({
    queryKey: ["/api/ai/recommendations", userLocation],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/ai/recommendations", {
        userLocation
      });
      return response.json() as Promise<AIInsight>;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });

  const defaultRecommendations = [
    {
      icon: <Target className="h-5 w-5" />,
      title: "Top Opportunity",
      description: `Wireless Gaming Headsets are trending +67% in ${userLocation}`,
      action: "Expected profit: 42% margin",
      gradient: "from-green-500 to-emerald-600"
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Price Optimization",
      description: "Reduce Smart Watch prices by 8% to beat competitors",
      action: "Increase sales by ~25%",
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      title: "Geographic Expansion",
      description: `Consider expanding to Pune - similar demographics to ${userLocation}`,
      action: "Potential 30% revenue increase",
      gradient: "from-purple-500 to-violet-600"
    }
  ];

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl p-6 border">
      <CardHeader className="flex flex-row items-center justify-between mb-4 p-0">
        <div className="flex items-center">
          <div className="p-3 bg-primary rounded-xl mr-4">
            <Bot className="text-primary-foreground h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">
              AI Recommendations for You
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Personalized insights based on {userLocation} market trends
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="ai-badge">
            AI Powered
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            data-testid="button-refresh-recommendations"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Summary Section */}
        {recommendations?.summary && (
          <div className="mb-6 p-4 bg-white/70 dark:bg-black/20 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center">
              <Lightbulb className="h-4 w-4 mr-2 text-yellow-600" />
              Business Health Summary
            </h3>
            <p className="text-sm text-muted-foreground">
              {recommendations.summary}
            </p>
          </div>
        )}

        {/* Recommendations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white/70 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Skeleton className="h-5 w-5 mr-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))
          ) : recommendations?.recommendations?.length ? (
            recommendations.recommendations.slice(0, 3).map((rec, index) => {
              const cardProps = defaultRecommendations[index] || defaultRecommendations[0];
              return (
                <RecommendationCard
                  key={index}
                  icon={cardProps.icon}
                  title={cardProps.title}
                  description={rec}
                  gradient={cardProps.gradient}
                />
              );
            })
          ) : (
            defaultRecommendations.map((rec, index) => (
              <RecommendationCard
                key={index}
                {...rec}
              />
            ))
          )}
        </div>

        {/* Trending Insights */}
        {recommendations?.trends?.length && (
          <div className="mb-4 p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg">
            <h3 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">
              Market Trends
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              {recommendations.trends.slice(0, 3).map((trend, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  {trend}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Opportunities */}
        {recommendations?.opportunities?.length && (
          <div className="mb-4 p-4 bg-green-50/50 dark:bg-green-950/20 rounded-lg">
            <h3 className="font-semibold mb-2 text-green-800 dark:text-green-200">
              Growth Opportunities
            </h3>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              {recommendations.opportunities.slice(0, 3).map((opportunity, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  {opportunity}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Call to Action */}
        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-white/20">
          <Button variant="outline" size="sm" className="flex-1">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Detailed Report
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Schedule Consultation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
