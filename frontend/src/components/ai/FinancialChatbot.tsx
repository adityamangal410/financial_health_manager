import {
    ChatBubbleLeftRightIcon,
    LightBulbIcon,
    PaperAirplaneIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'analysis' | 'insight';
  metadata?: {
    tool_used?: string;
    data_points?: number;
    confidence?: number;
  };
}

interface FinancialChatbotProps {
  onAnalysisRequest?: (query: string) => Promise<string>;
}

export function FinancialChatbot({ onAnalysisRequest }: FinancialChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Hello! I'm your AI financial assistant. I can help you analyze your spending patterns, track your savings goals, and provide personalized financial insights. What would you like to know about your finances?",
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested questions for user
  const suggestedQuestions = [
    "What are my top spending categories this month?",
    "How is my savings rate compared to last year?",
    "What unusual expenses did I have recently?",
    "Show me my monthly income vs expense trends",
    "What's my average spending on dining out?",
    "How can I improve my financial health?"
  ];

  // Sample financial insights (in real implementation, these would come from MCP server)
  const sampleInsights = [
    {
      content: "Based on your transaction data from the last 3 months, your top spending category is 'Food & Dining' at $1,247 (32% of expenses). You've increased dining out by 15% compared to last quarter.",
      tool_used: "summarize_csvs",
      data_points: 156,
      confidence: 0.92
    },
    {
      content: "Your savings rate for this month is 18.5%, which is below your 20% target but above the national average of 13%. Consider reducing discretionary spending by $200 to reach your goal.",
      tool_used: "month_details",
      data_points: 89,
      confidence: 0.88
    },
    {
      content: "I noticed a $450 expense labeled 'Medical' last week - this is 3x higher than your typical healthcare spending. This might be worth categorizing separately for tax purposes.",
      tool_used: "yoy_trends",
      data_points: 234,
      confidence: 0.95
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI processing time
    setTimeout(async () => {
      let responseContent = '';
      let metadata = {};

      if (onAnalysisRequest) {
        try {
          responseContent = await onAnalysisRequest(inputMessage);
        } catch (error) {
          responseContent = "I'm sorry, I encountered an error while analyzing your financial data. Please try again.";
        }
      } else {
        // Demo mode with sample responses
        const randomInsight = sampleInsights[Math.floor(Math.random() * sampleInsights.length)];
        responseContent = randomInsight.content;
        metadata = {
          tool_used: randomInsight.tool_used,
          data_points: randomInsight.data_points,
          confidence: randomInsight.confidence
        };
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        type: 'analysis',
        metadata
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000); // Realistic response time
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputMessage(question);
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    
    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
        }`}>
          {!isUser && message.type === 'analysis' && (
            <div className="flex items-center mb-2 text-sm opacity-75">
              <SparklesIcon className="w-4 h-4 mr-1" />
              AI Analysis
            </div>
          )}
          
          <p className="text-sm leading-relaxed">{message.content}</p>
          
          {/* Metadata for AI responses */}
          {!isUser && message.metadata && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-xs opacity-75">
              <div className="flex items-center justify-between">
                <span>Tool: {message.metadata.tool_used}</span>
                <span>{message.metadata.data_points} data points</span>
              </div>
              {message.metadata.confidence && (
                <div className="mt-1">
                  Confidence: {(message.metadata.confidence * 100).toFixed(0)}%
                </div>
              )}
            </div>
          )}
          
          <div className="mt-1 text-xs opacity-75 text-right">
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </div>
    );
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110"
          title="Open AI Financial Assistant"
        >
          <ChatBubbleLeftRightIcon className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">AI Financial Assistant</h3>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(renderMessage)}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 max-w-xs">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
            <LightBulbIcon className="w-3 h-3 mr-1" />
            Try asking:
          </div>
          <div className="space-y-1">
            {suggestedQuestions.slice(0, 3).map((question, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedQuestion(question)}
                className="block w-full text-left text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 truncate"
              >
                • {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask about your finances..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 text-sm"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg p-2 transition-colors"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}