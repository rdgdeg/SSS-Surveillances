import { useState } from 'react';
import { ExamImport } from '../../components/admin/ExamImport';
import { ExamPresencesDashboard } from '../../components/admin/ExamPresencesDashboard';
import { ManualExamNotifications } from '../../components/admin/ManualExamNotifications';
import { ExamList } from '../../components/admin/ExamList';
import { ExamDashboard } from '../../components/admin/ExamDashboard';
import { ExamenCoursLinkManager } from '../../components/admin/ExamenCoursLinkManager';
import { ExamOrphanAlert } from '../../components/admin/ExamOrphanAlert';
import { useActiveSession } from '../../src/hooks/useActiveSession';
import { RefreshCw } from 'lucide-react';

type TabType = 'list' | 'dashboard' | 'presences' | 'import' | 'notifications' | 'link-cours';

function ExamensPage() {
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [filters, setFilters] = useState<any>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: activeSession, isLoading } = useActiveSession();

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const tabs = [
    { id: 'list' as TabType, name: 'Liste', icon: '📋' },
    { id: 'dashboard' as TabType, name: 'Tableau de bord', icon: '📊' },
    { id: 'presences' as TabType, name: 'Présences', icon: '✅' },
    { id: 'import' as TabType, name: 'Import', icon: '📥' },
    { id: 'link-cours' as TabType, name: 'Lier aux cours', icon: '🔗' },
    { id: 'notifications' as TabType, name: 'Notifications', icon: '🔔' },
  ];

  const handleMetricClick = (filterKey: string, filterValue: string) => {
    setFilters({ [filterKey]: filterValue });
    setActiveTab('list');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!activeSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Aucune session active</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des examens</h1>
            <p className="mt-2 text-sm text-gray-600">
              Session: {activeSession.name} ({activeSession.year})
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Rafraîchir
          </button>
        </div>

        {/* Orphan Alert */}
        <ExamOrphanAlert 
          sessionId={activeSession.id} 
          onLinkClick={() => setActiveTab('link-cours')}
        />

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab content */}
        <div className="space-y-6">
          {activeTab === 'list' && (
            <ExamList key={refreshKey} sessionId={activeSession.id} initialFilters={filters} />
          )}

          {activeTab === 'dashboard' && (
            <ExamDashboard key={refreshKey} sessionId={activeSession.id} onMetricClick={handleMetricClick} />
          )}

          {activeTab === 'presences' && (
            <ExamPresencesDashboard key={refreshKey} sessionId={activeSession.id} />
          )}

          {activeTab === 'import' && (
            <ExamImport key={refreshKey} sessionId={activeSession.id} />
          )}

          {activeTab === 'link-cours' && (
            <ExamenCoursLinkManager key={refreshKey} sessionId={activeSession.id} />
          )}

          {activeTab === 'notifications' && (
            <ManualExamNotifications
              key={refreshKey}
              onExamenValidated={() => {
                // Optionally refresh the dashboard
                console.log('Examen validated');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default ExamensPage;
