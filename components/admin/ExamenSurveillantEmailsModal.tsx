import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { X, Mail, Copy, Check, Users } from 'lucide-react';
import { Button } from '../shared/Button';
import toast from 'react-hot-toast';

interface Props {
  examenId: string;
  examenNom: string;
  onClose: () => void;
}

interface SurveillantWithEmail {
  id: string;
  nom: string;
  prenom: string;
  email: string;
}

interface ExamenAuditoire {
  id: string;
  auditoire: string;
  surveillants: string[];
  surveillants_remplaces?: Array<{
    ancien_id: string;
    nouveau_id: string;
    date: string;
    raison?: string;
  }>;
}

export default function ExamenSurveillantEmailsModal({ examenId, examenNom, onClose }: Props) {
  const [copiedEmails, setCopiedEmails] = useState(false);
  const [copiedNames, setCopiedNames] = useState(false);

  // Récupérer les auditoires de l'examen
  const { data: auditoires } = useQuery({
    queryKey: ['examen-auditoires', examenId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('examen_auditoires')
        .select('*')
        .eq('examen_id', examenId);
      if (error) throw error;
      return data as ExamenAuditoire[];
    },
  });

  // Récupérer tous les surveillants avec leurs emails
  const { data: surveillants } = useQuery({
    queryKey: ['surveillants-with-emails'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surveillants')
        .select('id, nom, prenom, email')
        .eq('is_active', true)
        .order('nom');
      if (error) throw error;
      return data as SurveillantWithEmail[];
    },
  });

  // Calculer les surveillants actifs (non remplacés)
  const surveillantsActifs = React.useMemo(() => {
    if (!auditoires || !surveillants) return [];

    const surveillantsActifsIds = new Set<string>();

    auditoires.forEach(auditoire => {
      if (!auditoire.surveillants) return;

      // Récupérer les IDs des surveillants remplacés
      const remplacesIds = new Set(
        auditoire.surveillants_remplaces?.map(r => r.ancien_id) || []
      );

      // Ajouter les surveillants qui ne sont pas remplacés
      auditoire.surveillants.forEach(surveillantId => {
        if (!remplacesIds.has(surveillantId)) {
          surveillantsActifsIds.add(surveillantId);
        }
      });

      // Ajouter les nouveaux surveillants (remplaçants)
      auditoire.surveillants_remplaces?.forEach(remplacement => {
        surveillantsActifsIds.add(remplacement.nouveau_id);
      });
    });

    return surveillants.filter(s => surveillantsActifsIds.has(s.id));
  }, [auditoires, surveillants]);

  // Générer la liste des emails
  const emails = surveillantsActifs.map(s => s.email).sort();
  const emailsString = emails.join('; ');

  // Générer la liste des noms et prénoms (un par ligne)
  const names = surveillantsActifs.map(s => `${s.prenom} ${s.nom}`).sort();
  const namesString = names.join('\n');

  const handleCopyEmails = async () => {
    try {
      await navigator.clipboard.writeText(emailsString);
      setCopiedEmails(true);
      toast.success('Emails copiés dans le presse-papiers');
      setTimeout(() => setCopiedEmails(false), 2000);
    } catch (error) {
      toast.error('Erreur lors de la copie');
    }
  };

  const handleCopyNames = async () => {
    try {
      await navigator.clipboard.writeText(namesString);
      setCopiedNames(true);
      toast.success('Noms et prénoms copiés dans le presse-papiers');
      setTimeout(() => setCopiedNames(false), 2000);
    } catch (error) {
      toast.error('Erreur lors de la copie');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Emails des surveillants
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {examenNom}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Statistiques */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-900 dark:text-blue-200">
                Surveillants actifs pour cet examen
              </span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {surveillantsActifs.length} surveillant{surveillantsActifs.length > 1 ? 's' : ''} assigné{surveillantsActifs.length > 1 ? 's' : ''} 
              (hors remplacements)
            </p>
          </div>

          {/* Liste des surveillants */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Liste des surveillants :
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-40 overflow-y-auto">
              {surveillantsActifs.length > 0 ? (
                <div className="space-y-2">
                  {surveillantsActifs.map(surveillant => (
                    <div key={surveillant.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-900 dark:text-white">
                        {surveillant.prenom} {surveillant.nom}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 font-mono">
                        {surveillant.email}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Aucun surveillant assigné à cet examen
                </p>
              )}
            </div>
          </div>

          {/* Zone de copie des noms et prénoms */}
          {names.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Noms et prénoms à copier :
                </h3>
                <Button
                  onClick={handleCopyNames}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {copiedNames ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copier tous les noms
                    </>
                  )}
                </Button>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
                <textarea
                  value={namesString}
                  readOnly
                  className="w-full h-20 text-sm font-mono bg-transparent border-none resize-none focus:outline-none text-gray-900 dark:text-white"
                  placeholder="Aucun nom à afficher"
                />
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Format : un nom par ligne, prêt à coller dans vos documents
              </p>
            </div>
          )}

          {/* Zone de copie des emails */}
          {emails.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Emails à copier :
                </h3>
                <Button
                  onClick={handleCopyEmails}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {copiedEmails ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copier tous les emails
                    </>
                  )}
                </Button>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
                <textarea
                  value={emailsString}
                  readOnly
                  className="w-full h-24 text-sm font-mono bg-transparent border-none resize-none focus:outline-none text-gray-900 dark:text-white"
                  placeholder="Aucun email à afficher"
                />
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Format : emails séparés par des points-virgules, prêts à coller dans votre client email
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
            <h4 className="font-medium text-amber-900 dark:text-amber-200 mb-2">
              💡 Comment utiliser ces informations :
            </h4>
            <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
              <li>• <strong>Emails :</strong> Cliquez sur "Copier tous les emails" et collez dans votre client email</li>
              <li>• <strong>Noms :</strong> Cliquez sur "Copier tous les noms" pour les listes (un nom par ligne)</li>
              <li>• Utilisez le champ "À" ou "Cci" pour un envoi groupé d'emails</li>
              <li>• Les noms sont parfaits pour créer des feuilles de présence ou des listes Word/Excel</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}