import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { loanService } from '../../api/api';
import toast from 'react-hot-toast';

const ExportButton = ({ resource, dateRange, filename }) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      const params = {
        resource,
        date_from: dateRange?.from || undefined,
        date_to: dateRange?.to || undefined
      };

      const blob = await loanService.exportData(params);
      
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || `${resource}_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      toast.success('Export completed successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
    >
      {exporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {exporting ? 'EXPORTING...' : 'EXPORT CSV'}
    </button>
  );
};

export default ExportButton;
