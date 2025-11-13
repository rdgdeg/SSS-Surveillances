/**
 * Offline Queue Indicator
 * 
 * Affiche le nombre de soumissions en attente dans la file d'attente hors-ligne
 * et permet de les traiter manuellement.
 */

import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card';
import { CloudOff, RefreshCw, Download, Trash2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import offlineQueueManager from '../../lib/offlineQueueManager';
import { PendingSubmission, SubmissionPayload } from '../../types';
import toast from 'react-hot-toast';

interface OfflineQueueIndicatorProps {
  onProcess?: (payload: SubmissionPayload) => Promise<{ success: boolean; error?: string }>;
  className?: string;
}

export const OfflineQueueIndicator: React.FC<OfflineQueueIndicatorProps> = ({ 
  onProcess,
  className = '' 
}) => {
  const [queueCount, setQueueCount] = useState(0);
  const [submissions, setSubmissions] = useState<PendingSubmission[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  // Charger le nombre d'éléments dans la file
  const loadQueueCount = async () => {
    try {
      const available = offlineQueueManager.isAvailable();
      setIsAvailable(available);
      
      if (!available) {
        return;
      }

      const count = await offlineQueueManager.getCount();
      setQueueCount(count);

      if (showDetails) {
        const items = await offlineQueueManager.getAll();
        setSubmissions(items);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la file:', error);
    }
  };

  // Charger au montage et périodiquement
  useEffect(() => {
    loadQueueCount();
    
    // Rafraîchir toutes les 10 secondes
    const interval = setInterval(loadQueueCount, 10000);
    
    return () => clearInterval(interval);
  }, [showDetails]);

  // Traiter la file d'attente
  const handleProcess = async () => {
    if (!onProcess) {
      toast.error('Fonction de traitement non fournie');
      return;
    }

    setIsProcessing(true);
    
    try {
      const result = await offlineQueueManager.processQueue(onProcess);
      
      if (result.succeeded > 0) {
        toast.success(`${result.succeeded} soumission(s) traitée(s) avec succès !`);
      }
      
      if (result.failed > 0) {
        toast.error(`${result.failed} soumission(s) ont échoué`);
      }
      
      // Recharger la file
      await loadQueueCount();
    } catch (error) {
      console.error('Erreur lors du traitement de la file:', error);
      toast.error('Erreur lors du traitement de la file d\'attente');
    } finally {
      setIsProcessing(false);
    }
  };

  // Télécharger une copie locale d'une soumission
  const handleDownload = (submission: PendingSubmission) => {
    try {
      const dataStr = JSON.stringify(submission, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `soumission-${submission.id}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Copie locale téléchargée');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  // Supprimer une soumission de la file
  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette soumission de la file ?')) {
      return;
    }

    try {
      await offlineQueueManager.dequeue(id);
      toast.success('Soumission supprimée de la file');
      await loadQueueCount();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // Formater la date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Ne rien afficher si IndexedDB n'est pas disponible ou si la file est vide
  if (!isAvailable || queueCount === 0) {
    return null;
  }

  return (
    <div className={className}>
      {/* Indicateur compact */}
      <div 
        className="bg-orange-50 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg p-4 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CloudOff className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-orange-800 dark:text-orange-300">
                {queueCount} soumission{queueCount > 1 ? 's' : ''} en attente
              </h4>
              <p className="text-sm text-orange-700 dark:text-orange-400">
                Ces soumissions seront envoyées automatiquement lorsque la connexion sera rétablie
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onProcess && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleProcess();
                }}
                disabled={isProcessing}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Réessayer maintenant
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Détails des soumissions */}
      {showDetails && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudOff className="h-5 w-5" />
              Soumissions en attente
            </CardTitle>
            <CardDescription>
              Liste des soumissions qui seront envoyées automatiquement lors du retour en ligne
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="border dark:border-gray-700 rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {submission.data.email}
                        </span>
                        {submission.attempts > 0 && (
                          <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                            {submission.attempts} tentative{submission.attempts > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Créé le {formatDate(submission.timestamp)}</span>
                        </div>
                        
                        {submission.lastAttempt && (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            <span>Dernière tentative : {formatDate(submission.lastAttempt)}</span>
                          </div>
                        )}
                        
                        {submission.error && (
                          <div className="flex items-start gap-2 text-red-600 dark:text-red-400">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span className="text-xs">{submission.error}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>{submission.data.availabilities.length} créneau(x) sélectionné(s)</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(submission)}
                        title="Télécharger une copie locale"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(submission.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Supprimer de la file"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OfflineQueueIndicator;
