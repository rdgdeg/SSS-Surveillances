import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCoursWithPresences } from '../../lib/teacherPresenceApi';
import { supabase } from '../../lib/supabaseClient';
import { CoursWithPresence } from '../../types';
import { useActiveSession } from '../../src/hooks/useActiveSession';
import { 
  CheckCircle, 
  XCircle, 
  Users, 
  Search, 
  Filter,
  Download,
  Calendar,
  BookOpen,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Button } from '../../components/shared/Button';
import { ExportButton } from '../../components/shared/ExportButton';

type FilterStatus = 'all' | 'declared' | 'pending';
type FilterScope = 'all' | 'with-exams';

export default function PresencesEnseignantsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterScope, setFilterScope] = useState<FilterScope>('with-exams');
  const [selectedCours, setSelectedCours] = useState<CoursWithPresence | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingPresenceId, setEditingPresenceId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const itemsPerPage = 25;

  const { data: activeSession, isLoading: isLoadingSession } = useActiveSession();

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const { data: coursWithPresences, isLoading, error } = useQuery({
    queryKey: ['cours-presences', activeSession?.id, refreshKey],
    queryFn: () => {
      if (!activeSession?.id) {
        throw new Error('No active session');
      }
      return getCoursWithPresences(activeSession.id);
    },
    enabled: !!activeSession?.id,
    retry: false,
  });

  // Fetch cours IDs that have exams in the active session
  const { data: coursIdsWithExams } = useQuery({
    queryKey: ['cours-with-exams', activeSession?.id],
    queryFn: async () => {
      if (!activeSession?.id) return new Set<string>();
      
      const { data, error } = await supabase
        .from('examens')
        .select('cours_id')
        .eq('session_id', activeSession.id);
      
      if (error) throw error;
      
      return new Set(data?.map(e => e.cours_id).filter(Boolean) || []);
    },
    enabled: !!activeSession?.id,
  });

  // Filter and search logic
  const filteredCours = coursWithPresences?.filter(cours => {
    const matchesSearch = 
      cours.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cours.intitule_complet.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'declared' && cours.nb_presences_declarees > 0) ||
      (filterStatus === 'pending' && cours.nb_presences_declarees === 0);

    const matchesScope = 
      filterScope === 'all' ||
      (filterScope === 'with-exams' && coursIdsWithExams?.has(cours.id));

    return matchesSearch && matchesStatus && matchesScope;
  });

  // Pagination logic
  const totalPages = Math.ceil((filteredCours?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCours = filteredCours?.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterScope]);

  const exportData = filteredCours?.map(cours => ({
    'Code Cours': cours.code,
    'Intitulé': cours.intitule_complet,
    'Déclarations': cours.nb_presences_declarees,
    'Enseignants Présents': cours.nb_enseignants_presents,
    'Surveillants Accompagnants': cours.nb_surveillants_accompagnants_total,
  })) || [];

  if (isLoadingSession || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!activeSession) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <AlertCircle className="h-5 w-5" />
          <p>Aucune session active. Veuillez activer une session pour voir les présences.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
          <AlertCircle className="h-5 w-5" />
          <p>Erreur lors du chargement des présences</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: filteredCours?.length || 0,
    totalAll: coursWithPresences?.length || 0,
    withExams: coursIdsWithExams?.size || 0,
    declared: filteredCours?.filter(c => c.nb_presences_declarees > 0).length || 0,
    pending: filteredCours?.filter(c => c.nb_presences_declarees === 0).length || 0,
    totalTeachers: filteredCours?.reduce((sum, c) => sum + c.nb_enseignants_presents, 0) || 0,
    totalSupervisors: filteredCours?.reduce((sum, c) => sum + c.nb_surveillants_accompagnants_total, 0) || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            Présences Enseignants
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Suivi des déclarations de présence aux examens
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Rafraîchir
          </Button>
          <ExportButton
            data={exportData}
            filename="presences-enseignants"
            sheetName="Présences"
            size="default"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filterScope === 'with-exams' ? 'Cours avec examens' : 'Total Cours'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              {filterScope === 'with-exams' && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  sur {stats.totalAll} total
                </p>
              )}
            </div>
            <BookOpen className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Déclarés</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.declared}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En attente</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-amber-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Enseignants</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalTeachers}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Surveillants</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalSupervisors}</p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un cours..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Scope Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterScope('with-exams')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  filterScope === 'with-exams'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Calendar className="h-4 w-4" />
                Avec examens
              </button>
              <button
                onClick={() => setFilterScope('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterScope === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Tous les cours
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setFilterStatus('declared')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'declared'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Déclarés
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'pending'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                En attente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cours List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cours
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Déclarations
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Présents
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Surveillants
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedCours?.map((cours) => (
                <tr 
                  key={cours.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-bold">
                          {cours.code}
                        </span>
                      </div>
                      <div className="text-sm text-gray-900 dark:text-white font-medium mt-1">
                        {cours.intitule_complet}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {cours.nb_presences_declarees}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {cours.nb_enseignants_presents}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                      {cours.nb_surveillants_accompagnants_total}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {cours.nb_presences_declarees > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                        <CheckCircle className="h-3 w-3" />
                        Déclaré
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">
                        <AlertCircle className="h-3 w-3" />
                        En attente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedCours(cours)}
                    >
                      Détails
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCours?.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Aucun cours trouvé</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Affichage {startIndex + 1} à {Math.min(endIndex, filteredCours?.length || 0)} sur {filteredCours?.length || 0} cours
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
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
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedCours && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-bold">
                      {selectedCours.code}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedCours.intitule_complet}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedCours(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle className="h-6 w-6 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Déclarations</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedCours.nb_presences_declarees}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Présents</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {selectedCours.nb_enseignants_presents}
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Surveillants</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {selectedCours.nb_surveillants_accompagnants_total}
                  </p>
                </div>
              </div>

              {/* Presences List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Déclarations de présence
                </h3>
                {selectedCours.presences.length > 0 ? (
                  <div className="space-y-3">
                    {selectedCours.presences.map((presence) => {
                      const isEditing = editingPresenceId === presence.id;
                      
                      const handleEdit = () => {
                        setEditingPresenceId(presence.id);
                        setEditFormData({
                          est_present: presence.est_present,
                          nb_surveillants_accompagnants: presence.nb_surveillants_accompagnants || 0,
                          noms_accompagnants: presence.noms_accompagnants || '',
                          remarque: presence.remarque || '',
                        });
                      };
                      
                      const handleSave = async () => {
                        setIsSaving(true);
                        try {
                          const { error } = await supabase
                            .from('presences_enseignants')
                            .update(editFormData)
                            .eq('id', presence.id);
                          
                          if (error) throw error;
                          
                          setEditingPresenceId(null);
                          handleRefresh();
                        } catch (err) {
                          console.error('Error updating presence:', err);
                          alert('Erreur lors de la mise à jour');
                        } finally {
                          setIsSaving(false);
                        }
                      };
                      
                      const handleCancel = () => {
                        setEditingPresenceId(null);
                        setEditFormData({});
                      };
                      
                      return (
                        <div
                          key={presence.id}
                          className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {presence.enseignant_prenom} {presence.enseignant_nom}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {presence.enseignant_email}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <select
                                  value={editFormData.est_present ? 'true' : 'false'}
                                  onChange={(e) => setEditFormData({ ...editFormData, est_present: e.target.value === 'true' })}
                                  className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                  <option value="true">Présent</option>
                                  <option value="false">Absent</option>
                                </select>
                              ) : presence.est_present ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                                  <CheckCircle className="h-3 w-3" />
                                  Présent
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
                                  <XCircle className="h-3 w-3" />
                                  Absent
                                </span>
                              )}
                              {!isEditing && (
                                <button
                                  onClick={handleEdit}
                                  className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-xs"
                                >
                                  Modifier
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Type d'examen */}
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Type d'examen</p>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {(presence as any).type_examen === 'qcm' && '🔘 QCM'}
                                  {(presence as any).type_examen === 'qroc_manuel' && '📝 QROC (correction manuelle)'}
                                  {(presence as any).type_examen === 'qcm_qroc' && '🔘📝 QCM & QROC'}
                                  {(presence as any).type_examen === 'gradescope' && '💻 Gradescope'}
                                  {(presence as any).type_examen === 'oral' && '🗣️ Oral'}
                                  {(presence as any).type_examen === 'travail' && '📄 Travail'}
                                  {(presence as any).type_examen === 'autre' && `🔧 Autre: ${(presence as any).type_examen_autre || 'Non précisé'}`}
                                  {!(presence as any).type_examen && '❓ Non renseigné'}
                                </p>
                              </div>
                              
                              {(presence as any).type_presence && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Type de présence</p>
                                  <p className="text-sm text-gray-900 dark:text-white">
                                    {(presence as any).type_presence === 'present_full' && '✅ Surveillance complète'}
                                    {(presence as any).type_presence === 'present_partial' && '⚠️ Présence partielle'}
                                    {(presence as any).type_presence === 'absent' && '❌ Absent'}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Durée de l'examen */}
                          {(presence as any).duree_examen_moins_2h && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Durée de l'examen</p>
                              <p className="text-sm text-gray-900 dark:text-white">
                                ⏱️ {(presence as any).duree_examen_minutes} minutes 
                                ({Math.floor((presence as any).duree_examen_minutes / 60)}h{(presence as any).duree_examen_minutes % 60 > 0 ? (presence as any).duree_examen_minutes % 60 : ''})
                              </p>
                            </div>
                          )}

                          {/* Informations spécifiques au travail */}
                          {(presence as any).type_examen === 'travail' && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                              <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">📄 Informations sur le travail</p>
                              <div className="space-y-2">
                                {(presence as any).travail_date_depot && (
                                  <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Date limite de dépôt</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      📅 {new Date((presence as any).travail_date_depot).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                      })}
                                    </p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">Mode de dépôt</p>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {(presence as any).travail_en_presentiel ? '🏢 En présentiel' : '💻 En ligne'}
                                  </p>
                                </div>
                                {(presence as any).travail_en_presentiel && (presence as any).travail_bureau && (
                                  <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Bureau</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      📍 {(presence as any).travail_bureau}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Surveillants */}
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-2">
                              <Users className="h-4 w-4 text-purple-600" />
                              <span className="font-medium">Surveillants accompagnants:</span>
                              {isEditing ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={editFormData.nb_surveillants_accompagnants}
                                  onChange={(e) => setEditFormData({ ...editFormData, nb_surveillants_accompagnants: parseInt(e.target.value) || 0 })}
                                  className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                              ) : (
                                <span>{presence.nb_surveillants_accompagnants || 0}</span>
                              )}
                            </div>
                            {isEditing ? (
                              <textarea
                                value={editFormData.noms_accompagnants}
                                onChange={(e) => setEditFormData({ ...editFormData, noms_accompagnants: e.target.value })}
                                placeholder="Noms des surveillants"
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                rows={2}
                              />
                            ) : presence.noms_accompagnants && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 ml-6 whitespace-pre-line">
                                {presence.noms_accompagnants}
                              </p>
                            )}
                          </div>

                          {(isEditing || presence.remarque) && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Remarque:</p>
                              {isEditing ? (
                                <textarea
                                  value={editFormData.remarque}
                                  onChange={(e) => setEditFormData({ ...editFormData, remarque: e.target.value })}
                                  placeholder="Remarques"
                                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                  rows={2}
                                />
                              ) : (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {presence.remarque}
                                </p>
                              )}
                            </div>
                          )}

                          {isEditing && (
                            <div className="mt-4 flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={isSaving}
                              >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={isSaving}
                              >
                                Annuler
                              </Button>
                            </div>
                          )}

                          <div className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                            Soumis le {new Date(presence.submitted_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Aucune déclaration de présence pour ce cours
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
