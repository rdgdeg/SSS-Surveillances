import React, { useState, useEffect } from 'react';
import { usePresenceMutation, useExistingPresenceQuery } from '../../src/hooks/useTeacherPresence';
import { Cours, PresenceFormData } from '../../types';
import { 
  User, 
  Mail, 
  CheckCircle, 
  XCircle,
  Users,
  MessageSquare,
  Info,
  Loader2
} from 'lucide-react';

interface TeacherPresenceFormProps {
  cours: Cours;
  sessionId: string;
  defaultEmail?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TeacherPresenceForm({ cours, sessionId, defaultEmail = '', onSuccess, onCancel }: TeacherPresenceFormProps) {
  const [formData, setFormData] = useState<PresenceFormData>({
    enseignant_email: defaultEmail,
    enseignant_nom: '',
    enseignant_prenom: '',
    est_present: true,
    nb_surveillants_accompagnants: 0,
    noms_accompagnants: '',
    remarque: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { submit } = usePresenceMutation();
  const { data: existingPresence } = useExistingPresenceQuery(
    cours.id,
    sessionId,
    formData.enseignant_email || null
  );

  // Load existing presence if found
  useEffect(() => {
    if (existingPresence) {
      setFormData({
        enseignant_email: existingPresence.enseignant_email,
        enseignant_nom: existingPresence.enseignant_nom,
        enseignant_prenom: existingPresence.enseignant_prenom,
        est_present: existingPresence.est_present,
        nb_surveillants_accompagnants: existingPresence.nb_surveillants_accompagnants,
        noms_accompagnants: existingPresence.noms_accompagnants || '',
        remarque: existingPresence.remarque || ''
      });
    }
  }, [existingPresence]);

  // Auto-generate email when prenom and nom are filled
  useEffect(() => {
    if (formData.enseignant_prenom && formData.enseignant_nom && !formData.enseignant_email) {
      const prenom = formData.enseignant_prenom.toLowerCase().trim().replace(/\s+/g, '');
      const nom = formData.enseignant_nom.toLowerCase().trim().replace(/\s+/g, '');
      const suggestedEmail = `${prenom}.${nom}@uclouvain.be`;
      handleChange('enseignant_email', suggestedEmail);
    }
  }, [formData.enseignant_prenom, formData.enseignant_nom]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.enseignant_email.trim()) {
      newErrors.enseignant_email = 'L\'email est obligatoire';
    } else if (!emailRegex.test(formData.enseignant_email)) {
      newErrors.enseignant_email = 'Email invalide';
    }

    // Nom validation
    if (!formData.enseignant_nom.trim()) {
      newErrors.enseignant_nom = 'Le nom est obligatoire';
    }

    // Prénom validation
    if (!formData.enseignant_prenom.trim()) {
      newErrors.enseignant_prenom = 'Le prénom est obligatoire';
    }

    // Nb surveillants validation
    if (formData.nb_surveillants_accompagnants < 0) {
      newErrors.nb_surveillants_accompagnants = 'Le nombre doit être positif ou zéro';
    }

    // Noms accompagnants validation
    if (formData.nb_surveillants_accompagnants > 0 && !formData.noms_accompagnants?.trim()) {
      newErrors.noms_accompagnants = 'Veuillez indiquer les noms des personnes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    try {
      await submit.mutateAsync({
        coursId: cours.id,
        sessionId: sessionId,
        data: {
          ...formData,
          enseignant_email: formData.enseignant_email.toLowerCase().trim(),
          enseignant_nom: formData.enseignant_nom.trim(),
          enseignant_prenom: formData.enseignant_prenom.trim(),
          noms_accompagnants: formData.noms_accompagnants?.trim() || undefined,
          remarque: formData.remarque?.trim() || undefined
        }
      });

      setShowConfirmation(false);
      alert('Votre déclaration de présence a été enregistrée avec succès !');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting presence:', error);
      alert(`Erreur lors de l'enregistrement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setShowConfirmation(false);
    }
  };

  const handleChange = (field: keyof PresenceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
            <CheckCircle className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Déclaration de présence</h3>
        </div>
        
        {/* Cours info */}
        <div className="mt-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-5 w-5 text-blue-600" />
            <h4 className="text-sm font-semibold text-blue-900">Informations du cours</h4>
          </div>
          <dl className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold">{cours.code}</span>
              <dd className="text-gray-800 font-medium">{cours.intitule_complet}</dd>
            </div>
          </dl>
        </div>

        {existingPresence && (
          <div className="mt-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-300 rounded-xl p-4 shadow-sm animate-pulse-slow">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-900 font-medium">
                Vous avez déjà soumis une déclaration pour cet examen. Vous pouvez la modifier ci-dessous.
              </p>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Prénom et Nom */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="group">
            <label htmlFor="prenom" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <User className="h-4 w-4 text-blue-600" />
              Prénom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="prenom"
              value={formData.enseignant_prenom}
              onChange={(e) => handleChange('enseignant_prenom', e.target.value)}
              className={`block w-full rounded-lg shadow-sm sm:text-sm transition-all duration-200 ${
                errors.enseignant_prenom
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 group-hover:border-blue-400'
              }`}
              placeholder="Jean"
              required
              aria-invalid={!!errors.enseignant_prenom}
              aria-describedby={errors.enseignant_prenom ? 'prenom-error' : undefined}
            />
            {errors.enseignant_prenom && (
              <p id="prenom-error" className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <XCircle className="h-4 w-4" />
                {errors.enseignant_prenom}
              </p>
            )}
          </div>

          <div className="group">
            <label htmlFor="nom" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <User className="h-4 w-4 text-blue-600" />
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nom"
              value={formData.enseignant_nom}
              onChange={(e) => handleChange('enseignant_nom', e.target.value)}
              className={`block w-full rounded-lg shadow-sm sm:text-sm transition-all duration-200 ${
                errors.enseignant_nom
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 group-hover:border-blue-400'
              }`}
              placeholder="Dupont"
              required
              aria-invalid={!!errors.enseignant_nom}
              aria-describedby={errors.enseignant_nom ? 'nom-error' : undefined}
            />
            {errors.enseignant_nom && (
              <p id="nom-error" className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <XCircle className="h-4 w-4" />
                {errors.enseignant_nom}
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="group">
          <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <Mail className="h-4 w-4 text-blue-600" />
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={formData.enseignant_email}
            onChange={(e) => handleChange('enseignant_email', e.target.value)}
            className={`block w-full rounded-lg shadow-sm sm:text-sm transition-all duration-200 ${
              errors.enseignant_email
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 group-hover:border-blue-400'
            }`}
            placeholder="prenom.nom@uclouvain.be"
            required
            aria-invalid={!!errors.enseignant_email}
            aria-describedby={errors.enseignant_email ? 'email-error' : 'email-help'}
          />
          {!errors.enseignant_email && (
            <p id="email-help" className="mt-2 text-xs text-gray-500 flex items-center gap-1">
              <Info className="h-4 w-4" />
              Format: prenom.nom@uclouvain.be
            </p>
          )}
          {errors.enseignant_email && (
            <p id="email-error" className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <XCircle className="h-4 w-4" />
              {errors.enseignant_email}
            </p>
          )}
        </div>

        {/* Présence */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 shadow-sm">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            Serez-vous présent à cet examen ? <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className={`relative flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              formData.est_present === true
                ? 'border-green-500 bg-green-50 shadow-md'
                : 'border-gray-300 bg-white hover:border-green-300 hover:bg-green-50'
            }`}>
              <input
                type="radio"
                name="presence"
                checked={formData.est_present === true}
                onChange={() => handleChange('est_present', true)}
                className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300"
              />
              <div className="ml-3 flex items-center gap-2">
                <CheckCircle className={`h-6 w-6 ${formData.est_present === true ? 'text-green-600' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${formData.est_present === true ? 'text-green-900' : 'text-gray-700'}`}>
                  Oui, je serai présent
                </span>
              </div>
            </label>
            <label className={`relative flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              formData.est_present === false
                ? 'border-red-500 bg-red-50 shadow-md'
                : 'border-gray-300 bg-white hover:border-red-300 hover:bg-red-50'
            }`}>
              <input
                type="radio"
                name="presence"
                checked={formData.est_present === false}
                onChange={() => {
                  handleChange('est_present', false);
                }}
                className="h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300"
              />
              <div className="ml-3 flex items-center gap-2">
                <XCircle className={`h-6 w-6 ${formData.est_present === false ? 'text-red-600' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${formData.est_present === false ? 'text-red-900' : 'text-gray-700'}`}>
                  Non, je serai absent
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Nb surveillants */}
        <div className="group">
          <label htmlFor="nb_surveillants" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <Users className="h-5 w-5 text-blue-600" />
            {formData.est_present 
              ? "Nombre de personnes présentes pour surveiller en plus de moi"
              : "Nombre de personnes qui seront présentes pour surveiller"
            }
          </label>
          <input
            type="number"
            id="nb_surveillants"
            min="0"
            value={formData.nb_surveillants_accompagnants}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0;
              handleChange('nb_surveillants_accompagnants', value);
              if (value === 0) {
                handleChange('noms_accompagnants', '');
              }
            }}
            className={`block w-full rounded-lg shadow-sm sm:text-sm transition-all duration-200 ${
              errors.nb_surveillants_accompagnants
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 group-hover:border-blue-400'
            }`}
            aria-invalid={!!errors.nb_surveillants_accompagnants}
            aria-describedby={errors.nb_surveillants_accompagnants ? 'nb_surveillants-error' : 'nb_surveillants-help'}
          />
          <p id="nb_surveillants-help" className="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <Info className="h-4 w-4" />
            Par défaut 0 - Indiquez le nombre de personnes supplémentaires
          </p>
          {errors.nb_surveillants_accompagnants && (
            <p id="nb_surveillants-error" className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <XCircle className="h-4 w-4" />
              {errors.nb_surveillants_accompagnants}
            </p>
          )}
        </div>

        {/* Noms accompagnants (if nb > 0) */}
        {formData.nb_surveillants_accompagnants > 0 && (
          <div className="group animate-fade-in">
            <label htmlFor="noms_accompagnants" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              Noms des personnes amenées <span className="text-red-500">*</span>
            </label>
            <textarea
              id="noms_accompagnants"
              rows={3}
              value={formData.noms_accompagnants}
              onChange={(e) => handleChange('noms_accompagnants', e.target.value)}
              className={`block w-full rounded-lg shadow-sm sm:text-sm transition-all duration-200 ${
                errors.noms_accompagnants
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 group-hover:border-blue-400'
              }`}
              placeholder="Ex: Marie Dubois, Pierre Martin"
              aria-invalid={!!errors.noms_accompagnants}
              aria-describedby={errors.noms_accompagnants ? 'noms-error' : 'noms-help'}
            />
            {!errors.noms_accompagnants && (
              <p id="noms-help" className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <Info className="h-4 w-4" />
                Indiquez les noms complets, séparés par des virgules
              </p>
            )}
            {errors.noms_accompagnants && (
              <p id="noms-error" className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <XCircle className="h-4 w-4" />
                {errors.noms_accompagnants}
              </p>
            )}
          </div>
        )}

        {/* Remarque */}
        <div className="group">
          <label htmlFor="remarque" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Consignes particulières (optionnel)
          </label>
          <textarea
            id="remarque"
            rows={4}
            value={formData.remarque}
            onChange={(e) => handleChange('remarque', e.target.value)}
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-all duration-200 group-hover:border-blue-400"
            placeholder="Consignes spécifiques pour cet examen (seront ajoutées à la fiche du cours)..."
          />
          <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <Info className="h-4 w-4" />
            Ces consignes seront ajoutées à la fiche du cours et visibles par l'administration
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={submit.isPending}
            className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-semibold rounded-lg shadow-md text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            {submit.isPending ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                Enregistrement...
              </>
            ) : (
              <>
                <CheckCircle className="h-6 w-6 mr-2" />
                {existingPresence ? 'Mettre à jour ma déclaration' : 'Soumettre ma déclaration'}
              </>
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submit.isPending}
              className="inline-flex items-center px-6 py-3 border-2 border-gray-300 text-base font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <XCircle className="h-5 w-5 mr-2" />
              Annuler
            </button>
          )}
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 transform transition-all animate-scale-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <CheckCircle className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Confirmer votre déclaration</h3>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-200">
              <p className="text-sm text-gray-700 font-medium mb-4">Vous êtes sur le point de soumettre :</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <span className="text-xs text-gray-500">Cours</span>
                    <p className="font-semibold text-gray-900">{cours.code}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  {formData.est_present ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  )}
                  <div>
                    <span className="text-xs text-gray-500">Présence</span>
                    <p className="font-semibold text-gray-900">
                      {formData.est_present ? 'Présent' : 'Absent'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <Users className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <span className="text-xs text-gray-500">
                      {formData.est_present ? 'Personnes en plus' : 'Personnes présentes'}
                    </span>
                    <p className="font-semibold text-gray-900">
                      {formData.nb_surveillants_accompagnants} {formData.nb_surveillants_accompagnants > 1 ? 'personnes' : 'personne'}
                    </p>
                  </div>
                </div>

                {formData.nb_surveillants_accompagnants > 0 && formData.noms_accompagnants && (
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm">
                    <Users className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-xs text-gray-500">Noms</span>
                      <p className="font-medium text-gray-900 text-sm">{formData.noms_accompagnants}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={handleConfirm}
                disabled={submit.isPending}
                className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-semibold rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Confirmer
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={submit.isPending}
                className="flex-1 inline-flex justify-center items-center px-6 py-3 border-2 border-gray-300 text-base font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
              >
                <XCircle className="h-5 w-5 mr-2" />
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
