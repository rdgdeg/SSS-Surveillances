import React, { useState } from 'react';
import { X, Save, Info, AlertCircle } from 'lucide-react';
import { Button } from '../shared/Button';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

interface ExamenConsignesModalProps {
  examen: {
    id: string;
    code_examen: string;
    nom_examen: string;
    secretariat: string;
    utiliser_consignes_specifiques?: boolean;
    consignes_specifiques_arrivee?: string;
    consignes_specifiques_mise_en_place?: string;
    consignes_specifiques_generales?: string;
  };
  onClose: () => void;
  onSave: () => void;
}

export default function ExamenConsignesModal({ examen, onClose, onSave }: ExamenConsignesModalProps) {
  const [utiliserConsignesSpecifiques, setUtiliserConsignesSpecifiques] = useState(
    examen.utiliser_consignes_specifiques || false
  );
  const [consignesArrivee, setConsignesArrivee] = useState(
    examen.consignes_specifiques_arrivee || ''
  );
  const [consignesMiseEnPlace, setConsignesMiseEnPlace] = useState(
    examen.consignes_specifiques_mise_en_place || ''
  );
  const [consignesGenerales, setConsignesGenerales] = useState(
    examen.consignes_specifiques_generales || ''
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('examens')
        .update({
          utiliser_consignes_specifiques: utiliserConsignesSpecifiques,
          consignes_specifiques_arrivee: consignesArrivee || null,
          consignes_specifiques_mise_en_place: consignesMiseEnPlace || null,
          consignes_specifiques_generales: consignesGenerales || null,
        })
        .eq('id', examen.id);

      if (error) throw error;

      toast.success('Consignes mises à jour');
      onSave();
      onClose();
    } catch (err) {
      console.error('Error updating consignes:', err);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Info className="h-5 w-5 text-indigo-600" />
                Consignes spécifiques
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {examen.code_examen} - {examen.nom_examen}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">À propos des consignes spécifiques</p>
                <p>
                  Par défaut, cet examen utilise les consignes du secrétariat <strong>{examen.secretariat || 'non défini'}</strong>.
                  Activez les consignes spécifiques si cet examen nécessite des instructions particulières.
                </p>
              </div>
            </div>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Utiliser des consignes spécifiques pour cet examen
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Les consignes ci-dessous remplaceront celles du secrétariat
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={utiliserConsignesSpecifiques}
                onChange={(e) => setUtiliserConsignesSpecifiques(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Consignes Fields */}
          {utiliserConsignesSpecifiques && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Consignes d'arrivée
                </label>
                <textarea
                  value={consignesArrivee}
                  onChange={(e) => setConsignesArrivee(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Veuillez vous présenter à 08h15 à l'accueil du bâtiment AGOR..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Consignes de mise en place
                </label>
                <textarea
                  value={consignesMiseEnPlace}
                  onChange={(e) => setConsignesMiseEnPlace(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Disposer les tables en rangées espacées de 2 mètres..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Consignes générales
                </label>
                <textarea
                  value={consignesGenerales}
                  onChange={(e) => setConsignesGenerales(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Cet examen nécessite une surveillance renforcée..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>Enregistrement...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
