import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  searchCours, 
  submitPresence, 
  getExistingPresence 
} from '../../lib/teacherPresenceApi';
import { supabase } from '../../lib/supabaseClient';
import { useActiveSession } from '../../src/hooks/useActiveSession';
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  Users, 
  MessageSquare,
  Calendar,
  BookOpen,
  AlertCircle,
  Loader2,
  Info
} from 'lucide-react';
import { Button } from '../../components/shared/Button';
import toast from 'react-hot-toast';

interface CoursWithExam {
  id: string;
  code: string;
  intitule_complet: string;
  consignes: string | null;
  has_exam: boolean;
  exam_date?: string;
  exam_time?: string;
}

export default function TeacherPresencePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCours, setSelectedCours] = useState<CoursWithExam | null>(null);
  const [formData, setFormData] = useState({
    enseignant_email: '',
    enseignant_nom: '',
    enseignant_prenom: '',
    est_present: true,
    type_presence: 'present_full' as 'present_full' | 'present_partial' | 'absent',
    type_examen: null as 'ecrit' | 'qcm' | 'autre' | null,
    type_examen_autre: '',
    nb_surveillants_accompagnants: 0,
    noms_accompagnants: '',
    remarque: '',
  });
  const [autoEmail, setAutoEmail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: activeSession } = useActiveSession();

  // Search courses
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['cours-search', searchTerm],
    queryFn: () => searchCours(searchTerm),
    enabled: searchTerm.length >= 2,
  });

  // Get courses with exams in active session
  const { data: coursWithExams } = useQuery<{
    coursIds: Set<string>;
    examMap: Map<string, { id: string; date: string; time: string }>;
  }>({
    queryKey: ['cours-with-exams-list', activeSession?.id],
    queryFn: async () => {
      if (!activeSession?.id) return { coursIds: new Set(), examMap: new Map() };
      
      const { data: examens, error } = await supabase
        .from('examens')
        .select('cours_id, date, heure_debut')
        .eq('session_id', activeSession.id)
        .not('cours_id', 'is', null);
      
      if (error) throw error;
      
      const coursIds = new Set(examens?.map(e => e.cours_id) || []);
      const examMap = new Map(examens?.map(e => ({ 
        id: e.cours_id, 
        date: e.date, 
        time: e.heure_debut 
      })).map(e => [e.id, e]));
      
      return { coursIds, examMap };
    },
    enabled: !!activeSession?.id,
  });

  // Enrich search results with exam info
  const enrichedResults = searchResults?.map(cours => ({
    ...cours,
    has_exam: coursWithExams?.coursIds?.has(cours.id) || false,
    exam_date: coursWithExams?.examMap?.get(cours.id)?.date,
    exam_time: coursWithExams?.examMap?.get(cours.id)?.time,
  })).sort((a, b) => {
    // Prioritize courses with exams
    if (a.has_exam && !b.has_exam) return -1;
    if (!a.has_exam && b.has_exam) return 1;
    return 0;
  });

  // Check existing presence
  const { data: existingPresence } = useQuery({
    queryKey: ['existing-presence', selectedCours?.id, activeSession?.id, formData.enseignant_email],
    queryFn: () => {
      if (!selectedCours || !activeSession || !formData.enseignant_email) return null;
      return getExistingPresence(selectedCours.id, activeSession.id, formData.enseignant_email);
    },
    enabled: !!selectedCours && !!activeSession && !!formData.enseignant_email,
  });

  // Pre-fill form with existing data
  React.useEffect(() => {
    if (existingPresence) {
      setFormData(prev => ({
        ...prev,
        enseignant_nom: existingPresence.enseignant_nom,
        enseignant_prenom: existingPresence.enseignant_prenom,
        est_present: existingPresence.est_present,
        type_presence: (existingPresence as any).type_presence || (existingPresence.est_present ? 'present_full' : 'absent'),
        type_examen: (existingPresence as any).type_examen || null,
        type_examen_autre: (existingPresence as any).type_examen_autre || '',
        nb_surveillants_accompagnants: existingPresence.nb_surveillants_accompagnants,
        noms_accompagnants: existingPresence.noms_accompagnants || '',
        remarque: existingPresence.remarque || '',
      }));
    }
  }, [existingPresence]);

  // Pre-fill remarque with course consignes
  React.useEffect(() => {
    if (selectedCours && !existingPresence && selectedCours.consignes) {
      setFormData(prev => ({
        ...prev,
        remarque: selectedCours.consignes || '',
      }));
    }
  }, [selectedCours, existingPresence]);

  const handleSelectCours = (cours: CoursWithExam) => {
    setSelectedCours(cours);
    setSearchTerm('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCours || !activeSession) {
      toast.error('Veuillez sélectionner un cours');
      return;
    }

    if (!formData.enseignant_email || !formData.enseignant_nom || !formData.enseignant_prenom) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!formData.type_examen) {
      toast.error('Veuillez sélectionner le type d\'examen');
      return;
    }

    if (formData.type_examen === 'autre' && !formData.type_examen_autre.trim()) {
      toast.error('Veuillez préciser le type d\'examen');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPresence(selectedCours.id, activeSession.id, formData);
      toast.success('Présence enregistrée avec succès');
      
      // Reset form
      setSelectedCours(null);
      setFormData({
        enseignant_email: formData.enseignant_email, // Keep email
        enseignant_nom: formData.enseignant_nom, // Keep name
        enseignant_prenom: formData.enseignant_prenom, // Keep first name
        est_present: true,
        type_presence: 'present_full',
        type_examen: null,
        type_examen_autre: '',
        nb_surveillants_accompagnants: 0,
        noms_accompagnants: '',
        remarque: '',
      });
    } catch (error) {
      console.error('Error submitting presence:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activeSession) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-3 text-amber-800 dark:text-amber-200">
            <AlertCircle className="h-6 w-6" />
            <p>Aucune session d'examens active pour le moment.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Déclaration de Présence Enseignant
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Session: {activeSession.name} ({activeSession.year})
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Comment ça marche ?</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                <li>Recherchez votre cours par code ou nom</li>
                <li>Indiquez si vous serez présent et combien de personnes vous accompagnent</li>
                <li>Les consignes que vous ajoutez seront conservées pour les prochaines sessions</li>
              </ul>
            </div>
          </div>
        </div>

        {!selectedCours ? (
          /* Search Section */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rechercher votre cours
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Code ou nom du cours (min. 2 caractères)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            )}

            {enrichedResults && enrichedResults.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {enrichedResults.map((cours) => (
                  <button
                    key={cours.id}
                    onClick={() => handleSelectCours(cours)}
                    className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-bold">
                            {cours.code}
                          </span>
                          {cours.has_exam && (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-medium flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Examen prévu
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {cours.intitule_complet}
                        </p>
                        {cours.exam_date && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(cours.exam_date).toLocaleDateString('fr-FR')}
                            {cours.exam_time && ` à ${cours.exam_time}`}
                          </p>
                        )}
                      </div>
                      <BookOpen className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchTerm.length >= 2 && !isSearching && enrichedResults?.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Aucun cours trouvé
              </div>
            )}
          </div>
        ) : (
          /* Form Section */
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            {/* Selected Course */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-sm font-bold">
                      {selectedCours.code}
                    </span>
                    {selectedCours.has_exam && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Examen prévu
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedCours.intitule_complet}
                  </p>
                  {selectedCours.exam_date && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {new Date(selectedCours.exam_date).toLocaleDateString('fr-FR')}
                      {selectedCours.exam_time && ` à ${selectedCours.exam_time}`}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCours(null)}
                >
                  Changer
                </Button>
              </div>
            </div>

            {existingPresence && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Modification:</strong> Vous avez déjà soumis une déclaration pour ce cours. 
                  Vous pouvez la modifier ci-dessous.
                </p>
              </div>
            )}

            {/* Personal Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.enseignant_prenom}
                    onChange={(e) => {
                      const prenom = e.target.value;
                      setFormData({ ...formData, enseignant_prenom: prenom });
                      if (autoEmail && prenom && formData.enseignant_nom) {
                        const email = `${prenom.toLowerCase().trim()}.${formData.enseignant_nom.toLowerCase().trim()}@uclouvain.be`;
                        setFormData(prev => ({ ...prev, enseignant_email: email }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.enseignant_nom}
                    onChange={(e) => {
                      const nom = e.target.value;
                      setFormData({ ...formData, enseignant_nom: nom });
                      if (autoEmail && formData.enseignant_prenom && nom) {
                        const email = `${formData.enseignant_prenom.toLowerCase().trim()}.${nom.toLowerCase().trim()}@uclouvain.be`;
                        setFormData(prev => ({ ...prev, enseignant_email: email }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <div className="space-y-2">
                  <input
                    type="email"
                    required
                    value={formData.enseignant_email}
                    onChange={(e) => {
                      setFormData({ ...formData, enseignant_email: e.target.value });
                      setAutoEmail(false);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={autoEmail}
                      onChange={(e) => {
                        setAutoEmail(e.target.checked);
                        if (e.target.checked && formData.enseignant_prenom && formData.enseignant_nom) {
                          const email = `${formData.enseignant_prenom.toLowerCase().trim()}.${formData.enseignant_nom.toLowerCase().trim()}@uclouvain.be`;
                          setFormData(prev => ({ ...prev, enseignant_email: email }));
                        }
                      }}
                      className="rounded"
                    />
                    Générer automatiquement l'email UCLouvain
                  </label>
                </div>
              </div>
            </div>

            {/* Presence Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Votre présence à l'examen *
              </label>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type_presence: 'present_full', est_present: true })}
                  className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                    formData.type_presence === 'present_full'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle className={`h-6 w-6 flex-shrink-0 mt-0.5 ${
                      formData.type_presence === 'present_full' ? 'text-green-600' : 'text-gray-400'
                    }`} />
                    <div>
                      <span className="font-medium block">Oui, je serai présent pour la surveillance complète</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Je serai présent pour la surveillance et la mise en place de l'examen (un surveillant peut être retiré)
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type_presence: 'present_partial', est_present: true })}
                  className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                    formData.type_presence === 'present_partial'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Users className={`h-6 w-6 flex-shrink-0 mt-0.5 ${
                      formData.type_presence === 'present_partial' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <div>
                      <span className="font-medium block">Oui, je suis présent mais pas pour toute la surveillance</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Je serai présent mais n'assurerai pas toute la surveillance (il faut compter un surveillant)
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type_presence: 'absent', est_present: false })}
                  className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                    formData.type_presence === 'absent'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <XCircle className={`h-6 w-6 flex-shrink-0 mt-0.5 ${
                      formData.type_presence === 'absent' ? 'text-red-600' : 'text-gray-400'
                    }`} />
                    <div>
                      <span className="font-medium block">Non, je ne serai pas présent</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Je ne serai pas présent mais je peux indiquer des surveillants
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Exam Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Type d'examen *
              </label>
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type_examen: 'ecrit', type_examen_autre: '' })}
                    className={`p-3 border-2 rounded-lg transition-all ${
                      formData.type_examen === 'ecrit'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <span className="font-medium">Examen écrit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type_examen: 'qcm', type_examen_autre: '' })}
                    className={`p-3 border-2 rounded-lg transition-all ${
                      formData.type_examen === 'qcm'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <span className="font-medium">QCM</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type_examen: 'autre' })}
                    className={`p-3 border-2 rounded-lg transition-all ${
                      formData.type_examen === 'autre'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <span className="font-medium">Autre</span>
                  </button>
                </div>
                {formData.type_examen === 'autre' && (
                  <input
                    type="text"
                    placeholder="Précisez le type d'examen..."
                    value={formData.type_examen_autre}
                    onChange={(e) => setFormData({ ...formData, type_examen_autre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                )}
              </div>
            </div>

            {/* Accompanying Supervisors */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre de surveillants {formData.type_presence !== 'absent' ? 'accompagnants' : ''}
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {formData.type_presence === 'present_full' 
                    ? "Surveillants qui vous accompagneront à l'examen (en plus de vous)"
                    : formData.type_presence === 'present_partial'
                    ? "Surveillants qui assureront la surveillance avec vous"
                    : "Surveillants qui assureront la surveillance de l'examen"}
                </p>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.nb_surveillants_accompagnants}
                  onChange={(e) => setFormData({ ...formData, nb_surveillants_accompagnants: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {formData.nb_surveillants_accompagnants > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Noms des surveillants
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Jean Dupont, Marie Martin"
                    value={formData.noms_accompagnants}
                    onChange={(e) => setFormData({ ...formData, noms_accompagnants: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Séparez les noms par des virgules ou des retours à la ligne
                  </p>
                </div>
              )}
            </div>

            {/* Remarks/Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Consignes / Remarques
                </div>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Ces consignes seront conservées et affichées pour les prochaines sessions d'examens
              </p>
              
              {/* Historique des remarques */}
              {existingPresence && (existingPresence as any).historique_remarques && (existingPresence as any).historique_remarques.length > 0 && (
                <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Historique des remarques :</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {((existingPresence as any).historique_remarques as Array<any>).map((item, index) => (
                      <div key={index} className="text-xs bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">{item.enseignant_nom}</span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {new Date(item.date).toLocaleDateString('fr-FR', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">{item.remarque}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <textarea
                rows={4}
                value={formData.remarque}
                onChange={(e) => setFormData({ ...formData, remarque: e.target.value })}
                placeholder="Consignes particulières pour la surveillance de cet examen..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedCours(null)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {existingPresence ? 'Modifier' : 'Enregistrer'} ma présence
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
