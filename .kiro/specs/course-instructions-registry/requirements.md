# Requirements Document

## Introduction

This feature adds a course instructions registry to the surveillance application, allowing administrators to manage exam-specific instructions for each course and enabling supervisors to easily access these instructions during exams.

## Glossary

- **System**: The surveillance application
- **Course**: An academic course identified by a code (e.g., LEDPH1001) and title
- **Course Instructions**: Specific exam guidelines and rules for a particular course
- **Supervisor**: A person supervising an exam who needs to access course instructions
- **Administrator**: A user with admin privileges who can manage course instructions
- **Course Registry**: The database of all courses with their associated instructions
- **Default Instructions**: Generic message displayed when no specific instructions exist for a course

## Requirements

### Requirement 1

**User Story:** As a supervisor, I want to access course instructions quickly during an exam, so that I can ensure proper exam procedures are followed.

#### Acceptance Criteria

1. WHEN the Supervisor accesses the navigation menu, THE System SHALL display a "Consignes" (Instructions) button
2. WHEN the Supervisor clicks the "Consignes" button, THE System SHALL navigate to the course instructions page
3. THE System SHALL display a searchable and filterable list of all courses
4. WHEN the Supervisor searches for a course, THE System SHALL filter the course list based on course code or title
5. WHEN the Supervisor clicks on a course, THE System SHALL display the specific instructions for that course

### Requirement 2

**User Story:** As a supervisor, I want to see default instructions when specific course instructions are not available, so that I always have guidance on exam procedures.

#### Acceptance Criteria

1. WHEN the Supervisor views a course without specific instructions, THE System SHALL display "Se référer aux consignes générales et/ou présentes sur la feuille d'examen"
2. THE System SHALL clearly distinguish between courses with specific instructions and those without
3. THE System SHALL display instructions in a readable format

### Requirement 3

**User Story:** As an administrator, I want to import the UCLouvain course list, so that I can manage instructions for all relevant courses.

#### Acceptance Criteria

1. THE System SHALL store course data including course code and full title
2. THE System SHALL support importing courses from the provided CSV file format
3. THE System SHALL handle course codes with special characters and formatting
4. THE System SHALL maintain data integrity when importing multiple courses

### Requirement 4

**User Story:** As an administrator, I want to add and edit course-specific instructions, so that supervisors have accurate information for each exam.

#### Acceptance Criteria

1. WHEN the Administrator accesses the admin section, THE System SHALL provide access to course instructions management
2. THE System SHALL allow the Administrator to search and select a course
3. WHEN the Administrator selects a course, THE System SHALL display a form to add or edit instructions
4. THE System SHALL save course instructions when the Administrator submits the form
5. THE System SHALL allow the Administrator to update existing instructions
6. THE System SHALL allow the Administrator to delete instructions for a course

### Requirement 5

**User Story:** As an administrator, I want to view which courses have instructions defined, so that I can identify gaps in the instructions registry.

#### Acceptance Criteria

1. THE System SHALL display a list of all courses in the admin interface
2. THE System SHALL indicate which courses have instructions defined
3. THE System SHALL allow filtering courses by instruction status (with/without instructions)
4. THE System SHALL display the last update date for course instructions

### Requirement 6

**User Story:** As a supervisor, I want to sort and filter the course list efficiently, so that I can quickly find the course I need during an exam.

#### Acceptance Criteria

1. THE System SHALL allow sorting courses alphabetically by code
2. THE System SHALL allow sorting courses alphabetically by title
3. THE System SHALL provide a search field that filters in real-time
4. THE System SHALL display the number of courses matching the current filter
5. THE System SHALL maintain search and filter state during the session
