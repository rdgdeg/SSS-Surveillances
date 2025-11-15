import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { Cours } from '../../types';
import { AlertTriangle, Trash2, Merge, Search, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '../shared/Button';
import toast from 'react-hot-toast';

interface DuplicateGroup {
  code: string;
  cours: Cours[];
}

export function CoursDuplicateDetector() {
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  const [coursToKeep, setCoursToKeep] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Fetch all cours
  const { data: allCours, isLoading } = useQuery({
    queryKey: ['all-cours-duplicates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cours')
        .select('*')
        .order('code');
      
      if (error) throw error;
      return data;
    }
  });

  // Find duplicates
  const duplicates = useMemo(() => {
    if (!allCours) return [];

    const grouped = allCours.reduce((acc, cours) => {
      const code = cours.code.toUpperCase().trim();
      if (!acc[code]) {
        acc[code] = [];
      }
      acc[code].push(cours);
      return acc;
    }, {} as Record<string, Cours[]>);

    // Filter only groups with duplicates
    const duplicateGroups: DuplicateGroup[] = Object.entries(grouped)
      .filter(([_, cours]) => cours.length > 1)
      .map(([code, cours]) => ({ code, cours }))
      .sort((a, b) => b.cours.length - a.cours.length);

    return duplicateGroups;
  }, [allCours]);

  // Filter duplicates by search
  const filteredDuplicates = useMemo(() => {
    if (!searchTerm) return duplicates;
    
    const search = searchTerm.toLowerCase();
    return duplicates.filter(group =>
      group.code.toLowerCase().includes(search) ||
      group.cours.some(c => c.intitule_complet.toLowerCase().includes(search))
    );
  }, [duplicates, searchTerm]);

  // Merge mutation
  const mergeMutation = useMutation({
    mutationFn: async ({ keepId, deleteIds }: { keepId: string; deleteIds: string[] }) => {
      // Update all references to point to the kept cours
      const { error: updateExamensError } = await supabase
        .from('examens')
        .update({ cours_id: keepId })
        .in('cours_id', deleteIds);
      
      if (updateExamensError) throw updateExamensError;

      const { error: updatePresencesError } = await supabase
        .from('presences_enseignants')
        .update({ cours_id: keepId })
        .in('cours_id', deleteIds);
      
      if (updatePresencesError) throw updatePresencesError;

      // Delete duplicate cours
      const { error: deleteError } = await supabase
        .from('cours')
        .delete()
        .in('id', deleteIds);
      
      if (deleteError) throw deleteError;

      return { keepId, deleteIds };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['all-cours-duplicates'] });
      queryClient.invalidateQueries({ queryKey: ['all-cours'] });
      queryClient.invalidateQueries({ queryKey: ['examens-without-cours'] });
      toast.success(`${data.deleteIds.length} doublon(s) fusionné(s) avec succès !`);
      setSelectedGroup(null);
      setCoursToKeep('');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la fusion : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  });

  const handleMerge = () => {
    if (!selectedGroup || !coursToKeep) return;

    const deleteIds = selectedGroup.cours
      .filter(c => c.id !== coursToKeep)
      .map(c => c.id);

    if (deleteIds.length === 0) {
      toast.error('Veuillez sélectionner un cours à conserver');
      return;
    }

    if (window.confirm(
      `Êtes-vous sûr de vouloir fusionner ces ${deleteIds.length} doublon(s) ?\n\n` +
      `Toutes les références (examens, présences) seront transférées vers le cours conservé.\n` +
      `Cette action est irréversible.`
    )) {
      mergeMutation.mutate({ keepId: coursToKeep, deleteIds });
    }
  };

  if (isLoading) {
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
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            Détection de doublons
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {duplicates.length > 0 ? (
              <>
                {duplicates.length} code(s) en doublon trouvé(s) - {duplicates.reduce((sum, g) => sum + g.cours.length, 0)} cours au total
              </>
            ) : (
              'Aucun doublon détecté ✓'
            )}
          </p>
        </div>
      </div>

      {duplicates.length === 0 ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
          <p className="text-green-800 dark:text-green-200 font-medium">
            Aucun doublon détecté dans la liste des cours
          </p>
          <p className="text-sm text-green-700 dark:text-green-300 mt-2">
            Tous les codes de cours sont uniques
          </p>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher dans les doublons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Duplicates List */}
          <div className="space-y-3">
            {filteredDuplicates.map((group) => (
              <div
                key={group.code}
                className="bg-white dark:bg-gray-800 rounded-lg border-2 border-amber-200 dark:border-amber-800 p-4"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-sm font-bold">
                        {group.code}
                      </span>
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs font-medium">
                        {group.cours.length} doublons
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedGroup(group);
                      setCoursToKeep(group.cours[0].id);
                    }}
                  >
                    <Merge className="h-4 w-4 mr-1" />
                    Fusionner
                  </Button>
                </div>

                {/* List of duplicate cours */}
                <div className="space-y-2">
                  {group.cours.map((cours, idx) => (
                    <div
                      key={cours.id}
                      className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              #{idx + 1}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ID: {cours.id.substring(0, 8)}...
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {cours.intitule_complet}
                          </p>
                          {cours.consignes && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              Consignes: {cours.consignes}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Créé le {new Date(cours.created_at || '').toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Merge Modal */}
      {selectedGroup && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Merge className="h-5 w-5 text-indigo-600" />
                Fusionner les doublons - {selectedGroup.code}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Sélectionnez le cours à conserver. Les autres seront supprimés et toutes leurs références seront transférées.
              </p>
            </div>

            <div className="p-6 space-y-4">
              {selectedGroup.cours.map((cours, idx) => (
                <label
                  key={cours.id}
                  className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    coursToKeep === cours.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="cours-to-keep"
                      value={cours.id}
                      checked={coursToKeep === cours.id}
                      onChange={(e) => setCoursToKeep(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Option #{idx + 1}
                        </span>
                        {coursToKeep === cours.id && (
                          <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium">
                            À conserver
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {cours.intitule_complet}
                      </p>
                      {cours.consignes && (
                        <div className="bg-gray-50 dark:bg-gray-900 rounded p-2 mt-2">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            <strong>Consignes:</strong> {cours.consignes}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
                        <span>ID: {cours.id.substring(0, 8)}...</span>
                        <span>Créé: {new Date(cours.created_at || '').toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                </label>
              ))}

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-medium mb-1">Attention !</p>
                    <ul className="list-disc list-inside space-y-1 text-amber-700 dark:text-amber-300">
                      <li>Les {selectedGroup.cours.length - 1} autre(s) cours seront supprimés définitivement</li>
                      <li>Tous les examens et présences seront transférés vers le cours conservé</li>
                      <li>Cette action est irréversible</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedGroup(null);
                  setCoursToKeep('');
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleMerge}
                disabled={!coursToKeep || mergeMutation.isPending}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {mergeMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Fusion en cours...
                  </>
                ) : (
                  <>
                    <Merge className="h-4 w-4 mr-2" />
                    Fusionner les doublons
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
