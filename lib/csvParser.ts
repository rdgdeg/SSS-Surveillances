/**
 * CSV Parser utility for course import
 */

export interface ParsedCourse {
  code: string;
  intitule_complet: string;
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
    
    const code = parts[0].trim();
    const intitule_complet = parts.slice(1).join(';').trim(); // Handle semicolons in title
    
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
      intitule_complet
    });
  }
  
  return { courses, errors };
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
export function validateCSVFile(file: File): string | null {
  // Check file type
  const validTypes = ['text/csv', 'text/plain', 'application/vnd.ms-excel'];
  const validExtensions = ['.csv', '.txt'];
  
  const hasValidType = validTypes.includes(file.type);
  const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  
  if (!hasValidType && !hasValidExtension) {
    return 'Type de fichier invalide. Veuillez uploader un fichier CSV.';
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
