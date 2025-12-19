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
        .select('examen_id, auditoire, nb_surveillants_requis, surveillants')
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
        
        // Détecter si c'est un auditoire de type "secrétariat"
        const isSecretariatAuditoire = auditoire.auditoire && (
          auditoire.auditoire.toLowerCase().includes('répartition') || 
          auditoire.auditoire.toLowerCase().includes('secrétariat')
        );
        
        if (isSecretariatAuditoire) {
          // Pour les auditoires secrétariat : on considère l'attribution comme complète
          // dès qu'il y a des surveillants assignés, ou comme "prête" s'il n'y en a pas encore
          const surveillantsAssignes = auditoire.surveillants?.length || 0;
          if (surveillantsAssignes > 0) {
            // Si des surveillants sont assignés, l'attribution est complète
            stats[auditoire.examen_id].total_requis += surveillantsAssignes;
            stats[auditoire.examen_id].total_attribues += surveillantsAssignes;
          } else {
            // Si aucun surveillant n'est encore assigné, on considère qu'il faut 1 surveillant
            // et qu'il est déjà "attribué" (vert) car la répartition sera faite par le secrétariat
            stats[auditoire.examen_id].total_requis += 1;
            stats[auditoire.examen_id].total_attribues += 1;
          }
        } else {
          // Pour les auditoires normaux : logique habituelle
          stats[auditoire.examen_id].total_requis += auditoire.nb_surveillants_requis || 0;
          stats[auditoire.examen_id].total_attribues += (auditoire.surveillants?.length || 0);
        }
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
