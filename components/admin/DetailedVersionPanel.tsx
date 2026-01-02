import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { 
  History, 
  Eye, 
  Calendar,
  User,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  GitBranch,
  Diff,
  TrendingUp,
  BarChart3,
  Activity,
  ChevronDown,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  getDetailedRecentChanges,
  getDetailedVersionHistory,
  analyzeModificationPatterns,
  getDetailedVersionStatistics,
  formatUtils 
} from '../../lib/versioningService';
import toast from 'react-hot-toast';

interface DetailedVersionPanelProps {
  tableName?: string;
  recordId?: string;
  showAnalytics?: boolean;
  className?: string;
}

const DetailedVersionPanel: React.FC<DetailedVersionPanelProps> = ({
  tableName,
  recordId,
  showAnalytics = true,
  className = ''
}) => {
  const [changes, setChanges] = useState<any[]>([]);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedChanges, setExpandedChanges] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'changes' | 'patterns' | 'stats'>('changes');

  useEffect(() => {
    loadData();
  }, [tableName, recordId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (tableName && recordId) {
        // Historique spécifique d'un enregistrement
        const historyData = await getDetailedVersionHistory(tableName, recordId, 50);
        setChanges(historyData);
      } else if (tableName) {
        // Changements pour une table spécifique
        const changesData = await getDetailedRecentChanges(7);
        setChanges(changesData.filter(c => c.table_name === tableName));
        
        if (showAnalytics) {
          const patternsData = await analyzeModificationPatterns(tableName, 30);
          setPatterns(patternsData);
        }
      } else {
        // Vue globale
        const [changesData, patternsData, statsData] = await Promise.all([
          getDetailedRecentChanges(7),
          showAnalytics ? analyzeModificationPatterns(null, 30) : Promise.resolve([]),
          showAnalytics ? getDetailedVersionStatistics() : Promise.resolve([])
        ]);
        
        setChanges(changesData);
        setPatterns(patternsData);
        setStatistics(statsData);
      }
    } catch (error) {
      console.error('Error loading detailed version data:', error);
      toast.error('Erreur lors du chargement des données détaillées');
    } finally {
      setLoading(false);
    }
  };

  const toggleChangeExpansion = (changeId: string) => {
    const newExpanded = new Set(expandedChanges);
    if (newExpanded.has(changeId)) {
      newExpanded.delete(changeId);
    } else {
      newExpanded.add(changeId);
    }
    setExpandedChanges(newExpanded);
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'INSERT': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'UPDATE': return <GitBranch className="h-4 w-4 text-blue-500" />;
      case 'DELETE': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'RESTORE': return <History className="h-4 w-4 text-purple-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'INSERT': return 'bg-green-50 border-green-200';
      case 'UPDATE': return 'bg-blue-50 border-blue-200';
      case 'DELETE': return 'bg-red-50 border-red-200';
      case 'RESTORE': return 'bg-purple-50 border-purple-200';
      default: return 'bg-gray-50 border-gray-200';
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
    <div className={`space-y-6 ${className}`}>
      {/* Onglets de navigation */}
      {showAnalytics && !recordId && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('changes')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'changes'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <History className="h-4 w-4 inline mr-2" />
              Changements détaillés
            </button>
            <button
              onClick={() => setActiveTab('patterns')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'patterns'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="h-4 w-4 inline mr-2" />
              Analyse des patterns
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stats'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-2" />
              Statistiques
            </button>
          </nav>
        </div>
      )}

      {/* Contenu des onglets */}
      {(activeTab === 'changes' || recordId) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {recordId ? 'Historique détaillé' : 'Changements récents détaillés'}
              <span className="text-sm font-normal text-gray-500">
                ({changes.length} modifications)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {changes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun changement trouvé</p>
              </div>
            ) : (
              <div className="space-y-4">
                {changes.map((change, index) => (
                  <div
                    key={change.version_id || index}
                    className={`border rounded-lg p-4 ${getOperationColor(change.operation_type)}`}
                  >
                    {/* En-tête du changement */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getOperationIcon(change.operation_type)}
                        <div>
                          <div className="font-medium text-sm">
                            {change.change_summary}
                          </div>
                          <div className="text-xs text-gray-600">
                            {change.record_identifier && (
                              <span className="font-mono bg-gray-100 px-2 py-1 rounded mr-2">
                                {change.record_identifier}
                              </span>
                            )}
                            {change.table_name} • {change.record_id}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          {formatUtils.formatDate(change.created_at)}
                        </div>
                        <div className="text-xs text-gray-500">
                          par {change.username || 'Système'}
                        </div>
                      </div>
                    </div>

                    {/* Détails des changements */}
                    {change.detailed_changes && change.operation_type === 'UPDATE' && (
                      <div className="mt-3">
                        <button
                          onClick={() => toggleChangeExpansion(change.version_id || index)}
                          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          {expandedChanges.has(change.version_id || index) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          Voir les détails des modifications ({change.fields_changed_count} champs)
                        </button>
                        
                        {expandedChanges.has(change.version_id || index) && (
                          <div className="mt-3 p-3 bg-white rounded border">
                            <div className="text-sm font-medium mb-2 flex items-center gap-2">
                              <Diff className="h-4 w-4" />
                              Modifications détaillées :
                            </div>
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-2 rounded">
                              {change.detailed_changes}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Raison du changement */}
                    {change.reason && (
                      <div className="mt-3 text-sm text-gray-600 flex items-start gap-2">
                        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>Raison :</strong> {change.reason}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analyse des patterns */}
      {activeTab === 'patterns' && showAnalytics && !recordId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Analyse des patterns de modification
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patterns.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune donnée d'analyse disponible</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(
                  patterns.reduce((acc, pattern) => {
                    if (!acc[pattern.analysis_type]) {
                      acc[pattern.analysis_type] = [];
                    }
                    acc[pattern.analysis_type].push(pattern);
                    return acc;
                  }, {} as Record<string, any[]>)
                ).map(([type, items]) => (
                  <div key={type} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      {type}
                    </h4>
                    <div className="space-y-2">
                      {items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.metric}:</span>
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                              {item.value}
                            </span>
                          </div>
                          <span className="text-gray-600">{item.details}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Statistiques détaillées */}
      {activeTab === 'stats' && showAnalytics && !recordId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Statistiques détaillées par table
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statistics.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune statistique disponible</p>
              </div>
            ) : (
              <div className="space-y-4">
                {statistics.map((stat) => (
                  <div key={stat.table_name} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{stat.table_name}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          stat.is_enabled 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {stat.is_enabled ? 'Activé' : 'Désactivé'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="font-bold text-blue-600">{stat.total_versions}</div>
                        <div className="text-gray-600">Total versions</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="font-bold text-green-600">{stat.unique_records}</div>
                        <div className="text-gray-600">Enregistrements</div>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded">
                        <div className="font-bold text-purple-600">{stat.changes_this_week}</div>
                        <div className="text-gray-600">Cette semaine</div>
                      </div>
                      <div className="text-center p-2 bg-orange-50 rounded">
                        <div className="font-bold text-orange-600">{stat.avg_fields_per_update || 0}</div>
                        <div className="text-gray-600">Champs/modif</div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-medium text-green-600">{stat.inserts}</div>
                        <div className="text-gray-500">Créations</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-blue-600">{stat.updates}</div>
                        <div className="text-gray-500">Modifications</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-red-600">{stat.deletes}</div>
                        <div className="text-gray-500">Suppressions</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-purple-600">{stat.restores}</div>
                        <div className="text-gray-500">Restaurations</div>
                      </div>
                    </div>

                    {stat.most_active_user && (
                      <div className="mt-3 text-xs text-gray-600">
                        <strong>Utilisateur le plus actif :</strong> {stat.most_active_user}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DetailedVersionPanel;