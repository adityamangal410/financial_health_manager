import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon, DocumentChartBarIcon } from '@heroicons/react/24/outline';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface CSVField {
  index: number;
  name: string;
  sample: string;
  mapped: 'date' | 'description' | 'amount' | 'category' | 'account' | 'ignore' | null;
}

interface CSVImportWizardProps {
  onComplete: (file: File, fieldMapping: Record<string, number>) => void;
  onCancel: () => void;
}

export function CSVImportWizard({ onComplete, onCancel }: CSVImportWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [fields, setFields] = useState<CSVField[]>([]);
  const [isValidMapping, setIsValidMapping] = useState(false);

  // Common bank formats for auto-detection
  const bankFormats = {
    chase: {
      name: 'Chase Bank',
      pattern: ['date', 'description', 'amount', 'type', 'balance'],
      mapping: { date: 0, description: 1, amount: 2 }
    },
    amex: {
      name: 'American Express',
      pattern: ['date', 'description', 'amount'],
      mapping: { date: 0, description: 1, amount: 2 }
    },
    bofa: {
      name: 'Bank of America',
      pattern: ['posted date', 'reference number', 'payee', 'address', 'amount'],
      mapping: { date: 0, description: 2, amount: 4 }
    },
    wells: {
      name: 'Wells Fargo',
      pattern: ['date', 'amount', 'description', 'balance'],
      mapping: { date: 0, amount: 1, description: 2 }
    }
  };

  const parseCSV = useCallback((csvText: string): string[][] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  }, []);

  const detectBankFormat = useCallback((headers: string[]): string | null => {
    const lowerHeaders = headers.map(h => h.toLowerCase().trim());
    
    for (const [key, format] of Object.entries(bankFormats)) {
      const matches = format.pattern.filter(field => 
        lowerHeaders.some(header => header.includes(field.toLowerCase()))
      );
      if (matches.length >= 3) {
        return key;
      }
    }
    return null;
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const selectedFile = acceptedFiles[0];
    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      const parsedData = parseCSV(csvText);
      setCsvData(parsedData);
      
      if (parsedData.length > 0) {
        const headers = parsedData[0];
        const sampleRow = parsedData[1] || [];
        
        // Create field objects
        const csvFields: CSVField[] = headers.map((header, index) => ({
          index,
          name: header,
          sample: sampleRow[index] || '',
          mapped: null
        }));
        
        // Try to auto-detect bank format
        const detectedFormat = detectBankFormat(headers);
        if (detectedFormat) {
          const format = bankFormats[detectedFormat as keyof typeof bankFormats];
          Object.entries(format.mapping).forEach(([field, index]) => {
            if (csvFields[index]) {
              csvFields[index].mapped = field as CSVField['mapped'];
            }
          });
        }
        
        setFields(csvFields);
        setStep(2);
      }
    };
    reader.readAsText(selectedFile);
  }, [parseCSV, detectBankFormat]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  });

  const handleFieldMapping = (fieldIndex: number, mapping: CSVField['mapped']) => {
    const updatedFields = fields.map(field => 
      field.index === fieldIndex ? { ...field, mapped: mapping } : field
    );
    setFields(updatedFields);
    
    // Check if we have required mappings
    const hasDate = updatedFields.some(f => f.mapped === 'date');
    const hasDescription = updatedFields.some(f => f.mapped === 'description');
    const hasAmount = updatedFields.some(f => f.mapped === 'amount');
    
    setIsValidMapping(hasDate && hasDescription && hasAmount);
  };

  const handleComplete = () => {
    if (!file || !isValidMapping) return;
    
    const fieldMapping: Record<string, number> = {};
    fields.forEach(field => {
      if (field.mapped && field.mapped !== 'ignore') {
        fieldMapping[field.mapped] = field.index;
      }
    });
    
    onComplete(file, fieldMapping);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <DocumentChartBarIcon className="w-16 h-16 mx-auto text-blue-500 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Upload Your CSV File
        </h3>
        <p className="text-gray-600">
          Select a CSV file from your bank, credit card, or financial institution
        </p>
      </div>

      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="w-12 h-12 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
            📁
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragActive ? 'Drop your CSV file here' : 'Choose CSV file or drag and drop'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Supports files from Chase, Bank of America, Wells Fargo, Amex, and more
            </p>
          </div>
        </div>
      </div>

      {/* Supported formats */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Supported Formats:</h4>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
          {Object.values(bankFormats).map((format, index) => (
            <div key={index} className="flex items-center">
              <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
              {format.name}
            </div>
          ))}
          <div className="flex items-center">
            <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
            Custom CSV formats
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Map Your CSV Fields
        </h3>
        <p className="text-gray-600">
          Tell us which columns contain your transaction data
        </p>
      </div>

      {file && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="w-5 h-5 text-blue-500 mr-2" />
            <span className="font-medium">File: {file.name}</span>
            <span className="ml-2 text-sm text-gray-500">
              ({csvData.length - 1} transactions)
            </span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {fields.map((field) => (
            <div key={field.index} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{field.name}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Sample: "{field.sample}"
                  </div>
                </div>
                <select
                  value={field.mapped || ''}
                  onChange={(e) => handleFieldMapping(field.index, e.target.value as CSVField['mapped'])}
                  className="ml-4 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select mapping...</option>
                  <option value="date">Date</option>
                  <option value="description">Description</option>
                  <option value="amount">Amount</option>
                  <option value="category">Category</option>
                  <option value="account">Account</option>
                  <option value="ignore">Ignore this field</option>
                </select>
              </div>
              {field.mapped && field.mapped !== 'ignore' && (
                <div className="mt-2 text-xs text-green-600 flex items-center">
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  Mapped to {field.mapped}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Required fields indicator */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Required Fields:</h4>
        <div className="space-y-1 text-sm">
          {[
            { field: 'date', mapped: fields.some(f => f.mapped === 'date') },
            { field: 'description', mapped: fields.some(f => f.mapped === 'description') },
            { field: 'amount', mapped: fields.some(f => f.mapped === 'amount') }
          ].map(({ field, mapped }) => (
            <div key={field} className="flex items-center">
              <CheckCircleIcon className={`w-4 h-4 mr-2 ${mapped ? 'text-green-500' : 'text-gray-300'}`} />
              <span className={mapped ? 'text-green-700' : 'text-gray-500'}>
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 text-center">
      <CheckCircleIcon className="w-16 h-16 mx-auto text-green-500" />
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Ready to Import!
        </h3>
        <p className="text-gray-600">
          Your CSV file has been mapped and is ready for import
        </p>
      </div>

      <div className="bg-green-50 rounded-lg p-4">
        <div className="text-left space-y-2">
          <div className="font-medium text-green-900">Import Summary:</div>
          <div className="text-sm text-green-700">
            • File: {file?.name}
          </div>
          <div className="text-sm text-green-700">
            • Transactions: {csvData.length - 1}
          </div>
          <div className="text-sm text-green-700">
            • Fields mapped: {fields.filter(f => f.mapped && f.mapped !== 'ignore').length}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= stepNumber 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {stepNumber}
              </div>
              {stepNumber < 3 && (
                <ArrowRightIcon className="w-4 h-4 mx-2 text-gray-400" />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-2">
          <span className="text-sm text-gray-500">
            Step {step} of 3
          </span>
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <button
            onClick={step === 1 ? onCancel : () => setStep((step - 1) as 1 | 2)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 inline mr-2" />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep((step + 1) as 2 | 3)}
              disabled={step === 2 && !isValidMapping}
              className={`px-4 py-2 rounded-lg transition-colors ${
                (step === 2 && !isValidMapping)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Next
              <ArrowRightIcon className="w-4 h-4 inline ml-2" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Import Transactions
            </button>
          )}
        </div>
      </div>
    </div>
  );
}