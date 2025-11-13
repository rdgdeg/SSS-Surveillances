import React, { useState } from 'react';
import { ExamImport } from '../../components/admin/ExamImport';
import { ExamPresencesDashboard } from '../../components/admin/ExamPresencesDashboard';
import { ManualExamNotifications } from '../../components/admin/ManualExamNotifications';

type TabType = 'dashboard' | 'import' | 'notifications';

function ExamensPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  // Get active session (you might want to fetch this from your API)
  const activeSessionId = 'your-active-session-id'; // TODO: Replace with actual session fetching

  const tabs = [
    { id: 'dashboard' as TabType, name: 'Présences', icon: '📊' },
    { id: 'import' as TabType, name: 'Import', icon: '📥' },
    { id: 'notifications' as TabType, name: 'Notifications', icon: '🔔' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des examens</h1>
          <p className="mt-2 text-sm text-gray-600">
            Importez les examens, consultez les déclarations de présence et gérez les notifications
          </p>
        </div>

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
          {activeTab === 'dashboard' && (
            <ExamPresencesDashboard sessionId={activeSessionId} />
          )}

          {activeTab === 'import' && (
            <ExamImport sessionId={activeSessionId} />
          )}

          {activeTab === 'notifications' && (
            <ManualExamNotifications
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
