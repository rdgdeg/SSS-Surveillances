import React, { useState } from 'react';
import { useExamensWithPresencesQuery } from '../../src/hooks/useExamens';
import { ExamStatusBadge } from '../shared/ExamStatusBadge';
import { Pagination } from '../shared/Pagination';
import { ExamenWithPresence, ExamenStatusFilter } from '../../types';

interface ExamPresencesDashboardProps {
  sessionId: string;
}

export function ExamPresencesDashboard({ sessionId }: ExamPresencesDashboardProps) {
  const [filter, setFilter] = useState<ExamenStatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'code' | 'date' | 'status'>('date');
  const pageSize = 50;

  const { data: examens, isLoading, error } = useExamensWithPresencesQuery(sessionId);

  // Filter examens
  const filteredExamens = React.useMemo(() => {
    if (!examens) return [];

    return examens.filter(examen => {
      if (filter === 'all') return true;
      if (filter === 'declared') return examen.nb_presences_declarees > 0;
      if (filter === 'pending') return examen.nb_presences_declarees === 0 && !examen.saisie_manuelle;
      if (filter === 'manual') return examen.saisie_manuelle;
      return true;
    });
  }, [examens, filter]);

  // Sort examens
  const sortedExamens = React.useMemo(() => {
    const sorted = [...filteredExamens];
    
    if (sortBy === 'code') {
      sorted.sort((a, b) => a.code_examen.localeCompare(b.code_examen));
    } else if (sortBy === 'date') {
      sorted.sort((a, b) => {
        if (!a.date_examen && !b.date_examen) return 0;
        if (!a.date_examen) return 1;
        if (!b.date_examen) return -1;
        return a.date_examen.localeCompare(b.date_examen);
      });
    } else if (sortBy === 'status') {
      sorted.sort((a, b) => {
        const statusA = a.saisie_manuelle ? 2 : (a.nb_presences_declarees > 0 ? 0 : 1);
        const statusB = b.saisie_manuelle ? 2 : (b.nb_presences_declarees > 0 ? 0 : 1);
        return statusA - statusB;
      });
    }
    
    return sorted;
  }, [filteredExamens, sortBy]);

  // Paginate
  const totalPages = Math.ceil(sortedExamens.length / pageSize);
  const paginatedExamens = sortedExamens.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Check if exam has declarations
  const hasDeclarations = (examen: ExamenWithPresence): boolean => {
    return examen.nb_presences_declarees > 0;
  };

  // Calculate stats
  const stats = React.useMemo(() => {
    if (!examens) return { total: 0, declared: 0, pending: 0, manual: 0 };
    
    return {
      total: examens.length,
      declared: examens.filter(e => e.nb_presences_declarees > 0).length,
      pending: examens.filter(e => e.nb_presences_declarees === 0 && !e.saisie_manuelle).length,
      manual: examens.filter(e => e.saisie_manuelle).length
    };
  }, [examens]);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-3 text-gray-600">Chargement des examens...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-red-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-red-900">Erreur de chargement</h4>
              <p className="text-sm text-red-800 mt-1">
                {error instanceof Error ? error.message : 'Une erreur est survenue'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Total examens</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Déclarés</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">{stats.declared}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">En attente</div>
          <div className="mt-1 text-2xl font-semibold text-orange-600">{stats.pending}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Saisie manuelle</div>
          <div className="mt-1 text-2xl font-semibold text-blue-600">{stats.manual}</div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filtrer:</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded-md ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tous ({stats.total})
              </button>
              <button
                onClick={() => setFilter('declared')}
                className={`px-3 py-1 text-sm rounded-md ${
                  filter === 'declared'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Déclarés ({stats.declared})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-3 py-1 text-sm rounded-md ${
                  filter === 'pending'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                En attente ({stats.pending})
              </button>
              <button
                onClick={() => setFilter('manual')}
                className={`px-3 py-1 text-sm rounded-md ${
                  filter === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Manuels ({stats.manual})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Trier par:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="date">Date</option>
              <option value="code">Code</option>
              <option value="status">Statut</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date/Heure
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Présences
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Surveillants
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedExamens.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    Aucun examen trouvé
                  </td>
                </tr>
              ) : (
                paginatedExamens.map((examen) => (
                  <tr key={examen.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {examen.code_examen}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {examen.nom_examen}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {examen.date_examen ? (
                        <div>
                          <div>{new Date(examen.date_examen).toLocaleDateString('fr-FR')}</div>
                          {examen.heure_debut && (
                            <div className="text-xs text-gray-500">
                              {examen.heure_debut} {examen.heure_fin && `- ${examen.heure_fin}`}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Non définie</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <ExamStatusBadge 
                        hasDeclarations={hasDeclarations(examen)} 
                        count={examen.nb_presences_declarees}
                        showCount={true}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {examen.nb_presences_declarees > 0 ? (
                        <div>
                          <span className="font-medium text-green-600">
                            {examen.nb_enseignants_presents}
                          </span>
                          <span className="text-gray-500"> / {examen.nb_enseignants_total}</span>
                          <div className="text-xs text-gray-500">
                            {examen.nb_presences_declarees} déclaration(s)
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Aucune</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {examen.nb_surveillants_accompagnants_total > 0 ? (
                        <span className="font-medium text-blue-600">
                          +{examen.nb_surveillants_accompagnants_total}
                        </span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
