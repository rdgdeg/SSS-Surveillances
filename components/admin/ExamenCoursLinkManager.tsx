import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { Examen, Cours } from '../../types';
import { linkExamenToCours } from '../../lib/examenManagementApi';
import { extractCourseCode } from '../../lib/examenCsvParser';
import { Link2, AlertCircle, CheckCircle, Search, Loader2, Plus, X } from 'lucide-react';
import { Button } from '../shared/Button';

interface ExamenWithoutCours extends Examen {
  suggested_cours?: Cours;
  match_confidence?: 'high' | 'medium' | 'low';
}

export function ExamenCoursLinkManager({ sessionId }: { sessionId: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExamen, setSelectedExamen] = useState<ExamenWithoutCours | null>(null);
  const [selectedCoursId, setSelectedCoursId] = useState<string>('');
  const [coursSearchTerm, setCoursSearchTerm] = useState('');
  const [showCreateCours, setShowCreateCours] = useState(false);
  const [newCoursData, setNewCoursData] = useState({
    code: '',
    intitule_complet: '',
    consignes: ''
  });
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

  // Create cours mutation
  const createCoursMutation = useMutation({
    mutationFn: async (coursData: { code: string; intitule_complet: string; consignes?: string }) => {
      const { data, error } = await supabase
        .from('cours')
        .insert({
          code: coursData.code.trim(),
          intitule_complet: coursData.intitule_complet.trim(),
          consignes: coursData.consignes?.trim() || null
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (newCours) => {
      queryClient.invalidateQueries({ queryKey: ['all-cours'] });
      queryClient.invalidateQueries({ queryKey: ['examens-without-cours'] });
      setShowCreateCours(false);
      setNewCoursData({ code: '', intitule_complet: '', consignes: '' });
      
      // Auto-select the newly created course if we're in manual selection mode
      if (selectedExamen) {
        setSelectedCoursId(newCours.id);
      }
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
      setCoursSearchTerm('');
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

  const handleCreateCours = () => {
    if (newCoursData.code && newCoursData.intitule_complet) {
      createCoursMutation.mutate(newCoursData);
    }
  };

  const handleOpenCreateCours = (examen?: ExamenWithoutCours) => {
    const cleanCode = examen ? extractCourseCode(examen.code_examen) : '';
    setNewCoursData({
      code: cleanCode,
      intitule_complet: examen?.nom_examen || '',
      consignes: ''
    });
    setShowCreateCours(true);
  };

  // Filter cours based on search term
  const filteredCours = useMemo(() => {
    if (!allCours) return [];
    if (!coursSearchTerm) return allCours;
    
    const search = coursSearchTerm.toLowerCase();
    return allCours.filter(c => 
      c.code.toLowerCase().includes(search) ||
      c.intitule_complet.toLowerCase().includes(search)
    );
  }, [allCours, coursSearchTerm]);

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

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenCreateCours(examen)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Créer cours
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedExamen(examen);
                    setSelectedCoursId(examen.suggested_cours?.id || '');
                    setCoursSearchTerm('');
                  }}
                >
                  Choisir manuellement
                </Button>
              </div>
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

            <div className="p-6 space-y-4">
              {/* Search cours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rechercher un cours
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Code ou nom du cours..."
                    value={coursSearchTerm}
                    onChange={(e) => setCoursSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Select cours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sélectionner un cours
                </label>
                <select
                  value={selectedCoursId}
                  onChange={(e) => setSelectedCoursId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  size={10}
                >
                  <option value="">-- Choisir un cours --</option>
                  {filteredCours?.map((cours) => (
                    <option key={cours.id} value={cours.id}>
                      {cours.code} - {cours.intitule_complet}
                    </option>
                  ))}
                </select>
                {filteredCours?.length === 0 && coursSearchTerm && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                    Aucun cours trouvé. Vous pouvez créer un nouveau cours.
                  </p>
                )}
              </div>

              {/* Create new cours button */}
              <Button
                variant="outline"
                onClick={() => handleOpenCreateCours(selectedExamen || undefined)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer un nouveau cours
              </Button>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedExamen(null);
                  setSelectedCoursId('');
                  setCoursSearchTerm('');
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

      {/* Create Cours Modal */}
      {showCreateCours && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Plus className="h-5 w-5 text-indigo-600" />
                  Créer un nouveau cours
                </h3>
                <button
                  onClick={() => {
                    setShowCreateCours(false);
                    setNewCoursData({ code: '', intitule_complet: '', consignes: '' });
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Code du cours <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCoursData.code}
                  onChange={(e) => setNewCoursData({ ...newCoursData, code: e.target.value })}
                  placeholder="Ex: WINTR2105"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Intitulé */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Intitulé complet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCoursData.intitule_complet}
                  onChange={(e) => setNewCoursData({ ...newCoursData, intitule_complet: e.target.value })}
                  placeholder="Ex: INTERPR.DE L'ELECTROCARDIOGR."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Consignes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Consignes (optionnel)
                </label>
                <textarea
                  value={newCoursData.consignes}
                  onChange={(e) => setNewCoursData({ ...newCoursData, consignes: e.target.value })}
                  placeholder="Consignes pour les surveillants..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateCours(false);
                  setNewCoursData({ code: '', intitule_complet: '', consignes: '' });
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateCours}
                disabled={!newCoursData.code || !newCoursData.intitule_complet || createCoursMutation.isPending}
              >
                {createCoursMutation.isPending ? 'Création...' : 'Créer le cours'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
