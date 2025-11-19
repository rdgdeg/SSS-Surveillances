import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useActiveSession } from '../../src/hooks/useActiveSession';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  BookOpen, 
  Search,
  Loader2,
  AlertCircle,
  Users
} from 'lucide-react';
import ExamenSurveillants from '../../components/public/ExamenSurveillants';

interface Examen {
  id: string;
  heure_debut: string;
  heure_fin: string;
  local: string;
  nb_etudiants: number;
  cours: {
    code: string;
    intitule_complet: string;
  } | null;
}

export default function ExamSchedulePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: activeSession } = useActiveSession();

  // Fetch examens
  const { data: examens, isLoading, error: queryError } = useQuery({
    queryKey: ['public-examens', activeSession?.id],
    queryFn: async () => {
      if (!activeSession?.id) {
        console.log('❌ Pas de session active');
        return [];
      }
      
      console.log('🔍 Recherche des examens pour la session:', activeSession.id, activeSession.name);
      
      const { data, error } = await supabase
        .from('examens')
        .select(`
          id,
          heure_debut,
          heure_fin,
          local,
          nb_etudiants,
          cours:cours_id (
            code,
            intitule_complet
          )
        `)
        .eq('session_id', activeSession.id)
        .order('heure_debut', { ascending: true });
      
      if (error) {
        console.error('❌ Erreur lors de la récupération des examens:', error);
        throw error;
      }
      
      console.log('✅ Examens récupérés:', data?.length || 0, 'examens');
      console.log('📋 Données:', data);
      
      return (data || []) as unknown as Examen[];
    },
    enabled: !!activeSession?.id,
  });

  // Filter examens based on search
  const filteredExamens = examens?.filter(examen => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    const coursCode = examen.cours?.code?.toLowerCase() || '';
    const coursIntitule = examen.cours?.intitule_complet?.toLowerCase() || '';
    const local = examen.local?.toLowerCase() || '';
    
    return (
      coursCode.includes(search) ||
      coursIntitule.includes(search) ||
      local.includes(search)
    );
  });

  if (!activeSession) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-3 text-amber-800 dark:text-amber-200">
            <AlertCircle className="h-6 w-6" />
            <p>Aucune session d'examens active pour le moment.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Planning des Examens
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Session: {activeSession.name} ({activeSession.year})
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Pour les surveillants</p>
              <p>Recherchez votre nom ou prénom pour voir les surveillances qui vous sont attribuées.</p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 italic">
                Note : L'attribution des surveillants sera ajoutée prochainement.
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par cours, local, date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Debug Info */}
        {activeSession && (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 mb-4 text-xs">
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Debug:</strong> Session ID: {activeSession.id} | 
              Examens chargés: {examens?.length || 0} | 
              Loading: {isLoading ? 'Oui' : 'Non'}
              {queryError && ` | Erreur: ${queryError}`}
            </p>
          </div>
        )}

        {/* Error Display */}
        {queryError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 text-red-800 dark:text-red-200">
              <AlertCircle className="h-6 w-6" />
              <div>
                <p className="font-medium">Erreur lors du chargement des examens</p>
                <p className="text-sm mt-1">{String(queryError)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        )}

        {/* Examens List */}
        {!isLoading && filteredExamens && filteredExamens.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 px-6 py-3 border-b border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-lg font-semibold text-indigo-900 dark:text-indigo-200">
                  Examens de la session
                </h2>
              </div>
            </div>

            {/* Examens list */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredExamens.map((examen) => (
                <div key={examen.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        {/* Left: Course Info */}
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-3">
                            <BookOpen className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                            <div>
                              {examen.cours ? (
                                <>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-bold">
                                      {examen.cours.code}
                                    </span>
                                  </div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {examen.cours.intitule_complet}
                                  </p>
                                </>
                              ) : (
                                <p className="text-gray-500 dark:text-gray-400 italic">
                                  Cours non spécifié
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-8">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Clock className="h-4 w-4" />
                              <span>
                                {examen.heure_debut} - {examen.heure_fin}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <MapPin className="h-4 w-4" />
                              <span>{examen.local || 'Local non spécifié'}</span>
                            </div>
                            {examen.nb_etudiants > 0 && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Users className="h-4 w-4" />
                                <span>{examen.nb_etudiants} étudiant{examen.nb_etudiants > 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Surveillants */}
                        <ExamenSurveillants examenId={examen.id} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
        ) : !isLoading && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Aucun examen trouvé pour cette recherche' : 'Aucun examen planifié pour cette session'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
