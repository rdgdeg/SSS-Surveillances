import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '../supabaseClient';
import {
  getExamens,
  getExamenById,
  createExamen,
  updateExamen,
  deleteExamen,
  linkExamenToCours,
  importExamensFromCSV,
  getExamenDashboardStats,
  checkExamenPresenceStatus
} from '../examenManagementApi';

// Mock Supabase client
vi.mock('../supabaseClient', () => ({
  supabase: {
    from: vi.fn()
  }
}));

describe('examenManagementApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getExamens', () => {
    it('should fetch examens with filters and pagination', async () => {
      const mockExamens = [
        {
          id: '1',
          session_id: 'session-1',
          code_examen: 'WMDS2221',
          nom_examen: 'Test Exam',
          cours: { id: 'cours-1', code: 'WMDS2221' }
        }
      ];

      const mockPresences = [
        { examen_id: '1', est_present: true, nb_surveillants_accompagnants: 2 }
      ];

      const mockFrom = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockRange = vi.fn().mockResolvedValue({
        data: mockExamens,
        error: null,
        count: 1
      });
      const mockIn = vi.fn().mockResolvedValue({
        data: mockPresences,
        error: null
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'examens') {
          return {
            select: mockSelect,
            eq: mockEq,
            order: mockOrder,
            range: mockRange
          };
        } else if (table === 'presences_enseignants') {
          return {
            select: vi.fn().mockReturnThis(),
            in: mockIn
          };
        }
      });

      mockSelect.mockReturnValue({
        eq: mockEq
      });

      mockEq.mockReturnValue({
        order: mockOrder
      });

      mockOrder.mockReturnValue({
        order: mockOrder,
        range: mockRange
      });

      const result = await getExamens('session-1', {}, 1, 25);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].has_presence_declarations).toBe(true);
      expect(result.data[0].nb_presences_declarees).toBe(1);
    });

    it('should apply search filter', async () => {
      const mockOr = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockRange = vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      mockSelect.mockReturnValue({
        eq: mockEq
      });

      mockEq.mockReturnValue({
        or: mockOr
      });

      mockOr.mockReturnValue({
        order: mockOrder
      });

      mockOrder.mockReturnValue({
        order: mockOrder,
        range: mockRange
      });

      await getExamens('session-1', { search: 'WMDS' }, 1, 25);

      expect(mockOr).toHaveBeenCalled();
    });
  });

  describe('getExamenById', () => {
    it('should fetch single examen with course and presences', async () => {
      const mockExamen = {
        id: '1',
        session_id: 'session-1',
        code_examen: 'WMDS2221',
        cours: { id: 'cours-1', code: 'WMDS2221' }
      };

      const mockPresences = [
        { examen_id: '1', est_present: true, nb_surveillants_accompagnants: 2 }
      ];

      const mockFrom = vi.fn();
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockExamen,
        error: null
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'examens') {
          return {
            select: mockSelect,
            eq: mockEq,
            single: mockSingle
          };
        } else if (table === 'presences_enseignants') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: mockPresences,
              error: null
            })
          };
        }
      });

      mockSelect.mockReturnValue({
        eq: mockEq
      });

      mockEq.mockReturnValue({
        single: mockSingle
      });

      const result = await getExamenById('1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('1');
      expect(result?.has_presence_declarations).toBe(true);
    });

    it('should return null for non-existent exam', async () => {
      const mockFrom = vi.fn();
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      mockSelect.mockReturnValue({
        eq: mockEq
      });

      mockEq.mockReturnValue({
        single: mockSingle
      });

      const result = await getExamenById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createExamen', () => {
    it('should create new examen', async () => {
      const mockExamen = {
        id: '1',
        session_id: 'session-1',
        code_examen: 'WMDS2221',
        nom_examen: 'Test Exam'
      };

      const mockFrom = vi.fn();
      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockExamen,
        error: null
      });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert
      });

      mockInsert.mockReturnValue({
        select: mockSelect
      });

      mockSelect.mockReturnValue({
        single: mockSingle
      });

      const formData = {
        cours_id: 'cours-1',
        code_examen: 'WMDS2221',
        nom_examen: 'Test Exam',
        date_examen: '2025-12-04',
        heure_debut: '09:00',
        heure_fin: '11:00',
        duree_minutes: 120,
        auditoires: 'Room 1',
        enseignants: ['Teacher 1'],
        secretariat: 'MED',
        nb_surveillants_requis: 2
      };

      const result = await createExamen('session-1', formData);

      expect(result.id).toBe('1');
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe('updateExamen', () => {
    it('should update examen fields', async () => {
      const mockExamen = {
        id: '1',
        code_examen: 'WMDS2221',
        nom_examen: 'Updated Exam'
      };

      const mockFrom = vi.fn();
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockExamen,
        error: null
      });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate
      });

      mockUpdate.mockReturnValue({
        eq: mockEq
      });

      mockEq.mockReturnValue({
        select: mockSelect
      });

      mockSelect.mockReturnValue({
        single: mockSingle
      });

      const result = await updateExamen('1', { nom_examen: 'Updated Exam' });

      expect(result.nom_examen).toBe('Updated Exam');
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('deleteExamen', () => {
    it('should delete examen', async () => {
      const mockFrom = vi.fn();
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        error: null
      });

      (supabase.from as any).mockReturnValue({
        delete: mockDelete
      });

      mockDelete.mockReturnValue({
        eq: mockEq
      });

      await deleteExamen('1');

      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', '1');
    });
  });

  describe('linkExamenToCours', () => {
    it('should link examen to course', async () => {
      const mockExamen = {
        id: '1',
        cours_id: 'cours-1'
      };

      const mockFrom = vi.fn();
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockExamen,
        error: null
      });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate
      });

      mockUpdate.mockReturnValue({
        eq: mockEq
      });

      mockEq.mockReturnValue({
        select: mockSelect
      });

      mockSelect.mockReturnValue({
        single: mockSingle
      });

      const result = await linkExamenToCours('1', 'cours-1');

      expect(result.cours_id).toBe('cours-1');
    });
  });

  describe('importExamensFromCSV', () => {
    it('should import examens from CSV data', async () => {
      const csvData = [
        {
          date: '04-12-25',
          jour: 'Jeudi',
          duree: '02h00',
          debut: '09h00',
          fin: '11h00',
          activite: 'WMDS2221=E',
          code: 'Test Exam',
          auditoires: 'Room 1',
          enseignants: 'Teacher 1',
          secretariat: 'MED'
        }
      ];

      const mockCours = [{ id: 'cours-1', code: 'WMDS2221' }];

      const mockFrom = vi.fn();
      const mockSelect = vi.fn();
      const mockEq = vi.fn();
      const mockSingle = vi.fn();
      const mockInsert = vi.fn();

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'cours') {
          return {
            select: vi.fn().mockResolvedValue({
              data: mockCours,
              error: null
            })
          };
        } else if (table === 'examens') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            }),
            insert: vi.fn().mockResolvedValue({
              error: null
            })
          };
        }
      });

      const result = await importExamensFromCSV('session-1', csvData);

      expect(result.imported).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should skip duplicate examens', async () => {
      const csvData = [
        {
          date: '04-12-25',
          jour: 'Jeudi',
          duree: '02h00',
          debut: '09h00',
          fin: '11h00',
          activite: 'WMDS2221=E',
          code: 'Test Exam',
          auditoires: 'Room 1',
          enseignants: 'Teacher 1',
          secretariat: 'MED'
        }
      ];

      const mockCours = [{ id: 'cours-1', code: 'WMDS2221' }];
      const mockExisting = { id: 'existing-1' };

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'cours') {
          return {
            select: vi.fn().mockResolvedValue({
              data: mockCours,
              error: null
            })
          };
        } else if (table === 'examens') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockExisting,
              error: null
            })
          };
        }
      });

      const result = await importExamensFromCSV('session-1', csvData);

      expect(result.skipped).toBe(1);
      expect(result.imported).toBe(0);
    });

    it('should warn about unmatched courses', async () => {
      const csvData = [
        {
          date: '04-12-25',
          jour: 'Jeudi',
          duree: '02h00',
          debut: '09h00',
          fin: '11h00',
          activite: 'UNKNOWN123=E',
          code: 'Test Exam',
          auditoires: 'Room 1',
          enseignants: 'Teacher 1',
          secretariat: 'MED'
        }
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'cours') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [],
              error: null
            })
          };
        } else if (table === 'examens') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            }),
            insert: vi.fn().mockResolvedValue({
              error: null
            })
          };
        }
      });

      const result = await importExamensFromCSV('session-1', csvData);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('non trouvé');
    });
  });

  describe('getExamenDashboardStats', () => {
    it('should calculate dashboard statistics', async () => {
      const mockExamens = [
        {
          id: '1',
          cours_id: 'cours-1',
          nb_surveillants_requis: 2,
          secretariat: 'MED',
          date_examen: '2025-12-04'
        },
        {
          id: '2',
          cours_id: null,
          nb_surveillants_requis: null,
          secretariat: 'MED',
          date_examen: '2025-12-05'
        }
      ];

      const mockPresences = [{ examen_id: '1' }];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'examens') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: mockExamens,
              error: null
            })
          };
        } else if (table === 'presences_enseignants') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({
              data: mockPresences,
              error: null
            })
          };
        }
      });

      const result = await getExamenDashboardStats('session-1');

      expect(result.total_examens).toBe(2);
      expect(result.examens_with_declarations).toBe(1);
      expect(result.examens_pending_declarations).toBe(1);
      expect(result.total_supervisors_required).toBe(2);
      expect(result.examens_without_course).toBe(1);
      expect(result.examens_without_supervisor_requirement).toBe(1);
    });
  });

  describe('checkExamenPresenceStatus', () => {
    it('should check if exam has presence declarations', async () => {
      const mockFrom = vi.fn();
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        count: 2,
        error: null
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      mockSelect.mockReturnValue({
        eq: mockEq
      });

      const result = await checkExamenPresenceStatus('1');

      expect(result.has_declarations).toBe(true);
      expect(result.count).toBe(2);
    });

    it('should return false for exam without declarations', async () => {
      const mockFrom = vi.fn();
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        count: 0,
        error: null
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      mockSelect.mockReturnValue({
        eq: mockEq
      });

      const result = await checkExamenPresenceStatus('1');

      expect(result.has_declarations).toBe(false);
      expect(result.count).toBe(0);
    });
  });
});
