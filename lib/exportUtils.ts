import * as XLSX from 'xlsx';

/**
 * Export data to CSV format
 */
export function exportToCSV(data: any[], filename: string, headers?: string[]) {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    // Header row
    csvHeaders.join(','),
    // Data rows
    ...data.map(row => 
      csvHeaders.map(header => {
        const value = row[header];
        // Handle values with commas, quotes, or newlines
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Add BOM for Excel UTF-8 compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Export data to XLSX format
 */
export function exportToXLSX(data: any[], filename: string, sheetName: string = 'Data') {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Auto-size columns
  const maxWidth = 50;
  const colWidths = Object.keys(data[0]).map(key => {
    const maxLength = Math.max(
      key.length,
      ...data.map(row => String(row[key] || '').length)
    );
    return { wch: Math.min(maxLength + 2, maxWidth) };
  });
  worksheet['!cols'] = colWidths;

  // Generate and download
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Export multiple sheets to XLSX
 */
export function exportMultiSheetXLSX(
  sheets: Array<{ name: string; data: any[] }>,
  filename: string
) {
  const workbook = XLSX.utils.book_new();

  sheets.forEach(({ name, data }) => {
    if (data && data.length > 0) {
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Auto-size columns
      const maxWidth = 50;
      const colWidths = Object.keys(data[0]).map(key => {
        const maxLength = Math.max(
          key.length,
          ...data.map(row => String(row[key] || '').length)
        );
        return { wch: Math.min(maxLength + 2, maxWidth) };
      });
      worksheet['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, name);
    }
  });

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Helper to download a blob
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format date for export
 */
export function formatDateForExport(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Format datetime for export
 */
export function formatDateTimeForExport(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('fr-FR');
}

/**
 * Format boolean for export
 */
export function formatBooleanForExport(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  return value ? 'Oui' : 'Non';
}

/**
 * Export surveillances for a specific surveillant
 */
export async function exportSurveillancesSurveillant(
  surveillantName: string,
  examens: any[],
  consignesSecretariat: any[],
  baseUrl: string = window.location.origin
) {
  // Filter examens for this surveillant
  const surveillances = examens.filter(examen => 
    examen.surveillants_noms && 
    examen.surveillants_noms.some((nom: string) => 
      nom.toLowerCase().includes(surveillantName.toLowerCase())
    )
  );

  if (surveillances.length === 0) {
    throw new Error(`Aucune surveillance trouvée pour ${surveillantName}`);
  }

  // Prepare export data
  const exportData = surveillances.map(examen => {
    // Find consignes for this secretariat
    const consignes = consignesSecretariat.find(c => 
      c.code_secretariat === examen.secretariat
    );

    // Format consignes
    let consignesText = '';
    
    if (examen.is_mode_secretariat) {
      consignesText = 'Les consignes détaillées (arrivée, mise en place, auditoires) seront communiquées ultérieurement par le pool, le secrétariat ou le responsable de cours.';
    } else {
      const consignesParts = [];
      
      // Consignes générales du secrétariat
      if (consignes) {
        if (consignes.consignes_arrivee) {
          consignesParts.push(`Arrivée: ${consignes.consignes_arrivee}`);
        }
        if (consignes.consignes_mise_en_place) {
          consignesParts.push(`Mise en place: ${consignes.consignes_mise_en_place}`);
        }
        if (consignes.consignes_generales) {
          consignesParts.push(`Consignes générales: ${consignes.consignes_generales}`);
        }
      }
      
      // Consignes spécifiques de l'examen
      if (examen.utiliser_consignes_specifiques) {
        if (examen.consignes_specifiques_arrivee) {
          consignesParts.push(`Arrivée spécifique: ${examen.consignes_specifiques_arrivee}`);
        }
        if (examen.consignes_specifiques_mise_en_place) {
          consignesParts.push(`Mise en place spécifique: ${examen.consignes_specifiques_mise_en_place}`);
        }
        if (examen.consignes_specifiques_generales) {
          consignesParts.push(`Consignes spécifiques: ${examen.consignes_specifiques_generales}`);
        }
      } else if (examen.cours?.consignes) {
        consignesParts.push(`Consignes du cours: ${examen.cours.consignes}`);
      }
      
      consignesText = consignesParts.join(' | ');
    }

    return {
      'Date': formatDateForExport(examen.date_examen),
      'Heure début': examen.heure_debut,
      'Heure fin': examen.heure_fin,
      'Code examen': examen.code_examen,
      'Nom examen': examen.nom_examen,
      'Auditoires': examen.auditoires || 'À définir',
      'Secrétariat': examen.secretariat,
      'Consignes': consignesText,
      'Lien planning': `${baseUrl}/planning`
    };
  });

  // Sort by date and time
  exportData.sort((a, b) => {
    const dateA = new Date(`${a.Date.split('-').reverse().join('-')} ${a['Heure début']}`);
    const dateB = new Date(`${b.Date.split('-').reverse().join('-')} ${b['Heure début']}`);
    return dateA.getTime() - dateB.getTime();
  });

  // Export to Excel
  const filename = `Surveillances_${surveillantName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
  exportToXLSX(exportData, filename, 'Mes Surveillances');
  
  return exportData;
}
