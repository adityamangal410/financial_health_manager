import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FinancialAPI, handleApiError } from '../services/api';
import type { TimeSeriesConfig, Transaction } from '../types/financial';

// Query keys for React Query
export const QUERY_KEYS = {
  transactions: (filters?: any) => ['transactions', filters],
  financialSummary: (filters?: any) => ['financial-summary', filters],
  categoryBreakdown: (filters?: any) => ['category-breakdown', filters],
  uploadHistory: () => ['upload-history'],
  insights: (query?: string) => ['insights', query],
  monthlyTimeSeries: (config?: TimeSeriesConfig) => ['monthly-time-series', config],
  yearOverYear: (config?: TimeSeriesConfig) => ['year-over-year', config],
} as const;

/**
 * Hook to fetch transactions with caching and filtering
 */
export function useTransactions(params?: {
  limit?: number;
  offset?: number;
  start_date?: string;
  end_date?: string;
  category?: string;
  account?: string;
  type?: 'income' | 'expense';
}) {
  return useQuery({
    queryKey: QUERY_KEYS.transactions(params),
    queryFn: () => FinancialAPI.getTransactions(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch financial summary
 */
export function useFinancialSummary(params?: {
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.financialSummary(params),
    queryFn: () => FinancialAPI.getFinancialSummary(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch category breakdown
 */
export function useCategoryBreakdown(params?: {
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.categoryBreakdown(params),
    queryFn: () => FinancialAPI.getCategoryBreakdown(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch upload history
 */
export function useUploadHistory() {
  return useQuery({
    queryKey: QUERY_KEYS.uploadHistory(),
    queryFn: () => FinancialAPI.getUploadHistory(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 2,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to upload CSV files with progress tracking
 */
export function useUploadCSV() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      file, 
      onProgress 
    }: { 
      file: File; 
      onProgress?: (progress: number) => void 
    }) => FinancialAPI.uploadCSV(file, onProgress),
    
    onSuccess: () => {
      // Invalidate all financial data queries to refetch with new data
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['category-breakdown'] });
      queryClient.invalidateQueries({ queryKey: ['upload-history'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-time-series'] });
      queryClient.invalidateQueries({ queryKey: ['year-over-year'] });
    },
    
    onError: (error) => {
      console.error('Upload failed:', handleApiError(error));
    },
  });
}

/**
 * Hook to update a transaction
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      transactionId, 
      updates 
    }: { 
      transactionId: string; 
      updates: Partial<Omit<Transaction, 'id' | 'userId' | 'created' | 'updated'>>
    }) => FinancialAPI.updateTransaction(transactionId, updates),
    
    onSuccess: (updatedTransaction) => {
      // Update the transaction in the cache
      queryClient.setQueryData(
        QUERY_KEYS.transactions(),
        (oldData: any) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            transactions: oldData.transactions.map((t: Transaction) =>
              t.id === updatedTransaction.id ? updatedTransaction : t
            ),
          };
        }
      );

      // Invalidate summary and breakdown queries since data changed
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['category-breakdown'] });
    },
    
    onError: (error) => {
      console.error('Transaction update failed:', handleApiError(error));
    },
  });
}

/**
 * Hook to delete a transaction
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionId: string) => FinancialAPI.deleteTransaction(transactionId),
    
    onSuccess: (_, transactionId) => {
      // Remove the transaction from the cache
      queryClient.setQueryData(
        QUERY_KEYS.transactions(),
        (oldData: any) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            transactions: oldData.transactions.filter((t: Transaction) => t.id !== transactionId),
            total: oldData.total - 1,
          };
        }
      );

      // Invalidate summary and breakdown queries since data changed
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['category-breakdown'] });
    },
    
    onError: (error) => {
      console.error('Transaction deletion failed:', handleApiError(error));
    },
  });
}

/**
 * Hook to categorize transactions using rules
 */
export function useCategorizeTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rules: {
      pattern: string;
      category: string;
      apply_to_existing: boolean;
    }[]) => FinancialAPI.categorizeTransactions(rules),
    
    onSuccess: () => {
      // Invalidate all financial data queries to refetch updated categorizations
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['category-breakdown'] });
    },
    
    onError: (error) => {
      console.error('Categorization failed:', handleApiError(error));
    },
  });
}

/**
 * Hook to get AI financial insights
 */
export function useFinancialInsights(query?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.insights(query),
    queryFn: () => FinancialAPI.getFinancialInsights(query),
    enabled: !!query, // Only run when we have a query
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to check API health
 */
export function useApiHealth() {
  return useQuery({
    queryKey: ['api-health'],
    queryFn: () => FinancialAPI.healthCheck(),
    staleTime: 1000 * 30, // 30 seconds
    retry: 3,
    refetchInterval: 1000 * 60, // Check every minute
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to delete all transactions
 */
export function useDeleteAllTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: FinancialAPI.deleteAllTransactions,
    onSuccess: () => {
      // Refresh all financial data after deletion
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['category-breakdown'] });
      queryClient.invalidateQueries({ queryKey: ['upload-history'] });
    },
  });
}

/**
 * Hook to fetch monthly time series data
 */
export function useMonthlyTimeSeries(config: TimeSeriesConfig) {
  return useQuery({
    queryKey: QUERY_KEYS.monthlyTimeSeries(config),
    queryFn: () => FinancialAPI.getMonthlyTimeSeries(config),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch year-over-year comparison data
 */
export function useYearOverYear(config: TimeSeriesConfig) {
  return useQuery({
    queryKey: QUERY_KEYS.yearOverYear(config),
    queryFn: () => FinancialAPI.getYearOverYear(config),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Helper hook to refresh all financial data
 */
export function useRefreshFinancialData() {
  const queryClient = useQueryClient();

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    queryClient.invalidateQueries({ queryKey: ['category-breakdown'] });
    queryClient.invalidateQueries({ queryKey: ['upload-history'] });
    queryClient.invalidateQueries({ queryKey: ['monthly-time-series'] });
    queryClient.invalidateQueries({ queryKey: ['year-over-year'] });
  };

  return { refreshAll };
}