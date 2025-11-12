import React, { useState, useEffect } from 'react';
import { Cours } from '../../types';
import { useCoursMutation } from '../../src/hooks/useCours';

interface CourseInstructionsFormProps {
  cours: Cours;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CourseInstructionsForm({ cours, onClose, onSuccess }: CourseInstructionsFormProps) {
  const [consignes, setConsignes] = useState(cours.consignes || '');
  const [intituleComplet, setIntituleComplet] = useState(cours.intitule_complet);
  const mutation = useCoursMutation();

  useEffect(() => {
    setConsignes(cours.consignes || '');
    setIntituleComplet(cours.intitule_complet);
  }, [cours]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await mutation.update.mutateAsync({
        id: cours.id,
        updates: {
          intitule_complet: intituleComplet,
          consignes: consignes.trim() || null
        }
      });

      alert('Consignes enregistrées avec succès');
      onSuccess?.();
      onClose();
    } catch (error) {
      alert(`Erreur lors de l'enregistrement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer les consignes de ce cours ?')) {
      return;
    }

    try {
      await mutation.deleteConsignes.mutateAsync(cours.id);
      alert('Consignes supprimées avec succès');
      onSuccess?.();
      onClose();
    } catch (error) {
      alert(`Erreur lors de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const charCount = consignes.length;
  const maxChars = 10000;
  const isNearLimit = charCount > maxChars * 0.9;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                    Modifier les consignes
                  </h3>
                  
                  <div className="mb-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm font-semibold text-gray-700">Code: {cours.code}</p>
                  </div>

                  <div className="space-y-4">
                    {/* Intitulé complet */}
                    <div>
                      <label htmlFor="intitule" className="block text-sm font-medium text-gray-700 mb-1">
                        Intitulé complet
                      </label>
                      <input
                        type="text"
                        id="intitule"
                        value={intituleComplet}
                        onChange={(e) => setIntituleComplet(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required
                        maxLength={500}
                      />
                    </div>

                    {/* Consignes */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="consignes" className="block text-sm font-medium text-gray-700">
                          Consignes d'examen
                        </label>
                        <span className={`text-xs ${isNearLimit ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                          {charCount} / {maxChars} caractères
                        </span>
                      </div>
                      <textarea
                        id="consignes"
                        rows={12}
                        value={consignes}
                        onChange={(e) => setConsignes(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
                        placeholder="Saisissez les consignes spécifiques pour cet examen..."
                        maxLength={maxChars}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Laissez vide pour afficher le message par défaut aux surveillants
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
              <button
                type="submit"
                disabled={mutation.update.isPending}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mutation.update.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              
              {cours.consignes && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={mutation.deleteConsignes.isPending}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-red-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {mutation.deleteConsignes.isPending ? 'Suppression...' : 'Supprimer les consignes'}
                </button>
              )}
              
              <button
                type="button"
                onClick={onClose}
                disabled={mutation.update.isPending || mutation.deleteConsignes.isPending}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
