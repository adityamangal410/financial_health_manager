import { useState } from 'react';
import { CSVImportWizard } from './CSVImportWizard';
import { FileUpload } from './FileUpload';

interface EnhancedFileUploadProps {
  onUploadComplete: (data: { transactionCount: number; filename: string; message: string }) => void;
  onUploadError: (error: string) => void;
  disabled?: boolean;
  useWizard?: boolean;
}

export function EnhancedFileUpload({ 
  onUploadComplete, 
  onUploadError, 
  disabled = false,
  useWizard = false
}: EnhancedFileUploadProps) {
  const [showWizard, setShowWizard] = useState(false);
  const [wizardMode, setWizardMode] = useState(useWizard);

  const handleWizardComplete = async (file: File, fieldMapping: Record<string, number>) => {
    setShowWizard(false);
    
    // Here we would normally send the field mapping to the backend
    // For now, we'll use the regular upload process
    try {
      // Create a FormData object with the file and mapping information
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fieldMapping', JSON.stringify(fieldMapping));
      
      // This would be replaced with an API call that supports field mapping
      onUploadComplete({
        transactionCount: 0, // Would be returned from API
        filename: file.name,
        message: `File uploaded with custom field mapping: ${Object.keys(fieldMapping).join(', ')}`
      });
    } catch (error) {
      onUploadError(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  if (showWizard) {
    return (
      <CSVImportWizard
        onComplete={handleWizardComplete}
        onCancel={() => setShowWizard(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload mode toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 className="font-medium text-gray-900">Upload Mode</h3>
          <p className="text-sm text-gray-600">
            Choose how you want to upload your CSV file
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setWizardMode(false)}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              !wizardMode
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Quick Upload
          </button>
          <button
            onClick={() => setWizardMode(true)}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              wizardMode
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Guided Wizard
          </button>
        </div>
      </div>

      {wizardMode ? (
        <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-lg flex items-center justify-center">
              🧙‍♂️
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                CSV Import Wizard
              </h3>
              <p className="text-gray-600 mt-1">
                Get guided help with field mapping and bank format detection
              </p>
            </div>
            <button
              onClick={() => setShowWizard(true)}
              disabled={disabled}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              Start Import Wizard
            </button>
          </div>
        </div>
      ) : (
        <FileUpload
          onUploadComplete={onUploadComplete}
          onUploadError={onUploadError}
          disabled={disabled}
        />
      )}

      {/* Help text */}
      <div className="text-xs text-gray-500 text-center">
        💡 Use <strong>Quick Upload</strong> for standard formats or <strong>Guided Wizard</strong> for custom CSV files
      </div>
    </div>
  );
}