import { useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategoryBreakdown } from '../../types/financial';
import { formatCurrency } from '../../utils/financial';

interface CategoryChartProps {
  categories: CategoryBreakdown[];
  isLoading?: boolean;
  interactive?: boolean;
  showControls?: boolean;
}

export function CategoryChart({ 
  categories, 
  isLoading = false, 
  interactive = true,
  showControls = true 
}: CategoryChartProps) {
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());
  const [chartView, setChartView] = useState<'pie' | 'donut'>('pie');
  // Generate colors for categories
  const COLORS = [
    '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
    '#14b8a6', '#eab308', '#dc2626', '#9333ea', '#059669'
  ];

  const getColor = (index: number) => COLORS[index % COLORS.length];

  // Filter out hidden categories
  const visibleCategories = categories?.filter(cat => !hiddenCategories.has(cat.category)) || [];

  // Handle legend click to toggle category visibility
  const handleLegendClick = (data: any) => {
    if (!interactive) return;
    
    const category = data.value;
    const newHidden = new Set(hiddenCategories);
    
    if (newHidden.has(category)) {
      newHidden.delete(category);
    } else {
      newHidden.add(category);
    }
    
    setHiddenCategories(newHidden);
  };

  // Calculate total for visible categories
  const visibleTotal = visibleCategories.reduce((sum, cat) => sum + cat.amount, 0);

  // Safety check for undefined data
  if (!categories) {
    return (
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
          Expense Categories
        </h3>
        <div style={{ 
          height: '300px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '1rem',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '3rem' }}>📊</div>
          <p>Loading category data...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
          Expense Categories
        </h3>
        <div style={{ 
          height: '300px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          borderRadius: '0.5rem'
        }}>
          <div style={{ 
            width: '3rem', 
            height: '3rem', 
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #0ea5e9',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
          Expense Categories
        </h3>
        <div style={{ 
          height: '300px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '1rem',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '3rem' }}>📊</div>
          <p>No expense data available</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '0.375rem',
          padding: '0.75rem',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
        }}>
          <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{data.category}</p>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            {formatCurrency(data.amount)} ({data.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
          Expense Categories
          {hiddenCategories.size > 0 && (
            <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 'normal', marginLeft: '0.5rem' }}>
              ({visibleCategories.length}/{categories.length} shown)
            </span>
          )}
        </h3>
        
        {showControls && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setChartView('pie')}
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                backgroundColor: chartView === 'pie' ? '#0ea5e9' : 'white',
                color: chartView === 'pie' ? 'white' : '#374151',
                cursor: 'pointer'
              }}
            >
              Pie
            </button>
            <button
              onClick={() => setChartView('donut')}
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                backgroundColor: chartView === 'donut' ? '#0ea5e9' : 'white',
                color: chartView === 'donut' ? 'white' : '#374151',
                cursor: 'pointer'
              }}
            >
              Donut
            </button>
            {hiddenCategories.size > 0 && (
              <button
                onClick={() => setHiddenCategories(new Set())}
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  backgroundColor: 'white',
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                Show All
              </button>
            )}
          </div>
        )}
      </div>
      
      <div style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={visibleCategories}
              cx="50%"
              cy="50%"
              innerRadius={chartView === 'donut' ? 40 : 0}
              outerRadius={80}
              dataKey="amount"
              nameKey="category"
            >
              {visibleCategories.map((entry, index) => {
                const originalIndex = categories.findIndex(cat => cat.category === entry.category);
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getColor(originalIndex)}
                    stroke={interactive ? '#ffffff' : 'none'}
                    strokeWidth={interactive ? 2 : 0}
                    style={{ cursor: interactive ? 'pointer' : 'default' }}
                  />
                );
              })}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              onClick={handleLegendClick}
              formatter={(value: string) => {
                const originalIndex = categories.findIndex(cat => cat.category === value);
                const isHidden = hiddenCategories.has(value);
                return (
                  <span 
                    style={{ 
                      color: isHidden ? '#9ca3af' : getColor(originalIndex), 
                      fontSize: '0.875rem',
                      textDecoration: isHidden ? 'line-through' : 'none',
                      cursor: interactive ? 'pointer' : 'default'
                    }}
                  >
                    {value}
                  </span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Category breakdown list */}
      <div style={{ marginTop: '1rem' }}>
        {visibleTotal > 0 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '0.75rem',
            padding: '0.5rem',
            backgroundColor: '#f9fafb',
            borderRadius: '0.375rem'
          }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
              Visible Total
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0ea5e9' }}>
              {formatCurrency(visibleTotal)}
            </span>
          </div>
        )}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {categories.slice(0, 5).map((category, index) => {
            const isHidden = hiddenCategories.has(category.category);
            return (
              <div 
                key={category.category} 
                onClick={() => interactive && handleLegendClick({ value: category.category })}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  borderRadius: '0.25rem',
                  cursor: interactive ? 'pointer' : 'default',
                  opacity: isHidden ? 0.5 : 1,
                  backgroundColor: isHidden ? '#f3f4f6' : 'transparent',
                  transition: 'all 0.2s ease',
                  border: '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (interactive) {
                    e.currentTarget.style.backgroundColor = isHidden ? '#e5e7eb' : '#f9fafb';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  if (interactive) {
                    e.currentTarget.style.backgroundColor = isHidden ? '#f3f4f6' : 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '0.75rem',
                    height: '0.75rem',
                    backgroundColor: getColor(index),
                    borderRadius: '50%',
                    opacity: isHidden ? 0.5 : 1
                  }} />
                  <span style={{ 
                    fontSize: '0.875rem',
                    textDecoration: isHidden ? 'line-through' : 'none'
                  }}>
                    {category.category}
                  </span>
                  {interactive && (
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: '#6b7280',
                      fontStyle: 'italic'
                    }}>
                      {isHidden ? '(hidden)' : '(click to hide)'}
                    </span>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', margin: 0 }}>
                    {formatCurrency(category.amount)}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                    {category.percentage.toFixed(1)}% ({category.transaction_count} transactions)
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        
        {categories.length > 5 && (
          <p style={{ 
            fontSize: '0.75rem', 
            color: '#6b7280', 
            textAlign: 'center',
            marginTop: '0.5rem',
            margin: 0
          }}>
            +{categories.length - 5} more categories
          </p>
        )}
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}