import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import metricsCollector, { Metrics } from '../../lib/metricsCollector';
import { hasItems } from '../../lib/offlineQueueManager';

const MetricsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [queueSize, setQueueSize] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadMetrics = async () => {
    setIsRefreshing(true);
    try {
      const currentMetrics = metricsCollector.getMetrics();
      const hasQueueItems = await hasItems();
      
      setMetrics(currentMetrics);
      setQueueSize(hasQueueItems ? 1 : 0); // Simplifié
    } catch (error) {
      console.error('Erreur lors du chargement des métriques:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadMetrics, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement des métriques...</div>
      </div>
    );
  }

  const getStatusColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600 dark:text-green-400';
    if (rate >= 80) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatusIcon = (rate: number) => {
    if (rate >= 95) return <TrendingUp className="h-5 w-5" />;
    return <TrendingDown className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="h-6 w-6" />
          Métriques de Fiabilité
        </h2>
        <Button
          onClick={loadMetrics}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Grille de métriques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Taux de succès */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taux de succès</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className={`text-3xl font-bold ${getStatusColor(metrics.successRate)}`}>
                {metrics.successRate}%
              </div>
              <div className={getStatusColor(metrics.successRate)}>
                {getStatusIcon(metrics.successRate)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Temps de réponse */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Temps de réponse moyen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {metrics.responseTime}ms
              </div>
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        {/* File d'attente */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>File d'attente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className={`text-3xl font-bold ${queueSize > 10 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                {queueSize}
              </div>
              {queueSize > 10 && <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
            </div>
          </CardContent>
        </Card>

        {/* Retries moyens */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tentatives moyennes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {metrics.averageRetries}
              </div>
              <RefreshCw className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Détails supplémentaires */}
      <Card>
        <CardHeader>
          <CardTitle>Détails des métriques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-500 dark:text-gray-400">Taux d'échec</div>
              <div className="text-lg font-semibold">{metrics.failureRate}%</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Temps traitement file</div>
              <div className="text-lg font-semibold">{metrics.queueProcessingTime}ms</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Max tentatives</div>
              <div className="text-lg font-semibold">{metrics.maxRetries}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Dernière mise à jour</div>
              <div className="text-lg font-semibold">
                {new Date(metrics.timestamp).toLocaleTimeString('fr-FR')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertes */}
      {(metrics.failureRate > 5 || metrics.responseTime > 5000 || queueSize > 10) && (
        <Card className="border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              Alertes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-red-800 dark:text-red-300">
              {metrics.failureRate > 5 && (
                <li>⚠️ Taux d'échec élevé: {metrics.failureRate}% (seuil: 5%)</li>
              )}
              {metrics.responseTime > 5000 && (
                <li>⚠️ Temps de réponse élevé: {metrics.responseTime}ms (seuil: 5000ms)</li>
              )}
              {queueSize > 10 && (
                <li>⚠️ File d'attente importante: {queueSize} éléments (seuil: 10)</li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MetricsDashboard;
