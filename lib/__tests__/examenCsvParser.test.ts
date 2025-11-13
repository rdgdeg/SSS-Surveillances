import { describe, it, expect } from 'vitest';
import {
  parseExamenCSV,
  extractCourseCode,
  convertDateFormat,
  convertTimeFormat,
  parseDuration,
  parseTeachers
} from '../examenCsvParser';

describe('examenCsvParser', () => {
  describe('extractCourseCode', () => {
    it('should extract code from simple format with =E', () => {
      expect(extractCourseCode('WMDS2221=E')).toBe('WMDS2221');
    });

    it('should extract code from format with (T)=E', () => {
      expect(extractCourseCode('WFARM1282(T)=E')).toBe('WFARM1282');
    });

    it('should extract code from format with multiple codes', () => {
      expect(extractCourseCode('WFARM2244+2504+2515=E')).toBe('WFARM2244');
    });

    it('should extract code from format with (Q1)', () => {
      expect(extractCourseCode('WRDTH3120=E (Q1)')).toBe('WRDTH3120');
    });

    it('should handle code without suffix', () => {
      expect(extractCourseCode('WMDS2221')).toBe('WMDS2221');
    });

    it('should handle empty string', () => {
      expect(extractCourseCode('')).toBe('');
    });

    it('should trim whitespace', () => {
      expect(extractCourseCode('  WMDS2221=E  ')).toBe('WMDS2221');
    });
  });

  describe('convertDateFormat', () => {
    it('should convert DD-MM-YY to YYYY-MM-DD', () => {
      expect(convertDateFormat('04-12-25')).toBe('2025-12-04');
    });

    it('should handle single digit day and month', () => {
      expect(convertDateFormat('5-1-26')).toBe('2026-01-05');
    });

    it('should handle 4-digit year', () => {
      expect(convertDateFormat('04-12-2025')).toBe('2025-12-04');
    });

    it('should pad day and month with zeros', () => {
      expect(convertDateFormat('4-1-25')).toBe('2025-01-04');
    });

    it('should handle empty string', () => {
      expect(convertDateFormat('')).toBe('');
    });

    it('should handle invalid format gracefully', () => {
      expect(convertDateFormat('invalid')).toBe('');
    });

    it('should handle year 26 as 2026', () => {
      expect(convertDateFormat('16-02-26')).toBe('2026-02-16');
    });
  });

  describe('convertTimeFormat', () => {
    it('should convert HHhMM to HH:MM', () => {
      expect(convertTimeFormat('09h00')).toBe('09:00');
    });

    it('should convert single digit hour', () => {
      expect(convertTimeFormat('9h00')).toBe('09:00');
    });

    it('should handle afternoon times', () => {
      expect(convertTimeFormat('13h30')).toBe('13:30');
    });

    it('should handle evening times', () => {
      expect(convertTimeFormat('18h00')).toBe('18:00');
    });

    it('should handle empty string', () => {
      expect(convertTimeFormat('')).toBe('');
    });

    it('should handle invalid format gracefully', () => {
      expect(convertTimeFormat('invalid')).toBe('');
    });

    it('should pad hours and minutes', () => {
      expect(convertTimeFormat('8h5')).toBe('08:05');
    });
  });

  describe('parseDuration', () => {
    it('should parse 2 hours as 120 minutes', () => {
      expect(parseDuration('02h00')).toBe(120);
    });

    it('should parse 1.5 hours as 90 minutes', () => {
      expect(parseDuration('01h30')).toBe(90);
    });

    it('should parse 3 hours as 180 minutes', () => {
      expect(parseDuration('03h00')).toBe(180);
    });

    it('should parse 2.5 hours as 150 minutes', () => {
      expect(parseDuration('02h30')).toBe(150);
    });

    it('should handle single digit hours', () => {
      expect(parseDuration('2h00')).toBe(120);
    });

    it('should handle empty string', () => {
      expect(parseDuration('')).toBe(0);
    });

    it('should handle invalid format gracefully', () => {
      expect(parseDuration('invalid')).toBe(0);
    });

    it('should handle hours only format', () => {
      expect(parseDuration('2h')).toBe(120);
    });
  });

  describe('parseTeachers', () => {
    it('should split comma-separated teachers', () => {
      const result = parseTeachers('Hermans Cédric, Machiels Jean-Pascal');
      expect(result).toEqual(['Hermans Cédric', 'Machiels Jean-Pascal']);
    });

    it('should handle single teacher', () => {
      const result = parseTeachers('Scavée Christophe');
      expect(result).toEqual(['Scavée Christophe']);
    });

    it('should trim whitespace', () => {
      const result = parseTeachers('  Teacher One  ,  Teacher Two  ');
      expect(result).toEqual(['Teacher One', 'Teacher Two']);
    });

    it('should handle empty string', () => {
      const result = parseTeachers('');
      expect(result).toEqual([]);
    });

    it('should filter empty entries', () => {
      const result = parseTeachers('Teacher One,,Teacher Two');
      expect(result).toEqual(['Teacher One', 'Teacher Two']);
    });

    it('should handle multiple teachers with complex names', () => {
      const result = parseTeachers('Elens Laure, Muccioli Giulio, Haufroid Vincent, de Montjoye Laurence');
      expect(result).toEqual([
        'Elens Laure',
        'Muccioli Giulio',
        'Haufroid Vincent',
        'de Montjoye Laurence'
      ]);
    });
  });

  describe('parseExamenCSV', () => {
    it('should parse valid CSV with header', () => {
      const csv = `Date;Jour;Durée (h);Début;Fin;Activité;Code;Auditoires;Enseignants;Secrétariat en charge
04-12-25;Jeudi;01h00;18h00;19h00;WINTR2105=E;INTERPR.DE L'ELECTROCARDIOGR. (Partie 1 );71 - Simonart, 51 A - Lacroix;Scavée Christophe;MED`;

      const result = parseExamenCSV(csv);
      
      expect(result.errors).toHaveLength(0);
      expect(result.examens).toHaveLength(1);
      expect(result.examens[0]).toEqual({
        date: '04-12-25',
        jour: 'Jeudi',
        duree: '01h00',
        debut: '18h00',
        fin: '19h00',
        activite: 'WINTR2105=E',
        code: 'INTERPR.DE L\'ELECTROCARDIOGR. (Partie 1 )',
        auditoires: '71 - Simonart, 51 A - Lacroix',
        enseignants: 'Scavée Christophe',
        secretariat: 'MED'
      });
    });

    it('should parse multiple exams', () => {
      const csv = `Date;Jour;Durée (h);Début;Fin;Activité;Code;Auditoires;Enseignants;Secrétariat en charge
04-12-25;Jeudi;01h00;18h00;19h00;WINTR2105=E;INTERPR.DE L'ELECTROCARDIOGR.;71 - Simonart;Scavée Christophe;MED
08-12-25;Lundi;02h00;13h30;15h30;WMDS2221=E;SECTEUR HÉMATOLOGIE;51 A - Lacroix;Hermans Cédric;MED`;

      const result = parseExamenCSV(csv);
      
      expect(result.errors).toHaveLength(0);
      expect(result.examens).toHaveLength(2);
    });

    it('should handle empty CSV', () => {
      const result = parseExamenCSV('');
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('vide');
      expect(result.examens).toHaveLength(0);
    });

    it('should handle CSV with only header', () => {
      const csv = 'Date;Jour;Durée (h);Début;Fin;Activité;Code;Auditoires;Enseignants;Secrétariat en charge';
      
      const result = parseExamenCSV(csv);
      
      expect(result.errors).toHaveLength(1);
      expect(result.examens).toHaveLength(0);
    });

    it('should report error for missing date', () => {
      const csv = `Date;Jour;Durée (h);Début;Fin;Activité;Code;Auditoires;Enseignants;Secrétariat en charge
;Jeudi;01h00;18h00;19h00;WINTR2105=E;INTERPR.DE L'ELECTROCARDIOGR.;71 - Simonart;Scavée Christophe;MED`;

      const result = parseExamenCSV(csv);
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Date manquante');
    });

    it('should report error for missing activity code', () => {
      const csv = `Date;Jour;Durée (h);Début;Fin;Activité;Code;Auditoires;Enseignants;Secrétariat en charge
04-12-25;Jeudi;01h00;18h00;19h00;;INTERPR.DE L'ELECTROCARDIOGR.;71 - Simonart;Scavée Christophe;MED`;

      const result = parseExamenCSV(csv);
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('activité manquant');
    });

    it('should report error for insufficient columns', () => {
      const csv = `Date;Jour;Durée (h);Début;Fin;Activité;Code;Auditoires;Enseignants;Secrétariat en charge
04-12-25;Jeudi;01h00`;

      const result = parseExamenCSV(csv);
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('colonnes insuffisant');
    });

    it('should skip empty lines', () => {
      const csv = `Date;Jour;Durée (h);Début;Fin;Activité;Code;Auditoires;Enseignants;Secrétariat en charge
04-12-25;Jeudi;01h00;18h00;19h00;WINTR2105=E;INTERPR.DE L'ELECTROCARDIOGR.;71 - Simonart;Scavée Christophe;MED

08-12-25;Lundi;02h00;13h30;15h30;WMDS2221=E;SECTEUR HÉMATOLOGIE;51 A - Lacroix;Hermans Cédric;MED`;

      const result = parseExamenCSV(csv);
      
      expect(result.examens).toHaveLength(2);
    });

    it('should handle CSV with different header format', () => {
      const csv = `date;day;duration;start;end;activity;name;rooms;teachers;office
04-12-25;Jeudi;01h00;18h00;19h00;WINTR2105=E;INTERPR.DE L'ELECTROCARDIOGR.;71 - Simonart;Scavée Christophe;MED`;

      const result = parseExamenCSV(csv);
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.examens).toHaveLength(1);
    });
  });
});
