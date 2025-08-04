import type { CategoryBreakdown, FinancialSummary, MonthlyTimeSeriesResponse, TimeSeriesConfig, Transaction, UploadedFile, YearOverYearResponse } from '../types/financial';
import { AuthService } from './auth';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Base API client with authentication
 */
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get auth token from PocketBase AuthService
    const token = AuthService.getToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add authorization header if we have a token
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return {} as T;
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async uploadFile<T>(endpoint: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get auth token
    const token = localStorage.getItem('pocketbase_auth');
    const authData = token ? JSON.parse(token) : null;
    
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (authData?.token) {
      headers.Authorization = `Bearer ${authData.token}`;
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            resolve({} as T);
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new Error(errorData.detail || `HTTP error! status: ${xhr.status}`));
          } catch {
            reject(new Error(`HTTP error! status: ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error'));
      });

      xhr.open('POST', url);
      
      // Set headers
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.send(formData);
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

/**
 * Financial API endpoints
 */
export class FinancialAPI {
  /**
   * Upload and process CSV file
   */
  static async uploadCSV(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ 
    upload_id: string; 
    message: string; 
    transaction_count: number;
    filename: string; 
  }> {
    return apiClient.uploadFile('/api/upload-csv', file, onProgress);
  }

  /**
   * Delete all transactions for the authenticated user
   */
  static async deleteAllTransactions(): Promise<{ 
    message: string; 
    deleted_count: number; 
  }> {
    return apiClient.delete('/api/transactions');
  }

  /**
   * Get all transactions for the authenticated user
   */
  static async getTransactions(params?: {
    limit?: number;
    offset?: number;
    start_date?: string;
    end_date?: string;
    category?: string;
    account?: string;
    type?: 'income' | 'expense';
  }): Promise<{
    transactions: Transaction[];
    total: number;
    offset: number;
    limit: number;
  }> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/api/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get(endpoint);
  }

  /**
   * Get financial summary for the authenticated user
   */
  static async getFinancialSummary(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<FinancialSummary> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/api/financial-summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get(endpoint);
  }

  /**
   * Get category breakdown for expenses
   */
  static async getCategoryBreakdown(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<CategoryBreakdown[]> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/api/category-breakdown${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get(endpoint);
  }

  /**
   * Get upload history
   */
  static async getUploadHistory(): Promise<UploadedFile[]> {
    return apiClient.get('/api/uploads');
  }

  /**
   * Delete a transaction
   */
  static async deleteTransaction(transactionId: string): Promise<void> {
    return apiClient.delete(`/api/transactions/${transactionId}`);
  }

  /**
   * Update a transaction
   */
  static async updateTransaction(
    transactionId: string, 
    updates: Partial<Omit<Transaction, 'id' | 'userId' | 'created' | 'updated'>>
  ): Promise<Transaction> {
    return apiClient.put(`/api/transactions/${transactionId}`, updates);
  }

  /**
   * Manually categorize transactions
   */
  static async categorizeTransactions(rules: {
    pattern: string;
    category: string;
    apply_to_existing: boolean;
  }[]): Promise<{ updated_count: number; message: string }> {
    return apiClient.post('/api/categorize', { rules });
  }

  /**
   * Get financial insights using AI
   */
  static async getFinancialInsights(query?: string): Promise<{
    insights: string[];
    recommendations: string[];
    query_response?: string;
  }> {
    return apiClient.post('/api/insights', { query });
  }

  /**
   * Get monthly time series data
   */
  static async getMonthlyTimeSeries(config: TimeSeriesConfig): Promise<MonthlyTimeSeriesResponse> {
    const queryParams = new URLSearchParams();
    
    queryParams.append('metric', config.metric);
    if (config.months !== undefined) queryParams.append('months', config.months.toString());
    if (config.category) queryParams.append('category', config.category);
    if (config.account) queryParams.append('account', config.account);

    const endpoint = `/api/monthly-time-series?${queryParams.toString()}`;
    return apiClient.get(endpoint);
  }

  /**
   * Get year-over-year comparison data
   */
  static async getYearOverYear(config: TimeSeriesConfig): Promise<YearOverYearResponse> {
    const queryParams = new URLSearchParams();
    
    queryParams.append('metric', config.metric);
    if (config.currentYear !== undefined) queryParams.append('current_year', config.currentYear.toString());
    if (config.category) queryParams.append('category', config.category);
    if (config.account) queryParams.append('account', config.account);

    const endpoint = `/api/year-over-year?${queryParams.toString()}`;
    return apiClient.get(endpoint);
  }

  /**
   * Health check endpoint
   */
  static async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return apiClient.get('/health');
  }
}

/**
 * Error handling helper
 */
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}