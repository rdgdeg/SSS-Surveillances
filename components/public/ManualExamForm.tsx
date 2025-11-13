import React, { useState } from 'react';
import { useExamenMutation } from '../../src/hooks/useExamens';
import { ManualExamenFormData, Examen } from '../../types';

interface ManualExamFormProps {
  sessionId: string;
  enseignantEmail: string;
  onSuccess: (examen: Examen) => void;
  onCancel: () => void;
}

export function ManualExamForm({ sessionId, enseignantEmail, onSuccess, onCancel }: ManualExamFormProps) {
  const [formData, setFormData] = useState<ManualExamenFormData>({
    code_examen: '',
    nom_examen: '',
    date_examen: '',
    heure_debut: '',
    heure_fin: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { createManual } = useExamenMutation();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code_examen.trim()) {
      newErrors.code_examen = 'Le code d\'examen est obligatoire';
    } else if (formData.code_examen.length > 50) {
      newErrors.code_examen = 'Le code ne peut pas dépasser 50 caractères';
    }

    if (!formData.nom_examen.trim()) {
      newErrors.nom_examen = 'Le nom d\'examen est obligatoire';
    } else if (formData.nom_examen.length > 500) {
      newErrors.nom_examen = 'Le nom ne peut pas dépasser 500 caractères';
    }

    // Validate date format if provided
    if (formData.date_examen && !/^\d{4}-\d{2}-\d{2}$/.test(formData.date_examen)) {
      newErrors.date_examen = 'Format de date invalide (YYYY-MM-DD)';
    }

    // Validate time format if provided
    if (formData.heure_debut && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.heure_debut)) {
      newErrors.heure_debut = 'Format d\'heure invalide (HH:MM)';
    }

    if (formData.heure_fin && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.heure_fin)) {
      newErrors.heure_fin = 'Format d\'heure invalide (HH:MM)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const examen = await createManual.mutateAsync({
        sessionId,
        data: {
          code_examen: formData.code_examen.trim(),
          nom_examen: formData.nom_examen.trim(),
          date_examen: formData.date_examen || undefined,
          heure_debut: formData.heure_debut || undefined,
          heure_fin: formData.heure_fin || undefined
        },
        email: enseignantEmail
      });

      onSuccess(examen);
    } catch (error) {
      console.error('Error creating manual exam:', error);
      alert(`Erreur lors de la création de l'examen: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleChange = (field: keyof ManualExamenFormData, value: string) => {
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
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">Saisir un examen manuellement</h3>
        <p className="mt-1 text-sm text-gray-600">
          Remplissez les informations de votre examen. Un administrateur validera votre saisie.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Code examen */}
        <div>
          <label htmlFor="code_examen" className="block text-sm font-medium text-gray-700">
            Code d'examen <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="code_examen"
            value={formData.code_examen}
            onChange={(e) => handleChange('code_examen', e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
              errors.code_examen
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
            placeholder="Ex: MATH101"
            maxLength={50}
            required
            aria-invalid={!!errors.code_examen}
            aria-describedby={errors.code_examen ? 'code_examen-error' : undefined}
          />
          {errors.code_examen && (
            <p id="code_examen-error" className="mt-1 text-sm text-red-600">
              {errors.code_examen}
            </p>
          )}
        </div>

        {/* Nom examen */}
        <div>
          <label htmlFor="nom_examen" className="block text-sm font-medium text-gray-700">
            Nom d'examen <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="nom_examen"
            value={formData.nom_examen}
            onChange={(e) => handleChange('nom_examen', e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
              errors.nom_examen
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
            placeholder="Ex: Mathématiques I"
            maxLength={500}
            required
            aria-invalid={!!errors.nom_examen}
            aria-describedby={errors.nom_examen ? 'nom_examen-error' : undefined}
          />
          {errors.nom_examen && (
            <p id="nom_examen-error" className="mt-1 text-sm text-red-600">
              {errors.nom_examen}
            </p>
          )}
        </div>

        {/* Date examen */}
        <div>
          <label htmlFor="date_examen" className="block text-sm font-medium text-gray-700">
            Date de l'examen (optionnel)
          </label>
          <input
            type="date"
            id="date_examen"
            value={formData.date_examen}
            onChange={(e) => handleChange('date_examen', e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
              errors.date_examen
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
            aria-invalid={!!errors.date_examen}
            aria-describedby={errors.date_examen ? 'date_examen-error' : undefined}
          />
          {errors.date_examen && (
            <p id="date_examen-error" className="mt-1 text-sm text-red-600">
              {errors.date_examen}
            </p>
          )}
        </div>

        {/* Heures */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="heure_debut" className="block text-sm font-medium text-gray-700">
              Heure de début (optionnel)
            </label>
            <input
              type="time"
              id="heure_debut"
              value={formData.heure_debut}
              onChange={(e) => handleChange('heure_debut', e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                errors.heure_debut
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
              aria-invalid={!!errors.heure_debut}
              aria-describedby={errors.heure_debut ? 'heure_debut-error' : undefined}
            />
            {errors.heure_debut && (
              <p id="heure_debut-error" className="mt-1 text-sm text-red-600">
                {errors.heure_debut}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="heure_fin" className="block text-sm font-medium text-gray-700">
              Heure de fin (optionnel)
            </label>
            <input
              type="time"
              id="heure_fin"
              value={formData.heure_fin}
              onChange={(e) => handleChange('heure_fin', e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                errors.heure_fin
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
              aria-invalid={!!errors.heure_fin}
              aria-describedby={errors.heure_fin ? 'heure_fin-error' : undefined}
            />
            {errors.heure_fin && (
              <p id="heure_fin-error" className="mt-1 text-sm text-red-600">
                {errors.heure_fin}
              </p>
            )}
          </div>
        </div>

        {/* Info message */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-blue-800">
              Votre examen sera créé avec le statut "En attente de validation". Un administrateur vérifiera les informations avant de l'approuver.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={createManual.isPending}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createManual.isPending ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Création en cours...
              </>
            ) : (
              <>
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Créer l'examen
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={createManual.isPending}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
