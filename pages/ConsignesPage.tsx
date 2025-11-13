import React, { useState } from 'react';
import { CourseSearch } from '../components/public/CourseSearch';
import { CourseList } from '../components/public/CourseList';
import { CourseInstructionsModal } from '../components/public/CourseInstructionsModal';
import { Pagination } from '../components/shared/Pagination';
import { useCoursQuery, useCoursDetailQuery } from '../src/hooks/useCours';
import { CoursSearchParams, CoursListItem } from '../types';

function ConsignesPage() {
  const [searchParams, setSearchParams] = useState<CoursSearchParams>({ page: 1, pageSize: 50 });
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const { data: coursData, isLoading } = useCoursQuery(searchParams);
  const { data: selectedCours } = useCoursDetailQuery(selectedCourseId);

  const totalPages = coursData ? Math.ceil(coursData.total / (searchParams.pageSize || 50)) : 0;

  const handleCourseClick = (course: CoursListItem) => {
    setSelectedCourseId(course.id);
  };

  const handleCloseModal = () => {
    setSelectedCourseId(null);
  };

  const handleSearchChange = (params: CoursSearchParams) => {
    setSearchParams({ ...params, page: 1, pageSize: 50 }); // Reset à la page 1 lors d'une recherche
  };

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Consignes d'examen</h1>
          <p className="mt-2 text-sm text-gray-600">
            Consultez les consignes spécifiques pour chaque cours
          </p>
        </div>

        {/* Search and filters */}
        <CourseSearch
          onSearchChange={handleSearchChange}
          resultCount={coursData?.total}
        />

        {/* Course list */}
        <CourseList
          courses={coursData?.data || []}
          onCourseClick={handleCourseClick}
          isLoading={isLoading}
        />

        {/* Pagination */}
        {!isLoading && coursData && coursData.total > 0 && (
          <Pagination
            currentPage={searchParams.page || 1}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={coursData.total}
            pageSize={searchParams.pageSize || 50}
          />
        )}

        {/* Instructions modal */}
        <CourseInstructionsModal
          cours={selectedCours || null}
          isOpen={!!selectedCourseId}
          onClose={handleCloseModal}
        />
      </div>
    </div>
  );
}


export default ConsignesPage;
