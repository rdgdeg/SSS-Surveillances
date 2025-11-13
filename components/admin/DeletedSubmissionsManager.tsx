import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, AlertTriangle, Calendar, User, Mail } from 'lucide-react';
import { SoumissionDisponibilite } from '../../types';
import { getDeletedSoumissions, restoreSoumission, deleteSoumission } from '../../lib/api';
import { Button } from '../shared/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../shared/Card';
import toast from 'react-hot-toast';

const DeletedSubmissionsManager: React.FC = () => {
  const [deletedSubmissions, setDeletedSubmissions] = useState<SoumissionDisponibilite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadDeletedSubmissions();
  }, []);

  const loadDeletedSubmissions = async () => {
    try {
      setIsLoading(true);
      const data = await getDeletedSoumissions();
      setDeletedSubmissions(data);
    } catch (error) {
      console.error('Erreur lors du chargement des soumissions supprimées:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment restaurer cette soumission ?')) {
      return;
    }

    try {
      setProcessingId(id);
      await restoreSoumission(id);
      toast.success('Soumission restaurée avec succès');
      await loadDeletedSubmissions();
    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
      toast.error('Erreur lors de la restauration');
    } finally {
      setProcessingId(null);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm(
      'ATTENTION : Cette action est irréversible. Voulez-vous vraiment supprimer définitivement cette soumission ?'
    )) {
      return;
    }

    try {
      setProcessingId(id);
      await deleteSoumission(id, true);
      toast.success('Soumission supprimée définitivement');
      await loadDeletedSubmissions();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-6 w-6" />
            Soumissions supprimées
          </CardTitle>
          <CardDescription>
            Gérez les soumissions supprimées. Vous pouvez les restaurer ou les supprimer définitivement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deletedSubmissions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Trash2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune soumission supprimée</p>
            </div>
          ) : (
            <div className="space-y-4">
              {deletedSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">
                          {submission.prenom} {submission.nom}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Mail className="h-4 w-4" />
                        {submission.email}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Soumis le : {formatDate(submission.submitted_at)}</span>
                        </div>
                        {submission.deleted_at && (
                          <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                            <Trash2 className="h-4 w-4" />
                            <span>Supprimé le : {formatDate(submission.deleted_at)}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {submission.historique_disponibilites?.filter((d: any) => d.est_disponible).length || 0} créneaux disponibles
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleRestore(submission.id)}
                        disabled={processingId === submission.id}
                        size="sm"
                        variant="outline"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restaurer
                      </Button>
                      
                      <Button
                        onClick={() => handlePermanentDelete(submission.id)}
                        disabled={processingId === submission.id}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer définitivement
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {deletedSubmissions.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-300">
              <p className="font-semibold mb-1">Attention</p>
              <p>
                Les soumissions supprimées sont conservées pendant 90 jours avant d'être automatiquement 
                supprimées définitivement. La suppression définitive est irréversible.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeletedSubmissionsManager;
