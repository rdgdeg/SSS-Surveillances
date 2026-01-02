import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { 
  Settings, 
  RotateCcw, 
  Save, 
  Eye, 
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

interface ConsignesData {
  consignes: string;
  heure_arrivee_suggeree: string;
  source_consignes: 'secretariat' | 'specifique';
}

interface ExamenConsignesEditorProps {
  examenId: string;
  secretariat: string;
  codeExamen: string;
  onSave?: () => void;
  className?: string;
}

const ExamenConsignesEditor: React.FC<ExamenConsignesEditorProps> = ({
  examenId,
  secretariat,
  codeExamen,
  onSave,
  className = ''
}) => {
  const [consignes, setConsignes] = useState<ConsignesData | null>(null);
  const [consignesSecretariat, setConsignesSecretariat] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [utiliserSpecifiques, setUtiliserSpecifiques] = useState(false);
  
  const [formData, setFormData] = useState({
    consignes: ''
  });

  useEffect(() => {
    loadConsignes();
  }, [examenId]);

  const loadConsignes = async () => {
    try {
      setLoading(true);
      
      // Charger l'examen avec ses consignes spécifiques
      const { data: examenData, error: examenError } = await supabase
        .from('examens')
        .select(`
          id,
          utiliser_consignes_specifiques,
          consignes_specifiques_arrivee,
          consignes_specifiques_mise_en_place,
          consignes_specifiques_generales
        `)
        .eq('id', examenId)
        .single();

      if (examenError) throw examenError;

      // Charger les consignes du secrétariat
      const { data: secretariatData, error: secretariatError } = await supabase
        .from('consignes_secretariat')
        .select('*')
        .eq('code_secretariat', secretariat)
        .single();

      if (secretariatError && secretariatError.code !== 'PGRST116') {
        throw secretariatError;
      }

      setConsignesSecretariat(secretariatData);

      // Calculer les consignes effectives
      const utiliseSpecifiques = examenData?.utiliser_consignes_specifiques || false;
      setUtiliserSpecifiques(utiliseSpecifiques);

      // Construire les consignes spécifiques unifiées si elles existent
      let consignesSpecifiquesUnifiees = '';
      if (utiliseSpecifiques) {
        const parts = [];
        if (examenData?.consignes_specifiques_arrivee?.trim()) {
          parts.push(examenData.consignes_specifiques_arrivee.trim());
        }
        if (examenData?.consignes_specifiques_mise_en_place?.trim()) {
          parts.push(examenData.consignes_specifiques_mise_en_place.trim());
        }
        if (examenData?.consignes_specifiques_generales?.trim()) {
          parts.push(examenData.consignes_specifiques_generales.trim());
        }
        consignesSpecifiquesUnifiees = parts.join('\n\n');
      }

      const consignesEffectives = {
        consignes: utiliseSpecifiques && consignesSpecifiquesUnifiees
          ? consignesSpecifiquesUnifiees
          : secretariatData?.consignes || '',
        heure_arrivee_suggeree: secretariatData?.heure_arrivee_suggeree || '',
        source_consignes: utiliseSpecifiques ? 'specifique' : 'secretariat'
      };

      setConsignes(consignesEffectives);
      
      setFormData({
        consignes: consignesEffectives.consignes
      });

    } catch (error) {
      console.error('Error loading consignes:', error);
      toast.error('Erreur lors du chargement des consignes');
    } finally {
      setLoading(false);
    }
  };

  const handleInitialiserSpecifiques = async () => {
    try {
      setSaving(true);
      
      // Initialiser les consignes spécifiques avec celles du secrétariat (format unifié)
      const consignesUnifiees = consignesSecretariat?.consignes || '';
      
      // Diviser les consignes unifiées en parties pour maintenir la compatibilité
      const parts = consignesUnifiees.split('\n\n');
      const consignes_arrivee = parts[0] || '';
      const consignes_mise_en_place = parts[1] || '';
      const consignes_generales = parts[2] || '';

      const { error } = await supabase
        .from('examens')
        .update({
          consignes_specifiques_arrivee: consignes_arrivee,
          consignes_specifiques_mise_en_place: consignes_mise_en_place,
          consignes_specifiques_generales: consignes_generales,
          utiliser_consignes_specifiques: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', examenId);

      if (error) throw error;

      toast.success('Consignes spécifiques initialisées');
      await loadConsignes();
      setEditing(true);
      onSave?.();
    } catch (error) {
      console.error('Error initializing specific consignes:', error);
      toast.error('Erreur lors de l\'initialisation');
    } finally {
      setSaving(false);
    }
  };

  const handleUtiliserSecretariat = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('examens')
        .update({
          utiliser_consignes_specifiques: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', examenId);

      if (error) throw error;

      toast.success('Consignes du secrétariat restaurées');
      await loadConsignes();
      setEditing(false);
      onSave?.();
    } catch (error) {
      console.error('Error using secretariat consignes:', error);
      toast.error('Erreur lors de la restauration');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSpecifiques = async () => {
    try {
      setSaving(true);
      
      // Diviser les consignes unifiées en parties pour maintenir la compatibilité
      const parts = formData.consignes.split('\n\n');
      const consignes_arrivee = parts[0] || '';
      const consignes_mise_en_place = parts[1] || '';
      const consignes_generales = parts[2] || '';
      
      const { error } = await supabase
        .from('examens')
        .update({
          consignes_specifiques_arrivee: consignes_arrivee,
          consignes_specifiques_mise_en_place: consignes_mise_en_place,
          consignes_specifiques_generales: consignes_generales,
          utiliser_consignes_specifiques: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', examenId);

      if (error) throw error;

      toast.success('Consignes spécifiques sauvegardées');
      await loadConsignes();
      setEditing(false);
      onSave?.();
    } catch (error) {
      console.error('Error saving specific consignes:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Consignes de surveillance - {codeExamen}
          </CardTitle>
          <div className="flex items-center gap-2">
            {utiliserSpecifiques ? (
              <span className="flex items-center gap-1 text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded">
                <AlertTriangle className="h-4 w-4" />
                Consignes personnalisées
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                <CheckCircle className="h-4 w-4" />
                Consignes du secrétariat
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Informations sur le secrétariat */}
        {consignesSecretariat && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">
                Secrétariat: {secretariat} - {consignesSecretariat.nom_secretariat}
              </span>
            </div>
            <p className="text-sm text-blue-700">
              Heure d'arrivée suggérée: {consignesSecretariat.heure_arrivee_suggeree}
            </p>
          </div>
        )}

        {/* Consignes actuelles */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Consignes pour les surveillants
              {utiliserSpecifiques && editing && (
                <span className="text-xs text-gray-500 ml-2">(Personnalisées)</span>
              )}
            </label>
            {editing && utiliserSpecifiques ? (
              <textarea
                value={formData.consignes}
                onChange={(e) => setFormData({ ...formData, consignes: e.target.value })}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Exemple:
Veuillez vous présenter à 08h15 à l'accueil de la faculté.

Vérifiez la présence du matériel nécessaire et l'accès aux salles.

Respectez les protocoles spécifiques à cette faculté et les consignes de sécurité."
              />
            ) : (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {consignes?.consignes || 'Aucune consigne définie'}
                </p>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Utilisez des sauts de ligne pour séparer les différentes consignes (arrivée, mise en place, consignes générales).
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            {!utiliserSpecifiques ? (
              <Button
                onClick={handleInitialiserSpecifiques}
                disabled={saving}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Settings className="h-4 w-4" />
                )}
                Personnaliser les consignes
              </Button>
            ) : (
              <>
                {editing ? (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleSaveSpecifiques}
                      disabled={saving}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                      {saving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Sauvegarder
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          consignes: consignes?.consignes || ''
                        });
                      }}
                      disabled={saving}
                    >
                      Annuler
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Modifier les consignes
                  </Button>
                )}
              </>
            )}
          </div>

          {utiliserSpecifiques && (
            <Button
              variant="outline"
              onClick={handleUtiliserSecretariat}
              disabled={saving}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              Utiliser consignes du secrétariat
            </Button>
          )}
        </div>

        {/* Aide */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600">
            <strong>💡 Fonctionnement:</strong> Par défaut, les examens utilisent les consignes de leur secrétariat. 
            Vous pouvez personnaliser les consignes pour cet examen spécifique en cliquant sur "Personnaliser les consignes". 
            Les consignes personnalisées seront affichées dans le planning public à la place de celles du secrétariat.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExamenConsignesEditor;