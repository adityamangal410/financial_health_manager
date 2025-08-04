import { useState } from 'react';
import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { useYearOverYear } from '../../hooks/useFinancialData';
import type { TimeSeriesConfig } from '../../types/financial';

interface YearOverYearChartProps {
  config?: Partial<TimeSeriesConfig>;
  height?: number;
  className?: string;
}

export default function YearOverYearChart({
  config = {},
  height = 400,
  className = '',
}: YearOverYearChartProps) {
  // Default configuration
  const [chartConfig, setChartConfig] = useState<TimeSeriesConfig>({
    metric: 'expenses',
    currentYear: new Date().getFullYear(),
    ...config,
  });

  const { data: yoyData, isLoading, error } = useYearOverYear(chartConfig);

  // Format data for the chart
  const chartData = yoyData?.data.map((point) => ({
    month: point.month,
    currentYear: point.current_year,
    previousYear: point.previous_year,
    difference: point.year_diff,
    percentChange: point.percent_change,
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
          <p className="text-lg font-semibold mb-2">Failed to load year-over-year data</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  // Calculate summary stats
  const totalCurrentYear = chartData.reduce((sum, d) => sum + d.currentYear, 0);
  const totalPreviousYear = chartData.reduce((sum, d) => sum + d.previousYear, 0);
  const totalDifference = totalCurrentYear - totalPreviousYear;
  const totalPercentChange = totalPreviousYear > 0 ? (totalDifference / totalPreviousYear) * 100 : 0;

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Year-over-Year Comparison
          </h3>
          <p className="text-sm text-gray-600">
            {yoyData?.current_year} vs {yoyData?.previous_year} • {chartConfig.metric.charAt(0).toUpperCase() + chartConfig.metric.slice(1)}
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

          {/* Year Selector */}
          <select
            value={chartConfig.currentYear || new Date().getFullYear()}
            onChange={(e) => handleConfigChange({ currentYear: parseInt(e.target.value) })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - i;
              return (
                <option key={year} value={year}>
                  {year} vs {year - 1}
                </option>
              );
            })}
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 text-sm">
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <p className="text-gray-600">Current Year Total</p>
          <p className="text-lg font-semibold text-blue-700">
            ${totalCurrentYear.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg text-center">
          <p className="text-gray-600">Previous Year Total</p>
          <p className="text-lg font-semibold text-gray-700">
            ${totalPreviousYear.toLocaleString()}
          </p>
        </div>
        <div className={`p-3 rounded-lg text-center ${totalDifference >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
          <p className="text-gray-600">Difference</p>
          <p className={`text-lg font-semibold ${totalDifference >= 0 ? 'text-red-700' : 'text-green-700'}`}>
            {totalDifference >= 0 ? '+' : ''}${totalDifference.toLocaleString()}
          </p>
        </div>
        <div className={`p-3 rounded-lg text-center ${totalPercentChange >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
          <p className="text-gray-600">% Change</p>
          <p className={`text-lg font-semibold ${totalPercentChange >= 0 ? 'text-red-700' : 'text-green-700'}`}>
            {totalPercentChange >= 0 ? '+' : ''}{totalPercentChange.toFixed(1)}%
          </p>
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
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'percentChange') {
                  return [`${value.toFixed(1)}%`, 'Change %'];
                }
                return [
                  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  name === 'currentYear' ? `${yoyData?.current_year}` : 
                  name === 'previousYear' ? `${yoyData?.previous_year}` : 'Difference'
                ];
              }}
              labelFormatter={(label) => `Month: ${label}`}
            />
            <Legend />
            
            <Bar
              dataKey="currentYear"
              fill="#3b82f6"
              name={`${yoyData?.current_year}`}
            />
            <Bar
              dataKey="previousYear"
              fill="#9ca3af"
              name={`${yoyData?.previous_year}`}
            />
            <Line
              type="monotone"
              dataKey="percentChange"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 3 }}
              yAxisId="right"
              name="Change %"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Month-by-month breakdown */}
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Monthly Breakdown</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          {chartData.map((data) => (
            <div
              key={data.month}
              className={`p-2 rounded border ${
                data.percentChange > 0 ? 'bg-red-50 border-red-200' : 
                data.percentChange < 0 ? 'bg-green-50 border-green-200' : 
                'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="font-semibold">{data.month}</div>
              <div className="text-gray-600">
                ${data.currentYear.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className={`font-semibold ${
                data.percentChange > 0 ? 'text-red-600' : 
                data.percentChange < 0 ? 'text-green-600' : 
                'text-gray-600'
              }`}>
                {data.percentChange > 0 ? '+' : ''}{data.percentChange.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}