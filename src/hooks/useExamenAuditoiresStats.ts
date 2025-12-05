import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';

interface AuditoireStats {
  examen_id: string;
  total_requis: number;
  total_attribues: number;
}

export function useExamenAuditoiresStats(examenIds: string[]) {
  return useQuery({
    queryKey: ['examen-auditoires-stats', examenIds],
    queryFn: async () => {
      if (examenIds.length === 0) return {};

      const { data, error } = await supabase
        .from('examen_auditoires')
        .select('examen_id, nb_surveillants_requis, surveillants')
        .in('examen_id', examenIds);

      if (error) throw error;

      // Calculer les stats par examen
      const stats: Record<string, AuditoireStats> = {};
      
      data?.forEach((auditoire) => {
        if (!stats[auditoire.examen_id]) {
          stats[auditoire.examen_id] = {
            examen_id: auditoire.examen_id,
            total_requis: 0,
            total_attribues: 0,
          };
        }
        
        stats[auditoire.examen_id].total_requis += auditoire.nb_surveillants_requis || 0;
        stats[auditoire.examen_id].total_attribues += (auditoire.surveillants?.length || 0);
      });

      return stats;
    },
    enabled: examenIds.length > 0,
  });
}

export function getAttributionStatus(requis: number, attribues: number): 'none' | 'partial' | 'complete' {
  if (requis === 0) return 'none';
  if (attribues === 0) return 'none';
  if (attribues >= requis) return 'complete';
  return 'partial';
}
