import React, { useState } from 'react';
import { CourseSearch } from '../../components/public/CourseSearch';
import { CourseListAdmin } from '../../components/admin/CourseListAdmin';
import { CourseInstructionsForm } from '../../components/admin/CourseInstructionsForm';
import { CourseImport } from '../../components/admin/CourseImport';
import { useCoursQuery, useCoursDetailQuery, useCoursStatsQuery } from '../../src/hooks/useCours';
import { CoursSearchParams, CoursListItem } from '../../types';

export function CoursPage() {
  const [searchParams, setSearchParams] = useState<CoursSearchParams>({});
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  const { data: coursData, isLoading, refetch } = useCoursQuery(searchParams);
  const { data: selectedCours } = useCoursDetailQuery(selectedCourseId);
  const { data: stats } = useCoursStatsQuery();

  const handleEditClick = (course: CoursListItem) => {
    setSelectedCourseId(course.id);
  };

  const handleCloseForm = () => {
    setSelectedCourseId(null);
  };

  const handleSuccess = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des cours</h1>
              <p className="mt-2 text-sm text-gray-600">
                Gérez les consignes d'examen pour chaque cours
              </p>
            </div>
            <button
              onClick={() => setShowImport(!showImport)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              {showImport ? 'Masquer l\'import' : 'Importer des cours'}
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total des cours</dt>
                        <dd className="text-lg font-semibold text-gray-900">{stats.total}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Avec consignes</dt>
                        <dd className="text-lg font-semibold text-gray-900">{stats.withInstructions}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Sans consignes</dt>
                        <dd className="text-lg font-semibold text-gray-900">{stats.withoutInstructions}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Import section */}
        {showImport && (
          <div className="mb-6">
            <CourseImport />
          </div>
        )}

        {/* Search and filters */}
        <CourseSearch
          onSearchChange={setSearchParams}
          resultCount={coursData?.total}
        />

        {/* Course list */}
        <CourseListAdmin
          courses={coursData?.data || []}
          onEditClick={handleEditClick}
          isLoading={isLoading}
        />

        {/* Edit form modal */}
        {selectedCours && (
          <CourseInstructionsForm
            cours={selectedCours}
            onClose={handleCloseForm}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </div>
  );
}
