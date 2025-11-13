/**
 * CSV Parser utility for exam import
 * Format: Code Examen;Nom Examen;Enseignants;Date;Heure Début;Heure Fin
 */

import { ParsedExamen, ExamenCSVParseResult } from '../types';

/**
 * Valide un email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valide une date au format YYYY-MM-DD
 */
function isValidDate(dateStr: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;
  
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Valide une heure au format HH:MM
 */
function isValidTime(timeStr: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeStr);
}

/**
 * Parse CSV content with semicolon separator
 * Expected format: Code Examen;Nom Examen;Enseignants;Date;Heure Début;Heure Fin
 * Enseignants: emails séparés par des virgules
 */
export function parseExamenCSV(csvContent: string): ExamenCSVParseResult {
  const examens: ParsedExamen[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Split by lines and remove empty lines
  const lines = csvContent
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  if (lines.length === 0) {
    errors.push('Le fichier CSV est vide');
    return { examens, errors, warnings };
  }
  
  // Check header
  const header = lines[0].toLowerCase();
  const requiredHeaders = ['code', 'nom', 'enseignant'];
  const hasRequiredHeaders = requiredHeaders.every(h => header.includes(h));
  
  if (!hasRequiredHeaders) {
    errors.push('En-tête CSV invalide. Format attendu: Code Examen;Nom Examen;Enseignants;Date;Heure Début;Heure Fin');
  }
  
  // Parse data rows (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    
    // Split by semicolon
    const parts = line.split(';').map(p => p.trim());
    
    if (parts.length < 3) {
      errors.push(`Ligne ${lineNumber}: Format invalide (colonnes manquantes). Minimum requis: Code;Nom;Enseignants`);
      continue;
    }
    
    const code_examen = parts[0];
    const nom_examen = parts[1];
    const enseignantsStr = parts[2];
    const date_examen = parts[3] || undefined;
    const heure_debut = parts[4] || undefined;
    const heure_fin = parts[5] || undefined;
    
    // Validate required fields
    if (!code_examen) {
      errors.push(`Ligne ${lineNumber}: Code d'examen manquant`);
      continue;
    }
    
    if (!nom_examen) {
      errors.push(`Ligne ${lineNumber}: Nom d'examen manquant`);
      continue;
    }
    
    if (!enseignantsStr) {
      errors.push(`Ligne ${lineNumber}: Enseignants manquants`);
      continue;
    }
    
    // Validate code length
    if (code_examen.length > 50) {
      errors.push(`Ligne ${lineNumber}: Code trop long (max 50 caractères)`);
      continue;
    }
    
    // Validate nom length
    if (nom_examen.length > 500) {
      errors.push(`Ligne ${lineNumber}: Nom trop long (max 500 caractères)`);
      continue;
    }
    
    // Parse and validate enseignants (emails separated by commas)
    const enseignants = enseignantsStr
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);
    
    if (enseignants.length === 0) {
      errors.push(`Ligne ${lineNumber}: Aucun email d'enseignant valide trouvé`);
      continue;
    }
    
    // Validate emails
    const invalidEmails = enseignants.filter(email => !isValidEmail(email));
    if (invalidEmails.length > 0) {
      errors.push(`Ligne ${lineNumber}: Emails invalides: ${invalidEmails.join(', ')}`);
      continue;
    }
    
    // Validate date if present
    if (date_examen && !isValidDate(date_examen)) {
      warnings.push(`Ligne ${lineNumber}: Date invalide (${date_examen}), format attendu: YYYY-MM-DD. La date sera ignorée.`);
    }
    
    // Validate heure_debut if present
    if (heure_debut && !isValidTime(heure_debut)) {
      warnings.push(`Ligne ${lineNumber}: Heure de début invalide (${heure_debut}), format attendu: HH:MM. L'heure sera ignorée.`);
    }
    
    // Validate heure_fin if present
    if (heure_fin && !isValidTime(heure_fin)) {
      warnings.push(`Ligne ${lineNumber}: Heure de fin invalide (${heure_fin}), format attendu: HH:MM. L'heure sera ignorée.`);
    }
    
    // Add parsed examen
    examens.push({
      code_examen,
      nom_examen,
      enseignants,
      date_examen: date_examen && isValidDate(date_examen) ? date_examen : undefined,
      heure_debut: heure_debut && isValidTime(heure_debut) ? heure_debut : undefined,
      heure_fin: heure_fin && isValidTime(heure_fin) ? heure_fin : undefined
    });
  }
  
  return { examens, errors, warnings };
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
 * Validate CSV file
 */
export function validateExamenCSVFile(file: File): string | null {
  // Check file type
  const validTypes = ['text/csv', 'text/plain', 'application/vnd.ms-excel'];
  const validExtensions = ['.csv', '.txt'];
  
  const hasValidType = validTypes.includes(file.type);
  const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  
  if (!hasValidType && !hasValidExtension) {
    return 'Type de fichier invalide. Veuillez uploader un fichier CSV.';
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return 'Fichier trop volumineux. Taille maximale: 10MB.';
  }
  
  if (file.size === 0) {
    return 'Le fichier est vide.';
  }
  
  return null;
}
