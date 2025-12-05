import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { Button } from '../shared/Button';

interface Surveillant {
  id: string;
  nom: string;
  prenom: string;
}

interface Props {
  ancienSurveillant: Surveillant;
  surveillantsDisponibles: Surveillant[];
  onConfirm: (nouveauId: string, raison: string) => void;
  onCancel: () => void;
}

export function SurveillantRemplacementModal({
  ancienSurveillant,
  surveillantsDisponibles,
  onConfirm,
  onCancel,
}: Props) {
  const [nouveauId, setNouveauId] = useState('');
  const [raison, setRaison] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = () => {
    if (!nouveauId) return;
    onConfirm(nouveauId, raison);
  };

  const filteredSurveillants = surveillantsDisponibles.filter((s) => {
    const search = searchTerm.toLowerCase();
    const fullName = `${s.prenom} ${s.nom}`.toLowerCase();
    return fullName.includes(search);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Remplacer un surveillant
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Ancien surveillant */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm font-medium text-red-900 dark:text-red-200 mb-2">
              Surveillant à remplacer
            </p>
            <p className="text-lg font-semibold text-red-700 dark:text-red-300">
              {ancienSurveillant.prenom} {ancienSurveillant.nom}
            </p>
          </div>

          {/* Flèche */}
          <div className="flex justify-center">
            <ArrowRight className="h-8 w-8 text-gray-400" />
          </div>

          {/* Nouveau surveillant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nouveau surveillant *
            </label>
            
            {/* Recherche */}
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 mb-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />

            {/* Liste des surveillants */}
            <div className="max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg">
              {filteredSurveillants.length === 0 ? (
                <p className="p-4 text-sm text-gray-500 text-center">
                  Aucun surveillant trouvé
                </p>
              ) : (
                filteredSurveillants.map((surveillant) => (
                  <label
                    key={surveillant.id}
                    className={`flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                      nouveauId === surveillant.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="nouveau-surveillant"
                      value={surveillant.id}
                      checked={nouveauId === surveillant.id}
                      onChange={(e) => setNouveauId(e.target.value)}
                      className="rounded-full"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {surveillant.prenom} {surveillant.nom}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Raison */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Raison du remplacement (optionnel)
            </label>
            <textarea
              value={raison}
              onChange={(e) => setRaison(e.target.value)}
              placeholder="Ex: Indisponibilité, maladie, changement de planning..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!nouveauId}>
            Confirmer le remplacement
          </Button>
        </div>
      </div>
    </div>
  );
}
