import { useState } from 'react';
import {
    Bar,
    Brush,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { useMonthlyTimeSeries } from '../../hooks/useFinancialData';
import type { TimeSeriesConfig } from '../../types/financial';

interface MonthlyTimeSeriesChartProps {
  config?: Partial<TimeSeriesConfig>;
  height?: number;
  className?: string;
  enableZoom?: boolean;
  showSummaryStats?: boolean;
}

export default function MonthlyTimeSeriesChart({
  config = {},
  height = 400,
  className = '',
  enableZoom = true,
  showSummaryStats = true,
}: MonthlyTimeSeriesChartProps) {
  // Default configuration
  const [chartConfig, setChartConfig] = useState<TimeSeriesConfig>({
    metric: 'expenses',
    months: 12,
    ...config,
  });

  const { data: timeSeriesData, isLoading, error } = useMonthlyTimeSeries(chartConfig);

  // Format data for the chart
  const chartData = timeSeriesData?.data.map((point) => ({
    month: formatMonthLabel(point.month),
    monthKey: point.month,
    income: point.income,
    expenses: point.expenses,
    net: point.net,
    transactions: point.transaction_count,
  })) || [];

  const handleConfigChange = (newConfig: Partial<TimeSeriesConfig>) => {
    setChartConfig(prev => ({ ...prev, ...newConfig }));
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-80 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold mb-2">Failed to load time series data</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Monthly Time Series
          </h3>
          <p className="text-sm text-gray-600">
            {timeSeriesData?.period_start} to {timeSeriesData?.period_end}
          </p>
        </div>
        
        {/* Configuration Controls */}
        <div className="flex flex-wrap gap-3 mt-3 sm:mt-0">
          {/* Metric Selector */}
          <select
            value={chartConfig.metric}
            onChange={(e) => handleConfigChange({ metric: e.target.value as 'expenses' | 'income' | 'net' })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="expenses">Expenses</option>
            <option value="income">Income</option>
            <option value="net">Net (Income - Expenses)</option>
          </select>

          {/* Time Window Selector */}
          <select
            value={chartConfig.months || 12}
            onChange={(e) => handleConfigChange({ months: parseInt(e.target.value) })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={6}>Last 6 Months</option>
            <option value={12}>Last 12 Months</option>
            <option value={18}>Last 18 Months</option>
            <option value={24}>Last 24 Months</option>
            <option value={36}>Last 3 Years</option>
          </select>

          {/* Category Filter */}
          <select
            value={chartConfig.category || ''}
            onChange={(e) => handleConfigChange({ category: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            <option value="GROCERIES">Groceries</option>
            <option value="DINING">Dining</option>
            <option value="TRANSPORTATION">Transportation</option>
            <option value="UTILITIES">Utilities</option>
            <option value="ENTERTAINMENT">Entertainment</option>
            <option value="SHOPPING">Shopping</option>
            <option value="HEALTHCARE">Healthcare</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0]?.payload;
                  return (
                    <div style={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      minWidth: '240px'
                    }}>
                      <p style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#1f2937' }}>
                        {label}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '0.75rem', height: '0.75rem', backgroundColor: '#10b981', borderRadius: '50%' }} />
                            <span style={{ color: '#10b981', fontWeight: '600' }}>Income:</span>
                          </div>
                          <span style={{ fontWeight: '600' }}>${data?.income?.toLocaleString() || '0'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '0.75rem', height: '0.75rem', backgroundColor: '#ef4444', borderRadius: '50%' }} />
                            <span style={{ color: '#ef4444', fontWeight: '600' }}>Expenses:</span>
                          </div>
                          <span style={{ fontWeight: '600' }}>${data?.expenses?.toLocaleString() || '0'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '0.75rem', height: '0.75rem', backgroundColor: '#3b82f6', borderRadius: '50%' }} />
                            <span style={{ color: '#3b82f6', fontWeight: '600' }}>Net:</span>
                          </div>
                          <span style={{ 
                            fontWeight: '600',
                            color: (data?.net || 0) >= 0 ? '#10b981' : '#ef4444'
                          }}>
                            ${data?.net?.toLocaleString() || '0'}
                          </span>
                        </div>
                        <div style={{ 
                          marginTop: '0.5rem', 
                          paddingTop: '0.5rem', 
                          borderTop: '1px solid #e5e7eb',
                          fontSize: '0.875rem',
                          color: '#6b7280'
                        }}>
                          {data?.transactions || 0} transactions
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            
            {/* Show all metrics for context, highlight the selected one */}
            <Bar
              dataKey="income"
              fill="#10b981"
              fillOpacity={chartConfig.metric === 'income' ? 1 : 0.3}
              name="Income"
            />
            <Bar
              dataKey="expenses"
              fill="#ef4444"
              fillOpacity={chartConfig.metric === 'expenses' ? 1 : 0.3}
              name="Expenses"
            />
            <Line
              type="monotone"
              dataKey="net"
              stroke="#3b82f6"
              strokeWidth={chartConfig.metric === 'net' ? 3 : 1}
              dot={{ r: chartConfig.metric === 'net' ? 4 : 2 }}
              name="Net"
            />
            
            {/* Zoom/Brush functionality */}
            {enableZoom && chartData.length > 6 && (
              <Brush
                dataKey="month"
                height={30}
                stroke="#0ea5e9"
                fill="#f0f9ff"
                tickFormatter={(value: string | number) => String(value)}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      {showSummaryStats && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div className="text-center">
          <p className="text-gray-500">Avg Monthly Income</p>
          <p className="font-semibold text-green-600">
            ${(chartData.reduce((sum, d) => sum + d.income, 0) / Math.max(chartData.length, 1)).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Avg Monthly Expenses</p>
          <p className="font-semibold text-red-600">
            ${(chartData.reduce((sum, d) => sum + d.expenses, 0) / Math.max(chartData.length, 1)).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Avg Monthly Net</p>
          <p className="font-semibold text-blue-600">
            ${(chartData.reduce((sum, d) => sum + d.net, 0) / Math.max(chartData.length, 1)).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Total Transactions</p>
          <p className="font-semibold text-gray-700">
            {chartData.reduce((sum, d) => sum + d.transactions, 0).toLocaleString()}
          </p>
        </div>
        </div>
      )}
    </div>
  );
}

// Helper function to format month labels
function formatMonthLabel(monthKey: string): string {
  const date = new Date(monthKey + '-01');
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}