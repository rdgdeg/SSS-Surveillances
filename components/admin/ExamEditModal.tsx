import React, { useState, useEffect } from 'react';
import { ExamenWithStatus, ExamenFormData, Cours } from '../../types';
import { getCours } from '../../lib/coursApi';
import { createExamen, updateExamen } from '../../lib/examenManagementApi';

interface ExamEditModalProps {
  examen: ExamenWithStatus | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  sessionId: string;
}

export function ExamEditModal({ examen, isOpen, onClose, onSave, sessionId }: ExamEditModalProps) {
  const [formData, setFormData] = useState<ExamenFormData>({
    cours_id: null,
    code_examen: '',
    nom_examen: '',
    date_examen: '',
    heure_debut: '',
    heure_fin: '',
    duree_minutes: null,
    auditoires: '',
    enseignants: [],
    secretariat: '',
    nb_surveillants_requis: null
  });

  const [cours, setCours] = useState<Cours[]>([]);
  const [filteredCours, setFilteredCours] = useState<Cours[]>([]);
  const [coursSearch, setCoursSearch] = useState('');
  const [showCoursDropdown, setShowCoursDropdown] = useState(false);
  const [newTeacher, setNewTeacher] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Load courses
  useEffect(() => {
    const loadCours = async () => {
      try {
        const result = await getCours({ pageSize: 1000 });
        setCours(result.data.map(c => ({ id: c.id, code: c.code, intitule_complet: c.intitule_complet, consignes: null, created_at: '', updated_at: '' })));
      } catch (err) {
        console.error('Error loading courses:', err);
      }
    };
    if (isOpen) {
      loadCours();
    }
  }, [isOpen]);

  // Initialize form data when exam changes
  useEffect(() => {
    if (examen) {
      setFormData({
        cours_id: examen.cours_id,
        code_examen: examen.code_examen,
        nom_examen: examen.nom_examen,
        date_examen: examen.date_examen || '',
        heure_debut: examen.heure_debut || '',
        heure_fin: examen.heure_fin || '',
        duree_minutes: examen.duree_minutes,
        auditoires: examen.auditoires || '',
        enseignants: examen.enseignants || [],
        secretariat: examen.secretariat || '',
        nb_surveillants_requis: examen.nb_surveillants_requis
      });
      if (examen.cours) {
        setCoursSearch(`${examen.cours.code} - ${examen.cours.intitule_complet}`);
      }
    } else {
      // Reset for new exam
      setFormData({
        cours_id: null,
        code_examen: '',
        nom_examen: '',
        date_examen: '',
        heure_debut: '',
        heure_fin: '',
        duree_minutes: null,
        auditoires: '',
        enseignants: [],
        secretariat: '',
        nb_surveillants_requis: null
      });
      setCoursSearch('');
    }
    setErrors({});
  }, [examen]);

  // Filter courses based on search
  useEffect(() => {
    if (coursSearch) {
      const search = coursSearch.toLowerCase();
      const filtered = cours.filter(c =>
        c.code.toLowerCase().includes(search) ||
        c.intitule_complet.toLowerCase().includes(search)
      );
      setFilteredCours(filtered.slice(0, 10));
    } else {
      setFilteredCours([]);
    }
  }, [coursSearch, cours]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code_examen.trim()) {
      newErrors.code_examen = 'Le code d\'examen est requis';
    }

    if (!formData.nom_examen.trim()) {
      newErrors.nom_examen = 'Le nom d\'examen est requis';
    }

    if (!formData.date_examen) {
      newErrors.date_examen = 'La date est requise';
    }

    if (!formData.heure_debut) {
      newErrors.heure_debut = 'L\'heure de début est requise';
    }

    if (!formData.heure_fin) {
      newErrors.heure_fin = 'L\'heure de fin est requise';
    }

    if (formData.heure_debut && formData.heure_fin && formData.heure_debut >= formData.heure_fin) {
      newErrors.heure_fin = 'L\'heure de fin doit être après l\'heure de début';
    }

    if (formData.nb_surveillants_requis !== null && (formData.nb_surveillants_requis < 0 || formData.nb_surveillants_requis > 99)) {
      newErrors.nb_surveillants_requis = 'Le nombre doit être entre 0 et 99';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setSaving(true);

      if (examen) {
        await updateExamen(examen.id, formData);
      } else {
        await createExamen(sessionId, formData);
      }

      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving exam:', err);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectCours = (selectedCours: Cours) => {
    setFormData({ ...formData, cours_id: selectedCours.id });
    setCoursSearch(`${selectedCours.code} - ${selectedCours.intitule_complet}`);
    setShowCoursDropdown(false);
  };

  const handleAddTeacher = () => {
    if (newTeacher.trim()) {
      setFormData({
        ...formData,
        enseignants: [...formData.enseignants, newTeacher.trim()]
      });
      setNewTeacher('');
    }
  };

  const handleRemoveTeacher = (index: number) => {
    setFormData({
      ...formData,
      enseignants: formData.enseignants.filter((_, i) => i !== index)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {examen ? 'Modifier l\'examen' : 'Nouvel examen'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Course Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cours {!formData.cours_id && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={coursSearch}
                    onChange={(e) => {
                      setCoursSearch(e.target.value);
                      setShowCoursDropdown(true);
                    }}
                    onFocus={() => setShowCoursDropdown(true)}
                    placeholder="Rechercher un cours..."
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !formData.cours_id ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
                    }`}
                  />
                  {showCoursDropdown && filteredCours.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredCours.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectCours(c)}
                          className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                        >
                          <div className="font-medium">{c.code}</div>
                          <div className="text-sm text-gray-600">{c.intitule_complet}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {!formData.cours_id && (
                  <p className="mt-1 text-sm text-yellow-600">Aucun cours lié - Sélectionnez un cours</p>
                )}
              </div>

              {/* Code and Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code d'examen <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code_examen}
                    onChange={(e) => setFormData({ ...formData, code_examen: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.code_examen ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.code_examen && (
                    <p className="mt-1 text-sm text-red-600">{errors.code_examen}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom d'examen <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nom_examen}
                    onChange={(e) => setFormData({ ...formData, nom_examen: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.nom_examen ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.nom_examen && (
                    <p className="mt-1 text-sm text-red-600">{errors.nom_examen}</p>
                  )}
                </div>
              </div>

              {/* Date and Times */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date_examen}
                    onChange={(e) => setFormData({ ...formData, date_examen: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.date_examen ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.date_examen && (
                    <p className="mt-1 text-sm text-red-600">{errors.date_examen}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heure début <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.heure_debut}
                    onChange={(e) => setFormData({ ...formData, heure_debut: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.heure_debut ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.heure_debut && (
                    <p className="mt-1 text-sm text-red-600">{errors.heure_debut}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heure fin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.heure_fin}
                    onChange={(e) => setFormData({ ...formData, heure_fin: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.heure_fin ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.heure_fin && (
                    <p className="mt-1 text-sm text-red-600">{errors.heure_fin}</p>
                  )}
                </div>
              </div>

              {/* Rooms and Secretariat */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Auditoires
                  </label>
                  <input
                    type="text"
                    value={formData.auditoires}
                    onChange={(e) => setFormData({ ...formData, auditoires: e.target.value })}
                    placeholder="71 - Simonart, 51 A - Lacroix"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secrétariat
                  </label>
                  <input
                    type="text"
                    value={formData.secretariat}
                    onChange={(e) => setFormData({ ...formData, secretariat: e.target.value })}
                    placeholder="MED, FARM..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Supervisor Requirement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de surveillants requis
                </label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={formData.nb_surveillants_requis || ''}
                  onChange={(e) => setFormData({ ...formData, nb_surveillants_requis: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Non défini"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.nb_surveillants_requis ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.nb_surveillants_requis && (
                  <p className="mt-1 text-sm text-red-600">{errors.nb_surveillants_requis}</p>
                )}
              </div>

              {/* Teachers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enseignants
                </label>
                <div className="space-y-2">
                  {formData.enseignants.map((teacher, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="flex-1 px-3 py-2 bg-gray-100 rounded-md text-sm">
                        {teacher}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTeacher(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTeacher}
                      onChange={(e) => setNewTeacher(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTeacher())}
                      placeholder="Nom de l'enseignant"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddTeacher}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {examen ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
