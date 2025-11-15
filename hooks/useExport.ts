import { useState } from 'react';
import { exportToCSV, exportToXLSX, exportMultiSheetXLSX } from '../lib/exportUtils';
import {
  exportSurveillants,
  exportExamens,
  exportDisponibilites,
  exportCours,
  exportPresencesEnseignants,
  exportCreneaux,
  exportSessionComplete
} from '../lib/exportData';
import toast from 'react-hot-toast';

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (
    exportFn: () => Promise<any[]>,
    filename: string,
    format: 'csv' | 'xlsx',
    sheetName: string = 'Data'
  ) => {
    setIsExporting(true);
    try {
      const data = await exportFn();
      
      if (!data || data.length === 0) {
        toast.error('Aucune donnée à exporter');
        return;
      }

      if (format === 'csv') {
        exportToCSV(data, filename);
      } else {
        exportToXLSX(data, filename, sheetName);
      }
      
      toast.success(`Export ${format.toUpperCase()} réussi !`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Erreur lors de l'export : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleMultiSheetExport = async (
    exportFn: () => Promise<{ filename: string; sheets: Array<{ name: string; data: any[] }> }>
  ) => {
    setIsExporting(true);
    try {
      const { filename, sheets } = await exportFn();
      
      const hasData = sheets.some(sheet => sheet.data && sheet.data.length > 0);
      if (!hasData) {
        toast.error('Aucune donnée à exporter');
        return;
      }

      exportMultiSheetXLSX(sheets, filename);
      toast.success('Export multi-feuilles réussi !');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Erreur lors de l'export : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    exportSurveillants: (format: 'csv' | 'xlsx') =>
      handleExport(exportSurveillants, 'surveillants', format, 'Surveillants'),
    exportExamens: (sessionId: string, format: 'csv' | 'xlsx') =>
      handleExport(() => exportExamens(sessionId), 'examens', format, 'Examens'),
    exportDisponibilites: (sessionId: string, format: 'csv' | 'xlsx') =>
      handleExport(() => exportDisponibilites(sessionId), 'disponibilites', format, 'Disponibilités'),
    exportCours: (format: 'csv' | 'xlsx') =>
      handleExport(exportCours, 'cours', format, 'Cours'),
    exportPresencesEnseignants: (sessionId: string, format: 'csv' | 'xlsx') =>
      handleExport(() => exportPresencesEnseignants(sessionId), 'presences-enseignants', format, 'Présences'),
    exportCreneaux: (sessionId: string, format: 'csv' | 'xlsx') =>
      handleExport(() => exportCreneaux(sessionId), 'creneaux', format, 'Créneaux'),
    exportSessionComplete: (sessionId: string, sessionName: string) =>
      handleMultiSheetExport(() => exportSessionComplete(sessionId, sessionName)),
  };
}
