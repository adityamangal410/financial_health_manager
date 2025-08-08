import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    useCategoryBreakdown,
    useDeleteAllTransactions,
    useFinancialSummary,
    useRefreshFinancialData,
    useTransactions
} from '../../hooks/useFinancialData';
import { usePocketBaseRealtime } from '../../hooks/usePocketBaseRealtime';
import { aiAnalysisService } from '../../services/aiAnalysis';
import { FinancialChatbot } from '../ai/FinancialChatbot';
import MonthlyTimeSeriesChart from '../charts/MonthlyTimeSeriesChart';
import SavingsRateChart from '../charts/SavingsRateChart';
import YearOverYearChart from '../charts/YearOverYearChart';
import { ApiStatus } from '../common/ApiStatus';
import { TransactionTable } from '../transactions/TransactionTable';
import { EnhancedFileUpload } from '../upload/EnhancedFileUpload';
import { CategoryChart } from './CategoryChart';
import { FinancialSummaryComponent } from './FinancialSummary';

export function Dashboard() {
  const { user, logout } = useAuth();
  const [showAdvancedTools] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Fetch data using React Query hooks
  const { 
    data: transactionsData, 
    isLoading: transactionsLoading,
    error: transactionsError 
  } = useTransactions({ limit: 1000 });
  
  // Use a 2-year date range to capture all data
  const currentDate = new Date();
  const twoYearsAgo = new Date(currentDate.getFullYear() - 2, 0, 1);
  const nextYear = new Date(currentDate.getFullYear() + 1, 11, 31);
  
  const dateRange = {
    start_date: twoYearsAgo.toISOString().split('T')[0],
    end_date: nextYear.toISOString().split('T')[0]
  };

  const { 
    data: financialSummary, 
    isLoading: summaryLoading,
    error: summaryError 
  } = useFinancialSummary(dateRange);
  
  const { 
    data: categoryBreakdown, 
    isLoading: categoryLoading,
    error: categoryError 
  } = useCategoryBreakdown(dateRange);
  
  const { refreshAll } = useRefreshFinancialData();
  const deleteAllMutation = useDeleteAllTransactions();
  
  // Set up real-time updates from PocketBase
  usePocketBaseRealtime();

  // AI Analysis handler
  const handleAIAnalysis = async (query: string): Promise<string> => {
    try {
      const result = await aiAnalysisService.analyzeFinancialQuery(query);
      return result.response;
    } catch (error) {
      return "I'm sorry, I encountered an error while analyzing your financial data. Please try again.";
    }
  };

  // Extract transactions from the API response
  const transactions = transactionsData?.transactions || [];

  // Handle API errors
  const hasError = transactionsError || summaryError || categoryError;
  const errorMessage = hasError ? 'Failed to load financial data. Please try refreshing.' : null;

  // Loading state
  const isLoading = transactionsLoading || summaryLoading || categoryLoading;

  // Handle file upload
  const handleUploadSuccess = (data: { transactionCount: number; filename: string; message: string }) => {
    setUploadSuccess(data.message);
    setUploadError(null);
    refreshAll();
    // Clear success message after 5 seconds
    setTimeout(() => setUploadSuccess(null), 5000);
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
    setUploadSuccess(null);
    // Clear error message after 10 seconds
    setTimeout(() => setUploadError(null), 10000);
  };

  // Handle delete all transactions
  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL transactions? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await deleteAllMutation.mutateAsync();
      setUploadSuccess(result.message);
      setUploadError(null);
      // Clear success message after 5 seconds
      setTimeout(() => setUploadSuccess(null), 5000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete transactions';
      setUploadError(errorMessage);
      setUploadSuccess(null);
      // Clear error message after 10 seconds
      setTimeout(() => setUploadError(null), 10000);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
      {/* Header */}
      <header className="header">
        <div className="container flex items-center justify-between">
          <div>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              margin: '0',
              color: 'var(--text-primary)'
            }}>
              💰 Financial Health Manager
            </h1>
            <div className="flex items-center gap-4" style={{ marginTop: '8px' }}>
              <p style={{ 
                color: 'var(--text-secondary)', 
                fontSize: '14px', 
                margin: '0',
                fontWeight: '500'
              }}>
                Welcome back, {user?.name || user?.email}
              </p>
              <ApiStatus />
            </div>
          </div>
          <button onClick={logout} className="btn-secondary">
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
        
        {/* Status Messages */}
        {uploadSuccess && (
          <div className="alert alert-success">
            <span>✅</span>
            {uploadSuccess}
          </div>
        )}
        
        {uploadError && (
          <div className="alert alert-error">
            <span>❌</span>
            {uploadError}
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-error">
            <span>⚠️</span>
            {errorMessage}
          </div>
        )}

        {/* File Upload Section */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 style={{ marginBottom: '8px' }}>📁 Upload Financial Data</h2>
              <p style={{ margin: '0', color: 'var(--text-secondary)' }}>
                Upload multiple CSV files from different banks or institutions. If you upload the same file twice, it will be skipped.
              </p>
            </div>
            {transactions.length > 0 && (
              <button
                onClick={handleDeleteAll}
                disabled={deleteAllMutation.isPending}
                className="btn-secondary"
                style={{
                  backgroundColor: '#fef2f2',
                  borderColor: '#fca5a5',
                  color: '#991b1b',
                  fontSize: '14px',
                  padding: '10px 20px'
                }}
              >
                {deleteAllMutation.isPending ? '🗑️ Deleting...' : '🗑️ Clear All Data'}
              </button>
            )}
          </div>
          <EnhancedFileUpload 
            onUploadComplete={handleUploadSuccess}
            onUploadError={handleUploadError}
            disabled={false}
            useWizard={showAdvancedTools}
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="card text-center">
            <h3>Loading your financial data...</h3>
            <p>Please wait while we fetch your latest information.</p>
          </div>
        )}

        {/* Main Dashboard Content */}
        {!isLoading && !hasError && (
          <>
            {/* Financial Summary */}
            {financialSummary && (
              <div className="mb-6">
                <FinancialSummaryComponent data={financialSummary} />
              </div>
            )}

            {/* Charts and Analytics */}
            {categoryBreakdown && categoryBreakdown.length > 0 && (
              <div className="card mb-6">
                <h2>📊 Expense Breakdown</h2>
                <p style={{ marginBottom: '24px' }}>
                  See how your money is being spent across different categories.
                </p>
                <CategoryChart categories={categoryBreakdown} />
              </div>
            )}

            {/* Enhanced Visualizations */}
            {transactions.length > 0 && (
              <>
                {/* Savings Rate Chart - New Enhanced Visualization */}
                <div className="card mb-6">
                  <SavingsRateChart 
                    config={{ months: 12 }}
                    height={400}
                    showTargetLine={true}
                    targetSavingsRate={20}
                  />
                </div>

                {/* Monthly Time Series Chart - Enhanced with Zoom */}
                <div className="card mb-6">
                  <MonthlyTimeSeriesChart 
                    config={{ metric: 'expenses', months: 12 }}
                    height={400}
                    enableZoom={true}
                    showSummaryStats={true}
                  />
                </div>

                {/* Year over Year Chart */}
                <div className="card mb-6">
                  <YearOverYearChart 
                    config={{ metric: 'expenses', currentYear: new Date().getFullYear() }}
                    height={400}
                  />
                </div>
              </>
            )}

            {/* Transactions Table */}
            {transactions.length > 0 ? (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 style={{ marginBottom: '8px' }}>📋 Recent Transactions</h2>
                    <p style={{ margin: '0', color: 'var(--text-muted)' }}>
                      Showing {transactions.length} transactions
                    </p>
                  </div>
                  <button 
                    onClick={refreshAll}
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '8px 16px' }}
                  >
                    🔄 Refresh
                  </button>
                </div>
                <TransactionTable transactions={transactions} />
              </div>
            ) : (
              <div className="card text-center">
                <h3>📭 No Transactions Yet</h3>
                <p>
                  Upload your first CSV file to see your financial data here.
                </p>
              </div>
            )}
          </>
        )}

        {/* Empty State when no errors but no data */}
        {!isLoading && !hasError && !financialSummary && transactions.length === 0 && (
          <div className="card text-center">
            <h2>🚀 Get Started</h2>
            <p style={{ fontSize: '16px', marginBottom: '24px' }}>
              Upload your financial data to begin tracking your expenses and income.
            </p>
            <p style={{ color: 'var(--text-muted)' }}>
              Supported formats: CSV files from banks, credit cards, and financial institutions.
            </p>
          </div>
        )}
      </main>

      {/* AI Financial Chatbot - Fixed position overlay */}
      <FinancialChatbot onAnalysisRequest={handleAIAnalysis} />
    </div>
  );
}