import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { Users } from 'lucide-react';

interface Props {
  examenId: string;
}

interface Auditoire {
  id: string;
  auditoire: string;
  surveillants_noms: string[];
}

export default function ExamenSurveillants({ examenId }: Props) {
  const { data: auditoires, isLoading } = useQuery({
    queryKey: ['examen-auditoires-public', examenId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_examen_auditoires_with_surveillants')
        .select('*')
        .eq('examen_id', examenId);
      
      if (error) throw error;
      return data as Auditoire[];
    },
  });

  if (isLoading) {
    return (
      <div className="md:w-64 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          Surveillants
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
          Chargement...
        </p>
      </div>
    );
  }

  if (!auditoires || auditoires.length === 0) {
    return (
      <div className="md:w-64 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
        <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
          Surveillants
        </p>
        <p className="text-xs text-amber-600 dark:text-amber-500">
          Session en cours d'attribution
        </p>
      </div>
    );
  }

  return (
    <div className="md:w-64 space-y-2">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
        <Users className="h-3 w-3" />
        Surveillants
      </p>
      {auditoires.map((aud) => (
        <div key={aud.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 border border-gray-200 dark:border-gray-600">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            {aud.auditoire}
          </p>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
            {aud.surveillants_noms && aud.surveillants_noms.length > 0 ? (
              aud.surveillants_noms.map((nom, idx) => (
                <div key={idx} className="flex items-start gap-1">
                  <span className="text-gray-400">•</span>
                  <span>{nom}</span>
                </div>
              ))
            ) : (
              <span className="italic text-gray-400 dark:text-gray-500">
                Aucun surveillant assigné
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
