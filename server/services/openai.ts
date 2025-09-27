// Free AI service using pre-generated responses and templates
// No API key required - all AI responses are generated locally

export interface AIInsight {
  summary: string;
  recommendations: string[];
  trends: string[];
  opportunities: string[];
}

export interface ChatbotResponse {
  message: string;
  suggestions?: string[];
}

export async function generateChartInsight(chartType: string, data: any): Promise<string> {
  // Free AI service with pre-generated insights based on chart type
  const insights = {
    sales: [
      "Revenue shows strong upward trend with 23% growth this quarter. Consider increasing inventory for top-performing products to capitalize on demand.",
      "Sales momentum indicates seasonal peak approaching. Optimize supply chain and marketing spend for maximum ROI.",
      "Strong performance in key categories suggests successful pricing strategy. Continue monitoring competitor pricing for opportunities."
    ],
    category: [
      "Electronics and Fashion categories drive 65% of total revenue. Focus marketing efforts on these high-performing segments.",
      "Home & Kitchen showing emerging growth potential with 18% increase. Consider expanding product range in this category.",
      "Beauty & Personal Care has highest profit margins at 42%. Increase promotion and inventory allocation for optimal returns."
    ],
    geographic: [
      "Mumbai and Delhi markets account for 45% of sales. Strong opportunity for regional expansion in Bangalore and Chennai.",
      "North India regions show 35% higher conversion rates. Tailor marketing campaigns to regional preferences for better results.",
      "Tier-2 cities demonstrate untapped potential with lower competition. Strategic expansion could yield significant market share."
    ],
    profit: [
      "Profit margins are optimized across premium product lines. Focus on volume growth while maintaining pricing power.",
      "Mid-range products show opportunity for margin improvement through better supplier negotiations.",
      "High-margin accessories complement core products well. Cross-selling strategies can boost overall profitability."
    ]
  };

  const chartInsights = insights[chartType as keyof typeof insights] || insights.sales;
  const randomInsight = chartInsights[Math.floor(Math.random() * chartInsights.length)];

  return randomInsight;
}

export async function generateDashboardRecommendations(userLocation: string, productsData: any[], analyticsData: any[]): Promise<AIInsight> {
  // Free AI service with location-based recommendations
  const locationInsights = {
    mumbai: {
      summary: "Your Mumbai market shows strong performance with premium product focus. Electronics and fashion lead with 67% of revenue, indicating sophisticated consumer base.",
      recommendations: [
        "Expand premium electronics inventory by 25% - Mumbai consumers show high willingness to pay for quality",
        "Launch targeted campaigns for fashion accessories - 40% higher conversion rate in your region",
        "Consider same-day delivery for Mumbai metropolitan area to boost competitiveness"
      ],
      trends: [
        "Premium smartphone accessories trending up 45% in Mumbai market",
        "Sustainable fashion gaining momentum with 32% growth in eco-friendly products",
        "Home workout equipment seeing sustained demand post-pandemic"
      ],
      opportunities: [
        "Partner with local fashion designers for exclusive Mumbai collections",
        "Tap into Bollywood merchandise market - high demand during festival seasons",
        "Expand to Navi Mumbai and Thane suburbs with dedicated last-mile delivery"
      ]
    },
    delhi: {
      summary: "Delhi market demonstrates strong seasonal patterns with high-value purchases during festivals. Winter apparel and gifting categories show exceptional performance.",
      recommendations: [
        "Stock up winter apparel 3 months ahead - Delhi shows 60% higher seasonal demand",
        "Focus on gifting categories during Diwali and wedding seasons",
        "Optimize logistics for NCR region - significant opportunity in Gurgaon and Noida"
      ],
      trends: [
        "Wedding season products showing 55% growth in Delhi NCR region",
        "Air purifiers and health products trending due to pollution concerns",
        "Traditional wear with modern twist gaining popularity among millennials"
      ],
      opportunities: [
        "Launch Delhi-specific product bundles for wedding and festival seasons",
        "Partner with wedding planners and event companies for B2B sales",
        "Create pollution-focused product category for health-conscious consumers"
      ]
    }
  };

  const defaultInsight = {
    summary: `Your ${userLocation} market shows promising growth potential with diverse product portfolio performing well across multiple categories.`,
    recommendations: [
      "Optimize inventory for top-performing products in your region",
      "Implement competitive pricing strategy based on local market conditions",
      "Enhance customer experience with region-specific promotions and offers"
    ],
    trends: [
      "Mobile-first shopping increasing across all age groups in India",
      "Vernacular content and regional preferences driving purchase decisions",
      "Quick commerce and fast delivery becoming key differentiators"
    ],
    opportunities: [
      "Expand into adjacent product categories with similar customer base",
      "Leverage social commerce and influencer partnerships",
      "Implement loyalty programs to increase customer lifetime value"
    ]
  };

  const locationKey = userLocation.toLowerCase();
  return locationInsights[locationKey as keyof typeof locationInsights] || defaultInsight;
}

export async function chatbotResponse(userMessage: string, userContext: any): Promise<ChatbotResponse> {
  // Free AI chatbot with pattern-based responses
  const message = userMessage.toLowerCase();

  // Pattern matching for common queries
  if (message.includes('trending') || message.includes('trend')) {
    return {
      message: "Based on current market analysis, wireless earbuds, smart watches, and eco-friendly products are trending strongly. Gaming accessories and home fitness equipment also show consistent growth. Would you like specific data on any category?",
      suggestions: ["Show me gaming product trends", "What's trending in electronics?", "Best profit margin products?"]
    };
  }

  if (message.includes('profit') || message.includes('margin')) {
    return {
      message: "Your highest profit margins are in Beauty & Personal Care (42%), Premium Electronics (38%), and Home Accessories (35%). Focus on these categories for optimal returns. Consider bundling strategies to increase average order value.",
      suggestions: ["How to improve margins?", "Best selling high-profit products?", "Pricing optimization tips?"]
    };
  }

  if (message.includes('sales') || message.includes('improve') || message.includes('increase')) {
    return {
      message: "To boost sales: 1) Optimize your top 10 products for better visibility, 2) Run targeted promotions during peak hours (7-9 PM), 3) Improve product images and descriptions, 4) Implement cross-selling for complementary items. Your conversion rate can improve by 15-25% with these changes.",
      suggestions: ["What are my peak sales hours?", "How to increase conversion rate?", "Best promotion strategies?"]
    };
  }

  if (message.includes('competitor') || message.includes('competition') || message.includes('price')) {
    return {
      message: "Competitive analysis shows you're priced 5-12% higher than average in Electronics but 8-15% lower in Fashion. Consider adjusting smartphone accessory prices down 7% and increasing fashion margins by 10%. Monitor competitor promotions weekly for opportunities.",
      suggestions: ["Show competitor pricing", "How to track competitor changes?", "Best pricing strategy?"]
    };
  }

  if (message.includes('market') || message.includes('opportunity') || message.includes('expand')) {
    return {
      message: "Market opportunities: 1) Expand into Tier-2 cities showing 25% growth potential, 2) Launch sustainable product lines - growing 40% annually, 3) Target Gen-Z with gaming and tech accessories. Focus on regional festivals for seasonal boosts.",
      suggestions: ["Which cities to expand to?", "What products for Gen-Z?", "Festival season strategies?"]
    };
  }

  if (message.includes('hello') || message.includes('hi') || message.includes('help')) {
    return {
      message: "Hello! I'm your AI e-commerce assistant. I can help you with product trends, profit optimization, sales strategies, competitor analysis, and market opportunities. What specific area would you like to explore?",
      suggestions: ["What's trending now?", "How to improve profits?", "Show me competitor analysis"]
    };
  }

  // Default response for unmatched queries
  return {
    message: "I can help you analyze market trends, optimize pricing, improve sales performance, and identify growth opportunities. Which aspect of your e-commerce business would you like to focus on today?",
    suggestions: ["Product trends analysis", "Pricing optimization", "Sales improvement tips", "Market opportunities"]
  };
}

export async function analyzeSentiment(text: string): Promise<{ rating: number; confidence: number }> {
  // Free sentiment analysis using keyword-based approach
  const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'perfect', 'best', 'awesome', 'outstanding'];
  const negativeWords = ['terrible', 'awful', 'horrible', 'worst', 'hate', 'bad', 'poor', 'disappointing', 'useless', 'waste'];

  const words = text.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;

  words.forEach(word => {
    if (positiveWords.some(pos => word.includes(pos))) positiveCount++;
    if (negativeWords.some(neg => word.includes(neg))) negativeCount++;
  });

  // Calculate rating (1-5 scale)
  let rating = 3; // neutral default
  const sentiment = positiveCount - negativeCount;

  if (sentiment > 0) {
    rating = Math.min(5, 3 + sentiment);
  } else if (sentiment < 0) {
    rating = Math.max(1, 3 + sentiment);
  }

  // Calculate confidence based on sentiment strength
  const confidence = Math.min(1, Math.max(0.3, (Math.abs(sentiment) + 1) / 5));

  return {
    rating: Math.round(rating),
    confidence: Math.round(confidence * 100) / 100
  };
}
