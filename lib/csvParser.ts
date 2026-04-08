/**
 * CSV / XLSX Parser utility for course import
 */

import * as XLSX from 'xlsx';
import { normalizeActiviteToCoursCode } from './examCode';

export interface ParsedCourse {
  code: string;
  intitule_complet: string;
  faculte?: string | null;
}

export interface CSVParseResult {
  courses: ParsedCourse[];
  errors: string[];
}

/**
 * Parse CSV content with semicolon separator
 * Expected format: Cours;Intit.Complet
 */
export function parseCoursCSV(csvContent: string): CSVParseResult {
  const courses: ParsedCourse[] = [];
  const errors: string[] = [];
  
  // Split by lines and remove empty lines
  const lines = csvContent
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  if (lines.length === 0) {
    errors.push('Le fichier CSV est vide');
    return { courses, errors };
  }
  
  // Check header
  const header = lines[0];
  if (!header.toLowerCase().includes('cours') || !header.toLowerCase().includes('intit')) {
    errors.push('En-tête CSV invalide. Format attendu: Cours;Intit.Complet');
  }
  
  // Parse data rows (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    
    // Split by semicolon
    const parts = line.split(';');
    
    if (parts.length < 2) {
      errors.push(`Ligne ${lineNumber}: Format invalide (colonnes manquantes)`);
      continue;
    }
    
    const code = normalizeActiviteToCoursCode(parts[0].trim());
    let intitule_complet: string;
    let faculte: string | null = null;
    if (parts.length >= 3) {
      intitule_complet = parts[1].trim();
      faculte = parts.slice(2).join(';').trim() || null;
    } else {
      intitule_complet = parts.slice(1).join(';').trim(); // Handle semicolons in title
    }
    
    // Validate required fields
    if (!code) {
      errors.push(`Ligne ${lineNumber}: Code de cours manquant`);
      continue;
    }
    
    if (!intitule_complet) {
      errors.push(`Ligne ${lineNumber}: Intitulé complet manquant`);
      continue;
    }
    
    // Validate code length
    if (code.length > 50) {
      errors.push(`Ligne ${lineNumber}: Code trop long (max 50 caractères)`);
      continue;
    }
    
    // Validate title length
    if (intitule_complet.length > 500) {
      errors.push(`Ligne ${lineNumber}: Intitulé trop long (max 500 caractères)`);
      continue;
    }
    
    courses.push({
      code,
      intitule_complet,
      faculte: faculte || undefined
    });
  }
  
  return { courses, errors };
}

/**
 * Parse first sheet of an XLSX workbook (same columns as CSV: Cours, Intit., faculté optionnelle)
 */
export function parseCoursXLSX(buffer: ArrayBuffer): CSVParseResult {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: false });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    return { courses: [], errors: ['Classeur Excel vide'] };
  }
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(sheet, {
    header: 1,
    raw: false,
    defval: ''
  }) as string[][];
  if (!rows.length) {
    return { courses: [], errors: ['Feuille vide'] };
  }
  const lines = rows.map((row) =>
    row.map((c) => (c == null ? '' : String(c))).join(';')
  );
  const pseudoCsv = lines.join('\n');
  return parseCoursCSV(pseudoCsv);
}

/**
 * Read file content as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const content = event.target?.result as string;
      resolve(content);
    };
    
    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };
    
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Validate CSV / XLSX file for course import
 */
export function validateCSVFile(file: File): string | null {
  // Check file type
  const validTypes = ['text/csv', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  const validExtensions = ['.csv', '.txt', '.xlsx', '.xls'];
  
  const hasValidType = validTypes.includes(file.type);
  const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  
  if (!hasValidType && !hasValidExtension) {
    return 'Type de fichier invalide. Veuillez uploader un fichier CSV ou Excel (.xlsx).';
  }
  
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return 'Fichier trop volumineux. Taille maximale: 5MB.';
  }
  
  if (file.size === 0) {
    return 'Le fichier est vide.';
  }
  
  return null;
}

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
    reader.readAsArrayBuffer(file);
  });
}
