import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { ExamenWithStatus, ExamenFilters, ExamenImportResult } from '../../types';
import { getExamens, importExamensFromCSV } from '../../lib/examenManagementApi';
import { parseExamenCSV } from '../../lib/examenCsvParser';

interface UseExamensResult {
  examens: ExamenWithStatus[];
  loading: boolean;
  error: Error | null;
  total: number;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage examens with filters and pagination
 * @param sessionId Session ID
 * @param filters Optional filters
 * @param page Page number (1-indexed)
 * @param pageSize Number of items per page
 * @returns Examens data, loading state, error, total count, and refetch function
 */
export function useExamens(
  sessionId: string,
  filters?: ExamenFilters,
  page: number = 1,
  pageSize: number = 25
): UseExamensResult {
  const [examens, setExamens] = useState<ExamenWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);

  const fetchExamens = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getExamens(sessionId, filters, page, pageSize);
      
      setExamens(result.data);
      setTotal(result.total);
    } catch (err) {
      console.error('Error fetching examens:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch examens'));
    } finally {
      setLoading(false);
    }
  }, [sessionId, filters, page, pageSize]);

  useEffect(() => {
    if (sessionId) {
      fetchExamens();
    }
  }, [sessionId, fetchExamens]);

  // Set up real-time subscription for exam changes
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel('examens-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'examens',
          filter: `session_id=eq.${sessionId}`
        },
        () => {
          // Refetch when exams change
          fetchExamens();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'presences_enseignants'
        },
        () => {
          // Refetch when presences change (affects status badges)
          fetchExamens();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, fetchExamens]);

  return {
    examens,
    loading,
    error,
    total,
    refetch: fetchExamens
  };
}

/**
 * Hook to import examens from CSV file
 * @param onProgress Optional callback for progress updates
 * @returns Mutation object with mutateAsync function
 */
export function useExamenImport(
  onProgress?: (current: number, total: number) => void
) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutateAsync = async ({ 
    sessionId, 
    file 
  }: { 
    sessionId: string; 
    file: File 
  }): Promise<ExamenImportResult> => {
    try {
      setIsPending(true);
      setError(null);

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('Le fichier est trop volumineux (max 10 MB)');
      }

      // Validate file type
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
        throw new Error('Le fichier doit être au format CSV (.csv ou .txt)');
      }

      // Read file content
      const content = await file.text();
      
      // Parse CSV
      const parseResult = parseExamenCSV(content);
      
      // If parsing failed completely, return errors
      if (parseResult.examens.length === 0 && parseResult.errors.length > 0) {
        return {
          imported: 0,
          updated: 0,
          skipped: 0,
          errors: parseResult.errors,
          warnings: parseResult.warnings
        };
      }
      
      // Import examens
      const result = await importExamensFromCSV(sessionId, parseResult.examens, onProgress);
      
      // Merge parsing warnings with import result
      result.warnings = [...parseResult.warnings, ...result.warnings];
      result.errors = [...parseResult.errors, ...result.errors];
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to import examens');
      setError(error);
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return {
    mutateAsync,
    isPending,
    error
  };
}
