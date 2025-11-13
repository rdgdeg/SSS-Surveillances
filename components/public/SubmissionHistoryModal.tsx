import React from 'react';
import { X, Clock, Edit, Plus } from 'lucide-react';
import { ModificationHistoryEntry } from '../../types';
import { Button } from '../shared/Button';

interface SubmissionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ModificationHistoryEntry[];
  submittedAt: string;
}

const SubmissionHistoryModal: React.FC<SubmissionHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  submittedAt,
}) => {
  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Trier l'historique par date (plus récent en premier)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Historique des modifications
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {sortedHistory.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                Aucun historique de modification disponible
              </p>
            ) : (
              <div className="space-y-4">
                {/* Timeline */}
                <div className="relative">
                  {/* Ligne verticale */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

                  {sortedHistory.map((entry, index) => (
                    <div key={index} className="relative flex gap-4 pb-8 last:pb-0">
                      {/* Icône */}
                      <div
                        className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${
                          entry.type === 'creation'
                            ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                            : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {entry.type === 'creation' ? (
                          <Plus className="h-4 w-4" />
                        ) : (
                          <Edit className="h-4 w-4" />
                        )}
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 pt-0.5">
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">
                              {entry.type === 'creation'
                                ? 'Création de la soumission'
                                : 'Modification'}
                            </h3>
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(entry.date)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {entry.nb_creneaux} créneau{entry.nb_creneaux > 1 ? 'x' : ''}{' '}
                            {entry.type === 'creation' ? 'sélectionné' : 'modifié'}
                            {entry.nb_creneaux > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-gray-700">
            <Button onClick={onClose} variant="outline">
              Fermer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionHistoryModal;
