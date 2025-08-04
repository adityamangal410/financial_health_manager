import type { FinancialSummary } from '../../types/financial';
import { formatCurrency } from '../../utils/financial';

interface FinancialSummaryProps {
  data: FinancialSummary;
  isLoading?: boolean;
}

export function FinancialSummaryComponent({ data, isLoading = false }: FinancialSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card">
            <div style={{ height: '80px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    );
  }

  const primaryCards = [
    {
      title: 'Total Income',
      value: data.total_income,
      icon: '💰',
      color: 'var(--success-color)',
      bgColor: '#ecfdf5',
      description: 'Money coming in'
    },
    {
      title: 'Total Expenses',
      value: data.total_expenses,
      icon: '💸',
      color: 'var(--error-color)',
      bgColor: '#fef2f2',
      description: 'Money going out'
    },
    {
      title: 'Net Worth',
      value: data.net_worth,
      icon: '📊',
      color: data.net_worth >= 0 ? 'var(--success-color)' : 'var(--error-color)',
      bgColor: data.net_worth >= 0 ? '#ecfdf5' : '#fef2f2',
      description: 'Income - Expenses'
    },
    {
      title: 'Savings Rate',
      value: data.savings_rate,
      icon: '💾',
      color: data.savings_rate >= 20 ? 'var(--success-color)' : data.savings_rate >= 10 ? 'var(--warning-color)' : 'var(--error-color)',
      bgColor: data.savings_rate >= 20 ? '#ecfdf5' : data.savings_rate >= 10 ? '#fffbeb' : '#fef2f2',
      description: 'Percentage saved',
      isPercentage: true
    }
  ];

  const secondaryCards = [
    {
      title: 'Monthly Income',
      value: data.average_monthly_income,
      icon: '📅',
      color: 'var(--accent-color)',
      description: 'Average per month'
    },
    {
      title: 'Monthly Expenses',
      value: data.average_monthly_expenses,
      icon: '📊',
      color: 'var(--accent-color)',
      description: 'Average per month'
    },
    {
      title: 'Largest Expense',
      value: data.largest_expense,
      icon: '💳',
      color: 'var(--error-color)',
      description: 'Biggest single expense'
    },
    {
      title: 'Transactions',
      value: data.transactions_count,
      icon: '📋',
      color: 'var(--text-secondary)',
      description: 'Total records',
      isCount: true
    }
  ];

  const renderCard = (card: any, index: number, isPrimary = true) => (
    <div 
      key={index} 
      className="card"
      style={{
        background: isPrimary ? `linear-gradient(135deg, ${card.bgColor || '#f8fafc'} 0%, var(--bg-primary) 100%)` : 'var(--bg-primary)',
        border: `1px solid ${card.color}20`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Pattern */}
      {isPrimary && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '80px',
          height: '80px',
          background: `radial-gradient(circle, ${card.color}10 0%, transparent 70%)`,
          borderRadius: '50%',
          transform: 'translate(25%, -25%)'
        }} />
      )}
      
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 style={{ 
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              margin: '0 0 4px 0',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {card.title}
            </h3>
            <p style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              margin: '0'
            }}>
              {card.description}
            </p>
          </div>
          <div style={{
            fontSize: '24px',
            background: card.bgColor || 'var(--bg-tertiary)',
            borderRadius: '12px',
            padding: '8px',
            border: `2px solid ${card.color}20`
          }}>
            {card.icon}
          </div>
        </div>
        
        <div style={{
          fontSize: isPrimary ? '28px' : '24px',
          fontWeight: '700',
          color: card.color,
          lineHeight: 1.2,
          fontFamily: 'monospace'
        }}>
          {card.isCount ? 
            `${card.value.toLocaleString()}` : 
            card.isPercentage ?
              `${card.value.toFixed(1)}%` :
              formatCurrency(card.value)
          }
        </div>
        
        {/* Trend indicator */}
        {!card.isCount && (
          <div style={{
            marginTop: '8px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{ color: card.value >= 0 ? 'var(--success-color)' : 'var(--error-color)' }}>
              {card.value >= 0 ? '↗️' : '↘️'}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              {card.isPercentage ? 
                (card.value >= 20 ? 'Excellent' : card.value >= 10 ? 'Good' : 'Needs Work') :
                (card.value >= 0 ? 'Positive' : 'Negative')
              }
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {/* Primary Financial Metrics */}
      <div className="grid grid-cols-4 mb-4">
        {primaryCards.map((card, index) => renderCard(card, index, true))}
      </div>
      
      {/* Secondary Metrics */}
      <div className="grid grid-cols-4 mb-6">
        {secondaryCards.map((card, index) => renderCard(card, index, false))}
      </div>
    </div>
  );
}