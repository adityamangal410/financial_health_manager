import { useApiHealth } from '../../hooks/useFinancialData';

interface ApiStatusProps {
  className?: string;
}

export function ApiStatus({ className = '' }: ApiStatusProps) {
  const { data: health, isLoading, error } = useApiHealth();

  if (isLoading) {
    return (
      <div className={`${className} flex items-center gap-2`}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#6b7280'
        }} />
        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Checking connection...
        </span>
      </div>
    );
  }

  if (error || !health) {
    return (
      <div className={`${className} flex items-center gap-2`}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#ef4444'
        }} />
        <span style={{ fontSize: '0.875rem', color: '#ef4444' }}>
          API Offline
        </span>
      </div>
    );
  }

  return (
    <div className={`${className} flex items-center gap-2`}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#10b981'
      }} />
      <span style={{ fontSize: '0.875rem', color: '#10b981' }}>
        API Connected
      </span>
    </div>
  );
}