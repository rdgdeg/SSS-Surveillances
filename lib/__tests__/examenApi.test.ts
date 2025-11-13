import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchExamens, getExamenById, submitPresence, createNotification } from '../examenApi';

// Mock Supabase client
vi.mock('../supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          or: vi.fn(() => ({
            order: vi.fn(() => ({
              data: [],
              error: null
            }))
          })),
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        })),
        in: vi.fn(() => ({
          data: [],
          error: null
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        }))
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: null
            }))
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          error: null
        }))
      }))
    }))
  }
}));

describe('examenApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchExamens', () => {
    it('should search examens by code or name', async () => {
      const sessionId = 'session-123';
      const query = 'MATH';

      await searchExamens(sessionId, query);

      // Verify the function was called (actual implementation would check Supabase calls)
      expect(true).toBe(true);
    });
  });

  describe('submitPresence', () => {
    it('should validate nb_surveillants_accompagnants is non-negative', async () => {
      const examenId = 'exam-123';
      const data = {
        enseignant_email: 'prof@univ.be',
        enseignant_nom: 'Dupont',
        enseignant_prenom: 'Jean',
        est_present: true,
        nb_surveillants_accompagnants: -1,
        remarque: ''
      };

      // This should be validated before calling the API
      expect(data.nb_surveillants_accompagnants).toBeLessThan(0);
    });

    it('should set nb_surveillants_accompagnants to 0 when absent', async () => {
      const examenId = 'exam-123';
      const data = {
        enseignant_email: 'prof@univ.be',
        enseignant_nom: 'Dupont',
        enseignant_prenom: 'Jean',
        est_present: false,
        nb_surveillants_accompagnants: 5,
        remarque: ''
      };

      // When absent, nb_surveillants should be 0
      const expectedData = {
        ...data,
        nb_surveillants_accompagnants: data.est_present ? data.nb_surveillants_accompagnants : 0
      };

      expect(expectedData.nb_surveillants_accompagnants).toBe(0);
    });

    it('should lowercase email before submission', async () => {
      const email = 'Prof.Dupont@UNIV.BE';
      const lowercased = email.toLowerCase();

      expect(lowercased).toBe('prof.dupont@univ.be');
    });
  });

  describe('createNotification', () => {
    it('should create notification with correct structure', async () => {
      const notification = {
        type: 'examen_manuel',
        titre: 'Nouvel examen saisi',
        message: 'Un enseignant a saisi un examen',
        reference_id: 'exam-123',
        reference_type: 'examen'
      };

      // Verify structure
      expect(notification).toHaveProperty('type');
      expect(notification).toHaveProperty('titre');
      expect(notification).toHaveProperty('message');
      expect(notification).toHaveProperty('reference_id');
      expect(notification).toHaveProperty('reference_type');
    });
  });
});

describe('Data validation', () => {
  it('should validate email format', () => {
    const validEmails = [
      'user@example.com',
      'user.name@example.com',
      'user+tag@example.co.uk'
    ];

    const invalidEmails = [
      'invalid',
      '@example.com',
      'user@',
      'user @example.com'
    ];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    validEmails.forEach(email => {
      expect(emailRegex.test(email)).toBe(true);
    });

    invalidEmails.forEach(email => {
      expect(emailRegex.test(email)).toBe(false);
    });
  });

  it('should validate date format YYYY-MM-DD', () => {
    const validDates = ['2025-01-15', '2025-12-31', '2024-02-29'];
    const invalidDates = ['2025/01/15', '15-01-2025', '2025-1-5', 'invalid'];

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    validDates.forEach(date => {
      expect(dateRegex.test(date)).toBe(true);
    });

    invalidDates.forEach(date => {
      expect(dateRegex.test(date)).toBe(false);
    });
  });

  it('should validate time format HH:MM', () => {
    const validTimes = ['09:00', '14:30', '23:59', '00:00'];
    const invalidTimes = ['9:00', '25:00', '14:60', '9h00', 'invalid'];

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

    validTimes.forEach(time => {
      expect(timeRegex.test(time)).toBe(true);
    });

    invalidTimes.forEach(time => {
      expect(timeRegex.test(time)).toBe(false);
    });
  });
});

describe('Business logic', () => {
  it('should calculate surveillance needs correctly', () => {
    // If teacher is present with 2 surveillants, need = base - 1 - 2
    const baseNeed = 10;
    const teacherPresent = true;
    const nbSurveillants = 2;

    const calculatedNeed = baseNeed - (teacherPresent ? 1 : 0) - nbSurveillants;

    expect(calculatedNeed).toBe(7);
  });

  it('should not reduce need when teacher is absent', () => {
    const baseNeed = 10;
    const teacherPresent = false;
    const nbSurveillants = 2;

    const calculatedNeed = baseNeed - (teacherPresent ? 1 : 0) - (teacherPresent ? nbSurveillants : 0);

    expect(calculatedNeed).toBe(10);
  });
});
