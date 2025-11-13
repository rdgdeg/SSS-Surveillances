import React, { useState } from 'react';
import { ExamenWithStatus, ExamenFilters } from '../../types';
import { useExamens } from '../../src/hooks/useExamens';
import { ExamStatusBadge } from '../shared/ExamStatusBadge';
import { Pagination } from '../shared/Pagination';
import { updateExamen, deleteExamen } from '../../lib/examenManagementApi';

interface ExamListProps {
  sessionId: string;
  initialFilters?: ExamenFilters;
  onEditExam?: (exam: ExamenWithStatus) => void;
  onCreateExam?: () => void;
}

export function ExamList({ sessionId, initialFilters = {}, onEditExam, onCreateExam }: ExamListProps) {
  const [filters, setFilters] = useState<ExamenFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [editingField, setEditingField] = useState<{ examenId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const { examens, loading, error, total, refetch } = useExamens(sessionId, filters, page, pageSize);

  // Handle inline edit start
  const handleStartEdit = (examenId: string, field: string, currentValue: string) => {
    setEditingField({ examenId, field });
    setEditValue(currentValue || '');
  };

  // Handle inline edit save
  const handleSaveEdit = async (examenId: string, field: string) => {
    if (!editingField) return;

    try {
      setSaving(true);
      await updateExamen(examenId, { [field]: editValue || null } as any);
      setEditingField(null);
      refetch();
    } catch (err) {
      console.error('Error saving edit:', err);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // Handle inline edit cancel
  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  // Handle delete
  const handleDelete = async (examenId: string, examenCode: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'examen ${examenCode} ?`)) {
      return;
    }

    try {
      await deleteExamen(examenId);
      refetch();
    } catch (err) {
      console.error('Error deleting exam:', err);
      alert('Erreur lors de la suppression');
    }
  };

  // Handle key press in edit mode
  const handleKeyPress = (e: React.KeyboardEvent, examenId: string, field: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(examenId, field);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  if (loading && examens.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erreur lors du chargement des examens: {error.message}</p>
        <button
          onClick={() => refetch()}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white shadow-sm rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rechercher
            </label>
            <input
              type="text"
              placeholder="Code ou nom..."
              value={filters.search || ''}
              onChange={(e) => {
                setFilters({ ...filters, search: e.target.value });
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de début
            </label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => {
                setFilters({ ...filters, dateFrom: e.target.value });
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de fin
            </label>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => {
                setFilters({ ...filters, dateTo: e.target.value });
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Secretariat */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secrétariat
            </label>
            <input
              type="text"
              placeholder="MED, FARM..."
              value={filters.secretariat || ''}
              onChange={(e) => {
                setFilters({ ...filters, secretariat: e.target.value });
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Response Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut de réponse
            </label>
            <select
              value={filters.responseStatus || 'all'}
              onChange={(e) => {
                setFilters({ ...filters, responseStatus: e.target.value as any });
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous</option>
              <option value="declared">Déclaré</option>
              <option value="pending">En attente</option>
            </select>
          </div>

          {/* Course Linked */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cours lié
            </label>
            <select
              value={filters.hasCoursLinked === undefined ? 'all' : filters.hasCoursLinked ? 'yes' : 'no'}
              onChange={(e) => {
                const value = e.target.value === 'all' ? undefined : e.target.value === 'yes';
                setFilters({ ...filters, hasCoursLinked: value });
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous</option>
              <option value="yes">Oui</option>
              <option value="no">Non</option>
            </select>
          </div>

          {/* Supervisor Requirement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Surveillants définis
            </label>
            <select
              value={filters.hasSupervisorRequirement === undefined ? 'all' : filters.hasSupervisorRequirement ? 'yes' : 'no'}
              onChange={(e) => {
                const value = e.target.value === 'all' ? undefined : e.target.value === 'yes';
                setFilters({ ...filters, hasSupervisorRequirement: value });
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous</option>
              <option value="yes">Oui</option>
              <option value="no">Non</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({});
                setPage(1);
              }}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Heure
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Auditoires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Secrétariat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Surveillants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {examens.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    Aucun examen trouvé
                  </td>
                </tr>
              ) : (
                examens.map((examen) => (
                  <tr key={examen.id} className="hover:bg-gray-50">
                    {/* Date - Inline editable */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingField?.examenId === examen.id && editingField?.field === 'date_examen' ? (
                        <input
                          type="date"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(examen.id, 'date_examen')}
                          onKeyDown={(e) => handleKeyPress(e, examen.id, 'date_examen')}
                          className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                          disabled={saving}
                        />
                      ) : (
                        <div
                          onClick={() => handleStartEdit(examen.id, 'date_examen', examen.date_examen || '')}
                          className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                        >
                          {examen.date_examen || '-'}
                        </div>
                      )}
                    </td>

                    {/* Time - Inline editable */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingField?.examenId === examen.id && editingField?.field === 'heure_debut' ? (
                        <input
                          type="time"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(examen.id, 'heure_debut')}
                          onKeyDown={(e) => handleKeyPress(e, examen.id, 'heure_debut')}
                          className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                          disabled={saving}
                        />
                      ) : (
                        <div
                          onClick={() => handleStartEdit(examen.id, 'heure_debut', examen.heure_debut || '')}
                          className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                        >
                          {examen.heure_debut && examen.heure_fin
                            ? `${examen.heure_debut} - ${examen.heure_fin}`
                            : '-'}
                        </div>
                      )}
                    </td>

                    {/* Code */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{examen.code_examen}</span>
                        {!examen.cours_id && (
                          <svg
                            className="ml-2 h-4 w-4 text-yellow-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            title="Cours non lié"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={examen.nom_examen}>
                      {examen.nom_examen}
                    </td>

                    {/* Rooms - Inline editable */}
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {editingField?.examenId === examen.id && editingField?.field === 'auditoires' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(examen.id, 'auditoires')}
                          onKeyDown={(e) => handleKeyPress(e, examen.id, 'auditoires')}
                          className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                          disabled={saving}
                        />
                      ) : (
                        <div
                          onClick={() => handleStartEdit(examen.id, 'auditoires', examen.auditoires || '')}
                          className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded max-w-xs truncate"
                          title={examen.auditoires || ''}
                        >
                          {examen.auditoires || '-'}
                        </div>
                      )}
                    </td>

                    {/* Secretariat - Inline editable */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingField?.examenId === examen.id && editingField?.field === 'secretariat' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(examen.id, 'secretariat')}
                          onKeyDown={(e) => handleKeyPress(e, examen.id, 'secretariat')}
                          className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                          disabled={saving}
                        />
                      ) : (
                        <div
                          onClick={() => handleStartEdit(examen.id, 'secretariat', examen.secretariat || '')}
                          className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                        >
                          {examen.secretariat || 'Non assigné'}
                        </div>
                      )}
                    </td>

                    {/* Supervisors */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {examen.nb_surveillants_requis !== null ? examen.nb_surveillants_requis : '-'}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ExamStatusBadge
                        hasDeclarations={examen.has_presence_declarations}
                        count={examen.nb_presences_declarees}
                        showCount={true}
                      />
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => onEditExam?.(examen)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="Modifier"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(examen.id, examen.code_examen)}
                        className="text-red-600 hover:text-red-900"
                        title="Supprimer"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <Pagination
          currentPage={page}
          totalItems={total}
          itemsPerPage={pageSize}
          onPageChange={setPage}
          onItemsPerPageChange={setPageSize}
        />
      )}
    </div>
  );
}
