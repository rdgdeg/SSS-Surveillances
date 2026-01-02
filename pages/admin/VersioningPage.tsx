import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { 
  History, 
  Database, 
  Calendar, 
  User, 
  Search, 
  Filter,
  Download,
  Settings,
  BarChart3,
  Clock,
  GitBranch,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Trash2,
  Eye,
  TrendingUp
} from 'lucide-react';
import { 
  VersionSummary,
  RecentChange,
  getVersionSummary,
  getDetailedRecentChanges,
  getVersioningMetadata,
  updateVersioningConfig,
  cleanupOldVersions,
  exportVersionHistory,
  getDetailedVersionStatistics,
  formatUtils
} from '../../lib/versioningService';
import VersionHistoryPanel from '../../components/admin/VersionHistoryPanel';
import DetailedVersionPanel from '../../components/admin/DetailedVersionPanel';
import EnhancedVersioningPanel from '../../components/admin/EnhancedVersioningPanel';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const VersioningPage: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<VersionSummary[]>([]);
  const [recentChanges, setRecentChanges] = useState<RecentChange[]>([]);
  const [metadata, setMetadata] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('7'); // derniers 7 jours
  const [userFilter, setUserFilter] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryData, changesData, metadataData] = await Promise.all([
        getVersionSummary(),
        getDetailedRecentChanges(parseInt(dateFilter)),
        getVersioningMetadata()
      ]);
      
      setSummary(summaryData);
      setRecentChanges(changesData);
      setMetadata(metadataData);
    } catch (error) {
      console.error('Error loading versioning data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async (tableName?: string) => {
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir nettoyer les anciennes versions ${tableName ? `de la table ${tableName}` : 'de toutes les tables'} ? Cette action est irréversible.`
    );

    if (!confirmed) return;

    try {
      setCleanupLoading(true);
      const deletedCount = await cleanupOldVersions(tableName);
      toast.success(`${deletedCount} versions supprimées`);
      await loadData();
    } catch (error) {
      console.error('Error cleaning up versions:', error);
      toast.error('Erreur lors du nettoyage');
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleExportAll = async (format: 'json' | 'csv' = 'json') => {
    try {
      const allData = await Promise.all(
        summary.map(async (table) => ({
          table: table.table_name,
          history: await exportVersionHistory(table.table_name, undefined, format)
        }))
      );

      const exportData = format === 'json' 
        ? JSON.stringify(allData, null, 2)
        : allData.map(d => d.history).join('\n\n');

      const blob = new Blob([exportData], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historique-complet-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Export complet terminé');
    } catch (error) {
      console.error('Error exporting all data:', error);
      toast.error('Erreur lors de l\'export');
    }
  };

  const filteredChanges = recentChanges.filter(change => {
    const matchesSearch = !searchTerm || 
      change.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      change.record_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (change.username && change.username.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesUser = !userFilter || 
      (change.username && change.username.toLowerCase().includes(userFilter.toLowerCase()));

    return matchesSearch && matchesUser;
  });

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'INSERT': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'UPDATE': return <GitBranch className="h-4 w-4 text-blue-500" />;
      case 'DELETE': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'RESTORE': return <RefreshCw className="h-4 w-4 text-purple-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <History className="h-8 w-8" />
          Système de Versioning
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'summary' ? 'default' : 'outline'}
            onClick={() => setViewMode('summary')}
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            Vue résumé
          </Button>
          <Button
            variant={viewMode === 'detailed' ? 'default' : 'outline'}
            onClick={() => setViewMode('detailed')}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Vue complète
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Configuration
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExportAll('json')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export complet
          </Button>
          <Button
            variant="outline"
            onClick={() => handleCleanup()}
            disabled={cleanupLoading}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            {cleanupLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Nettoyage
          </Button>
        </div>
      </div>

      {/* Vue conditionnelle selon le mode */}
      {viewMode === 'detailed' ? (
        <EnhancedVersioningPanel />
      ) : (
        <>
          {/* Résumé des versions par table */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {summary.map((table) => (
          <Card key={table.table_name} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  {table.table_name}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedTable(table.table_name);
                    setSelectedRecord('');
                  }}
                >
                  Voir
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total versions:</span>
                  <span className="font-medium">{table.total_versions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Enregistrements:</span>
                  <span className="font-medium">{table.unique_records}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dernier changement:</span>
                  <span className="font-medium text-xs">
                    {formatUtils.formatDate(table.last_change)}
                  </span>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>{table.inserts} créations</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <GitBranch className="h-3 w-3 text-blue-500" />
                      <span>{table.updates} modifications</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      <span>{table.deletes} suppressions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <RefreshCw className="h-3 w-3 text-purple-500" />
                      <span>{table.restores} restaurations</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCleanup(table.table_name)}
                    disabled={cleanupLoading}
                    className="w-full text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Nettoyer cette table
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Changements récents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Changements récents
            </CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="1">Dernières 24h</option>
                <option value="7">7 derniers jours</option>
                <option value="30">30 derniers jours</option>
                <option value="90">90 derniers jours</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                Actualiser
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par table, ID ou utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
            <div className="w-48">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filtrer par utilisateur"
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredChanges.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun changement récent trouvé</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredChanges.map((change, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getOperationIcon(change.operation_type)}
                      <div>
                        <div className="font-medium text-sm">
                          {change.table_name} • {change.record_id}
                        </div>
                        <div className="text-xs text-gray-600">
                          {formatUtils.formatOperationType(change.operation_type)} par {change.username || 'Système'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        {formatUtils.formatDate(change.created_at)}
                      </div>
                      {change.fields_changed > 0 && (
                        <div className="text-xs text-gray-500">
                          {change.fields_changed} champ(s) modifié(s)
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {change.reason && (
                    <div className="mt-2 text-sm text-gray-600">
                      <strong>Raison:</strong> {change.reason}
                    </div>
                  )}
                  
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTable(change.table_name);
                        setSelectedRecord(change.record_id);
                      }}
                      className="text-xs"
                    >
                      Voir l'historique
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Panneau d'historique détaillé */}
      {selectedTable && (
        <VersionHistoryPanel
          tableName={selectedTable}
          recordId={selectedRecord}
          onRestore={() => {
            loadData();
            toast.success('Données actualisées après restauration');
          }}
          className="mt-6"
        />
      )}

      {/* Configuration du versioning */}
      {showConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration du versioning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metadata.map((config) => (
                <div key={config.table_name} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{config.table_name}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        config.is_enabled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {config.is_enabled ? 'Activé' : 'Désactivé'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Rétention:</span>
                      <div className="font-medium">{config.retention_days} jours</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Max versions:</span>
                      <div className="font-medium">{config.max_versions_per_record}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Champs exclus:</span>
                      <div className="font-medium">{config.exclude_fields?.length || 0}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Dernière MAJ:</span>
                      <div className="font-medium text-xs">
                        {formatUtils.formatDate(config.updated_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
        </>
      )}
    </div>
  );
};

export default VersioningPage;