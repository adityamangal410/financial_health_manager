import {
    ChartBarIcon,
    CogIcon,
    DocumentArrowDownIcon,
    DocumentTextIcon,
    TableCellsIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

interface ExportReportsProps {
  onExport?: (format: 'pdf' | 'csv', options: ExportOptions) => Promise<void>;
}

interface ExportOptions {
  format: 'pdf' | 'csv';
  dateRange: {
    start: string;
    end: string;
  };
  includeSections: {
    summary: boolean;
    transactions: boolean;
    categories: boolean;
    charts: boolean;
  };
  transactionFilters?: {
    categories?: string[];
    minAmount?: number;
    maxAmount?: number;
  };
}

export function ExportReports({ onExport }: ExportReportsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    dateRange: {
      start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
      end: new Date().toISOString().split('T')[0] // Today
    },
    includeSections: {
      summary: true,
      transactions: true,
      categories: true,
      charts: true
    }
  });

  const handleExport = async () => {
    if (!onExport) {
      // Fallback for demo purposes
      setIsExporting(true);
      
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create and download a sample file
      if (exportOptions.format === 'csv') {
        downloadSampleCSV();
      } else {
        downloadSamplePDF();
      }
      
      setIsExporting(false);
      return;
    }

    try {
      setIsExporting(true);
      await onExport(exportOptions.format, exportOptions);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = `Date,Description,Amount,Category,Account
2024-01-15,"Grocery Store",-89.50,"Food & Dining","Checking"
2024-01-14,"Salary Deposit",3000.00,"Income","Checking"
2024-01-13,"Gas Station",-45.20,"Transportation","Credit Card"
2024-01-12,"Restaurant",-67.80,"Food & Dining","Credit Card"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadSamplePDF = () => {
    // For demo purposes, we'll create a simple text file
    // In a real implementation, this would use a PDF library like jsPDF
    const pdfContent = `FINANCIAL HEALTH REPORT
Generated: ${new Date().toLocaleDateString()}
Period: ${exportOptions.dateRange.start} to ${exportOptions.dateRange.end}

SUMMARY
=======
Total Income: $3,000.00
Total Expenses: $202.50
Net Income: $2,797.50
Savings Rate: 93.25%

TRANSACTIONS
============
2024-01-15 | Grocery Store      | -$89.50  | Food & Dining
2024-01-14 | Salary Deposit     | $3000.00 | Income
2024-01-13 | Gas Station        | -$45.20  | Transportation
2024-01-12 | Restaurant         | -$67.80  | Food & Dining

CATEGORY BREAKDOWN
==================
Income: $3,000.00 (100.0%)
Food & Dining: $157.30 (5.2%)
Transportation: $45.20 (1.5%)`;
    
    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-report-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const predefinedRanges = [
    { 
      label: 'Last 30 Days', 
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    { 
      label: 'Last 3 Months', 
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    { 
      label: 'Year to Date', 
      start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    { 
      label: 'Last Year', 
      start: new Date(new Date().getFullYear() - 1, 0, 1).toISOString().split('T')[0],
      end: new Date(new Date().getFullYear() - 1, 11, 31).toISOString().split('T')[0]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Export Financial Reports
        </h2>
        <p className="text-gray-600">
          Generate PDF reports or CSV exports of your financial data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Format Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Export Format</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setExportOptions(prev => ({ ...prev, format: 'pdf' }))}
              className={`p-4 border-2 rounded-lg transition-all ${
                exportOptions.format === 'pdf'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <DocumentTextIcon className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <div className="font-medium">PDF Report</div>
              <div className="text-sm text-gray-500">
                Professional formatted report with charts
              </div>
            </button>
            
            <button
              onClick={() => setExportOptions(prev => ({ ...prev, format: 'csv' }))}
              className={`p-4 border-2 rounded-lg transition-all ${
                exportOptions.format === 'csv'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <TableCellsIcon className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="font-medium">CSV Export</div>
              <div className="text-sm text-gray-500">
                Raw transaction data for spreadsheets
              </div>
            </button>
          </div>
        </div>

        {/* Date Range Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Date Range</h3>
          
          <div className="grid grid-cols-2 gap-2 mb-4">
            {predefinedRanges.map((range) => (
              <button
                key={range.label}
                onClick={() => setExportOptions(prev => ({
                  ...prev,
                  dateRange: { start: range.start, end: range.end }
                }))}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                {range.label}
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={exportOptions.dateRange.start}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={exportOptions.dateRange.end}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content Selection (PDF only) */}
      {exportOptions.format === 'pdf' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Include in Report</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'summary', label: 'Financial Summary', icon: ChartBarIcon },
              { key: 'transactions', label: 'Transaction List', icon: TableCellsIcon },
              { key: 'categories', label: 'Category Breakdown', icon: CogIcon },
              { key: 'charts', label: 'Charts & Graphs', icon: ChartBarIcon }
            ].map(({ key, label, icon: Icon }) => (
              <label key={key} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={exportOptions.includeSections[key as keyof typeof exportOptions.includeSections]}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    includeSections: {
                      ...prev.includeSections,
                      [key]: e.target.checked
                    }
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Icon className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Export Button */}
      <div className="flex justify-center pt-6 border-t">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className={`flex items-center px-8 py-3 rounded-lg font-medium transition-colors ${
            isExporting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isExporting ? (
            <>
              <div className="w-5 h-5 mr-2 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              Generating {exportOptions.format.toUpperCase()}...
            </>
          ) : (
            <>
              <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
              Export {exportOptions.format.toUpperCase()} Report
            </>
          )}
        </button>
      </div>

      {/* Export Preview */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Export Preview</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div>📅 Date Range: {exportOptions.dateRange.start} to {exportOptions.dateRange.end}</div>
          <div>📊 Format: {exportOptions.format.toUpperCase()}</div>
          {exportOptions.format === 'pdf' && (
            <div>📋 Sections: {Object.entries(exportOptions.includeSections)
              .filter(([_, included]) => included)
              .map(([section, _]) => section)
              .join(', ')
            }</div>
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Export Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• PDF reports include formatted charts and professional styling</li>
          <li>• CSV exports contain raw transaction data for analysis in Excel or Google Sheets</li>
          <li>• Large date ranges may take longer to generate</li>
          <li>• Reports include only transactions within the selected date range</li>
        </ul>
      </div>
    </div>
  );
}