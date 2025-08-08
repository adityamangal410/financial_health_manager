import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useMonthlyTimeSeries } from '../../hooks/useFinancialData';
import type { TimeSeriesConfig } from '../../types/financial';

interface SavingsRateChartProps {
  config?: Partial<TimeSeriesConfig>;
  height?: number;
  className?: string;
  showTargetLine?: boolean;
  targetSavingsRate?: number;
}

export default function SavingsRateChart({
  config = {},
  height = 400,
  className = '',
  showTargetLine = true,
  targetSavingsRate = 20, // Default 20% savings rate target
}: SavingsRateChartProps) {
  // Default configuration
  const [chartConfig, setChartConfig] = useState<TimeSeriesConfig>({
    metric: 'net', // We'll calculate savings rate from net income
    months: 12,
    ...config,
  });

  const { data: timeSeriesData, isLoading, error } = useMonthlyTimeSeries(chartConfig);

  // Calculate savings rate data
  const savingsRateData = timeSeriesData?.data.map((point) => {
    const savingsRate = point.income > 0 ? ((point.income - point.expenses) / point.income) * 100 : 0;
    return {
      month: formatMonthLabel(point.month),
      monthKey: point.month,
      savingsRate: Math.round(savingsRate * 100) / 100, // Round to 2 decimal places
      income: point.income,
      expenses: point.expenses,
      net: point.net,
      transactions: point.transaction_count,
    };
  }) || [];

  // Helper function to format month labels
  function formatMonthLabel(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }

  // Calculate average savings rate
  const avgSavingsRate = savingsRateData.length > 0 
    ? savingsRateData.reduce((sum, point) => sum + point.savingsRate, 0) / savingsRateData.length
    : 0;

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          padding: '1rem',
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
          minWidth: '200px'
        }}>
          <p style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#1f2937' }}>
            {label}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#0ea5e9', fontWeight: '600' }}>Savings Rate:</span>
              <span style={{ fontWeight: '600' }}>{data.savingsRate.toFixed(1)}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Income:</span>
              <span>${data.income.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Expenses:</span>
              <span>${data.expenses.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Net:</span>
              <span style={{ color: data.net >= 0 ? '#10b981' : '#ef4444' }}>
                ${data.net.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

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
          <p className="text-lg font-semibold mb-2">Failed to load savings rate data</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
            💰 Savings Rate Over Time
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
            Track your savings rate trend and compare against targets
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Average</p>
            <p style={{ 
              fontSize: '1.125rem', 
              fontWeight: '600', 
              margin: 0,
              color: avgSavingsRate >= targetSavingsRate ? '#10b981' : '#f59e0b'
            }}>
              {avgSavingsRate.toFixed(1)}%
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select
              value={chartConfig.months}
              onChange={(e) => handleConfigChange({ months: parseInt(e.target.value) })}
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                backgroundColor: 'white'
              }}
            >
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
              <option value={18}>18 months</option>
              <option value={24}>24 months</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={savingsRateData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            
            {/* Target savings rate reference line */}
            {showTargetLine && (
              <ReferenceLine 
                y={targetSavingsRate} 
                stroke="#f59e0b" 
                strokeDasharray="5 5"
                strokeWidth={2}
              />
            )}
            
            <Tooltip content={<CustomTooltip />} />
            
            <Line
              type="monotone"
              dataKey="savingsRate"
              stroke="#0ea5e9"
              strokeWidth={3}
              dot={{ 
                fill: '#0ea5e9', 
                strokeWidth: 2, 
                stroke: '#ffffff',
                r: 6 
              }}
              activeDot={{ 
                r: 8, 
                stroke: '#0ea5e9',
                strokeWidth: 2,
                fill: '#ffffff'
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend and summary */}
      <div style={{ 
        marginTop: '1rem', 
        padding: '1rem',
        backgroundColor: '#f9fafb',
        borderRadius: '0.375rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '1rem',
              height: '0.25rem',
              backgroundColor: '#0ea5e9',
              borderRadius: '0.125rem'
            }} />
            <span style={{ fontSize: '0.875rem', color: '#374151' }}>Savings Rate</span>
          </div>
          
          {showTargetLine && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '1rem',
                height: '0.25rem',
                backgroundColor: '#f59e0b',
                borderRadius: '0.125rem',
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #ffffff 2px, #ffffff 4px)'
              }} />
              <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                Target ({targetSavingsRate}%)
              </span>
            </div>
          )}
        </div>
        
        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
          💡 A savings rate of 20%+ is considered excellent
        </div>
      </div>
    </div>
  );
}