import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { Users, ChevronDown, ChevronRight } from 'lucide-react';
import ExamenAuditoiresModal from './ExamenAuditoiresModal';

interface Examen {
  id: string;
  code_examen: string;
  nom_examen: string;
  date_examen: string;
  heure_debut: string;
  heure_fin: string;
  secretariat: string;
}

interface ExamenAuditoire {
  id: string;
  examen_id: string;
  auditoire: string;
  nb_surveillants_requis: number;
  surveillants: string[];
  surveillants_noms?: string[];
}

interface ExamenWithAuditoires extends Examen {
  auditoires: ExamenAuditoire[];
}

export default function ExamListWithAuditoires({ sessionId }: { sessionId: string }) {
  const [expandedExams, setExpandedExams] = useState<Set<string>>(new Set());
  const [selectedAuditoire, setSelectedAuditoire] = useState<{ examenId: string; examenNom: string } | null>(null);

  // Fetch examens with auditoires
  const { data: examens, isLoading } = useQuery({
    queryKey: ['examens-with-auditoires', sessionId],
    queryFn: async () => {
      // Fetch examens
      const { data: examensData, error: examensError } = await supabase
        .from('examens')
        .select('*')
        .eq('session_id', sessionId)
        .order('date_examen', { ascending: true })
        .order('heure_debut', { ascending: true });

      if (examensError) throw examensError;

      // Fetch auditoires for all examens
      const { data: auditoiresData, error: auditoiresError } = await supabase
        .from('v_examen_auditoires_with_surveillants')
        .select('*')
        .in('examen_id', examensData.map(e => e.id));

      if (auditoiresError) throw auditoiresError;

      // Group auditoires by examen
      const examensWithAuditoires: ExamenWithAuditoires[] = examensData.map(examen => ({
        ...examen,
        auditoires: auditoiresData.filter(a => a.examen_id === examen.id),
      }));

      return examensWithAuditoires;
    },
  });

  const toggleExpand = (examenId: string) => {
    const newExpanded = new Set(expandedExams);
    if (newExpanded.has(examenId)) {
      newExpanded.delete(examenId);
    } else {
      newExpanded.add(examenId);
    }
    setExpandedExams(newExpanded);
  };

  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-2">
      {examens?.map((examen) => {
        const isExpanded = expandedExams.has(examen.id);
        const hasAuditoires = examen.auditoires && examen.auditoires.length > 0;

        return (
          <div key={examen.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Ligne principale de l'examen */}
            <div className="flex items-center gap-2 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              {/* Bouton expand/collapse */}
              {hasAuditoires && (
                <button
                  onClick={() => toggleExpand(examen.id)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </button>
              )}

              {/* Informations de l'examen */}
              <div className="flex-1 grid grid-cols-6 gap-4 items-center">
                <div className="text-sm text-gray-900 dark:text-white">
                  {examen.date_examen || '-'}
                </div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {examen.heure_debut} - {examen.heure_fin}
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {examen.code_examen}
                </div>
                <div className="text-sm text-gray-900 dark:text-white col-span-2 truncate">
                  {examen.nom_examen}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {examen.secretariat || '-'}
                </div>
              </div>

              {/* Badge nombre d'auditoires */}
              {hasAuditoires && (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium">
                    {examen.auditoires.length} auditoire{examen.auditoires.length > 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => setSelectedAuditoire({ examenId: examen.id, examenNom: examen.nom_examen })}
                    className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded"
                    title="Gérer les auditoires"
                  >
                    <Users className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Lignes des auditoires (expandable) */}
            {isExpanded && hasAuditoires && (
              <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                {examen.auditoires.map((auditoire) => (
                  <div
                    key={auditoire.id}
                    className="flex items-center gap-2 p-4 pl-12 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                  >
                    <div className="flex-1 grid grid-cols-6 gap-4 items-center">
                      {/* Colonnes vides pour alignement */}
                      <div className="col-span-3"></div>
                      
                      {/* Auditoire */}
                      <div className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                        📍 {auditoire.auditoire}
                      </div>

                      {/* Surveillants */}
                      <div className="col-span-2 text-sm text-gray-600 dark:text-gray-400">
                        {auditoire.surveillants_noms && auditoire.surveillants_noms.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {auditoire.surveillants_noms.map((nom, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs"
                              >
                                {nom}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs italic text-gray-400">
                            Aucun surveillant assigné
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Modal de gestion */}
      {selectedAuditoire && (
        <ExamenAuditoiresModal
          examenId={selectedAuditoire.examenId}
          examenNom={selectedAuditoire.examenNom}
          onClose={() => setSelectedAuditoire(null)}
        />
      )}
    </div>
  );
}
