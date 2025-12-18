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
  mode_attribution?: 'auditoire' | 'secretariat';
}

export default function ExamenSurveillants({ examenId }: Props) {
  const { data: auditoires, isLoading } = useQuery({
    queryKey: ['examen-auditoires-public', examenId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('examen_auditoires')
        .select('id, auditoire, mode_attribution, surveillants')
        .eq('examen_id', examenId)
        .order('mode_attribution DESC, auditoire');
      
      if (error) throw error;
      
      // Récupérer les noms des surveillants
      const auditoiresWithNames = await Promise.all(
        data.map(async (aud) => {
          if (!aud.surveillants || aud.surveillants.length === 0) {
            return { ...aud, surveillants_noms: [] };
          }
          
          const { data: surveillants, error: survError } = await supabase
            .from('surveillants')
            .select('id, nom, prenom, type')
            .in('id', aud.surveillants);
          
          if (survError) throw survError;
          
          const noms = surveillants.map(s => 
            s.type === 'jobiste' ? `${s.prenom} ${s.nom} (Jobiste)` : `${s.prenom} ${s.nom}`
          );
          
          return { ...aud, surveillants_noms: noms };
        })
      );
      
      return auditoiresWithNames as Auditoire[];
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

  // Séparer les auditoires par mode
  const auditoiresSpecifiques = auditoires?.filter(a => a.mode_attribution !== 'secretariat') || [];
  const surveillantsSecretariat = auditoires?.find(a => a.mode_attribution === 'secretariat');

  return (
    <div className="md:w-64 space-y-2">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
        <Users className="h-3 w-3" />
        Surveillants
      </p>
      
      {/* Surveillants avec auditoires attribués par le secrétariat */}
      {surveillantsSecretariat && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 border border-amber-200 dark:border-amber-700">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-1">
            Auditoires attribués par le secrétariat
          </p>
          <div className="text-xs text-amber-700 dark:text-amber-300 space-y-0.5">
            {surveillantsSecretariat.surveillants_noms && surveillantsSecretariat.surveillants_noms.length > 0 ? (
              surveillantsSecretariat.surveillants_noms.map((nom, idx) => (
                <div key={idx} className="flex items-start gap-1">
                  <span className="text-amber-500">•</span>
                  <span>{nom}</span>
                </div>
              ))
            ) : (
              <span className="italic text-amber-600 dark:text-amber-400">
                Surveillants en cours de sélection
              </span>
            )}
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 italic">
            La répartition des auditoires sera communiquée séparément
          </p>
        </div>
      )}
      
      {/* Auditoires spécifiques */}
      {auditoiresSpecifiques.map((aud) => (
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
