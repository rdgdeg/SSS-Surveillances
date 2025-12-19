import React, { useState } from 'react';
import { Calendar, Download, Search, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '../../components/shared/Button';
import CalendarExportButton from '../../components/shared/CalendarExportButton';
import { useSurveillances } from '../../hooks/useSurveillances';
import { generateMultipleEventsICS, downloadICSFile, surveillanceToCalendarEvent } from '../../lib/calendarUtils';

const MesSurveillancesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  
  // Calculer les dates pour les filtres
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());

  // Déterminer les options de filtre basées sur la sélection
  const getFilterOptions = () => {
    switch (dateFilter) {
      case 'week':
        return {
          dateDebut: today.toISOString().split('T')[0],
          dateFin: nextWeek.toISOString().split('T')[0]
        };
      case 'month':
        return {
          dateDebut: today.toISOString().split('T')[0],
          dateFin: nextMonth.toISOString().split('T')[0]
        };
      case 'future':
        return {
          dateDebut: today.toISOString().split('T')[0]
        };
      default:
        return {};
    }
  };

  const { surveillances, loading, error, refreshSurveillances } = useSurveillances({
    surveillantNom: searchTerm,
    ...getFilterOptions()
  });

  const handleExportAll = () => {
    if (surveillances.length === 0) return;

    const events = surveillances.map(surveillance => surveillanceToCalendarEvent(surveillance));
    const icsContent = generateMultipleEventsICS(events);
    downloadICSFile(icsContent, 'mes-surveillances.ics');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5); // HH:MM
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Mes Surveillances
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Consultez vos surveillances et ajoutez-les à votre agenda
        </p>
      </div>

      {/* Filtres et actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Recherche par nom */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher par nom de surveillant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            {/* Filtre par date */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="all">Toutes les dates</option>
                <option value="future">À venir</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={refreshSurveillances}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </Button>
            
            {surveillances.length > 0 && (
              <Button
                onClick={handleExportAll}
                variant="default"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Exporter tout
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <span className="text-red-700 dark:text-red-300">
              Erreur lors du chargement des surveillances: {error}
            </span>
          </div>
        </div>
      )}

      {/* Liste des surveillances */}
      {surveillances.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Aucune surveillance trouvée
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || dateFilter !== 'all' 
              ? 'Aucune surveillance ne correspond aux critères de recherche.'
              : 'Vous n\'avez pas encore de surveillances assignées.'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Examen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date et Heure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Lieu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Surveillant
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {surveillances.map((surveillance) => (
                  <tr key={surveillance.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {surveillance.nom_examen}
                        </div>
                        {surveillance.type_examen && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {surveillance.type_examen}
                          </div>
                        )}
                        {surveillance.faculte && (
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {surveillance.faculte}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {formatDate(surveillance.date_examen)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatTime(surveillance.heure_debut)} - {formatTime(surveillance.heure_fin)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {surveillance.auditoire || 'Non spécifié'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {surveillance.surveillant_nom || 'Non assigné'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <CalendarExportButton
                        surveillance={surveillance}
                        variant="dropdown"
                        size="sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Informations sur l'export */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
          💡 Comment ajouter à votre agenda
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• <strong>Télécharger (.ics)</strong> : Fichier compatible avec tous les calendriers</li>
          <li>• <strong>Google Calendar</strong> : Ouvre directement dans Google Calendar</li>
          <li>• <strong>Outlook</strong> : Ouvre dans Outlook Web ou l'application</li>
          <li>• <strong>Yahoo Calendar</strong> : Ouvre dans Yahoo Calendar</li>
        </ul>
      </div>
    </div>
  );
};

export default MesSurveillancesPage;