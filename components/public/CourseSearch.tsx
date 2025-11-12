import React, { useState, useEffect } from 'react';
import { CoursSearchParams } from '../../types';

interface CourseSearchProps {
  onSearchChange: (params: CoursSearchParams) => void;
  resultCount?: number;
}

export function CourseSearch({ onSearchChange, resultCount }: CourseSearchProps) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'code' | 'intitule_complet' | 'updated_at'>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [hasInstructions, setHasInstructions] = useState<boolean | undefined>(undefined);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange({
        search: search || undefined,
        sortBy,
        sortOrder,
        hasInstructions
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [search, sortBy, sortOrder, hasInstructions, onSearchChange]);

  const handleClearSearch = () => {
    setSearch('');
  };

  const handleClearFilters = () => {
    setSearch('');
    setSortBy('code');
    setSortOrder('asc');
    setHasInstructions(undefined);
  };

  const hasActiveFilters = search || hasInstructions !== undefined || sortBy !== 'code' || sortOrder !== 'asc';

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
      <div className="space-y-4">
        {/* Search input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Rechercher par code ou intitulé..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={handleClearSearch}
            >
              <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>

        {/* Filters and sort */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Sort by */}
          <div className="flex items-center gap-2">
            <label htmlFor="sortBy" className="text-sm font-medium text-gray-700">
              Trier par:
            </label>
            <select
              id="sortBy"
              className="block w-auto rounded-md border-gray-300 py-1.5 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="code">Code</option>
              <option value="intitule_complet">Intitulé</option>
              <option value="updated_at">Date de mise à jour</option>
            </select>
          </div>

          {/* Sort order */}
          <button
            type="button"
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? (
              <>
                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
                </svg>
                Croissant
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z" />
                </svg>
                Décroissant
              </>
            )}
          </button>

          {/* Filter by instructions */}
          <div className="flex items-center gap-2">
            <label htmlFor="hasInstructions" className="text-sm font-medium text-gray-700">
              Consignes:
            </label>
            <select
              id="hasInstructions"
              className="block w-auto rounded-md border-gray-300 py-1.5 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              value={hasInstructions === undefined ? 'all' : hasInstructions ? 'yes' : 'no'}
              onChange={(e) => {
                const value = e.target.value;
                setHasInstructions(value === 'all' ? undefined : value === 'yes');
              }}
            >
              <option value="all">Tous</option>
              <option value="yes">Avec consignes</option>
              <option value="no">Sans consignes</option>
            </select>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              type="button"
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={handleClearFilters}
            >
              <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Réinitialiser
            </button>
          )}
        </div>

        {/* Result count */}
        {resultCount !== undefined && (
          <div className="text-sm text-gray-600">
            {resultCount} cours trouvé{resultCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
