import ollama from "ollama";

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

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";

async function getOllamaResponse(prompt: string): Promise<string> {
  try {
    const response = await ollama.chat({
      model: "mistral",
      messages: [{ role: "user", content: prompt }],
      options: {
        temperature: 0.8,
      },
    });
    return response.message.content;
  } catch (error) {
    console.error("Error communicating with Ollama:", error);
    // Provide a fallback response that is more generic
    return "I am currently unable to provide a detailed analysis. Please try again later.";
  }
}


export async function generateChartInsight(chartType: string, data: any): Promise<string> {
  const prompt = `
    Analyze the following ${chartType} chart data and provide a concise, actionable insight.
    The data is: ${JSON.stringify(data)}.
    Focus on identifying a key trend or opportunity that an e-commerce manager could act on.
    Keep the insight to a single, impactful sentence.
  `;
  return getOllamaResponse(prompt);
}

export async function generateDashboardRecommendations(userLocation: string, productsData: any[], analyticsData: any[]): Promise<AIInsight> {
  const prompt = `
    As an AI e-commerce strategist for a user in ${userLocation}, analyze the following data:
    - Top 50 Products: ${JSON.stringify(productsData.slice(0, 5).map(p => ({ name: p.name, category: p.category, sales: p.sales })))}
    - Recent Analytics (last 20 periods): ${JSON.stringify(analyticsData.slice(0, 5).map(a => ({ date: a.date, revenue: a.revenue, profit: a.profit })))}

    Based on this data, provide:
    1. A brief 'summary' of the current business situation.
    2. A list of 3 actionable 'recommendations' to improve performance.
    3. A list of 2-3 emerging 'trends'.
    4. A list of 2-3 potential 'opportunities'.

    Format the output as a JSON object with the keys: "summary", "recommendations", "trends", "opportunities".
  `;

  const response = await getOllamaResponse(prompt);
  try {
    // Attempt to parse the JSON from the model's response
    return JSON.parse(response);
  } catch (error) {
    console.error("Failed to parse AI recommendations response:", error);
    // Provide a structured fallback response
    return {
      summary: "Could not generate a detailed summary at this time. Please check your data and try again.",
      recommendations: ["Review your product performance and analytics data.", "Consider running a new marketing campaign."],
      trends: ["Monitor market trends for new opportunities."],
      opportunities: ["Explore new product categories based on customer demand."],
    };
  }
}

export async function chatbotResponse(userMessage: string, userContext: any): Promise<ChatbotResponse> {
  const prompt = `
    You are an AI e-commerce assistant. A user with context ${JSON.stringify(userContext)} sent the message: "${userMessage}".

    Provide a helpful, concise response to the user's message.
    Also, suggest 3 relevant follow-up questions or actions the user might take next.

    Format the output as a JSON object with the keys: "message" and "suggestions".
  `;

  const response = await getOllamaResponse(prompt);
  try {
    return JSON.parse(response);
  } catch (error) {
    console.error("Failed to parse AI chatbot response:", error);
    return {
      message: "I'm having trouble processing that request right now. Could you please rephrase it?",
      suggestions: ["What are my top selling products?", "How can I improve sales?", "Show me recent trends."],
    };
  }
}

export async function analyzeSentiment(text: string): Promise<{ rating: number; confidence: number }> {
  const prompt = `
    Analyze the sentiment of the following text and return a rating on a scale of 1 to 5, where 1 is very negative and 5 is very positive.
    Also provide a confidence score between 0 and 1.
    Text: "${text}"

    Format the output as a JSON object with the keys: "rating" (number) and "confidence" (number).
  `;

  const response = await getOllamaResponse(prompt);
  try {
    const parsed = JSON.parse(response);
    return {
      rating: Math.round(parsed.rating),
      confidence: parsed.confidence,
    };
  } catch (error) {
    console.error("Failed to parse sentiment analysis response:", error);
    // Fallback to a simple keyword-based analysis if the model fails
    const positiveWords = ['great', 'excellent', 'amazing', 'love', 'perfect'];
    const negativeWords = ['terrible', 'awful', 'bad', 'hate', 'disappointing'];
    const words = text.toLowerCase().split(/\s+/);
    let score = 3;
    if (positiveWords.some(w => words.includes(w))) score = 5;
    if (negativeWords.some(w => words.includes(w))) score = 1;

    return {
      rating: score,
      confidence: 0.5,
    };
  }
}