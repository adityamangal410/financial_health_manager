import { useMemo, useState } from 'react';
import type { Transaction } from '../../types/financial';
import { formatCurrency, formatDate } from '../../utils/financial';

interface TransactionTableProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export function TransactionTable({ transactions, isLoading = false }: TransactionTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'date' | 'amount' | 'description' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction =>
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.account && transaction.account.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Sort transactions
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'date') {
        aValue = new Date(a.date);
        bValue = new Date(b.date);
      } else if (sortField === 'amount') {
        aValue = Math.abs(a.amount);
        bValue = Math.abs(b.amount);
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [transactions, searchTerm, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: typeof sortField) => {
    if (sortField !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const getTransactionTypeIcon = (amount: number) => {
    return amount >= 0 ? '💰' : '💸';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'groceries': '🛒',
      'dining': '🍽️',
      'transportation': '🚗',
      'entertainment': '🎬',
      'shopping': '🛍️',
      'utilities': '⚡',
      'health': '🏥',
      'income': '💰',
      'housing': '🏠',
      'travel': '✈️',
      'education': '📚',
      'subscriptions': '📱',
      'insurance': '🛡️',
      'taxes': '🏛️',
      'savings': '🐷',
      'investments': '📈',
      'default': '📋'
    };
    return icons[category.toLowerCase()] || icons.default;
  };

  if (isLoading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h3>Loading transactions...</h3>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Search and Summary */}
      <div className="flex items-center justify-between mb-4">
        <div style={{ position: 'relative', width: '300px' }}>
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '40px' }}
          />
          <span style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }}>
            🔍
          </span>
        </div>
        
        <div style={{ 
          color: 'var(--text-muted)', 
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {filteredTransactions.length} of {transactions.length} transactions
        </div>
      </div>

      {/* Table */}
      {filteredTransactions.length > 0 ? (
        <>
          <div style={{ 
            borderRadius: '8px', 
            overflow: 'hidden', 
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)'
          }}>
            <table className="table">
              <thead>
                <tr>
                  <th 
                    style={{ cursor: 'pointer', userSelect: 'none', width: '120px' }}
                    onClick={() => handleSort('date')}
                  >
                    📅 Date {getSortIcon('date')}
                  </th>
                  <th 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('description')}
                  >
                    📝 Description {getSortIcon('description')}
                  </th>
                  <th 
                    style={{ cursor: 'pointer', userSelect: 'none', width: '140px' }}
                    onClick={() => handleSort('category')}
                  >
                    🏷️ Category {getSortIcon('category')}
                  </th>
                  <th style={{ width: '120px' }}>
                    🏦 Account
                  </th>
                  <th 
                    style={{ 
                      cursor: 'pointer', 
                      userSelect: 'none', 
                      textAlign: 'right', 
                      width: '120px' 
                    }}
                    onClick={() => handleSort('amount')}
                  >
                    💵 Amount {getSortIcon('amount')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td style={{ 
                      fontWeight: '500',
                      color: 'var(--text-primary)'
                    }}>
                      {formatDate(new Date(transaction.date))}
                    </td>
                    <td style={{ 
                      fontWeight: '500',
                      color: 'var(--text-primary)'
                    }}>
                      <div className="flex items-center gap-4">
                        <span>{getTransactionTypeIcon(transaction.amount)}</span>
                        <span>{transaction.description}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-4">
                        <span>{getCategoryIcon(transaction.category)}</span>
                        <span style={{ 
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          fontWeight: '500'
                        }}>
                          {transaction.category}
                        </span>
                      </div>
                    </td>
                    <td style={{ 
                      fontSize: '13px',
                      color: 'var(--text-muted)'
                    }}>
                      {transaction.account || 'N/A'}
                    </td>
                    <td style={{ 
                      textAlign: 'right',
                      fontWeight: '600',
                      color: transaction.amount >= 0 ? 'var(--success-color)' : 'var(--error-color)'
                    }}>
                      {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between" style={{ marginTop: '24px' }}>
              <div style={{ 
                color: 'var(--text-muted)', 
                fontSize: '14px' 
              }}>
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length}
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary"
                  style={{ 
                    padding: '8px 16px', 
                    fontSize: '12px',
                    opacity: currentPage === 1 ? 0.5 : 1
                  }}
                >
                  ← Previous
                </button>
                
                <span style={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-secondary"
                  style={{ 
                    padding: '8px 16px', 
                    fontSize: '12px',
                    opacity: currentPage === totalPages ? 0.5 : 1
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card text-center">
          <h3>🔍 No transactions found</h3>
          <p>Try adjusting your search terms or clearing the search.</p>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="btn-primary"
              style={{ marginTop: '16px' }}
            >
              Clear Search
            </button>
          )}
        </div>
      )}
    </div>
  );
}