import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { 
  History, 
  RotateCcw, 
  Eye, 
  Download, 
  Calendar,
  User,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  GitBranch,
  Diff
} from 'lucide-react';
import { 
  DataVersion, 
  VersionComparison,
  getVersionHistory, 
  restoreVersion, 
  compareVersions,
  exportVersionHistory,
  formatUtils 
} from '../../lib/versioningService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface VersionHistoryPanelProps {
  tableName: string;
  recordId: string;
  onRestore?: () => void;
  className?: string;
}

const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  tableName,
  recordId,
  onRestore,
  className = ''
}) => {
  const { user } = useAuth();
  const [versions, setVersions] = useState<DataVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [comparison, setComparison] = useState<VersionComparison[] | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    loadVersionHistory();
  }, [tableName, recordId]);

  const loadVersionHistory = async () => {
    try {
      setLoading(true);
      const history = await getVersionHistory(tableName, recordId, 100);
      setVersions(history);
    } catch (error) {
      console.error('Error loading version history:', error);
      toast.error('Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    if (!user) return;

    const confirmed = window.confirm(
      'Êtes-vous sûr de vouloir restaurer cette version ? Cette action créera une nouvelle version avec les données restaurées.'
    );

    if (!confirmed) return;

    try {
      setRestoring(versionId);
      await restoreVersion(tableName, recordId, versionId, 'Restauration manuelle depuis l\'interface admin');
      toast.success('Version restaurée avec succès');
      await loadVersionHistory();
      onRestore?.();
    } catch (error) {
      console.error('Error restoring version:', error);
      toast.error('Erreur lors de la restauration');
    } finally {
      setRestoring(null);
    }
  };

  const handleCompareVersions = async () => {
    if (selectedVersions.length !== 2) {
      toast.error('Sélectionnez exactement 2 versions à comparer');
      return;
    }

    try {
      const comp = await compareVersions(selectedVersions[0], selectedVersions[1]);
      setComparison(comp);
      setShowComparison(true);
    } catch (error) {
      console.error('Error comparing versions:', error);
      toast.error('Erreur lors de la comparaison');
    }
  };

  const handleExport = async (format: 'json' | 'csv' = 'json') => {
    try {
      const exported = await exportVersionHistory(tableName, recordId, format);
      const blob = new Blob([exported], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historique-${tableName}-${recordId}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Historique exporté');
    } catch (error) {
      console.error('Error exporting history:', error);
      toast.error('Erreur lors de l\'export');
    }
  };

  const toggleVersionSelection = (versionId: string) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      } else if (prev.length < 2) {
        return [...prev, versionId];
      } else {
        return [prev[1], versionId];
      }
    });
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'INSERT': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'UPDATE': return <FileText className="h-4 w-4 text-blue-500" />;
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

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des versions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historique des versions ({versions.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              {selectedVersions.length === 2 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCompareVersions}
                  className="flex items-center gap-1"
                >
                  <Diff className="h-4 w-4" />
                  Comparer
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('json')}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
          {selectedVersions.length > 0 && (
            <p className="text-sm text-gray-600">
              {selectedVersions.length} version(s) sélectionnée(s) 
              {selectedVersions.length === 2 && ' - Cliquez sur "Comparer" pour voir les différences'}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun historique disponible pour cet enregistrement</p>
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className={`border rounded-lg p-4 transition-all ${
                    selectedVersions.includes(version.id)
                      ? 'border-indigo-300 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedVersions.includes(version.id)}
                        onChange={() => toggleVersionSelection(version.id)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getOperationIcon(version.operation_type)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getOperationColor(version.operation_type)}`}>
                            {formatUtils.formatOperationType(version.operation_type)}
                          </span>
                          <span className="text-sm text-gray-500">
                            Version #{versions.length - index}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>{formatUtils.formatDate(version.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span>{version.username || 'Système'}</span>
                          </div>
                        </div>

                        {version.reason && (
                          <div className="mt-2 text-sm text-gray-600">
                            <strong>Raison:</strong> {version.reason}
                          </div>
                        )}

                        {version.changed_fields && version.changed_fields.length > 0 && (
                          <div className="mt-2">
                            <div className="text-sm font-medium text-gray-700 mb-1">
                              Champs modifiés:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {version.changed_fields.map(field => (
                                <span
                                  key={field}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                                >
                                  {field}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-3 text-sm">
                          <div className="text-gray-600">
                            {formatUtils.generateChangeSummary(version)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Afficher les détails de la version
                          console.log('Version details:', version);
                        }}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        Détails
                      </Button>
                      
                      {version.operation_type !== 'DELETE' && index > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(version.id)}
                          disabled={restoring === version.id}
                          className="flex items-center gap-1 text-purple-600 hover:text-purple-700"
                        >
                          {restoring === version.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                          Restaurer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de comparaison */}
      {showComparison && comparison && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Comparaison des versions
              </h3>
              <Button
                variant="outline"
                onClick={() => setShowComparison(false)}
              >
                Fermer
              </Button>
            </div>

            <div className="space-y-4">
              {comparison.map((diff, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    diff.is_different ? 'border-orange-200 bg-orange-50' : 'border-gray-200'
                  }`}
                >
                  <div className="font-medium text-sm mb-2 flex items-center gap-2">
                    {diff.is_different && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                    {diff.field_name}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600 mb-1">Version 1:</div>
                      <div className="bg-red-50 border border-red-200 rounded p-2 font-mono">
                        {formatUtils.formatValue(diff.value_1)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600 mb-1">Version 2:</div>
                      <div className="bg-green-50 border border-green-200 rounded p-2 font-mono">
                        {formatUtils.formatValue(diff.value_2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VersionHistoryPanel;