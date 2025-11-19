import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Trash2, Users, Save, X } from 'lucide-react';
import { Button } from '../shared/Button';
import toast from 'react-hot-toast';

interface Surveillant {
  id: string;
  nom: string;
  prenom: string;
}

interface ExamenAuditoire {
  id: string;
  examen_id: string;
  auditoire: string;
  nb_surveillants_requis: number;
  surveillants: string[];
  remarques: string | null;
}

interface Props {
  examenId: string;
}

export default function ExamenAuditoiresManager({ examenId }: Props) {
  const queryClient = useQueryClient();
  const [editingAuditoire, setEditingAuditoire] = useState<string | null>(null);
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

  if (isLoading) return <div className="text-sm text-gray-500">Chargement...</div>;

  return (
    <div className="space-y-4">
      {/* Liste des auditoires existants */}
      {auditoires && auditoires.length > 0 && (
        <div className="space-y-3">
          {auditoires.map((auditoire) => (
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

              {/* Sélection des surveillants */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Surveillants assignés ({auditoire.surveillants?.length || 0})
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {surveillants?.map((surveillant) => {
                    const isSelected = auditoire.surveillants?.includes(surveillant.id);
                    return (
                      <label
                        key={surveillant.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSurveillant(auditoire.id, auditoire.surveillants || [], surveillant.id)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {surveillant.prenom} {surveillant.nom}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulaire d'ajout */}
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
            Ajouter
          </Button>
        </div>
      </div>
    </div>
  );
}
