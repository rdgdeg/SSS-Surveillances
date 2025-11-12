import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { AlertTriangle, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { CapacityStats } from '../../types';

interface CapacityDashboardProps {
  stats: CapacityStats;
  isLoading?: boolean;
}

export const CapacityDashboard: React.FC<CapacityDashboardProps> = ({ stats, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Si aucun créneau avec capacité définie
  if (stats.total_creneaux_avec_capacite === 0) {
    return (
      <Card className="mb-6 border-gray-300 dark:border-gray-600">
        <CardContent className="pt-6">
          <div className="text-center text-gray-500 dark:text-gray-400 py-4">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Aucune capacité définie</p>
            <p className="text-sm mt-1">Commencez par définir le nombre de surveillants requis pour chaque créneau.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const cards = [
    {
      title: 'Total avec capacité',
      value: stats.total_creneaux_avec_capacite,
      icon: TrendingUp,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
      description: 'créneaux configurés'
    },
    {
      title: 'Critiques',
      value: stats.creneaux_critiques,
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      description: '< 50% remplis',
      highlight: stats.creneaux_critiques > 0
    },
    {
      title: 'En alerte',
      value: stats.creneaux_alerte,
      icon: AlertCircle,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      description: '50-99% remplis',
      highlight: stats.creneaux_alerte > 0
    },
    {
      title: 'OK',
      value: stats.creneaux_ok,
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      description: '≥ 100% remplis'
    },
    {
      title: 'Taux moyen',
      value: `${Math.round(stats.taux_remplissage_moyen)}%`,
      icon: TrendingUp,
      color: stats.taux_remplissage_moyen >= 100 
        ? 'text-green-600 dark:text-green-400' 
        : stats.taux_remplissage_moyen >= 50 
          ? 'text-orange-600 dark:text-orange-400' 
          : 'text-red-600 dark:text-red-400',
      bgColor: stats.taux_remplissage_moyen >= 100 
        ? 'bg-green-100 dark:bg-green-900/30' 
        : stats.taux_remplissage_moyen >= 50 
          ? 'bg-orange-100 dark:bg-orange-900/30' 
          : 'bg-red-100 dark:bg-red-900/30',
      description: 'de remplissage'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card, index) => (
        <Card 
          key={index} 
          className={`${card.highlight ? 'border-2 border-orange-400 dark:border-orange-600 shadow-lg' : ''}`}
        >
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {card.title}
                </p>
                <p className={`text-3xl font-bold ${card.color} mb-1`}>
                  {card.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {card.description}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Composant compact pour afficher uniquement les statistiques critiques
export const CompactCapacityStats: React.FC<{ stats: CapacityStats }> = ({ stats }) => {
  if (stats.total_creneaux_avec_capacite === 0) {
    return null;
  }

  const hasIssues = stats.creneaux_critiques > 0 || stats.creneaux_alerte > 0;

  if (!hasIssues) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg text-sm">
        <CheckCircle className="h-4 w-4" />
        <span className="font-medium">Tous les créneaux sont OK</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-4 px-4 py-2 bg-orange-50 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg">
      {stats.creneaux_critiques > 0 && (
        <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
          <AlertTriangle className="h-4 w-4" />
          <span className="font-semibold">{stats.creneaux_critiques}</span>
          <span className="text-sm">critique{stats.creneaux_critiques > 1 ? 's' : ''}</span>
        </div>
      )}
      {stats.creneaux_alerte > 0 && (
        <div className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
          <AlertCircle className="h-4 w-4" />
          <span className="font-semibold">{stats.creneaux_alerte}</span>
          <span className="text-sm">en alerte</span>
        </div>
      )}
    </div>
  );
};
