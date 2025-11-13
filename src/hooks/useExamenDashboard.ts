import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { ExamenDashboardStats } from '../../types';
import { getExamenDashboardStats } from '../../lib/examenManagementApi';

interface UseExamenDashboardResult {
  stats: ExamenDashboardStats | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage exam dashboard statistics
 * @param sessionId Session ID
 * @returns Dashboard stats, loading state, error, and refetch function
 */
export function useExamenDashboard(sessionId: string): UseExamenDashboardResult {
  const [stats, setStats] = useState<ExamenDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getExamenDashboardStats(sessionId);
      setStats(result);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch dashboard stats'));
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      fetchStats();
    }
  }, [sessionId, fetchStats]);

  // Set up real-time subscription for changes that affect stats
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'examens',
          filter: `session_id=eq.${sessionId}`
        },
        () => {
          // Refetch stats when exams change
          fetchStats();
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
          // Refetch stats when presences change
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
}
