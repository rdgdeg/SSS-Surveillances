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
  remplacements?: Array<{
    nom: string;
    isRemplacement: boolean;
    ancienNom?: string;
  }>;
}

export default function ExamenSurveillants({ examenId }: Props) {
  const { data: auditoires, isLoading } = useQuery({
    queryKey: ['examen-auditoires-public', examenId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('examen_auditoires')
        .select('id, auditoire, mode_attribution, surveillants, surveillants_remplaces')
        .eq('examen_id', examenId)
        .order('auditoire');
      
      if (error) throw error;
      
      // Récupérer les noms des surveillants avec gestion des remplacements
      const auditoiresWithNames = await Promise.all(
        data.map(async (aud) => {
          if (!aud.surveillants || aud.surveillants.length === 0) {
            return { ...aud, surveillants_noms: [], remplacements: [] };
          }
          
          // Récupérer tous les IDs (actuels + remplacés)
          const allIds = [...aud.surveillants];
          if (aud.surveillants_remplaces) {
            aud.surveillants_remplaces.forEach((remp: any) => {
              if (!allIds.includes(remp.ancien_id)) allIds.push(remp.ancien_id);
            });
          }
          
          const { data: surveillants, error: survError } = await supabase
            .from('surveillants')
            .select('id, nom, prenom, type')
            .in('id', allIds);
          
          if (survError) throw survError;
          
          // Créer un map des surveillants
          const surveillantsMap = new Map(
            surveillants.map(s => [s.id, s])
          );
          
          // Traiter les noms avec remplacements
          const nomsAvecRemplacements: Array<{
            nom: string;
            isRemplacement: boolean;
            ancienNom?: string;
          }> = [];
          
          aud.surveillants.forEach((survId: string) => {
            const surveillant = surveillantsMap.get(survId);
            if (!surveillant) return;
            
            const nomComplet = surveillant.type === 'jobiste' 
              ? `${surveillant.prenom} ${surveillant.nom} (Jobiste)` 
              : `${surveillant.prenom} ${surveillant.nom}`;
            
            // Vérifier s'il y a un remplacement pour ce surveillant
            const remplacement = aud.surveillants_remplaces?.find((r: any) => r.nouveau_id === survId);
            
            if (remplacement) {
              const ancienSurveillant = surveillantsMap.get(remplacement.ancien_id);
              const ancienNom = ancienSurveillant 
                ? (ancienSurveillant.type === 'jobiste' 
                    ? `${ancienSurveillant.prenom} ${ancienSurveillant.nom} (Jobiste)` 
                    : `${ancienSurveillant.prenom} ${ancienSurveillant.nom}`)
                : 'Surveillant inconnu';
              
              nomsAvecRemplacements.push({
                nom: nomComplet,
                isRemplacement: true,
                ancienNom
              });
            } else {
              nomsAvecRemplacements.push({
                nom: nomComplet,
                isRemplacement: false
              });
            }
          });
          
          return { 
            ...aud, 
            surveillants_noms: nomsAvecRemplacements.map(n => n.nom),
            remplacements: nomsAvecRemplacements
          };
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

  // Séparer l'auditoire spécial "répartition par le secrétariat" des autres
  const auditoiresNormaux = auditoires?.filter(a => 
    !a.auditoire.toLowerCase().includes('répartition') && 
    !a.auditoire.toLowerCase().includes('secrétariat')
  ) || [];
  const auditoireSecretariat = auditoires?.find(a => 
    a.auditoire.toLowerCase().includes('répartition') || 
    a.auditoire.toLowerCase().includes('secrétariat')
  );

  // Si l'auditoire secrétariat a des surveillants assignés, on n'affiche QUE celui-ci
  const hasSecretariatSurveillants = auditoireSecretariat && 
    auditoireSecretariat.surveillants_noms && 
    auditoireSecretariat.surveillants_noms.length > 0;

  return (
    <div className="md:w-64 space-y-2">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
        <Users className="h-3 w-3" />
        Surveillants
      </p>
      
      {/* Auditoire spécial pour répartition par le secrétariat */}
      {auditoireSecretariat && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 border border-amber-200 dark:border-amber-700">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-1">
            {auditoireSecretariat.auditoire}
          </p>
          <div className="text-xs text-amber-700 dark:text-amber-300 space-y-0.5">
            {auditoireSecretariat.remplacements && auditoireSecretariat.remplacements.length > 0 ? (
              auditoireSecretariat.remplacements.map((remp, idx) => (
                <div key={idx} className="flex items-start gap-1">
                  <span className="text-amber-500">•</span>
                  <div className="flex flex-col">
                    {remp.isRemplacement && remp.ancienNom && (
                      <span className="line-through text-red-600 dark:text-red-400 text-xs">
                        {remp.ancienNom}
                      </span>
                    )}
                    <span className={remp.isRemplacement ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                      {remp.nom}
                    </span>
                  </div>
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
      
      {/* Auditoires normaux - seulement si pas de surveillants dans le mode secrétariat */}
      {!hasSecretariatSurveillants && auditoiresNormaux.map((aud) => (
        <div key={aud.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 border border-gray-200 dark:border-gray-600">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            {aud.auditoire}
          </p>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
            {aud.remplacements && aud.remplacements.length > 0 ? (
              aud.remplacements.map((remp, idx) => (
                <div key={idx} className="flex items-start gap-1">
                  <span className="text-gray-400">•</span>
                  <div className="flex flex-col">
                    {remp.isRemplacement && remp.ancienNom && (
                      <span className="line-through text-red-600 dark:text-red-400 text-xs">
                        {remp.ancienNom}
                      </span>
                    )}
                    <span className={remp.isRemplacement ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                      {remp.nom}
                    </span>
                  </div>
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
