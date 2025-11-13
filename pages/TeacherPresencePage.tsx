import React, { useState } from 'react';
import { TeacherExamSearch } from '../components/public/TeacherExamSearch';
import { ManualExamForm } from '../components/public/ManualExamForm';
import { TeacherPresenceForm } from '../components/public/TeacherPresenceForm';
import { Examen } from '../types';

type ViewMode = 'search' | 'manual' | 'presence';

function TeacherPresencePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('search');
  const [selectedExamen, setSelectedExamen] = useState<Examen | null>(null);
  const [defaultEmail, setDefaultEmail] = useState('');

  // Get active session (you might want to fetch this from your API)
  const activeSessionId = 'your-active-session-id'; // TODO: Replace with actual session fetching

  const handleExamenSelect = (examen: Examen) => {
    setSelectedExamen(examen);
    setViewMode('presence');
  };

  const handleManualEntry = () => {
    setViewMode('manual');
  };

  const handleManualExamenCreated = (examen: Examen) => {
    setSelectedExamen(examen);
    setViewMode('presence');
  };

  const handleCancel = () => {
    setSelectedExamen(null);
    setViewMode('search');
  };

  const handleSuccess = () => {
    // Reset to search view after successful submission
    setSelectedExamen(null);
    setViewMode('search');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Déclaration de présence aux examens</h1>
          <p className="mt-2 text-sm text-gray-600">
            Déclarez votre présence et le nombre de surveillants que vous amenez
          </p>
        </div>

        {/* Breadcrumb */}
        {viewMode !== 'search' && (
          <div className="mb-6">
            <button
              onClick={handleCancel}
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour à la recherche
            </button>
          </div>
        )}

        {/* Content based on view mode */}
        <div className="space-y-6">
          {viewMode === 'search' && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <TeacherExamSearch
                sessionId={activeSessionId}
                onExamenSelect={handleExamenSelect}
                onManualEntry={handleManualEntry}
              />
            </div>
          )}

          {viewMode === 'manual' && (
            <ManualExamForm
              sessionId={activeSessionId}
              enseignantEmail={defaultEmail}
              onSuccess={handleManualExamenCreated}
              onCancel={handleCancel}
            />
          )}

          {viewMode === 'presence' && selectedExamen && (
            <TeacherPresenceForm
              examen={selectedExamen}
              defaultEmail={defaultEmail}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          )}
        </div>

        {/* Help section */}
        {viewMode === 'search' && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-sm font-medium text-blue-900 mb-3">Besoin d'aide ?</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start">
                <svg className="h-5 w-5 mr-2 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>Recherchez votre examen par code (ex: MATH101) ou par nom</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 mr-2 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>Si votre examen n'apparaît pas, vous pouvez le saisir manuellement</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 mr-2 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>Vous pouvez modifier votre déclaration à tout moment</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherPresencePage;
