import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Bot, 
  Send, 
  X, 
  MessageCircle,
  Sparkles,
  TrendingUp,
  DollarSign,
  BarChart3
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: Date;
  suggestions?: string[];
}

const QUICK_QUESTIONS = [
  "What products are trending now?",
  "Best profit margins?",
  "How to improve sales?",
  "Competitor analysis?",
  "Market opportunities?",
  "Price optimization tips?"
];

const SUGGESTION_ICONS = {
  "trending": <TrendingUp className="h-3 w-3" />,
  "profit": <DollarSign className="h-3 w-3" />,
  "sales": <BarChart3 className="h-3 w-3" />,
  "default": <Sparkles className="h-3 w-3" />
};

export default function Chatbot() {
  const user = { id: "demo-user" }; // Mock user for demo
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      message: "Hi! I'm your AI assistant. I can help you with product recommendations, market trends analysis, profit optimization, and competitor insights. What would you like to know?",
      isUser: false,
      timestamp: new Date(),
      suggestions: ["What products are trending?", "Best profit margins?"]
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/chat", {
        userId: user?.id || "anonymous",
        message
      });
      return response.json();
    },
    onSuccess: (data) => {
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        message: data.message,
        isUser: false,
        timestamp: new Date(),
        suggestions: data.suggestions
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    },
    onError: (error) => {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        message: "I'm experiencing some technical difficulties. Please try again in a moment.",
        isUser: false,
        timestamp: new Date(),
        suggestions: ["What products are trending?", "How can I improve my profit margins?"]
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = (messageText?: string) => {
    const text = messageText || inputMessage.trim();
    if (!text) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      message: text,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);
    chatMutation.mutate(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getSuggestionIcon = (suggestion: string) => {
    const lower = suggestion.toLowerCase();
    if (lower.includes('trending') || lower.includes('trend')) return SUGGESTION_ICONS.trending;
    if (lower.includes('profit') || lower.includes('margin')) return SUGGESTION_ICONS.profit;
    if (lower.includes('sales') || lower.includes('sell')) return SUGGESTION_ICONS.sales;
    return SUGGESTION_ICONS.default;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50" data-testid="chatbot-container">
      {/* Chatbot Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "chatbot-button w-14 h-14 rounded-full text-white flex items-center justify-center",
          "bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90",
          "shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105",
          isOpen && "scale-95"
        )}
        data-testid="button-chatbot-toggle"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>

      {/* Chatbot Window */}
      {isOpen && (
        <Card className="absolute bottom-16 right-0 w-80 h-96 shadow-xl border-0 overflow-hidden bg-card">
          {/* Chat Header */}
          <CardHeader className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground p-4 flex flex-row items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-white/20 text-white">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-sm font-medium">EcomAI Assistant</CardTitle>
                <Badge variant="secondary" className="text-xs bg-white/20 text-white border-0">
                  AI Powered
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              data-testid="button-close-chatbot"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="p-0 flex flex-col h-80">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.isUser ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg p-3 text-sm",
                        message.isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                      data-testid={`message-${message.isUser ? 'user' : 'ai'}-${message.id}`}
                    >
                      <p className="whitespace-pre-wrap">{message.message}</p>
                      <p className={cn(
                        "text-xs mt-1 opacity-70",
                        message.isUser ? "text-right" : "text-left"
                      )}>
                        {formatTime(message.timestamp)}
                      </p>
                      
                      {/* AI Suggestions */}
                      {!message.isUser && message.suggestions && (
                        <div className="mt-2 space-y-1">
                          {message.suggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="w-full justify-start text-xs h-7 text-left"
                              onClick={() => sendMessage(suggestion)}
                              data-testid={`button-suggestion-${index}`}
                            >
                              {getSuggestionIcon(suggestion)}
                              <span className="ml-1 truncate">{suggestion}</span>
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3 flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-muted-foreground">AI is thinking...</span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t p-4 bg-background">
              {/* Quick Questions */}
              <div className="flex flex-wrap gap-1 mb-3">
                {QUICK_QUESTIONS.slice(0, 2).map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-6 px-2"
                    onClick={() => sendMessage(question)}
                    data-testid={`button-quick-${index}`}
                  >
                    {question}
                  </Button>
                ))}
              </div>

              {/* Message Input */}
              <div className="flex space-x-2">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="flex-1 text-sm"
                  disabled={chatMutation.isPending}
                  data-testid="input-chat-message"
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={!inputMessage.trim() || chatMutation.isPending}
                  size="sm"
                  className="px-3"
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
