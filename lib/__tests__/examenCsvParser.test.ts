import { describe, it, expect } from 'vitest';
import { parseExamenCSV, validateExamenCSVFile } from '../examenCsvParser';

describe('parseExamenCSV', () => {
  it('should parse valid CSV with all fields', () => {
    const csv = `Code Examen;Nom Examen;Enseignants;Date;Heure Début;Heure Fin
MATH101;Mathématiques I;prof1@univ.be,prof2@univ.be;2025-01-15;09:00;12:00
PHYS201;Physique II;prof3@univ.be;2025-01-16;14:00;17:00`;

    const result = parseExamenCSV(csv);

    expect(result.examens).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);

    expect(result.examens[0]).toEqual({
      code_examen: 'MATH101',
      nom_examen: 'Mathématiques I',
      enseignants: ['prof1@univ.be', 'prof2@univ.be'],
      date_examen: '2025-01-15',
      heure_debut: '09:00',
      heure_fin: '12:00'
    });
  });

  it('should parse CSV with only required fields', () => {
    const csv = `Code Examen;Nom Examen;Enseignants
MATH101;Mathématiques I;prof1@univ.be`;

    const result = parseExamenCSV(csv);

    expect(result.examens).toHaveLength(1);
    expect(result.examens[0]).toEqual({
      code_examen: 'MATH101',
      nom_examen: 'Mathématiques I',
      enseignants: ['prof1@univ.be'],
      date_examen: undefined,
      heure_debut: undefined,
      heure_fin: undefined
    });
  });

  it('should handle multiple emails correctly', () => {
    const csv = `Code Examen;Nom Examen;Enseignants
MATH101;Mathématiques I;prof1@univ.be,prof2@univ.be,prof3@univ.be`;

    const result = parseExamenCSV(csv);

    expect(result.examens[0].enseignants).toEqual([
      'prof1@univ.be',
      'prof2@univ.be',
      'prof3@univ.be'
    ]);
  });

  it('should reject empty CSV', () => {
    const csv = '';
    const result = parseExamenCSV(csv);

    expect(result.examens).toHaveLength(0);
    expect(result.errors).toContain('Le fichier CSV est vide');
  });

  it('should reject CSV with missing required fields', () => {
    const csv = `Code Examen;Nom Examen;Enseignants
;Mathématiques I;prof1@univ.be
MATH102;;prof2@univ.be
MATH103;Physique II;`;

    const result = parseExamenCSV(csv);

    expect(result.examens).toHaveLength(0);
    expect(result.errors).toHaveLength(3);
    expect(result.errors[0]).toContain('Code d\'examen manquant');
    expect(result.errors[1]).toContain('Nom d\'examen manquant');
    expect(result.errors[2]).toContain('Enseignants manquants');
  });

  it('should reject invalid email addresses', () => {
    const csv = `Code Examen;Nom Examen;Enseignants
MATH101;Mathématiques I;invalid-email,prof@univ.be`;

    const result = parseExamenCSV(csv);

    expect(result.examens).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Emails invalides');
    expect(result.errors[0]).toContain('invalid-email');
  });

  it('should warn about invalid date format', () => {
    const csv = `Code Examen;Nom Examen;Enseignants;Date
MATH101;Mathématiques I;prof1@univ.be;2025/01/15`;

    const result = parseExamenCSV(csv);

    expect(result.examens).toHaveLength(1);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('Date invalide');
    expect(result.examens[0].date_examen).toBeUndefined();
  });

  it('should warn about invalid time format', () => {
    const csv = `Code Examen;Nom Examen;Enseignants;Date;Heure Début;Heure Fin
MATH101;Mathématiques I;prof1@univ.be;2025-01-15;9h00;12h00`;

    const result = parseExamenCSV(csv);

    expect(result.examens).toHaveLength(1);
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings[0]).toContain('Heure de début invalide');
    expect(result.warnings[1]).toContain('Heure de fin invalide');
  });

  it('should reject code longer than 50 characters', () => {
    const csv = `Code Examen;Nom Examen;Enseignants
${'A'.repeat(51)};Mathématiques I;prof1@univ.be`;

    const result = parseExamenCSV(csv);

    expect(result.examens).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Code trop long');
  });

  it('should reject nom longer than 500 characters', () => {
    const csv = `Code Examen;Nom Examen;Enseignants
MATH101;${'A'.repeat(501)};prof1@univ.be`;

    const result = parseExamenCSV(csv);

    expect(result.examens).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Nom trop long');
  });

  it('should handle semicolons in exam name', () => {
    const csv = `Code Examen;Nom Examen;Enseignants
MATH101;Mathématiques I; Partie A;prof1@univ.be`;

    const result = parseExamenCSV(csv);

    expect(result.examens).toHaveLength(1);
    expect(result.examens[0].nom_examen).toBe('Mathématiques I; Partie A');
  });

  it('should trim whitespace from fields', () => {
    const csv = `Code Examen;Nom Examen;Enseignants
  MATH101  ;  Mathématiques I  ;  prof1@univ.be  ,  prof2@univ.be  `;

    const result = parseExamenCSV(csv);

    expect(result.examens).toHaveLength(1);
    expect(result.examens[0].code_examen).toBe('MATH101');
    expect(result.examens[0].nom_examen).toBe('Mathématiques I');
    expect(result.examens[0].enseignants).toEqual(['prof1@univ.be', 'prof2@univ.be']);
  });
});

describe('validateExamenCSVFile', () => {
  it('should accept valid CSV file', () => {
    const file = new File(['test'], 'examens.csv', { type: 'text/csv' });
    const error = validateExamenCSVFile(file);
    expect(error).toBeNull();
  });

  it('should accept .txt file', () => {
    const file = new File(['test'], 'examens.txt', { type: 'text/plain' });
    const error = validateExamenCSVFile(file);
    expect(error).toBeNull();
  });

  it('should reject invalid file type', () => {
    const file = new File(['test'], 'examens.pdf', { type: 'application/pdf' });
    const error = validateExamenCSVFile(file);
    expect(error).toContain('Type de fichier invalide');
  });

  it('should reject file larger than 10MB', () => {
    const largeContent = 'x'.repeat(11 * 1024 * 1024);
    const file = new File([largeContent], 'examens.csv', { type: 'text/csv' });
    const error = validateExamenCSVFile(file);
    expect(error).toContain('Fichier trop volumineux');
  });

  it('should reject empty file', () => {
    const file = new File([], 'examens.csv', { type: 'text/csv' });
    const error = validateExamenCSVFile(file);
    expect(error).toContain('Le fichier est vide');
  });
});
