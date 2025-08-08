/**
 * AI Analysis Service - Connects to FastMCP server for financial insights
 */

class AIAnalysisService {
  // baseURL reserved for future real implementation
  private readonly baseURL: string;

  constructor(baseURL: string = import.meta.env.VITE_API_URL || 'http://localhost:8001') {
    // retain value for future real implementation to avoid TS unused warnings in strict mode
    this.baseURL = baseURL;
    void this.baseURL;
  }

  /**
   * Send a natural language query to the AI for financial analysis
   */
  async analyzeFinancialQuery(query: string, _userContext?: any): Promise<{
    response: string;
    tool_used?: string;
    confidence?: number;
    data_points?: number;
  }> {
    try {
      // In a real implementation, this would connect to the MCP server
      // For now, we'll simulate intelligent responses based on query patterns
      
      const response = await this.simulateAIResponse(query);
      return response;
      
      // Real implementation would look like:
      // const response = await fetch(`${this.baseURL}/api/ai/analyze`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify({ query, context: userContext })
      // });
      // return await response.json();
      
    } catch (error) {
      console.error('AI Analysis error:', error);
      throw new Error('Failed to get AI analysis. Please try again.');
    }
  }

  /**
   * Simulate AI responses based on query patterns (for demo purposes)
   */
  private async simulateAIResponse(query: string): Promise<{
    response: string;
    tool_used?: string;
    confidence?: number;
    data_points?: number;
  }> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));

    const lowerQuery = query.toLowerCase();
    
    // Pattern matching for different types of financial queries
    if (lowerQuery.includes('spending') || lowerQuery.includes('expenses') || lowerQuery.includes('categories')) {
      return {
        response: `Based on your recent transaction data, your top spending categories are:

1. **Food & Dining**: $1,247 (32% of total expenses)
2. **Transportation**: $620 (16% of total expenses)  
3. **Shopping**: $480 (12% of total expenses)
4. **Bills & Utilities**: $350 (9% of total expenses)

Your dining expenses have increased by 15% compared to last month. Consider meal planning to reduce food costs.`,
        tool_used: 'summarize_csvs',
        confidence: 0.92,
        data_points: 156
      };
    }
    
    if (lowerQuery.includes('savings') || lowerQuery.includes('save')) {
      return {
        response: `Your current savings rate is **18.5%** of your income, which is:

📊 **Above average** (national average: 13%)
📉 **Below your 20% target**

To reach your savings goal:
• Reduce dining out by $150/month
• Consider cheaper transportation options
• Set up automatic transfers to savings

You're doing well - just need a small adjustment! 💪`,
        tool_used: 'month_details',
        confidence: 0.88,
        data_points: 89
      };
    }
    
    if (lowerQuery.includes('income') || lowerQuery.includes('salary')) {
      return {
        response: `Your income analysis shows:

💰 **Monthly Average**: $4,200
📈 **Growth**: +5.2% vs last year
🎯 **Stability**: Very consistent (±3% variation)

Your income sources:
• Primary salary: 85%
• Side projects: 10% 
• Investments: 5%

Consider increasing your investment income for better financial diversity.`,
        tool_used: 'yoy_trends',
        confidence: 0.95,
        data_points: 234
      };
    }
    
    if (lowerQuery.includes('trend') || lowerQuery.includes('pattern') || lowerQuery.includes('monthly')) {
      return {
        response: `I've analyzed your spending patterns over the last 12 months:

📈 **Trending Up**: Healthcare (+25%), Entertainment (+18%)
📉 **Trending Down**: Transportation (-12%), Utilities (-8%)
🔄 **Seasonal**: Higher spending in Dec/Jan, lower in Feb/Mar

**Key Insight**: Your healthcare costs are rising significantly. Consider reviewing your insurance plan or setting aside more for medical expenses.`,
        tool_used: 'summarize_csvs',
        confidence: 0.90,
        data_points: 312
      };
    }
    
    if (lowerQuery.includes('budget') || lowerQuery.includes('improve') || lowerQuery.includes('advice')) {
      return {
        response: `Based on your financial data, here are my top recommendations:

🎯 **Priority 1**: Create a food budget ($800/month max)
🎯 **Priority 2**: Automate savings ($800/month)
🎯 **Priority 3**: Track discretionary spending more closely

**Quick wins**:
• Use the 50/30/20 rule (needs/wants/savings)
• Set up spending alerts for categories over budget
• Review subscriptions - you might have $50+ in unused services

You're on the right track! Small changes can have big impacts. 🚀`,
        tool_used: 'month_details',
        confidence: 0.85,
        data_points: 198
      };
    }
    
    if (lowerQuery.includes('unusual') || lowerQuery.includes('strange') || lowerQuery.includes('anomaly')) {
      return {
        response: `I've detected some unusual activity in your recent transactions:

🚨 **Unusual Expenses**:
• $450 medical expense (3x normal)
• $280 car repair (unexpected)
• $120 subscription charge (new service?)

💡 **Suggestions**:
• The medical expense might be tax-deductible
• Consider setting aside more for car maintenance
• Review that new subscription - is it providing value?

These one-time expenses explain why this month's spending is 12% higher than usual.`,
        tool_used: 'summarize_csvs',
        confidence: 0.93,
        data_points: 145
      };
    }
    
    // Default response for unrecognized queries
    return {
      response: `I can help you analyze various aspects of your finances! Here are some things you can ask me:

📊 **Spending Analysis**: "What are my top spending categories?"
💰 **Savings Goals**: "How is my savings rate?"
📈 **Trends**: "What are my spending trends?"
🎯 **Budget Advice**: "How can I improve my budget?"
🔍 **Unusual Activity**: "Any unusual expenses recently?"

What specific aspect of your finances would you like to explore?`,
      tool_used: 'general_query',
      confidence: 0.70,
      data_points: 0
    };
  }

  /**
   * Get suggested follow-up questions based on current conversation
   */
  getSuggestedQuestions(_lastQuery?: string): string[] {
    const baseQuestions = [
      "What are my top spending categories this month?",
      "How is my savings rate compared to last year?", 
      "What unusual expenses did I have recently?",
      "Show me my monthly income vs expense trends",
      "What's my average spending on dining out?",
      "How can I improve my financial health?"
    ];

    // In a real implementation, this would be more sophisticated
    // and based on actual conversation context
    return baseQuestions;
  }

  /**
   * Get financial insights proactively (for dashboard widgets)
   */
  async getProactiveInsights(): Promise<{
    insights: Array<{
      title: string;
      description: string;
      type: 'warning' | 'success' | 'info';
      action?: string;
    }>;
  }> {
    // Simulate getting proactive insights
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      insights: [
        {
          title: "Spending Alert",
          description: "You've spent 85% of your dining budget with 8 days left in the month.",
          type: "warning",
          action: "Review dining expenses"
        },
        {
          title: "Savings Goal Progress", 
          description: "Great job! You're ahead of your monthly savings target by $120.",
          type: "success",
          action: "View savings details"
        },
        {
          title: "Category Insight",
          description: "Your transportation costs decreased 15% this month due to remote work.",
          type: "info",
          action: "See full analysis"
        }
      ]
    };
  }
}

export const aiAnalysisService = new AIAnalysisService();