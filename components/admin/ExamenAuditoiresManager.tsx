import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Trash2, Users, Save, X, Search, RefreshCw } from 'lucide-react';
import { Button } from '../shared/Button';
import toast from 'react-hot-toast';
import { SurveillantRemplacementModal } from './SurveillantRemplacementModal';
import { ExamenAuditoire, SurveillantRemplacement } from '../../types';

interface Surveillant {
  id: string;
  nom: string;
  prenom: string;
}

interface Props {
  examenId: string;
}

export default function ExamenAuditoiresManager({ examenId }: Props) {
  const queryClient = useQueryClient();
  const [editingAuditoire, setEditingAuditoire] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<{ [key: string]: string }>({});
  const [remplacementModal, setRemplacementModal] = useState<{
    auditoireId: string;
    ancienSurveillant: Surveillant;
  } | null>(null);
  const [newAuditoire, setNewAuditoire] = useState({
    auditoire: '',
    nb_surveillants_requis: 1,
    surveillants: [] as string[],
    remarques: '',
  });

  // Fetch surveillants
  const { data: surveillants } = useQuery({
    queryKey: ['surveillants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surveillants')
        .select('id, nom, prenom')
        .order('nom');
      if (error) throw error;
      return data as Surveillant[];
    },
  });

  // Fetch auditoires for this examen
  const { data: auditoires, isLoading } = useQuery({
    queryKey: ['examen-auditoires', examenId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('examen_auditoires')
        .select('*')
        .eq('examen_id', examenId)
        .order('auditoire');
      if (error) throw error;
      return data as ExamenAuditoire[];
    },
  });

  // Séparer l'auditoire spécial "répartition par le secrétariat" des autres
  const auditoiresNormaux = auditoires?.filter(a => 
    !a.auditoire.toLowerCase().includes('répartition') && 
    !a.auditoire.toLowerCase().includes('secrétariat')
  ) || [];
  const auditoireSecretariat = auditoires?.find(a => 
    a.auditoire.toLowerCase().includes('répartition') || 
    a.auditoire.toLowerCase().includes('secrétariat')
  );

  // Si l'auditoire secrétariat a des surveillants assignés, on privilégie ce mode
  const hasSecretariatSurveillants = auditoireSecretariat && 
    auditoireSecretariat.surveillants && 
    auditoireSecretariat.surveillants.length > 0;

  // Create auditoire
  const createMutation = useMutation({
    mutationFn: async (data: typeof newAuditoire) => {
      const { error } = await supabase
        .from('examen_auditoires')
        .insert({
          examen_id: examenId,
          ...data,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examen-auditoires', examenId] });
      toast.success('Auditoire ajouté');
      setNewAuditoire({ auditoire: '', nb_surveillants_requis: 1, surveillants: [], remarques: '' });
    },
    onError: () => toast.error('Erreur lors de l\'ajout'),
  });

  // Update auditoire
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ExamenAuditoire> }) => {
      const { error } = await supabase
        .from('examen_auditoires')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examen-auditoires', examenId] });
      toast.success('Auditoire modifié');
      setEditingAuditoire(null);
    },
    onError: () => toast.error('Erreur lors de la modification'),
  });

  // Delete auditoire
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('examen_auditoires')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examen-auditoires', examenId] });
      toast.success('Auditoire supprimé');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const handleAddAuditoire = () => {
    if (!newAuditoire.auditoire.trim()) {
      toast.error('Veuillez saisir un nom d\'auditoire');
      return;
    }
    createMutation.mutate(newAuditoire);
  };

  const handleAddAuditoireSecretariat = () => {
    // Créer l'auditoire spécial pour la répartition par le secrétariat
    if (auditoireSecretariat) {
      toast.success('L\'auditoire "Répartition par le secrétariat" existe déjà');
      return;
    }
    
    createMutation.mutate({
      auditoire: 'Répartition à faire par le responsable ou le secrétariat',
      nb_surveillants_requis: 1,
      surveillants: [],
      remarques: 'Les surveillants seront répartis dans les auditoires par le responsable de l\'examen ou le secrétariat',
    });
  };

  const handleUpdateSurveillants = (auditoireId: string, surveillantIds: string[]) => {
    updateMutation.mutate({
      id: auditoireId,
      data: { surveillants: surveillantIds },
    });
  };

  const toggleSurveillant = (auditoireId: string, currentSurveillants: string[], surveillantId: string) => {
    const newSurveillants = currentSurveillants.includes(surveillantId)
      ? currentSurveillants.filter(id => id !== surveillantId)
      : [...currentSurveillants, surveillantId];
    handleUpdateSurveillants(auditoireId, newSurveillants);
  };

  const handleRemplacer = (auditoireId: string, ancienId: string) => {
    const surveillant = surveillants?.find(s => s.id === ancienId);
    if (!surveillant) return;
    setRemplacementModal({ auditoireId, ancienSurveillant: surveillant });
  };

  const handleConfirmRemplacement = async (nouveauId: string, raison: string) => {
    if (!remplacementModal) return;

    const auditoire = auditoires?.find(a => a.id === remplacementModal.auditoireId);
    if (!auditoire) return;

    // Retirer l'ancien et ajouter le nouveau
    const newSurveillants = auditoire.surveillants
      .filter(id => id !== remplacementModal.ancienSurveillant.id)
      .concat(nouveauId);

    // Ajouter à l'historique des remplacements
    const remplacement: SurveillantRemplacement = {
      ancien_id: remplacementModal.ancienSurveillant.id,
      nouveau_id: nouveauId,
      date: new Date().toISOString(),
      raison: raison || undefined,
    };

    const surveillantsRemplaces = [
      ...(auditoire.surveillants_remplaces || []),
      remplacement,
    ];

    updateMutation.mutate({
      id: remplacementModal.auditoireId,
      data: {
        surveillants: newSurveillants,
        surveillants_remplaces: surveillantsRemplaces as any,
      },
    });

    setRemplacementModal(null);
  };

  if (isLoading) return <div className="text-sm text-gray-500">Chargement...</div>;

  return (
    <div className="space-y-4">
      {/* Auditoire spécial pour répartition par le secrétariat */}
      {auditoireSecretariat && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border-2 border-amber-300 dark:border-amber-700">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-medium text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <Users className="h-5 w-5" />
                {auditoireSecretariat.auditoire}
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                {auditoireSecretariat.remarques || 'Les surveillants seront répartis dans les auditoires par le responsable de l\'examen ou le secrétariat'}
              </p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Supprimer cette section ? Tous les surveillants sélectionnés seront retirés.')) {
                  deleteMutation.mutate(auditoireSecretariat.id);
                }
              }}
              className="text-red-600 hover:text-red-700 dark:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Surveillants assignés */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-amber-800 dark:text-amber-200">
              Surveillants sélectionnés ({auditoireSecretariat.surveillants?.length || 0})
            </label>

            {auditoireSecretariat.surveillants && auditoireSecretariat.surveillants.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded border border-amber-200 dark:border-amber-600 p-2 space-y-1">
                {auditoireSecretariat.surveillants.map((survId) => {
                  const surv = surveillants?.find(s => s.id === survId);
                  if (!surv) return null;
                  return (
                    <div key={survId} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        ✓ {surv.prenom} {surv.nom}
                      </span>
                      <button
                        onClick={() => handleRemplacer(auditoireSecretariat.id, survId)}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1"
                        title="Remplacer ce surveillant"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Remplacer
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Barre de recherche pour ajouter */}
            <div className="mt-3">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-2">
                Ajouter un surveillant
              </p>
              <input
                type="text"
                placeholder="Rechercher un surveillant..."
                value={searchTerm[auditoireSecretariat.id] || ''}
                onChange={(e) => setSearchTerm({ ...searchTerm, [auditoireSecretariat.id]: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-amber-300 dark:border-amber-600 rounded focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
              />
              
              <div className="max-h-40 overflow-y-auto space-y-1 mt-2">
                {surveillants
                  ?.filter((surveillant) => {
                    const search = (searchTerm[auditoireSecretariat.id] || '').toLowerCase();
                    if (!search) return true;
                    const fullName = `${surveillant.prenom} ${surveillant.nom}`.toLowerCase();
                    return fullName.includes(search);
                  })
                  .sort((a, b) => {
                    const aSelected = auditoireSecretariat.surveillants?.includes(a.id);
                    const bSelected = auditoireSecretariat.surveillants?.includes(b.id);
                    if (aSelected && !bSelected) return -1;
                    if (!aSelected && bSelected) return 1;
                    return `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`);
                  })
                  .map((surveillant) => {
                    const isSelected = auditoireSecretariat.surveillants?.includes(surveillant.id);
                    return (
                      <label
                        key={surveillant.id}
                        className={`flex items-center gap-2 p-2 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded cursor-pointer ${
                          isSelected ? 'bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-600' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSurveillant(auditoireSecretariat.id, auditoireSecretariat.surveillants || [], surveillant.id)}
                          className="rounded"
                        />
                        <span className={`text-sm ${isSelected ? 'font-medium text-amber-800 dark:text-amber-200' : 'text-gray-700 dark:text-gray-300'}`}>
                          {surveillant.prenom} {surveillant.nom}
                        </span>
                      </label>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auditoires normaux - seulement si pas de surveillants dans le mode secrétariat */}
      {!hasSecretariatSurveillants && auditoiresNormaux.length > 0 && (
        <div className="space-y-3">
          {auditoiresNormaux.map((auditoire) => (
            <div
              key={auditoire.id}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {auditoire.auditoire}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {auditoire.nb_surveillants_requis} surveillant{auditoire.nb_surveillants_requis > 1 ? 's' : ''} requis
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Supprimer cet auditoire ?')) {
                      deleteMutation.mutate(auditoire.id);
                    }
                  }}
                  className="text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Surveillants assignés */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Surveillants assignés ({auditoire.surveillants?.length || 0})
                </label>

                {auditoire.surveillants && auditoire.surveillants.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 p-2 space-y-1">
                    {auditoire.surveillants.map((survId) => {
                      const surv = surveillants?.find(s => s.id === survId);
                      if (!surv) return null;
                      return (
                        <div key={survId} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          <span className="text-sm font-medium text-green-700 dark:text-green-300">
                            ✓ {surv.prenom} {surv.nom}
                          </span>
                          <button
                            onClick={() => handleRemplacer(auditoire.id, survId)}
                            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1"
                            title="Remplacer ce surveillant"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Remplacer
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Barre de recherche pour ajouter */}
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Ajouter un surveillant
                  </p>
                  <input
                    type="text"
                    placeholder="Rechercher un surveillant..."
                    value={searchTerm[auditoire.id] || ''}
                    onChange={(e) => setSearchTerm({ ...searchTerm, [auditoire.id]: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  
                  <div className="max-h-40 overflow-y-auto space-y-1 mt-2">
                    {surveillants
                      ?.filter((surveillant) => {
                        const search = (searchTerm[auditoire.id] || '').toLowerCase();
                        if (!search) return true;
                        const fullName = `${surveillant.prenom} ${surveillant.nom}`.toLowerCase();
                        return fullName.includes(search);
                      })
                      .sort((a, b) => {
                        const aSelected = auditoire.surveillants?.includes(a.id);
                        const bSelected = auditoire.surveillants?.includes(b.id);
                        if (aSelected && !bSelected) return -1;
                        if (!aSelected && bSelected) return 1;
                        return `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`);
                      })
                      .map((surveillant) => {
                        const isSelected = auditoire.surveillants?.includes(surveillant.id);
                        return (
                          <label
                            key={surveillant.id}
                            className={`flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer ${
                              isSelected ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSurveillant(auditoire.id, auditoire.surveillants || [], surveillant.id)}
                              className="rounded"
                            />
                            <span className={`text-sm ${isSelected ? 'font-medium text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                              {surveillant.prenom} {surveillant.nom}
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulaires d'ajout - seulement si pas en mode secrétariat avec surveillants */}
      {!hasSecretariatSurveillants && (
        <div className="space-y-4">
          {/* Ajouter un auditoire normal */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un auditoire
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom de l'auditoire *
              </label>
              <input
                type="text"
                value={newAuditoire.auditoire}
                onChange={(e) => setNewAuditoire({ ...newAuditoire, auditoire: e.target.value })}
                placeholder="Ex: Auditoire A, Salle 101..."
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre de surveillants requis
              </label>
              <input
                type="number"
                min="1"
                value={newAuditoire.nb_surveillants_requis}
                onChange={(e) => setNewAuditoire({ ...newAuditoire, nb_surveillants_requis: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <Button
              onClick={handleAddAuditoire}
              size="sm"
              disabled={createMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-1" />
              Ajouter l'auditoire
            </Button>
          </div>
        </div>

        {/* Ajouter l'auditoire spécial pour répartition par le secrétariat */}
        {!auditoireSecretariat && (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
            <h4 className="font-medium text-amber-900 dark:text-amber-200 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Répartition par le secrétariat
            </h4>
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
              Créer une section pour sélectionner des surveillants dont la répartition dans les auditoires sera faite par le responsable de l'examen ou le secrétariat.
            </p>
            <Button
              onClick={handleAddAuditoireSecretariat}
              size="sm"
              disabled={createMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="h-4 w-4 mr-1" />
              Créer cette section
            </Button>
          </div>
        )}
        </div>
      )}

      {/* Message informatif en mode secrétariat */}
      {hasSecretariatSurveillants && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Mode répartition par le secrétariat activé
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Des surveillants sont sélectionnés pour une répartition par le secrétariat. 
            Les auditoires spécifiques sont masqués pour éviter la confusion.
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            Pour revenir au mode auditoires spécifiques, supprimez d'abord tous les surveillants de la section ci-dessus.
          </p>
        </div>
      )}

      {/* Modal de remplacement */}
      {remplacementModal && (
        <SurveillantRemplacementModal
          ancienSurveillant={remplacementModal.ancienSurveillant}
          surveillantsDisponibles={surveillants?.filter(s => s.id !== remplacementModal.ancienSurveillant.id) || []}
          onConfirm={handleConfirmRemplacement}
          onCancel={() => setRemplacementModal(null)}
        />
      )}
    </div>
  );
}