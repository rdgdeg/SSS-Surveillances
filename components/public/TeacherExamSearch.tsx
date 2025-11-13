import React, { useState } from 'react';
import { useExamenSearchQuery } from '../../src/hooks/useExamens';
import { Examen } from '../../types';

interface TeacherExamSearchProps {
  sessionId: string;
  onExamenSelect: (examen: Examen) => void;
  onManualEntry: () => void;
}

export function TeacherExamSearch({ sessionId, onExamenSelect, onManualEntry }: TeacherExamSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults, isLoading, error } = useExamenSearchQuery(sessionId, searchQuery);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleExamenClick = (examen: Examen) => {
    onExamenSelect(examen);
    setSearchQuery(''); // Reset search
  };

  const showResults = searchQuery.length >= 2;
  const hasResults = searchResults && searchResults.length > 0;

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="exam-search" className="block text-sm font-medium text-gray-700 mb-2">
          Rechercher votre examen
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            id="exam-search"
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Entrez le code ou le nom de l'examen..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            aria-label="Rechercher un examen"
            aria-describedby="search-description"
          />
        </div>
        <p id="search-description" className="mt-2 text-xs text-gray-500">
          Tapez au moins 2 caractères pour lancer la recherche
        </p>
      </div>

      {/* Loading state */}
      {isLoading && showResults && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center">
            <svg className="animate-spin h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-blue-900">Recherche en cours...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && showResults && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-red-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-red-900">Erreur de recherche</h4>
              <p className="text-sm text-red-800 mt-1">
                {error instanceof Error ? error.message : 'Une erreur est survenue'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {!isLoading && showResults && hasResults && (
        <div className="bg-white border border-gray-200 rounded-md shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-900">
              {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''}
            </h4>
          </div>
          <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {searchResults.map((examen) => (
              <li key={examen.id}>
                <button
                  onClick={() => handleExamenClick(examen)}
                  className="w-full px-4 py-3 hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {examen.code_examen}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {examen.nom_examen}
                      </p>
                      {examen.date_examen && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(examen.date_examen).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                          {examen.heure_debut && ` à ${examen.heure_debut}`}
                        </p>
                      )}
                    </div>
                    <svg className="h-5 w-5 text-gray-400 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No results */}
      {!isLoading && showResults && !hasResults && !error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-900">Aucun examen trouvé</h4>
              <p className="text-sm text-yellow-800 mt-1">
                Aucun examen ne correspond à votre recherche "{searchQuery}".
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Manual entry option */}
      <div className="border-t border-gray-200 pt-4">
        <button
          onClick={onManualEntry}
          className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Examen non trouvé ? Saisir manuellement
        </button>
      </div>
    </div>
  );
}
