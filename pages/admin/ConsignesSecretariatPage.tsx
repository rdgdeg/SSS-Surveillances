import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Info, Save, Edit, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ConsigneSecretariat {
  id: string;
  code_secretariat: string;
  nom_secretariat: string;
  consignes_arrivee: string | null;
  consignes_mise_en_place: string | null;
  consignes_generales: string | null;
  heure_arrivee_suggeree: string | null;
  is_active: boolean;
}

export default function ConsignesSecretariatPage() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ConsigneSecretariat>>({});
  const queryClient = useQueryClient();

  // Fetch consignes
  const { data: consignes, isLoading } = useQuery({
    queryKey: ['consignes-secretariat-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consignes_secretariat')
        .select('*')
        .order('code_secretariat');
      
      if (error) throw error;
      return data as ConsigneSecretariat[];
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (consigne: Partial<ConsigneSecretariat>) => {
      const { error } = await supabase
        .from('consignes_secretariat')
        .update(consigne)
        .eq('id', consigne.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consignes-secretariat-admin'] });
      toast.success('Consignes mises à jour');
      setEditingId(null);
      setFormData({});
    },
    onError: (error) => {
      console.error('Error updating consignes:', error);
      toast.error('Erreur lors de la mise à jour');
    },
  });

  const handleEdit = (consigne: ConsigneSecretariat) => {
    setEditingId(consigne.id);
    setFormData(consigne);
  };

  const handleSave = () => {
    if (!editingId) return;
    updateMutation.mutate({ ...formData, id: editingId });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Consignes par Secrétariat
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Gérez les consignes d'arrivée et de mise en place pour chaque secrétariat
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">À propos des consignes</p>
            <p>
              Ces consignes seront affichées sur le planning public des examens pour les surveillants.
              Elles s'affichent automatiquement en fonction du secrétariat lié à chaque examen.
            </p>
          </div>
        </div>
      </div>

      {/* Consignes List */}
      <div className="grid gap-6">
        {consignes?.map((consigne) => {
          const isEditing = editingId === consigne.id;

          return (
            <Card key={consigne.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-bold">
                        {consigne.code_secretariat}
                      </span>
                      <span>{consigne.nom_secretariat}</span>
                    </CardTitle>
                  </div>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(consigne)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Heure d'arrivée suggérée
                      </label>
                      <Input
                        type="time"
                        value={formData.heure_arrivee_suggeree || ''}
                        onChange={(e) => setFormData({ ...formData, heure_arrivee_suggeree: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Consignes d'arrivée
                      </label>
                      <textarea
                        value={formData.consignes_arrivee || ''}
                        onChange={(e) => setFormData({ ...formData, consignes_arrivee: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Ex: Veuillez vous présenter à l'accueil de la faculté..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Consignes de mise en place
                      </label>
                      <textarea
                        value={formData.consignes_mise_en_place || ''}
                        onChange={(e) => setFormData({ ...formData, consignes_mise_en_place: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Ex: Disposer les tables en rangées espacées..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Consignes générales
                      </label>
                      <textarea
                        value={formData.consignes_generales || ''}
                        onChange={(e) => setFormData({ ...formData, consignes_generales: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Ex: Merci de respecter les consignes de sécurité..."
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Enregistrer
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={updateMutation.isPending}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm">
                    {consigne.heure_arrivee_suggeree && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Heure d'arrivée :
                        </span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">
                          {consigne.heure_arrivee_suggeree}
                        </span>
                      </div>
                    )}
                    {consigne.consignes_arrivee && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300 block mb-1">
                          Consignes d'arrivée :
                        </span>
                        <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                          {consigne.consignes_arrivee}
                        </p>
                      </div>
                    )}
                    {consigne.consignes_mise_en_place && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300 block mb-1">
                          Consignes de mise en place :
                        </span>
                        <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                          {consigne.consignes_mise_en_place}
                        </p>
                      </div>
                    )}
                    {consigne.consignes_generales && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300 block mb-1">
                          Consignes générales :
                        </span>
                        <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                          {consigne.consignes_generales}
                        </p>
                      </div>
                    )}
                    {!consigne.consignes_arrivee && !consigne.consignes_mise_en_place && !consigne.consignes_generales && (
                      <div className="text-gray-500 dark:text-gray-400 italic">
                        Aucune consigne définie
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
