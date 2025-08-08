import type { CategoryBreakdown, FinancialSummary, MonthlyTrend, Transaction } from '../types/financial';

/**
 * Format currency with proper locale and currency symbol
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format percentage with proper locale
 */
export function formatPercentage(value: number, decimals = 1): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
}

/**
 * Calculate financial summary from transactions
 */
export function calculateFinancialSummary(transactions: Transaction[]): FinancialSummary {
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const net = income - expenses;
  const savingsRate = income > 0 ? (net / income) * 100 : 0;
  
  const dates = transactions.map(t => new Date(t.date)).sort((a, b) => a.getTime() - b.getTime());
  const periodStart = (dates[0]?.toISOString() || new Date().toISOString()).slice(0, 10);
  const periodEnd = (dates[dates.length - 1]?.toISOString() || new Date().toISOString()).slice(0, 10);

  return {
    total_income: income,
    total_expenses: expenses,
    net_worth: net,
    balance: net,
    transactions_count: transactions.length,
    period_start: periodStart,
    period_end: periodEnd,
    // Approximations for enhanced metrics within utility context
    savings_rate: savingsRate,
    average_monthly_income: income,
    average_monthly_expenses: expenses,
    largest_expense: expenses,
    largest_income: income,
    expense_to_income_ratio: income > 0 ? expenses / income : 0,
  } as FinancialSummary;
}

/**
 * Calculate category breakdown for expenses
 */
export function calculateCategoryBreakdown(transactions: Transaction[]): CategoryBreakdown[] {
  const expenses = transactions.filter(t => t.type === 'expense');
  const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const categoryTotals = expenses.reduce((acc, transaction) => {
    const category = transaction.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + Math.abs(transaction.amount);
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      transaction_count: Math.max(1, Math.floor((amount / Math.max(totalExpenses, 1)) * expenses.length)),
    }))
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Calculate monthly trends
 */
export function calculateMonthlyTrends(transactions: Transaction[]): MonthlyTrend[] {
  const monthlyData = transactions.reduce((acc, transaction) => {
    const month = new Date(transaction.date).toISOString().substring(0, 7); // YYYY-MM
    
    if (!acc[month]) {
      acc[month] = { income: 0, expenses: 0 };
    }
    
    if (transaction.type === 'income') {
      acc[month].income += transaction.amount;
    } else {
      acc[month].expenses += Math.abs(transaction.amount);
    }
    
    return acc;
  }, {} as Record<string, { income: number; expenses: number }>);

  return Object.entries(monthlyData)
    .map(([month, data]) => {
      const net = data.income - data.expenses;
      const savingsRate = data.income > 0 ? (net / data.income) * 100 : 0;
      
      return {
        month: new Date(month + '-01').toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        }),
        income: data.income,
        expenses: data.expenses,
        net,
        savingsRate,
      };
    })
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
}

/**
 * Filter transactions based on criteria
 */
export function filterTransactions(
  transactions: Transaction[], 
  filter: Partial<{
    startDate: string;
    endDate: string;
    category: string;
    account: string;
    type: 'income' | 'expense' | 'all';
    searchTerm: string;
  }>
): Transaction[] {
  return transactions.filter(transaction => {
    // Date range filter
    if (filter.startDate && new Date(transaction.date) < new Date(filter.startDate)) {
      return false;
    }
    if (filter.endDate && new Date(transaction.date) > new Date(filter.endDate)) {
      return false;
    }
    
    // Category filter
    if (filter.category && filter.category !== 'all' && transaction.category !== filter.category) {
      return false;
    }
    
    // Account filter
    if (filter.account && filter.account !== 'all' && transaction.account !== filter.account) {
      return false;
    }
    
    // Type filter
    if (filter.type && filter.type !== 'all' && transaction.type !== filter.type) {
      return false;
    }
    
    // Search term filter
    if (filter.searchTerm) {
      const searchLower = filter.searchTerm.toLowerCase();
      const searchableText = [
        transaction.description,
        transaction.category,
        transaction.account,
      ].join(' ').toLowerCase();
      
      if (!searchableText.includes(searchLower)) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Sort transactions based on criteria
 */
export function sortTransactions(
  transactions: Transaction[],
  sortBy: 'date' | 'amount' | 'description' | 'category' = 'date',
  sortOrder: 'asc' | 'desc' = 'desc'
): Transaction[] {
  return [...transactions].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'amount':
        comparison = Math.abs(a.amount) - Math.abs(b.amount);
        break;
      case 'description':
        comparison = a.description.localeCompare(b.description);
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
}