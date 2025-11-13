import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { Session } from '../../types';

/**
 * Hook pour récupérer la session active
 */
export function useActiveSession() {
  return useQuery({
    queryKey: ['active-session'],
    queryFn: async (): Promise<Session | null> => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No active session found
          return null;
        }
        throw error;
      }

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
