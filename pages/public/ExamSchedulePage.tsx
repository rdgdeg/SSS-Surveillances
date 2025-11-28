import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useActiveSession } from '../../src/hooks/useActiveSession';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  BookOpen, 
  Search,
  Loader2,
  AlertCircle,
  Users,
  Filter,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import ExamenSurveillants from '../../components/public/ExamenSurveillants';

interface Examen {
  id: string;
  date_examen: string;
  heure_debut: string;
  heure_fin: string;
  auditoires: string;
  code_examen: string;
  nom_examen: string;
  secretariat: string;
  utiliser_consignes_specifiques?: boolean;
  consignes_specifiques_arrivee?: string;
  consignes_specifiques_mise_en_place?: string;
  consignes_specifiques_generales?: string;
  cours: {
    code: string;
    intitule_complet: string;
    consignes: string | null;
  } | null;
  surveillants_noms?: string[]; // Added for search/filter
}

interface AuditoireWithSurveillants {
  id: string;
  examen_id: string;
  auditoire: string;
  surveillants_noms: string[];
}

interface ConsigneSecretariat {
  id: string;
  code_secretariat: string;
  nom_secretariat: string;
  consignes_arrivee: string;
  consignes_mise_en_place: string;
  consignes_generales: string;
  heure_arrivee_suggeree: string;
}

export default function ExamSchedulePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSecretariat, setSelectedSecretariat] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedSurveillant, setSelectedSurveillant] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const { data: activeSession } = useActiveSession();

  // Fetch examens with surveillants
  const { data: examens, isLoading, error: queryError } = useQuery({
    queryKey: ['public-examens', activeSession?.id],
    queryFn: async () => {
      if (!activeSession?.id) return [];
      
      // Try to select with new columns, fallback to basic columns if they don't exist yet
      let query = supabase
        .from('examens')
        .select(`
          id,
          date_examen,
          heure_debut,
          heure_fin,
          auditoires,
          code_examen,
          nom_examen,
          secretariat,
          cours:cours_id (
            code,
            intitule_complet,
            consignes
          )
        `)
        .eq('session_id', activeSession.id)
        .order('date_examen', { ascending: true })
        .order('heure_debut', { ascending: true });

      const { data, error } = await query;
      
      // If successful, try to fetch consignes specifiques separately if columns exist
      if (data && !error) {
        try {
          const { data: dataWithConsignes } = await supabase
            .from('examens')
            .select(`
              id,
              utiliser_consignes_specifiques,
              consignes_specifiques_arrivee,
              consignes_specifiques_mise_en_place,
              consignes_specifiques_generales
            `)
            .eq('session_id', activeSession.id);
          
          // Merge consignes data if available
          if (dataWithConsignes) {
            const consignesMap = new Map(dataWithConsignes.map(c => [c.id, c]));
            data.forEach((exam: any) => {
              const consignes = consignesMap.get(exam.id);
              if (consignes) {
                exam.utiliser_consignes_specifiques = consignes.utiliser_consignes_specifiques;
                exam.consignes_specifiques_arrivee = consignes.consignes_specifiques_arrivee;
                exam.consignes_specifiques_mise_en_place = consignes.consignes_specifiques_mise_en_place;
                exam.consignes_specifiques_generales = consignes.consignes_specifiques_generales;
              }
            });
          }
        } catch (consignesError) {
          // Columns don't exist yet, that's ok - consignes will just not be available
          console.log('Consignes spécifiques columns not yet available');
        }
      }
      
      if (error) throw error;
      return (data || []) as unknown as Examen[];
    },
    enabled: !!activeSession?.id,
  });

  // Fetch consignes secretariat
  const { data: consignesSecretariat } = useQuery({
    queryKey: ['consignes-secretariat'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consignes_secretariat')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      return (data || []) as ConsigneSecretariat[];
    },
  });

  // Fetch surveillants for all examens
  const { data: auditoires } = useQuery({
    queryKey: ['all-auditoires-surveillants', activeSession?.id],
    queryFn: async () => {
      if (!activeSession?.id || !examens) return [];
      
      const examenIds = examens.map(e => e.id);
      if (examenIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('v_examen_auditoires_with_surveillants')
        .select('*')
        .in('examen_id', examenIds);
      
      if (error) throw error;
      return (data || []) as AuditoireWithSurveillants[];
    },
    enabled: !!activeSession?.id && !!examens && examens.length > 0,
  });

  // Enrich examens with surveillants names
  const examensWithSurveillants = useMemo(() => {
    if (!examens || !auditoires) return examens || [];
    
    return examens.map(examen => {
      const examenAuditoires = auditoires.filter(a => a.examen_id === examen.id);
      const surveillantsNoms = examenAuditoires.flatMap(a => a.surveillants_noms || []);
      
      return {
        ...examen,
        surveillants_noms: surveillantsNoms,
      };
    });
  }, [examens, auditoires]);

  // Get unique dates, secretariats, time slots, and surveillants
  const uniqueDates = useMemo(() => {
    if (!examensWithSurveillants) return [];
    const dates = [...new Set(examensWithSurveillants.map(e => e.date_examen).filter(Boolean))];
    return dates.sort();
  }, [examensWithSurveillants]);

  const uniqueSecretariats = useMemo(() => {
    if (!examensWithSurveillants) return [];
    return [...new Set(examensWithSurveillants.map(e => e.secretariat).filter(Boolean))].sort();
  }, [examensWithSurveillants]);

  const uniqueTimeSlots = useMemo(() => {
    if (!examensWithSurveillants) return [];
    return [...new Set(examensWithSurveillants.map(e => e.heure_debut).filter(Boolean))].sort();
  }, [examensWithSurveillants]);

  // Get unique surveillants (last names only)
  const uniqueSurveillants = useMemo(() => {
    if (!examensWithSurveillants) return [];
    
    const allSurveillants = examensWithSurveillants.flatMap(e => e.surveillants_noms || []);
    
    // Extract last names (assuming format "Nom Prénom" or "Nom")
    const lastNames = allSurveillants
      .map(nom => {
        const parts = nom.trim().split(/\s+/);
        return parts[0]; // First word is typically the last name
      })
      .filter(Boolean);
    
    return [...new Set(lastNames)].sort((a, b) => a.localeCompare(b, 'fr'));
  }, [examensWithSurveillants]);

  // Filter and search examens
  const filteredExamens = useMemo(() => {
    if (!examensWithSurveillants) return [];
    
    return examensWithSurveillants.filter(examen => {
      // Search filter (includes surveillants)
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const coursCode = examen.cours?.code?.toLowerCase() || '';
        const coursIntitule = examen.cours?.intitule_complet?.toLowerCase() || '';
        const codeExamen = examen.code_examen?.toLowerCase() || '';
        const nomExamen = examen.nom_examen?.toLowerCase() || '';
        const auditoires = examen.auditoires?.toLowerCase() || '';
        const surveillantsText = (examen.surveillants_noms || []).join(' ').toLowerCase();
        
        const matchesSearch = 
          coursCode.includes(search) ||
          coursIntitule.includes(search) ||
          codeExamen.includes(search) ||
          nomExamen.includes(search) ||
          auditoires.includes(search) ||
          surveillantsText.includes(search);
        
        if (!matchesSearch) return false;
      }
      
      // Date filter
      if (selectedDate && examen.date_examen !== selectedDate) return false;
      
      // Secretariat filter
      if (selectedSecretariat && examen.secretariat !== selectedSecretariat) return false;
      
      // Time slot filter
      if (selectedTimeSlot && examen.heure_debut !== selectedTimeSlot) return false;
      
      // Surveillant filter (by last name)
      if (selectedSurveillant) {
        const hasSurveillant = (examen.surveillants_noms || []).some(nom => 
          nom.toLowerCase().startsWith(selectedSurveillant.toLowerCase())
        );
        if (!hasSurveillant) return false;
      }
      
      return true;
    });
  }, [examensWithSurveillants, searchTerm, selectedDate, selectedSecretariat, selectedTimeSlot, selectedSurveillant]);

  // Pagination
  const totalPages = Math.ceil(filteredExamens.length / itemsPerPage);
  const paginatedExamens = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredExamens.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredExamens, currentPage]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDate, selectedSecretariat, selectedTimeSlot, selectedSurveillant]);

  // Helper function to get consignes for a specific secretariat
  const getConsignesForSecretariat = (secretariatCode: string): ConsigneSecretariat | undefined => {
    if (!consignesSecretariat || !secretariatCode) return undefined;
    return consignesSecretariat.find(c => c.code_secretariat === secretariatCode);
  };

  // Function to sort auditoires alphabetically
  const sortAuditoires = (auditoires: string): string => {
    if (!auditoires) return '';
    
    // Split by common separators (comma, semicolon, slash, dash, etc.)
    const separators = /[,;\/\-\+&]/;
    const audList = auditoires.split(separators).map(a => a.trim()).filter(Boolean);
    
    // Sort alphabetically
    audList.sort((a, b) => a.localeCompare(b, 'fr', { numeric: true, sensitivity: 'base' }));
    
    // Join back with comma
    return audList.join(', ');
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Planning des Examens
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Session: {activeSession.name} ({activeSession.year})
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Pour les surveillants</p>
              <p>Utilisez la barre de recherche ou le filtre "Surveillant" pour trouver rapidement vos surveillances.</p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                💡 Astuce : Le filtre "Surveillant" affiche uniquement les noms de famille pour une recherche rapide.
              </p>
            </div>
          </div>
        </div>



        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par cours, surveillant, local..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Filter className="inline h-4 w-4 mr-1" />
                  Date
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Toutes les dates</option>
                  {uniqueDates.map((date) => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString('fr-FR', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Secrétariat
                </label>
                <select
                  value={selectedSecretariat}
                  onChange={(e) => setSelectedSecretariat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Tous les secrétariats</option>
                  {uniqueSecretariats.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Créneau horaire
                </label>
                <select
                  value={selectedTimeSlot}
                  onChange={(e) => setSelectedTimeSlot(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Tous les créneaux</option>
                  {uniqueTimeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Users className="inline h-4 w-4 mr-1" />
                  Surveillant
                </label>
                <select
                  value={selectedSurveillant}
                  onChange={(e) => setSelectedSurveillant(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Tous les surveillants</option>
                  {uniqueSurveillants.map((nom) => (
                    <option key={nom} value={nom}>
                      {nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results count */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {filteredExamens.length} examen{filteredExamens.length !== 1 ? 's' : ''} trouvé{filteredExamens.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {queryError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 text-red-800 dark:text-red-200">
              <AlertCircle className="h-6 w-6" />
              <div>
                <p className="font-medium">Erreur lors du chargement des examens</p>
                <p className="text-sm mt-1">{String(queryError)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        )}

        {/* Examens List */}
        {!isLoading && paginatedExamens && paginatedExamens.length > 0 ? (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 px-6 py-3 border-b border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-lg font-semibold text-indigo-900 dark:text-indigo-200">
                      Examens de la session
                    </h2>
                  </div>
                  <span className="text-sm text-indigo-700 dark:text-indigo-300">
                    Page {currentPage} / {totalPages}
                  </span>
                </div>
              </div>

              {/* Examens list */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedExamens.map((examen) => {
                  const consignes = getConsignesForSecretariat(examen.secretariat);
                  
                  return (
                    <div key={examen.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        {/* Left: Course Info */}
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-3">
                            <BookOpen className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-bold">
                                  {examen.code_examen}
                                </span>
                                {examen.cours && (
                                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                                    {examen.cours.code}
                                  </span>
                                )}
                              </div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {examen.nom_examen}
                              </p>
                              {examen.cours && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {examen.cours.intitule_complet}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-8">
                            {examen.date_examen && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {new Date(examen.date_examen).toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Clock className="h-4 w-4" />
                              <span>
                                {examen.heure_debut || '--:--'} - {examen.heure_fin || '--:--'}
                              </span>
                            </div>
                            {examen.auditoires && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <MapPin className="h-4 w-4" />
                                <span>{sortAuditoires(examen.auditoires)}</span>
                              </div>
                            )}
                          </div>

                          {/* Consignes : Spécifiques > Cours > Secrétariat */}
                          {(examen.utiliser_consignes_specifiques || examen.cours?.consignes || consignes) && (
                            <div className="mt-4 ml-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 text-xs">
                                  <p className="font-semibold text-blue-900 dark:text-blue-200 mb-1">
                                    Consignes pour les surveillants
                                  </p>
                                  {examen.utiliser_consignes_specifiques ? (
                                    <>
                                      <p className="text-blue-800 dark:text-blue-300 mb-1">
                                        <strong>Consignes spécifiques pour cet examen</strong>
                                      </p>
                                      {examen.consignes_specifiques_arrivee && (
                                        <p className="text-blue-700 dark:text-blue-300 mb-1">
                                          {examen.consignes_specifiques_arrivee}
                                        </p>
                                      )}
                                      {examen.consignes_specifiques_mise_en_place && (
                                        <p className="text-blue-700 dark:text-blue-300 mb-1">
                                          <strong>Mise en place :</strong> {examen.consignes_specifiques_mise_en_place}
                                        </p>
                                      )}
                                      {examen.consignes_specifiques_generales && (
                                        <p className="text-blue-700 dark:text-blue-300">
                                          {examen.consignes_specifiques_generales}
                                        </p>
                                      )}
                                    </>
                                  ) : examen.cours?.consignes ? (
                                    <>
                                      <p className="text-blue-800 dark:text-blue-300 mb-1">
                                        <strong>Consignes du cours {examen.cours.code}</strong>
                                      </p>
                                      <p className="text-blue-700 dark:text-blue-300 whitespace-pre-wrap">
                                        {examen.cours.consignes}
                                      </p>
                                    </>
                                  ) : consignes && (
                                    <>
                                      <p className="text-blue-800 dark:text-blue-300 mb-1">
                                        <strong>{consignes.nom_secretariat}</strong>
                                      </p>
                                      {consignes.consignes_arrivee && (
                                        <p className="text-blue-700 dark:text-blue-300 mb-1">
                                          <strong>Consignes d'arrivée :</strong> {consignes.consignes_arrivee}
                                        </p>
                                      )}
                                      {consignes.consignes_mise_en_place && (
                                        <p className="text-blue-700 dark:text-blue-300 mb-1">
                                          <strong>Consignes de mise en place :</strong> {consignes.consignes_mise_en_place}
                                        </p>
                                      )}
                                      {consignes.consignes_generales && (
                                        <p className="text-blue-700 dark:text-blue-300">
                                          <strong>Consignes générales :</strong> {consignes.consignes_generales}
                                        </p>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right: Surveillants */}
                        <ExamenSurveillants examenId={examen.id} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-6 py-4 mt-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Affichage {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredExamens.length)} sur {filteredExamens.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Précédent
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              currentPage === pageNum
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : !isLoading && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Aucun examen trouvé pour cette recherche' : 'Aucun examen planifié pour cette session'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
