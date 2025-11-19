import React, { useState } from 'react';
import { ExamenWithStatus, ExamenFilters } from '../../types';
import { useExamens } from '../../src/hooks/useExamens';
import { ExamStatusBadge } from '../shared/ExamStatusBadge';
import { Pagination } from '../shared/Pagination';
import { updateExamen, deleteExamen, createExamen } from '../../lib/examenManagementApi';
import { Plus, Edit2, Trash2, X, Save, Users } from 'lucide-react';
import { Button } from '../shared/Button';
import toast from 'react-hot-toast';
import { useDebouncedSearch } from '../../src/hooks/useDebouncedSearch';
import { useAuth } from '../../contexts/AuthContext';
import ExamenAuditoiresModal from './ExamenAuditoiresModal';

interface ExamListProps {
  sessionId: string;
  initialFilters?: ExamenFilters;
  onEditExam?: (exam: ExamenWithStatus) => void;
  onCreateExam?: () => void;
}

interface ExamFormData {
  cours_id: string | null;
  code_examen: string;
  nom_examen: string;
  date_examen: string;
  heure_debut: string;
  heure_fin: string;
  duree_minutes: number | null;
  auditoires: string;
  enseignants: string[];
  secretariat: string;
  nb_surveillants_requis: number | null;
}

export function ExamList({ sessionId, initialFilters = {}, onEditExam, onCreateExam }: ExamListProps) {
  const { user } = useAuth();
  const { searchTerm, debouncedTerm, setSearchTerm, isDebouncing } = useDebouncedSearch(300);
  const [filters, setFilters] = useState<ExamenFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingField, setEditingField] = useState<{ examenId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<ExamenWithStatus | null>(null);
  const [showAuditoiresModal, setShowAuditoiresModal] = useState<{ id: string; nom: string } | null>(null);
  const [formData, setFormData] = useState<ExamFormData>({
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
    nb_surveillants_requis: null,
  });

  // Utiliser le terme debounced pour les requêtes API
  const debouncedFilters = { ...filters, search: debouncedTerm };
  const { examens, loading, error, total, refetch } = useExamens(sessionId, debouncedFilters, page, pageSize);

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
      await updateExamen(
        examenId, 
        { [field]: editValue || null } as any,
        user?.id,
        user?.username
      );
      setEditingField(null);
      refetch();
      toast.success('Modification enregistrée');
    } catch (err) {
      console.error('Error saving edit:', err);
      toast.error('Erreur lors de la sauvegarde');
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
      await deleteExamen(examenId, user?.id, user?.username);
      toast.success('Examen supprimé');
      refetch();
    } catch (err) {
      console.error('Error deleting exam:', err);
      toast.error('Erreur lors de la suppression');
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

  // Handle create exam
  const handleOpenCreateModal = () => {
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
      nb_surveillants_requis: null,
    });
    setShowCreateModal(true);
  };

  const handleCreateExam = async () => {
    if (!formData.code_examen || !formData.nom_examen) {
      toast.error('Le code et le nom de l\'examen sont requis');
      return;
    }

    try {
      setSaving(true);
      await createExamen(sessionId, formData, user?.id, user?.username);
      toast.success('Examen créé avec succès');
      setShowCreateModal(false);
      refetch();
    } catch (err: any) {
      console.error('Error creating exam:', err);
      toast.error(`Erreur lors de la création: ${err.message || 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle edit exam in modal
  const handleOpenEditModal = (exam: ExamenWithStatus) => {
    setSelectedExam(exam);
    setFormData({
      cours_id: exam.cours_id || null,
      code_examen: exam.code_examen,
      nom_examen: exam.nom_examen,
      date_examen: exam.date_examen || '',
      heure_debut: exam.heure_debut || '',
      heure_fin: exam.heure_fin || '',
      duree_minutes: exam.duree_minutes || null,
      auditoires: exam.auditoires || '',
      enseignants: [],
      secretariat: exam.secretariat || '',
      nb_surveillants_requis: exam.nb_surveillants_requis,
    });
    setShowEditModal(true);
  };

  const handleUpdateExam = async () => {
    if (!selectedExam) return;

    try {
      setSaving(true);
      await updateExamen(selectedExam.id, formData, user?.id, user?.username);
      toast.success('Examen modifié avec succès');
      setShowEditModal(false);
      setSelectedExam(null);
      refetch();
    } catch (err: any) {
      console.error('Error updating exam:', err);
      toast.error(`Erreur lors de la modification: ${err.message || 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
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
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Liste des examens ({total})</h2>
        <Button onClick={handleOpenCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Créer un examen
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-sm rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rechercher
              {isDebouncing && <span className="ml-2 text-xs text-gray-500">(recherche...)</span>}
            </label>
            <input
              type="text"
              placeholder="Code ou nom..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
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
                      <div className="flex items-center gap-1">
                        {/* Heure début */}
                        {editingField?.examenId === examen.id && editingField?.field === 'heure_debut' ? (
                          <input
                            type="time"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleSaveEdit(examen.id, 'heure_debut')}
                            onKeyDown={(e) => handleKeyPress(e, examen.id, 'heure_debut')}
                            className="w-24 px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                            disabled={saving}
                          />
                        ) : (
                          <div
                            onClick={() => handleStartEdit(examen.id, 'heure_debut', examen.heure_debut || '')}
                            className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                            title="Cliquer pour modifier l'heure de début"
                          >
                            {examen.heure_debut || '--:--'}
                          </div>
                        )}
                        
                        <span className="text-gray-400">-</span>
                        
                        {/* Heure fin */}
                        {editingField?.examenId === examen.id && editingField?.field === 'heure_fin' ? (
                          <input
                            type="time"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleSaveEdit(examen.id, 'heure_fin')}
                            onKeyDown={(e) => handleKeyPress(e, examen.id, 'heure_fin')}
                            className="w-24 px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                            disabled={saving}
                          />
                        ) : (
                          <div
                            onClick={() => handleStartEdit(examen.id, 'heure_fin', examen.heure_fin || '')}
                            className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                            title="Cliquer pour modifier l'heure de fin"
                          >
                            {examen.heure_fin || '--:--'}
                          </div>
                        )}
                      </div>
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
                        onClick={() => handleOpenEditModal(examen)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="Modifier"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(examen.id, examen.code_examen)}
                        className="text-red-600 hover:text-red-900"
                        title="Supprimer"
                      >
                        <Trash2 className="h-5 w-5" />
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
          totalPages={Math.ceil(total / pageSize)}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Plus className="h-5 w-5 text-indigo-600" />
                  Créer un nouvel examen
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Code de l'examen <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code_examen}
                    onChange={(e) => setFormData({ ...formData, code_examen: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ex: WINTR2105"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Secrétariat
                  </label>
                  <input
                    type="text"
                    value={formData.secretariat}
                    onChange={(e) => setFormData({ ...formData, secretariat: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ex: MED, FARM"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom de l'examen <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nom_examen}
                  onChange={(e) => setFormData({ ...formData, nom_examen: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: INTERPR.DE L'ELECTROCARDIOGR."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date_examen}
                    onChange={(e) => setFormData({ ...formData, date_examen: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Heure début
                  </label>
                  <input
                    type="time"
                    value={formData.heure_debut}
                    onChange={(e) => setFormData({ ...formData, heure_debut: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Heure fin
                  </label>
                  <input
                    type="time"
                    value={formData.heure_fin}
                    onChange={(e) => setFormData({ ...formData, heure_fin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Auditoires
                </label>
                <input
                  type="text"
                  value={formData.auditoires}
                  onChange={(e) => setFormData({ ...formData, auditoires: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: AGOR 11, AGOR 12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Surveillants requis
                </label>
                <input
                  type="number"
                  value={formData.nb_surveillants_requis || ''}
                  onChange={(e) => setFormData({ ...formData, nb_surveillants_requis: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  min="0"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                disabled={saving}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateExam}
                disabled={saving || !formData.code_examen || !formData.nom_examen}
              >
                {saving ? 'Création...' : 'Créer l\'examen'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedExam && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Edit2 className="h-5 w-5 text-indigo-600" />
                  Modifier l'examen
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedExam(null);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Code de l'examen <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code_examen}
                    onChange={(e) => setFormData({ ...formData, code_examen: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Secrétariat
                  </label>
                  <input
                    type="text"
                    value={formData.secretariat}
                    onChange={(e) => setFormData({ ...formData, secretariat: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom de l'examen <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nom_examen}
                  onChange={(e) => setFormData({ ...formData, nom_examen: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date_examen}
                    onChange={(e) => setFormData({ ...formData, date_examen: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Heure début
                  </label>
                  <input
                    type="time"
                    value={formData.heure_debut}
                    onChange={(e) => setFormData({ ...formData, heure_debut: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Heure fin
                  </label>
                  <input
                    type="time"
                    value={formData.heure_fin}
                    onChange={(e) => setFormData({ ...formData, heure_fin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Auditoires
                </label>
                <input
                  type="text"
                  value={formData.auditoires}
                  onChange={(e) => setFormData({ ...formData, auditoires: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Surveillants requis
                </label>
                <input
                  type="number"
                  value={formData.nb_surveillants_requis || ''}
                  onChange={(e) => setFormData({ ...formData, nb_surveillants_requis: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  min="0"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedExam(null);
                }}
                disabled={saving}
              >
                Annuler
              </Button>
              <Button
                onClick={handleUpdateExam}
                disabled={saving || !formData.code_examen || !formData.nom_examen}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
