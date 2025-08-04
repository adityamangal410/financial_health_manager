import { CheckCircleIcon, DocumentArrowUpIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useUploadCSV } from '../../hooks/useFinancialData';
import type { UploadProgress } from '../../types/financial';

interface FileUploadProps {
  onUploadComplete: (data: { transactionCount: number; filename: string; message: string }) => void;
  onUploadError: (error: string) => void;
  disabled?: boolean;
}

export function FileUpload({ onUploadComplete, onUploadError, disabled = false }: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const uploadMutation = useUploadCSV();
  const isUploading = uploadMutation.isPending;

  const processFile = useCallback(async (file: File) => {
    setUploadProgress({
      progress: 0,
      stage: 'uploading',
      message: 'Uploading file...',
    });

    try {
      const result = await uploadMutation.mutateAsync({
        file,
        onProgress: (progress) => {
          if (progress < 30) {
            setUploadProgress({
              progress,
              stage: 'uploading',
              message: 'Uploading CSV file...',
            });
          } else if (progress < 70) {
            setUploadProgress({
              progress,
              stage: 'processing',
              message: 'Processing CSV data...',
            });
          } else {
            setUploadProgress({
              progress,
              stage: 'analyzing',
              message: 'Analyzing transactions...',
            });
          }
        },
      });

      setUploadProgress({
        progress: 100,
        stage: 'completed',
        message: 'Upload completed! Ready for next file.',
      });

      onUploadComplete({
        transactionCount: result.transaction_count,
        filename: result.filename,
        message: result.message,
      });

      // Reset after 1 second to allow immediate next upload
      setTimeout(() => {
        setUploadProgress(null);
      }, 1000);

    } catch (error) {
      setUploadProgress({
        progress: 0,
        stage: 'error',
        message: error instanceof Error ? error.message : 'Upload failed. Please try again.',
      });
      
      onUploadError(error instanceof Error ? error.message : 'Upload failed');
      
      setTimeout(() => {
        setUploadProgress(null);
      }, 2000);
    }
  }, [uploadMutation, onUploadComplete, onUploadError]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      onUploadError('Please upload a CSV file');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      onUploadError('File size must be less than 10MB');
      return;
    }
    
    processFile(file);
  }, [processFile, onUploadError]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    multiple: false,
    disabled: disabled || isUploading,
  });

  const getUploadAreaStyle = () => {
    const baseStyle = {
      border: '2px dashed #d1d5db',
      borderRadius: '0.5rem',
      padding: '3rem 2rem',
      textAlign: 'center' as const,
      cursor: disabled || isUploading ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      backgroundColor: 'transparent',
    };

    if (disabled || isUploading) {
      return { ...baseStyle, opacity: 0.5 };
    }

    if (isDragReject) {
      return { ...baseStyle, borderColor: '#ef4444', backgroundColor: '#fef2f2' };
    }

    if (isDragActive) {
      return { ...baseStyle, borderColor: '#0ea5e9', backgroundColor: '#f0f9ff' };
    }

    return baseStyle;
  };

  const renderUploadContent = () => {
    if (uploadProgress) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          {uploadProgress.stage === 'completed' ? (
            <CheckCircleIcon style={{ width: '3rem', height: '3rem', color: '#10b981' }} />
          ) : uploadProgress.stage === 'error' ? (
            <XCircleIcon style={{ width: '3rem', height: '3rem', color: '#ef4444' }} />
          ) : (
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              border: '3px solid #e5e7eb',
              borderTop: '3px solid #0ea5e9',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          )}
          
          <div>
            <div style={{ 
              width: '200px', 
              height: '8px', 
              backgroundColor: '#e5e7eb', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${uploadProgress.progress}%`,
                height: '100%',
                backgroundColor: uploadProgress.stage === 'error' ? '#ef4444' : '#0ea5e9',
                transition: 'width 0.3s ease',
                borderRadius: '4px',
              }} />
            </div>
            <p style={{ 
              marginTop: '0.5rem', 
              fontSize: '0.875rem',
              color: uploadProgress.stage === 'error' ? '#ef4444' : undefined
            }}>
              {uploadProgress.message}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <DocumentArrowUpIcon style={{ width: '3rem', height: '3rem', color: '#6b7280' }} />
        <div>
          <p style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            {isDragActive ? 'Drop your CSV file here' : 'Upload your financial data'}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Drag and drop a CSV file, or click to browse. Upload multiple files from different institutions.
          </p>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
            Supports bank statements, credit card exports, and financial data (Max 10MB)
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div {...getRootProps()} style={getUploadAreaStyle()}>
        <input {...getInputProps()} />
        {renderUploadContent()}
      </div>
      
      {!uploadProgress && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          backgroundColor: '#f9fafb', 
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Supported formats:</p>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            <li>CSV files from major banks (Chase, Bank of America, Wells Fargo, etc.)</li>
            <li>Credit card statements (Amex, Visa, MasterCard)</li>
            <li>Mint, YNAB, or Personal Capital exports</li>
            <li>Custom CSV with Date, Description, Amount columns</li>
          </ul>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}