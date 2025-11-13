/**
 * CSV Parser for Exam Import
 * Parses semicolon-delimited CSV files containing exam schedules
 */

export interface ParsedCSVExamen {
  date: string; // DD-MM-YY
  jour: string;
  duree: string; // "02h00"
  debut: string; // "09h00"
  fin: string; // "11h00"
  activite: string; // "WMDS2221=E"
  code: string; // "SECTEUR HÉMATOLOGIE"
  auditoires: string;
  enseignants: string;
  secretariat: string;
}

export interface ExamenCSVParseResult {
  examens: ParsedCSVExamen[];
  errors: string[];
  warnings: string[];
}

/**
 * Parse CSV content into exam records
 * @param csvContent Raw CSV file content
 * @returns Parsed exams with errors and warnings
 */
export function parseExamenCSV(csvContent: string): ExamenCSVParseResult {
  const result: ExamenCSVParseResult = {
    examens: [],
    errors: [],
    warnings: []
  };

  try {
    // Split into lines and remove empty lines
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      result.errors.push('Le fichier CSV est vide');
      return result;
    }

    // Parse header
    const header = lines[0].split(';').map(h => h.trim());
    const expectedHeaders = ['Date', 'Jour', 'Durée (h)', 'Début', 'Fin', 'Activité', 'Code', 'Auditoires', 'Enseignants', 'Secrétariat en charge'];
    
    // Validate header
    const hasValidHeader = expectedHeaders.every((expected, index) => 
      header[index] && header[index].toLowerCase().includes(expected.toLowerCase().substring(0, 4))
    );

    if (!hasValidHeader) {
      result.warnings.push('En-têtes de colonnes non reconnus. Tentative de parsing quand même...');
    }

    // Parse data rows (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const columns = line.split(';').map(col => col.trim());
        
        // Validate minimum columns
        if (columns.length < 10) {
          result.errors.push(`Ligne ${i + 1}: Nombre de colonnes insuffisant (${columns.length}/10)`);
          continue;
        }

        const examen: ParsedCSVExamen = {
          date: columns[0] || '',
          jour: columns[1] || '',
          duree: columns[2] || '',
          debut: columns[3] || '',
          fin: columns[4] || '',
          activite: columns[5] || '',
          code: columns[6] || '',
          auditoires: columns[7] || '',
          enseignants: columns[8] || '',
          secretariat: columns[9] || ''
        };

        // Validate required fields
        if (!examen.date) {
          result.errors.push(`Ligne ${i + 1}: Date manquante`);
          continue;
        }

        if (!examen.activite) {
          result.errors.push(`Ligne ${i + 1}: Code d'activité manquant`);
          continue;
        }

        result.examens.push(examen);
      } catch (error) {
        result.errors.push(`Ligne ${i + 1}: Erreur de parsing - ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }

    if (result.examens.length === 0 && result.errors.length === 0) {
      result.errors.push('Aucun examen valide trouvé dans le fichier');
    }

  } catch (error) {
    result.errors.push(`Erreur générale de parsing: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }

  return result;
}

/**
 * Extract clean course code from activity code
 * Removes suffixes like =E, (T)=E, +2504+2515=E, etc.
 * @param activite Activity code from CSV
 * @returns Clean course code
 */
export function extractCourseCode(activite: string): string {
  if (!activite) return '';
  
  // Remove everything after and including =, (, or +
  let code = activite.split('=')[0]; // Remove =E, =E (Q1), etc.
  code = code.split('(')[0]; // Remove (T), (Q1), etc.
  code = code.split('+')[0]; // Remove +2504+2515, etc.
  
  return code.trim();
}

/**
 * Convert date from DD-MM-YY to YYYY-MM-DD
 * @param date Date string in DD-MM-YY format
 * @returns Date string in YYYY-MM-DD format
 */
export function convertDateFormat(date: string): string {
  if (!date) return '';
  
  try {
    // Split by dash
    const parts = date.split('-');
    if (parts.length !== 3) {
      throw new Error('Format de date invalide');
    }

    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    let year = parts[2];

    // Handle 2-digit year
    if (year.length === 2) {
      const yearNum = parseInt(year, 10);
      // Assume 20xx for years 00-99
      // 25 → 2025, 26 → 2026, etc.
      year = `20${year}`;
    }

    // Validate date components
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    if (dayNum < 1 || dayNum > 31) {
      throw new Error('Jour invalide');
    }
    if (monthNum < 1 || monthNum > 12) {
      throw new Error('Mois invalide');
    }
    if (yearNum < 2000 || yearNum > 2100) {
      throw new Error('Année invalide');
    }

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error converting date:', date, error);
    return '';
  }
}

/**
 * Convert time from "09h00" to "09:00"
 * @param time Time string in "HHhMM" format
 * @returns Time string in "HH:MM" format
 */
export function convertTimeFormat(time: string): string {
  if (!time) return '';
  
  try {
    // Replace 'h' with ':'
    let converted = time.replace('h', ':');
    
    // Ensure HH:MM format
    const parts = converted.split(':');
    if (parts.length !== 2) {
      throw new Error('Format d\'heure invalide');
    }

    const hours = parts[0].padStart(2, '0');
    const minutes = parts[1].padStart(2, '0');

    // Validate time components
    const hoursNum = parseInt(hours, 10);
    const minutesNum = parseInt(minutes, 10);

    if (hoursNum < 0 || hoursNum > 23) {
      throw new Error('Heures invalides');
    }
    if (minutesNum < 0 || minutesNum > 59) {
      throw new Error('Minutes invalides');
    }

    return `${hours}:${minutes}`;
  } catch (error) {
    console.error('Error converting time:', time, error);
    return '';
  }
}

/**
 * Parse duration from "02h00" to minutes
 * @param duree Duration string in "HHhMM" format
 * @returns Duration in minutes
 */
export function parseDuration(duree: string): number {
  if (!duree) return 0;
  
  try {
    // Extract hours and minutes
    const match = duree.match(/(\d+)h(\d+)/);
    if (!match) {
      // Try just hours (e.g., "02h00" or "2h")
      const hoursMatch = duree.match(/(\d+)h/);
      if (hoursMatch) {
        const hours = parseInt(hoursMatch[1], 10);
        return hours * 60;
      }
      throw new Error('Format de durée invalide');
    }

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);

    return hours * 60 + minutes;
  } catch (error) {
    console.error('Error parsing duration:', duree, error);
    return 0;
  }
}

/**
 * Split teachers string into array
 * @param enseignants Comma-separated teacher names
 * @returns Array of teacher names
 */
export function parseTeachers(enseignants: string): string[] {
  if (!enseignants) return [];
  
  return enseignants
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0);
}
