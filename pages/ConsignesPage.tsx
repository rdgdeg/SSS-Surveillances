import React, { useState } from 'react';
import { CourseSearch } from '../components/public/CourseSearch';
import { CourseList } from '../components/public/CourseList';
import { CourseInstructionsModal } from '../components/public/CourseInstructionsModal';
import { useCoursQuery, useCoursDetailQuery } from '../src/hooks/useCours';
import { CoursSearchParams, CoursListItem } from '../types';

function ConsignesPage() {
  const [searchParams, setSearchParams] = useState<CoursSearchParams>({});
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const { data: coursData, isLoading } = useCoursQuery(searchParams);
  const { data: selectedCours } = useCoursDetailQuery(selectedCourseId);

  const handleCourseClick = (course: CoursListItem) => {
    setSelectedCourseId(course.id);
  };

  const handleCloseModal = () => {
    setSelectedCourseId(null);
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
          onSearchChange={setSearchParams}
          resultCount={coursData?.total}
        />

        {/* Course list */}
        <CourseList
          courses={coursData?.data || []}
          onCourseClick={handleCourseClick}
          isLoading={isLoading}
        />

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
