import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCoursWithPresences } from '../../lib/teacherPresenceApi';
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

type FilterStatus = 'all' | 'declared' | 'pending';

export default function PresencesEnseignantsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedCours, setSelectedCours] = useState<CoursWithPresence | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

  // Filter and search logic
  const filteredCours = coursWithPresences?.filter(cours => {
    const matchesSearch = 
      cours.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cours.intitule_complet.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'declared' && cours.nb_presences_declarees > 0) ||
      (filterStatus === 'pending' && cours.nb_presences_declarees === 0);

    return matchesSearch && matchesFilter;
  });

  const handleExport = () => {
    if (!filteredCours) return;

    const csvContent = [
      ['Code Cours', 'Intitulé', 'Déclarations', 'Enseignants Présents', 'Surveillants Accompagnants'].join(','),
      ...filteredCours.map(cours => [
        cours.code,
        `"${cours.intitule_complet}"`,
        cours.nb_presences_declarees,
        cours.nb_enseignants_presents,
        cours.nb_surveillants_accompagnants_total
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `presences-enseignants-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

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
    total: coursWithPresences?.length || 0,
    declared: coursWithPresences?.filter(c => c.nb_presences_declarees > 0).length || 0,
    pending: coursWithPresences?.filter(c => c.nb_presences_declarees === 0).length || 0,
    totalTeachers: coursWithPresences?.reduce((sum, c) => sum + c.nb_enseignants_presents, 0) || 0,
    totalSupervisors: coursWithPresences?.reduce((sum, c) => sum + c.nb_surveillants_accompagnants_total, 0) || 0,
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
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Cours</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
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
        <div className="flex flex-col sm:flex-row gap-4">
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

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-indigo-600 text-white'
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
              {filteredCours?.map((cours) => (
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
                    {selectedCours.presences.map((presence) => (
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
                          {presence.est_present ? (
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
                        </div>

                        {presence.nb_surveillants_accompagnants > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <Users className="h-4 w-4 text-purple-600" />
                              <span className="font-medium">
                                {presence.nb_surveillants_accompagnants} surveillant(s)
                              </span>
                            </div>
                            {presence.noms_accompagnants && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 ml-6">
                                {presence.noms_accompagnants}
                              </p>
                            )}
                          </div>
                        )}

                        {presence.remarque && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Remarque:</span> {presence.remarque}
                            </p>
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
                    ))}
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
