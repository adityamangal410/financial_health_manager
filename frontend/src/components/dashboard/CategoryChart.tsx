import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategoryBreakdown } from '../../types/financial';
import { formatCurrency } from '../../utils/financial';

interface CategoryChartProps {
  categories: CategoryBreakdown[];
  isLoading?: boolean;
}

export function CategoryChart({ categories, isLoading = false }: CategoryChartProps) {
  // Generate colors for categories
  const COLORS = [
    '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
    '#14b8a6', '#eab308', '#dc2626', '#9333ea', '#059669'
  ];

  const getColor = (index: number) => COLORS[index % COLORS.length];

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
      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
        Expense Categories
      </h3>
      
      <div style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categories}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="amount"
              nameKey="category"
            >
              {categories.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(index)} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value: string, entry: any, index: number) => (
                <span style={{ color: getColor(index), fontSize: '0.875rem' }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Category breakdown list */}
      <div style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {categories.slice(0, 5).map((category, index) => (
            <div key={category.category} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '0.5rem 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '0.75rem',
                  height: '0.75rem',
                  backgroundColor: getColor(index),
                  borderRadius: '50%'
                }} />
                <span style={{ fontSize: '0.875rem' }}>{category.category}</span>
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
          ))}
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