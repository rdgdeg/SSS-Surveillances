import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { 
  History, 
  Filter, 
  Calendar, 
  User, 
  Search, 
  Download, 
  Trash2,
  Eye,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  GitBranch,
  Clock,
  FileText,
  Database,
  Settings,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface VersionEvent {
  id: string;
  table_name: string;
  record_id: string;
  operation_type: 'INSERT' | 'UPDATE' | 'DELETE' | 'RESTORE';
  change_summary: string;
  detailed_changes: string;
  username: string;
  reason: string;
  created_at: string;
  fields_changed_count: number;
  record_identifier: string;
  old_values: any;
  new_values: any;
  changed_fields: string[];
}

interface FilterOptions {
  dateFrom: string;
  dateTo: string;
  operationType: string;
  tableName: string;
  username: string;
  searchTerm: string;
}

const EnhancedVersioningPanel: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<VersionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [filters, setFilters] = useState<FilterOptions>({
    dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    operationType: '',
    tableName: '',
    username: '',
    searchTerm: ''
  });

  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);

  useEffect(() => {
    loadVersionEvents();
    loadFilterOptions();
  }, [filters]);

  const loadVersionEvents = async () => {
    try {
      setLoading(true);
      
      // Construire la requête avec filtres
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.operationType) params.append('operationType', filters.operationType);
      if (filters.tableName) params.append('tableName', filters.tableName);
      if (filters.username) params.append('username', filters.username);
      if (filters.searchTerm) params.append('search', filters.searchTerm);

      const response = await fetch(`/api/versioning/events?${params}`);
      if (!response.ok) throw new Error('Erreur lors du chargement');
      
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error loading version events:', error);
      toast.error('Erreur lors du chargement des événements');
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const response = await fetch('/api/versioning/filter-options');
      if (!response.ok) throw new Error('Erreur lors du chargement des options');
      
      const data = await response.json();
      setAvailableTables(data.tables || []);
      setAvailableUsers(data.users || []);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const handleDeleteEvents = async (eventIds?: string[]) => {
    const idsToDelete = eventIds || selectedEvents;
    
    if (idsToDelete.length === 0) {
      toast.error('Aucun événement sélectionné');
      return;
    }

    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer ${idsToDelete.length} événement(s) ? Cette action est irréversible.`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      
      const response = await fetch('/api/versioning/events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventIds: idsToDelete })
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      toast.success(`${idsToDelete.length} événement(s) supprimé(s)`);
      setSelectedEvents([]);
      await loadVersionEvents();
    } catch (error) {
      console.error('Error deleting events:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteByDateRange = async () => {
    if (!filters.dateFrom || !filters.dateTo) {
      toast.error('Veuillez sélectionner une plage de dates');
      return;
    }

    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer TOUS les événements entre ${filters.dateFrom} et ${filters.dateTo} ? Cette action est irréversible.`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      
      const response = await fetch('/api/versioning/events/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dateFrom: filters.dateFrom, 
          dateTo: filters.dateTo,
          tableName: filters.tableName,
          operationType: filters.operationType
        })
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      const result = await response.json();
      toast.success(`${result.deletedCount} événement(s) supprimé(s)`);
      await loadVersionEvents();
    } catch (error) {
      console.error('Error bulk deleting events:', error);
      toast.error('Erreur lors de la suppression en masse');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportEvents = async (format: 'json' | 'csv' = 'json') => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      params.append('format', format);

      const response = await fetch(`/api/versioning/events/export?${params}`);
      if (!response.ok) throw new Error('Erreur lors de l\'export');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `versioning-events-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Export terminé');
    } catch (error) {
      console.error('Error exporting events:', error);
      toast.error('Erreur lors de l\'export');
    }
  };

  const toggleEventSelection = (eventId: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const selectAllEvents = () => {
    setSelectedEvents(events.map(e => e.id));
  };

  const clearSelection = () => {
    setSelectedEvents([]);
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'INSERT': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'UPDATE': return <GitBranch className="h-4 w-4 text-blue-500" />;
      case 'DELETE': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'RESTORE': return <RotateCcw className="h-4 w-4 text-purple-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'INSERT': return 'bg-green-50 border-green-200 text-green-800';
      case 'UPDATE': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'DELETE': return 'bg-red-50 border-red-200 text-red-800';
      case 'RESTORE': return 'bg-purple-50 border-purple-200 text-purple-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historique Complet des Modifications ({events.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1"
              >
                <Filter className="h-4 w-4" />
                Filtres
                {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportEvents('json')}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Export JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportEvents('csv')}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Panneau de filtres */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type d'opération
                  </label>
                  <select
                    value={filters.operationType}
                    onChange={(e) => setFilters(prev => ({ ...prev, operationType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Tous les types</option>
                    <option value="INSERT">Créations</option>
                    <option value="UPDATE">Modifications</option>
                    <option value="DELETE">Suppressions</option>
                    <option value="RESTORE">Restaurations</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Table
                  </label>
                  <select
                    value={filters.tableName}
                    onChange={(e) => setFilters(prev => ({ ...prev, tableName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Toutes les tables</option>
                    {availableTables.map(table => (
                      <option key={table} value={table}>{table}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Utilisateur
                  </label>
                  <select
                    value={filters.username}
                    onChange={(e) => setFilters(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Tous les utilisateurs</option>
                    {availableUsers.map(username => (
                      <option key={username} value={username}>{username}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recherche
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="ID, raison, contenu..."
                      value={filters.searchTerm}
                      onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({
                      dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      dateTo: new Date().toISOString().split('T')[0],
                      operationType: '',
                      tableName: '',
                      username: '',
                      searchTerm: ''
                    })}
                  >
                    Réinitialiser
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteByDateRange}
                    disabled={deleting || !filters.dateFrom || !filters.dateTo}
                    className="flex items-center gap-1"
                  >
                    {deleting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Supprimer par dates
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Actions de sélection */}
          {events.length > 0 && (
            <div className="flex items-center justify-between mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedEvents.length === events.length}
                    onChange={() => selectedEvents.length === events.length ? clearSelection() : selectAllEvents()}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">
                    {selectedEvents.length > 0 
                      ? `${selectedEvents.length} événement(s) sélectionné(s)`
                      : 'Sélectionner tout'
                    }
                  </span>
                </div>
                {selectedEvents.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Désélectionner
                  </Button>
                )}
              </div>
              {selectedEvents.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteEvents()}
                  disabled={deleting}
                  className="flex items-center gap-1"
                >
                  {deleting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Supprimer sélection
                </Button>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun événement trouvé avec les filtres actuels</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`border rounded-lg p-4 transition-all ${
                    selectedEvents.includes(event.id)
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event.id)}
                      onChange={() => toggleEventSelection(event.id)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getOperationIcon(event.operation_type)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getOperationColor(event.operation_type)}`}>
                            {event.operation_type}
                          </span>
                          <span className="text-sm font-medium">
                            {event.table_name}
                          </span>
                          <span className="text-sm text-gray-500">
                            ID: {event.record_id}
                          </span>
                          {event.record_identifier !== 'N/A' && (
                            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              {event.record_identifier}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            {formatDate(event.created_at)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedEvent(
                              expandedEvent === event.id ? null : event.id
                            )}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="text-sm text-gray-700 mb-2">
                        <strong>Résumé:</strong> {event.change_summary}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {event.username || 'Système'}
                        </div>
                        {event.fields_changed_count > 0 && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {event.fields_changed_count} champ(s) modifié(s)
                          </div>
                        )}
                      </div>

                      {event.reason && (
                        <div className="mt-2 text-sm">
                          <strong>Raison:</strong> {event.reason}
                        </div>
                      )}

                      {/* Détails étendus */}
                      {expandedEvent === event.id && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg space-y-3">
                          {event.detailed_changes && (
                            <div>
                              <h4 className="font-medium text-sm mb-2">Modifications détaillées:</h4>
                              <pre className="text-xs bg-white p-2 rounded border whitespace-pre-wrap">
                                {event.detailed_changes}
                              </pre>
                            </div>
                          )}

                          {event.changed_fields && event.changed_fields.length > 0 && (
                            <div>
                              <h4 className="font-medium text-sm mb-2">Champs modifiés:</h4>
                              <div className="flex flex-wrap gap-1">
                                {event.changed_fields.map(field => (
                                  <span
                                    key={field}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                                  >
                                    {field}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {event.old_values && (
                              <div>
                                <h4 className="font-medium text-sm mb-2">Valeurs avant:</h4>
                                <pre className="text-xs bg-red-50 p-2 rounded border max-h-32 overflow-y-auto">
                                  {JSON.stringify(event.old_values, null, 2)}
                                </pre>
                              </div>
                            )}
                            {event.new_values && (
                              <div>
                                <h4 className="font-medium text-sm mb-2">Valeurs après:</h4>
                                <pre className="text-xs bg-green-50 p-2 rounded border max-h-32 overflow-y-auto">
                                  {JSON.stringify(event.new_values, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedVersioningPanel;