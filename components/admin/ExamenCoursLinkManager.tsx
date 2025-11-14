import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { Examen, Cours } from '../../types';
import { linkExamenToCours } from '../../lib/examenManagementApi';
import { extractCourseCode } from '../../lib/examenCsvParser';
import { Link2, AlertCircle, CheckCircle, Search, Loader2 } from 'lucide-react';
import { Button } from '../shared/Button';

interface ExamenWithoutCours extends Examen {
  suggested_cours?: Cours;
  match_confidence?: 'high' | 'medium' | 'low';
}

export function ExamenCoursLinkManager({ sessionId }: { sessionId: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExamen, setSelectedExamen] = useState<ExamenWithoutCours | null>(null);
  const [selectedCoursId, setSelectedCoursId] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch examens without cours_id
  const { data: examensWithoutCours, isLoading: loadingExamens } = useQuery({
    queryKey: ['examens-without-cours', sessionId],
    queryFn: async () => {
      const { data: examens, error } = await supabase
        .from('examens')
        .select('*')
        .eq('session_id', sessionId)
        .is('cours_id', null)
        .order('code_examen');

      if (error) throw error;

      // Fetch all cours for matching
      const { data: allCours } = await supabase
        .from('cours')
        .select('*')
        .order('code');

      // Try to suggest matches
      const examensWithSuggestions: ExamenWithoutCours[] = (examens || []).map(examen => {
        const cleanCode = extractCourseCode(examen.code_examen);
        
        // Try exact match
        let suggested = allCours?.find(c => c.code === cleanCode);
        let confidence: 'high' | 'medium' | 'low' = 'high';

        // Try partial match if no exact match
        if (!suggested && cleanCode.length >= 4) {
          suggested = allCours?.find(c => 
            c.code.startsWith(cleanCode.substring(0, 4))
          );
          confidence = 'medium';
        }

        // Try fuzzy match
        if (!suggested) {
          suggested = allCours?.find(c => 
            c.code.toLowerCase().includes(cleanCode.toLowerCase().substring(0, 3))
          );
          confidence = 'low';
        }

        return {
          ...examen,
          suggested_cours: suggested,
          match_confidence: suggested ? confidence : undefined
        };
      });

      return examensWithSuggestions;
    },
    enabled: !!sessionId
  });

  // Fetch all cours for manual selection
  const { data: allCours } = useQuery({
    queryKey: ['all-cours'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cours')
        .select('*')
        .order('code');
      if (error) throw error;
      return data;
    }
  });

  // Link mutation
  const linkMutation = useMutation({
    mutationFn: ({ examenId, coursId }: { examenId: string; coursId: string }) =>
      linkExamenToCours(examenId, coursId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examens-without-cours'] });
      queryClient.invalidateQueries({ queryKey: ['cours-presences'] });
      setSelectedExamen(null);
      setSelectedCoursId('');
    }
  });

  const handleAutoLink = (examen: ExamenWithoutCours) => {
    if (examen.suggested_cours) {
      linkMutation.mutate({
        examenId: examen.id,
        coursId: examen.suggested_cours.id
      });
    }
  };

  const handleManualLink = () => {
    if (selectedExamen && selectedCoursId) {
      linkMutation.mutate({
        examenId: selectedExamen.id,
        coursId: selectedCoursId
      });
    }
  };

  const filteredExamens = examensWithoutCours?.filter(e =>
    e.code_examen.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.nom_examen.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loadingExamens) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Link2 className="h-6 w-6 text-indigo-600" />
            Lier les examens aux cours
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {examensWithoutCours?.length || 0} examen(s) sans cours lié
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un examen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Examens List */}
      <div className="space-y-3">
        {filteredExamens?.map((examen) => (
          <div
            key={examen.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-bold">
                    {examen.code_examen}
                  </span>
                  <span className="text-xs text-gray-500">
                    Code extrait: {extractCourseCode(examen.code_examen)}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {examen.nom_examen}
                </p>

                {/* Suggestion */}
                {examen.suggested_cours && (
                  <div className={`mt-3 p-3 rounded-lg ${
                    examen.match_confidence === 'high' 
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : examen.match_confidence === 'medium'
                      ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                      : 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {examen.match_confidence === 'high' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                          )}
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            Suggestion {examen.match_confidence === 'high' ? '(forte)' : examen.match_confidence === 'medium' ? '(moyenne)' : '(faible)'}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {examen.suggested_cours.code} - {examen.suggested_cours.intitule_complet}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAutoLink(examen)}
                        disabled={linkMutation.isPending}
                      >
                        Lier
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedExamen(examen);
                  setSelectedCoursId(examen.suggested_cours?.id || '');
                }}
              >
                Choisir manuellement
              </Button>
            </div>
          </div>
        ))}

        {filteredExamens?.length === 0 && (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              Tous les examens sont liés à un cours !
            </p>
          </div>
        )}
      </div>

      {/* Manual Link Modal */}
      {selectedExamen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Lier manuellement
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {selectedExamen.code_examen} - {selectedExamen.nom_examen}
              </p>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sélectionner un cours
              </label>
              <select
                value={selectedCoursId}
                onChange={(e) => setSelectedCoursId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">-- Choisir un cours --</option>
                {allCours?.map((cours) => (
                  <option key={cours.id} value={cours.id}>
                    {cours.code} - {cours.intitule_complet}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedExamen(null);
                  setSelectedCoursId('');
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleManualLink}
                disabled={!selectedCoursId || linkMutation.isPending}
              >
                {linkMutation.isPending ? 'Liaison...' : 'Lier'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
