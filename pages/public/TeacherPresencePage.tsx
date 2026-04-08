import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  searchCours, 
  submitPresence, 
  getExistingPresence,
  getExamensWithCoursForSession,
  collectUniqueTeacherLabelsFromExamens,
  filterExamensByTeacherLabel
} from '../../lib/teacherPresenceApi';
import { supabase } from '../../lib/supabaseClient';
import type { Examen } from '../../types';
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
  Info,
  ChevronDown,
  ChevronUp
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
    type_presence: 'present_full' as 'present_full' | 'present_partial',
    type_examen: null as 'qcm' | 'qroc_manuel' | 'qcm_qroc' | 'gradescope' | 'oral' | 'travail' | 'autre' | null,
    type_examen_autre: '',
    travail_date_depot: '',
    travail_en_presentiel: false,
    travail_bureau: '',
    duree_examen_moins_2h: false,
    duree_examen_minutes: 120,
    nb_surveillants_accompagnants: 0,
    noms_accompagnants: '',
    remarque: '',
  });
  const [autoEmail, setAutoEmail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedExamenId, setSelectedExamenId] = useState<string | null>(null);
  const [selectedTeacherLabel, setSelectedTeacherLabel] = useState('');
  const [manualExamMode, setManualExamMode] = useState(false);
  const [examPickerSearch, setExamPickerSearch] = useState('');
  const [showCourseSearch, setShowCourseSearch] = useState(false);

  const { data: activeSession } = useActiveSession();

  const { data: sessionExamens, isLoading: sessionExamensLoading } = useQuery({
    queryKey: ['examens-session-teacher', activeSession?.id],
    queryFn: () => getExamensWithCoursForSession(activeSession!.id),
    enabled: !!activeSession?.id,
  });

  const teacherLabels = useMemo(
    () => collectUniqueTeacherLabelsFromExamens(sessionExamens || []),
    [sessionExamens]
  );

  const examsForLabel = useMemo(() => {
    if (!selectedTeacherLabel.trim() || !sessionExamens) return [];
    return filterExamensByTeacherLabel(sessionExamens, selectedTeacherLabel);
  }, [sessionExamens, selectedTeacherLabel]);

  const filteredManualExams = useMemo(() => {
    if (!sessionExamens) return [];
    const q = examPickerSearch.trim().toLowerCase();
    if (!q) return sessionExamens;
    return sessionExamens.filter(
      (ex) =>
        ex.code_examen.toLowerCase().includes(q) ||
        (ex.nom_examen || '').toLowerCase().includes(q) ||
        (ex.secretariat || '').toLowerCase().includes(q)
    );
  }, [sessionExamens, examPickerSearch]);

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
        .select('cours_id, date_examen, heure_debut')
        .eq('session_id', activeSession.id)
        .not('cours_id', 'is', null);
      
      if (error) throw error;
      
      const coursIds = new Set(examens?.map(e => e.cours_id) || []);
      const examMap = new Map(examens?.map(e => ({ 
        id: e.cours_id, 
        date: e.date_examen, 
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

  // Check existing presence for current teacher
  const { data: existingPresence } = useQuery({
    queryKey: ['existing-presence', selectedCours?.id, activeSession?.id, formData.enseignant_email, selectedExamenId],
    queryFn: () => {
      if (!selectedCours || !activeSession || !formData.enseignant_email) return null;
      return getExistingPresence(
        selectedCours.id,
        activeSession.id,
        formData.enseignant_email,
        selectedExamenId
      );
    },
    enabled: !!selectedCours && !!activeSession && !!formData.enseignant_email,
  });

  // Check all presences for this course
  const { data: allPresencesForCours } = useQuery({
    queryKey: ['all-presences-cours', selectedCours?.id, activeSession?.id, selectedExamenId],
    queryFn: async () => {
      if (!selectedCours || !activeSession) return [];
      
      let q = supabase
        .from('presences_enseignants')
        .select('*')
        .eq('cours_id', selectedCours.id)
        .eq('session_id', activeSession.id);

      if (selectedExamenId) {
        q = q.eq('examen_id', selectedExamenId);
      }

      const { data, error } = await q;
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCours && !!activeSession,
  });

  // Pre-fill form with existing data
  React.useEffect(() => {
    if (existingPresence) {
      setFormData(prev => ({
        ...prev,
        enseignant_nom: existingPresence.enseignant_nom,
        enseignant_prenom: existingPresence.enseignant_prenom,
        est_present: existingPresence.est_present,
        type_presence: (existingPresence as any).type_presence || 'present_full',
        type_examen: (existingPresence as any).type_examen || null,
        type_examen_autre: (existingPresence as any).type_examen_autre || '',
        travail_date_depot: (existingPresence as any).travail_date_depot || '',
        travail_en_presentiel: (existingPresence as any).travail_en_presentiel || false,
        travail_bureau: (existingPresence as any).travail_bureau || '',
        duree_examen_moins_2h: (existingPresence as any).duree_examen_moins_2h || false,
        duree_examen_minutes: (existingPresence as any).duree_examen_minutes || 120,
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

  // Calculate existing submissions stats
  const existingSubmissionsStats = React.useMemo(() => {
    if (!allPresencesForCours || allPresencesForCours.length === 0) {
      return { count: 0, totalSurveillants: 0, teachers: [], allSurveillants: 0 };
    }

    // Calculer le total de TOUS les surveillants (y compris l'enseignant actuel)
    const allSurveillants = allPresencesForCours.reduce(
      (sum, p) => sum + (p.nb_surveillants_accompagnants || 0),
      0
    );

    // Exclure la soumission actuelle de l'enseignant si elle existe
    const otherSubmissions = allPresencesForCours.filter(
      p => p.enseignant_email.toLowerCase() !== formData.enseignant_email.toLowerCase()
    );

    const totalSurveillants = otherSubmissions.reduce(
      (sum, p) => sum + (p.nb_surveillants_accompagnants || 0),
      0
    );

    const teachers = otherSubmissions.map(p => ({
      nom: `${p.enseignant_prenom} ${p.enseignant_nom}`,
      nb_surveillants: p.nb_surveillants_accompagnants || 0,
    }));

    return {
      count: otherSubmissions.length,
      totalSurveillants,
      teachers,
      allSurveillants, // Total incluant tout le monde
    };
  }, [allPresencesForCours, formData.enseignant_email]);

  // Pré-remplir le champ avec le total actuel quand un cours est sélectionné
  React.useEffect(() => {
    if (selectedCours && !existingPresence && existingSubmissionsStats.allSurveillants > 0) {
      // Si d'autres ont déjà encodé, pré-remplir avec le total actuel
      setFormData(prev => ({
        ...prev,
        nb_surveillants_accompagnants: existingSubmissionsStats.allSurveillants,
      }));
    }
  }, [selectedCours, existingPresence, existingSubmissionsStats.allSurveillants]);

  const handlePickExamen = (examen: Examen) => {
    const row = examen as Examen & {
      cours?: { id: string; code: string; intitule_complet: string; consignes: string | null } | null;
    };
    if (!examen.cours_id || !row.cours) {
      toast.error('Cours non lié à cet examen. Importez les cours puis les examens, ou contactez le secrétariat.');
      return;
    }
    setSelectedExamenId(examen.id);
    setSelectedCours({
      id: row.cours.id,
      code: row.cours.code,
      intitule_complet: row.cours.intitule_complet,
      consignes: row.cours.consignes ?? null,
      has_exam: true,
      exam_date: examen.date_examen || undefined,
      exam_time: examen.heure_debut || undefined,
    });
    setShowConfirmation(false);
  };

  const handleSelectCours = (cours: CoursWithExam) => {
    setSelectedExamenId(null);
    setSelectedCours(cours);
    setSearchTerm('');
    setShowConfirmation(false);
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

    if (formData.type_examen === 'travail') {
      if (!formData.travail_date_depot) {
        toast.error('Veuillez indiquer la date limite de remise du travail');
        return;
      }
      if (formData.travail_en_presentiel && !formData.travail_bureau?.trim()) {
        toast.error('Veuillez indiquer le bureau pour le travail en présentiel');
        return;
      }
    }

    // Si d'autres enseignants ont déjà soumis et qu'on n'a pas encore confirmé, afficher la confirmation
    if (existingSubmissionsStats.count > 0 && !showConfirmation && !existingPresence) {
      setShowConfirmation(true);
      return;
    }

    await performSubmit();
  };

  const handleConfirmAndSubmit = async () => {
    setShowConfirmation(false);
    await performSubmit();
  };

  const performSubmit = async () => {
    if (!selectedCours || !activeSession) return;

    setIsSubmitting(true);
    try {
      await submitPresence(selectedCours.id, activeSession.id, formData, selectedExamenId);
      toast.success(existingPresence ? 'Présence modifiée avec succès' : 'Présence enregistrée avec succès');
      
      // Reset form (garder identité pour enchaîner un autre examen)
      setSelectedCours(null);
      setSelectedExamenId(null);
      setShowConfirmation(false);
      setFormData({
        enseignant_email: formData.enseignant_email, // Keep email
        enseignant_nom: formData.enseignant_nom, // Keep name
        enseignant_prenom: formData.enseignant_prenom, // Keep first name
        est_present: true,
        type_presence: 'present_full',
        type_examen: null,
        type_examen_autre: '',
        travail_date_depot: '',
        travail_en_presentiel: false,
        travail_bureau: '',
        duree_examen_moins_2h: false,
        duree_examen_minutes: 120,
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
              <p className="font-medium mb-1">Principe de la session</p>
              <p className="mb-2 text-blue-700 dark:text-blue-300">
                Vous déclarez votre présence pour la session active.
                La liste des noms est construite depuis la liste des examens importés
                (noms/labels enseignants présents dans ce fichier).
              </p>
              <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                <li>Choisissez votre nom dans la liste des enseignants de la session</li>
                <li>Sélectionnez ensuite l’examen concerné</li>
                <li>Indiquez si vous serez présent et combien de personnes vous accompagnent</li>
                <li>Si votre nom n’apparaît pas, utilisez “Autre méthode (si nécessaire)”</li>
                <li>Les deux méthodes mènent au même formulaire et au même enregistrement de présence</li>
              </ul>
            </div>
          </div>
        </div>

        {!selectedCours ? (
          <>
          {sessionExamensLoading && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          )}
          {sessionExamens && sessionExamens.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Par liste des enseignants (session)
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sélectionnez le libellé tel qu’il apparaît dans le fichier d’examens, puis l’examen concerné.
              </p>
              {!manualExamMode ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Votre nom dans la liste
                    </label>
                    <select
                      value={selectedTeacherLabel}
                      onChange={(e) => setSelectedTeacherLabel(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">— Choisir —</option>
                      {teacherLabels.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setManualExamMode(true);
                      setSelectedTeacherLabel('');
                    }}
                    className="text-sm text-indigo-600 dark:text-indigo-400 underline"
                  >
                    Je ne suis pas dans la liste — choisir un examen directement
                  </button>
                  {selectedTeacherLabel && examsForLabel.length > 0 && (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Examens</p>
                      {examsForLabel.map((ex) => (
                        <button
                          key={ex.id}
                          type="button"
                          onClick={() => handlePickExamen(ex)}
                          className="w-full text-left p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <span className="font-mono text-xs text-indigo-600">{ex.code_examen}</span>
                          <span className="block text-sm text-gray-900 dark:text-white">{ex.nom_examen}</span>
                          <span className="text-xs text-gray-500">
                            {ex.date_examen
                              ? new Date(ex.date_examen).toLocaleDateString('fr-FR')
                              : ''}{' '}
                            {ex.heure_debut || ''}
                            {ex.secretariat ? ` · ${ex.secretariat}` : ''}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedTeacherLabel && examsForLabel.length === 0 && (
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Aucun examen pour ce libellé. Utilisez le mode ci-dessous ou la recherche par cours.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setManualExamMode(false)}
                    className="text-sm text-indigo-600 dark:text-indigo-400 underline"
                  >
                    Retour à la liste des noms
                  </button>
                  <input
                    type="search"
                    placeholder="Filtrer par code, intitulé ou secrétariat…"
                    value={examPickerSearch}
                    onChange={(e) => setExamPickerSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {filteredManualExams.map((ex) => (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => handlePickExamen(ex)}
                        className="w-full text-left p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <span className="font-mono text-xs text-indigo-600">{ex.code_examen}</span>
                        <span className="block text-sm text-gray-900 dark:text-white">{ex.nom_examen}</span>
                        <span className="text-xs text-gray-500">
                          {ex.date_examen
                            ? new Date(ex.date_examen).toLocaleDateString('fr-FR')
                            : ''}{' '}
                          {ex.heure_debut || ''}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Search Section (other method) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowCourseSearch((v) => !v)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Autre méthode (si nécessaire)
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Rechercher votre cours au lieu de passer par la liste de la session
                </p>
              </div>
              {showCourseSearch ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {showCourseSearch && (
              <div className="px-5 pb-5 border-t border-gray-200 dark:border-gray-700">
                <p className="pt-4 text-xs text-gray-600 dark:text-gray-400">
                  Cette méthode est un secours: les informations envoyées sont enregistrées
                  exactement au même endroit que la méthode par liste des noms.
                </p>
                <div className="pt-4 mb-4">
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
            )}
          </div>
          </>
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
                  onClick={() => {
                    setSelectedCours(null);
                    setSelectedExamenId(null);
                  }}
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
                      <span className="font-medium block">Oui, je serai présent pour la surveillance et la mise en place</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Je compte donc pour un surveillant
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
                      <span className="font-medium block">Oui, je suis présent mais je passerai d'auditoire en auditoire</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Je ne compte donc pas pour un surveillant
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Accompanying Supervisors */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre de surveillants que vous apportez
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Indiquez le nombre de surveillants que vous mettez à disposition en plus de vous-même et leurs noms
                </p>
                <input
                  type="number"
                  min="0"
                  max="20"
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

            {/* Exam Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type d'examen *
              </label>
              <select
                value={formData.type_examen || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  type_examen: e.target.value as any,
                  type_examen_autre: e.target.value !== 'autre' ? '' : formData.type_examen_autre,
                  travail_date_depot: e.target.value !== 'travail' ? '' : formData.travail_date_depot,
                  travail_en_presentiel: e.target.value !== 'travail' ? false : formData.travail_en_presentiel,
                  travail_bureau: e.target.value !== 'travail' ? '' : formData.travail_bureau,
                })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">-- Sélectionnez le type d'examen --</option>
                <option value="qcm">QCM</option>
                <option value="qroc_manuel">QROC (correction manuelle)</option>
                <option value="qcm_qroc">QCM & QROC</option>
                <option value="gradescope">Gradescope</option>
                <option value="oral">Oral</option>
                <option value="travail">Travail</option>
                <option value="autre">Autre (à préciser)</option>
              </select>

              {/* Champ de précision pour "Autre" */}
              {formData.type_examen === 'autre' && (
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Précisez le type d'examen..."
                    value={formData.type_examen_autre}
                    onChange={(e) => setFormData({ ...formData, type_examen_autre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              )}

              {/* Champs spécifiques pour "Travail" */}
              {formData.type_examen === 'travail' && (
                <div className="mt-4 space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date limite de remise *
                    </label>
                    <input
                      type="date"
                      value={formData.travail_date_depot}
                      onChange={(e) => setFormData({ ...formData, travail_date_depot: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-blue-100 dark:hover:bg-blue-900/30">
                      <input
                        type="checkbox"
                        checked={formData.travail_en_presentiel}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          travail_en_presentiel: e.target.checked,
                          travail_bureau: e.target.checked ? formData.travail_bureau : ''
                        })}
                        className="rounded"
                      />
                      <span className="text-sm font-medium">Travail en présentiel</span>
                    </label>
                  </div>

                  {formData.travail_en_presentiel && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bureau *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Bureau 123, Bâtiment A"
                        value={formData.travail_bureau}
                        onChange={(e) => setFormData({ ...formData, travail_bureau: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Exam Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Durée de l'examen
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <input
                    type="checkbox"
                    checked={formData.duree_examen_moins_2h}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      duree_examen_moins_2h: e.target.checked,
                      duree_examen_minutes: e.target.checked ? formData.duree_examen_minutes : 120
                    })}
                    className="rounded"
                  />
                  <span className="text-sm">Mon examen dure moins de 2 heures</span>
                </label>
                
                {formData.duree_examen_moins_2h && (
                  <div className="ml-6 space-y-2">
                    <label className="block text-sm text-gray-600 dark:text-gray-400">
                      Durée en minutes
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="15"
                        max="120"
                        step="15"
                        value={formData.duree_examen_minutes}
                        onChange={(e) => setFormData({ ...formData, duree_examen_minutes: parseInt(e.target.value) || 60 })}
                        className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        minutes ({Math.floor(formData.duree_examen_minutes / 60)}h{formData.duree_examen_minutes % 60 > 0 ? (formData.duree_examen_minutes % 60).toString().padStart(2, '0') : ''})
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Durées courantes : 30min, 45min, 60min (1h), 90min (1h30)
                    </p>
                  </div>
                )}
              </div>
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

            {/* Warning if other teachers already submitted */}
            {existingSubmissionsStats.count > 0 && !showConfirmation && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">
                      Attention : D'autres enseignants ont déjà soumis pour ce cours
                    </h4>
                    <div className="text-sm text-amber-800 dark:text-amber-300 space-y-2">
                      <p>
                        {existingSubmissionsStats.count} enseignant{existingSubmissionsStats.count > 1 ? 's ont' : ' a'} déjà déclaré{existingSubmissionsStats.count > 1 ? 's' : ''} un total de{' '}
                        <strong>{existingSubmissionsStats.allSurveillants} surveillant{existingSubmissionsStats.allSurveillants > 1 ? 's' : ''}</strong> pour ce cours.
                      </p>
                      <div className="bg-amber-100 dark:bg-amber-900/30 rounded p-2 space-y-1">
                        {existingSubmissionsStats.teachers.map((teacher, idx) => (
                          <div key={idx} className="text-xs">
                            • {teacher.nom} : {teacher.nb_surveillants} surveillant{teacher.nb_surveillants > 1 ? 's' : ''}
                          </div>
                        ))}
                      </div>
                      <p className="font-medium text-blue-900 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 p-2 rounded">
                        💡 Le champ ci-dessus a été pré-rempli avec le total actuel ({existingSubmissionsStats.allSurveillants}). Vous pouvez le modifier si nécessaire.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmation && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-400 dark:border-orange-600 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-bold text-orange-900 dark:text-orange-300 text-lg mb-2">
                      Confirmation requise
                    </h4>
                    <div className="text-sm text-orange-800 dark:text-orange-300 space-y-2">
                      <p>
                        Vous êtes sur le point de définir le nombre total de surveillants à <strong>{formData.nb_surveillants_accompagnants} surveillant{formData.nb_surveillants_accompagnants > 1 ? 's' : ''}</strong> pour ce cours.
                      </p>
                      {existingSubmissionsStats.totalSurveillants > 0 && (
                        <p>
                          Note : {existingSubmissionsStats.count} autre{existingSubmissionsStats.count > 1 ? 's' : ''} enseignant{existingSubmissionsStats.count > 1 ? 's ont' : ' a'} déjà déclaré un total de {existingSubmissionsStats.totalSurveillants} surveillant{existingSubmissionsStats.totalSurveillants > 1 ? 's' : ''}.
                        </p>
                      )}
                      <p className="font-semibold text-orange-900 dark:text-orange-200">
                        Confirmez-vous ce nombre de surveillants ?
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowConfirmation(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    onClick={handleConfirmAndSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirmer et enregistrer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Submit */}
            {!showConfirmation && (
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
            )}
          </form>
        )}
      </div>
    </div>
  );
}
