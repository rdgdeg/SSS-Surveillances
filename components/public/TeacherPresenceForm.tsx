import React, { useState, useEffect } from 'react';
import { usePresenceMutation, useExistingPresenceQuery } from '../../src/hooks/useTeacherPresence';
import { Cours, PresenceFormData } from '../../types';

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
        remarque: existingPresence.remarque || ''
      });
    }
  }, [existingPresence]);

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
    if (formData.est_present && formData.nb_surveillants_accompagnants < 0) {
      newErrors.nb_surveillants_accompagnants = 'Le nombre doit être positif ou zéro';
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
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">Déclaration de présence</h3>
        
        {/* Cours info */}
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Informations du cours</h4>
          <dl className="grid grid-cols-1 gap-2 text-sm">
            <div>
              <dt className="text-gray-600 inline">Code:</dt>
              <dd className="text-gray-900 inline ml-2 font-medium">{cours.code}</dd>
            </div>
            <div>
              <dt className="text-gray-600 inline">Nom:</dt>
              <dd className="text-gray-900 inline ml-2">{cours.intitule_complet}</dd>
            </div>
          </dl>
        </div>

        {existingPresence && (
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              Vous avez déjà soumis une déclaration pour cet examen. Vous pouvez la modifier ci-dessous.
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={formData.enseignant_email}
            onChange={(e) => handleChange('enseignant_email', e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
              errors.enseignant_email
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
            placeholder="votre.email@univ.be"
            required
            aria-invalid={!!errors.enseignant_email}
            aria-describedby={errors.enseignant_email ? 'email-error' : undefined}
          />
          {errors.enseignant_email && (
            <p id="email-error" className="mt-1 text-sm text-red-600">
              {errors.enseignant_email}
            </p>
          )}
        </div>

        {/* Nom et Prénom */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nom"
              value={formData.enseignant_nom}
              onChange={(e) => handleChange('enseignant_nom', e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                errors.enseignant_nom
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
              required
              aria-invalid={!!errors.enseignant_nom}
              aria-describedby={errors.enseignant_nom ? 'nom-error' : undefined}
            />
            {errors.enseignant_nom && (
              <p id="nom-error" className="mt-1 text-sm text-red-600">
                {errors.enseignant_nom}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="prenom" className="block text-sm font-medium text-gray-700">
              Prénom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="prenom"
              value={formData.enseignant_prenom}
              onChange={(e) => handleChange('enseignant_prenom', e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                errors.enseignant_prenom
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
              required
              aria-invalid={!!errors.enseignant_prenom}
              aria-describedby={errors.enseignant_prenom ? 'prenom-error' : undefined}
            />
            {errors.enseignant_prenom && (
              <p id="prenom-error" className="mt-1 text-sm text-red-600">
                {errors.enseignant_prenom}
              </p>
            )}
          </div>
        </div>

        {/* Présence */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Serez-vous présent à cet examen ? <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="presence"
                checked={formData.est_present === true}
                onChange={() => handleChange('est_present', true)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Oui, je serai présent</span>
            </label>
            <label className="inline-flex items-center ml-6">
              <input
                type="radio"
                name="presence"
                checked={formData.est_present === false}
                onChange={() => {
                  handleChange('est_present', false);
                  handleChange('nb_surveillants_accompagnants', 0);
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Non, je serai absent</span>
            </label>
          </div>
        </div>

        {/* Nb surveillants (only if present) */}
        {formData.est_present && (
          <div>
            <label htmlFor="nb_surveillants" className="block text-sm font-medium text-gray-700">
              Nombre de surveillants que vous amenez
            </label>
            <input
              type="number"
              id="nb_surveillants"
              min="0"
              value={formData.nb_surveillants_accompagnants}
              onChange={(e) => handleChange('nb_surveillants_accompagnants', parseInt(e.target.value) || 0)}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                errors.nb_surveillants_accompagnants
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
              aria-invalid={!!errors.nb_surveillants_accompagnants}
              aria-describedby={errors.nb_surveillants_accompagnants ? 'nb_surveillants-error' : 'nb_surveillants-help'}
            />
            <p id="nb_surveillants-help" className="mt-1 text-xs text-gray-500">
              Indiquez 0 si vous ne venez pas avec des surveillants
            </p>
            {errors.nb_surveillants_accompagnants && (
              <p id="nb_surveillants-error" className="mt-1 text-sm text-red-600">
                {errors.nb_surveillants_accompagnants}
              </p>
            )}
          </div>
        )}

        {/* Remarque */}
        <div>
          <label htmlFor="remarque" className="block text-sm font-medium text-gray-700">
            Consignes particulières (optionnel)
          </label>
          <textarea
            id="remarque"
            rows={3}
            value={formData.remarque}
            onChange={(e) => handleChange('remarque', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Consignes spécifiques pour cet examen (seront ajoutées à la fiche du cours)..."
          />
          <p className="mt-1 text-xs text-gray-500">
            Ces consignes seront ajoutées à la fiche du cours et visibles par l'administration
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submit.isPending}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submit.isPending ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enregistrement...
              </>
            ) : (
              <>
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {existingPresence ? 'Mettre à jour' : 'Soumettre'}
              </>
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submit.isPending}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
          )}
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmer votre déclaration</h3>
            <div className="text-sm text-gray-600 space-y-2 mb-6">
              <p>Vous êtes sur le point de soumettre votre déclaration de présence :</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Cours: <strong>{cours.code}</strong></li>
                <li>Présence: <strong>{formData.est_present ? 'Oui' : 'Non'}</strong></li>
                {formData.est_present && (
                  <li>Surveillants: <strong>{formData.nb_surveillants_accompagnants}</strong></li>
                )}
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleConfirm}
                disabled={submit.isPending}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Confirmer
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={submit.isPending}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
