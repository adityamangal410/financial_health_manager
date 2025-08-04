export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  account: string;
  type: 'income' | 'expense';
  userId: string;
  created: string;
  updated: string;
}

export interface UploadedFile {
  id: string;
  filename: string;
  size: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transactionCount?: number;
  errorMessage?: string;
  userId: string;
  created: string;
  updated: string;
}

export interface FinancialSummary {
  total_income: number;
  total_expenses: number;
  net_worth: number;
  balance: number;
  transactions_count: number;
  period_start: string;
  period_end: string;
  // Enhanced metrics
  savings_rate: number;
  average_monthly_income: number;
  average_monthly_expenses: number;
  largest_expense: number;
  largest_income: number;
  expense_to_income_ratio: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  transaction_count: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  net: number;
  savingsRate: number;
}

export interface TransactionFilter {
  startDate?: string;
  endDate?: string;
  category?: string;
  account?: string;
  type?: 'income' | 'expense' | 'all';
  searchTerm?: string;
  sortBy?: 'date' | 'amount' | 'description' | 'category';
  sortOrder?: 'asc' | 'desc';
}

export interface UploadProgress {
  progress: number;
  stage: 'uploading' | 'processing' | 'analyzing' | 'completed' | 'error';
  message: string;
}

// Time Series Chart Types
export interface MonthlyDataPoint {
  month: string; // Format: "2024-01", "2024-02", etc.
  income: number;
  expenses: number;
  net: number;
  transaction_count: number;
}

export interface YearOverYearDataPoint {
  month: string; // Format: "Jan", "Feb", etc.
  current_year: number;
  previous_year: number;
  year_diff: number;
  percent_change: number;
}

export interface MonthlyTimeSeriesResponse {
  data: MonthlyDataPoint[];
  period_start: string;
  period_end: string;
  metric: string; // "expenses", "income", "net"
}

export interface YearOverYearResponse {
  data: YearOverYearDataPoint[];
  current_year: number;
  previous_year: number;
  metric: string;
}

export interface TimeSeriesConfig {
  metric: 'expenses' | 'income' | 'net';
  months?: number; // For monthly series
  currentYear?: number; // For year-over-year
  category?: string;
  account?: string;
}