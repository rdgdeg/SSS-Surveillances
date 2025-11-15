import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { exportToCSV, exportToXLSX } from '../../lib/exportUtils';
import toast from 'react-hot-toast';

interface ExportButtonProps {
  data: any[];
  filename: string;
  sheetName?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm';
  label?: string;
}

export function ExportButton({
  data,
  filename,
  sheetName = 'Data',
  disabled = false,
  variant = 'outline',
  size = 'default',
  label = 'Exporter'
}: ExportButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'xlsx') => {
    if (!data || data.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    setIsExporting(true);
    try {
      if (format === 'csv') {
        exportToCSV(data, filename);
        toast.success('Export CSV réussi !');
      } else {
        exportToXLSX(data, filename, sheetName);
        toast.success('Export XLSX réussi !');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Erreur lors de l'export : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsExporting(false);
      setShowMenu(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowMenu(!showMenu)}
        disabled={disabled || isExporting || !data || data.length === 0}
      >
        {isExporting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Export...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            {label}
          </>
        )}
      </Button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="py-1">
              <button
                onClick={() => handleExport('csv')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Exporter en CSV
              </button>
              <button
                onClick={() => handleExport('xlsx')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exporter en XLSX
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
