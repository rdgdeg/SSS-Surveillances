# Requirements Document - Exam Management System

## Introduction

This feature provides a comprehensive exam management system that allows administrators to import, view, edit, and track exams for each session. The system links exams to existing courses, tracks teacher presence declarations, manages supervisor requirements, and provides a dashboard for monitoring exam readiness.

## Glossary

- **System**: The exam management application
- **Admin**: Administrator user with full access to exam management features
- **Exam**: An examination event with date, time, location, and associated course
- **Course**: An academic course from the university course catalog
- **Teacher Presence**: Declaration by a teacher indicating attendance and accompanying supervisors for an exam
- **Supervisor Requirement**: The number of supervisors needed for a specific exam
- **Session**: An examination period (e.g., January 2026)
- **CSV Import**: Process of importing exam data from a CSV file
- **Response Status**: Indicator showing whether teachers have submitted presence information
- **Exam Dashboard**: Overview page showing exam statistics and readiness metrics
- **Secretariat**: Administrative department responsible for specific exams

## Requirements

### Requirement 1: CSV Import of Exams

**User Story:** As an Admin, I want to import exams from a CSV file for a specific session, so that I can quickly populate the exam schedule.

#### Acceptance Criteria

1. WHEN the Admin uploads a CSV file with exam data, THE System SHALL parse the file and extract exam information including date, day, duration, start time, end time, activity code, activity name, rooms, teachers, and secretariat
2. WHEN parsing the CSV file, THE System SHALL extract the course code from the activity code field by removing any suffix characters (e.g., "=E", "(T)=E")
3. WHEN importing an exam, THE System SHALL attempt to link it to an existing course in the database by matching the extracted course code
4. IF an exam with the same course code and date already exists for the session, THEN THE System SHALL skip the import of that exam to prevent duplicates
5. WHEN the import process completes, THE System SHALL display a summary showing the number of exams imported, skipped, and any errors encountered
6. WHEN an exam cannot be linked to an existing course, THE System SHALL flag it for manual course assignment and include it in the import warnings

### Requirement 2: Exam List Display and Filtering

**User Story:** As an Admin, I want to view all exams for a session with filtering and sorting options, so that I can easily find and manage specific exams.

#### Acceptance Criteria

1. WHEN the Admin navigates to the exam management page, THE System SHALL display a list of all exams for the active session
2. THE System SHALL provide filter options for date range, secretariat, response status (all/declared/pending), and course code or name
3. THE System SHALL provide sorting options for date, time, course code, and response status
4. WHEN displaying each exam in the list, THE System SHALL show the date, time, course code, course name, rooms, number of required supervisors, and response status badge
5. THE System SHALL display a badge indicating whether teacher presence information has been received (declared/pending)
6. WHEN the Admin applies filters or sorting, THE System SHALL update the exam list immediately without page reload
7. THE System SHALL provide pagination when the number of exams exceeds 25 items per page

### Requirement 3: Inline Exam Editing

**User Story:** As an Admin, I want to edit exam details directly in the exam list, so that I can quickly update information without opening a separate page.

#### Acceptance Criteria

1. WHEN the Admin clicks on an editable field in the exam list, THE System SHALL enable inline editing for that field
2. THE System SHALL allow inline editing of date, start time, end time, rooms, and secretariat fields
3. WHEN the Admin modifies a field and moves focus away, THE System SHALL save the changes automatically
4. IF the save operation fails, THEN THE System SHALL display an error message and revert the field to its previous value
5. WHEN the Admin presses the Escape key during inline editing, THE System SHALL cancel the edit and revert to the original value
6. THE System SHALL provide visual feedback (loading indicator) while saving changes

### Requirement 4: Modal Exam Editing

**User Story:** As an Admin, I want to open a detailed edit modal for an exam, so that I can modify all exam properties including the linked course and supervisor requirements.

#### Acceptance Criteria

1. WHEN the Admin clicks the edit button for an exam, THE System SHALL open a modal dialog with all exam details
2. THE System SHALL display editable fields for date, start time, end time, duration, rooms, teachers list, secretariat, and number of required supervisors
3. THE System SHALL provide a course selector dropdown showing all available courses from the database
4. WHEN the Admin changes the linked course, THE System SHALL update the exam's course association
5. WHEN the Admin saves changes in the modal, THE System SHALL validate all required fields before saving
6. IF validation fails, THEN THE System SHALL display error messages next to the invalid fields
7. WHEN the save operation succeeds, THE System SHALL close the modal and refresh the exam list
8. WHEN the Admin clicks cancel or the close button, THE System SHALL discard changes and close the modal

### Requirement 5: Manual Course Linking

**User Story:** As an Admin, I want to manually link an exam to a course when automatic matching fails, so that all exams are properly associated with courses.

#### Acceptance Criteria

1. WHEN an exam is not linked to a course, THE System SHALL display a warning indicator on that exam in the list
2. WHEN the Admin opens the edit modal for an unlinked exam, THE System SHALL highlight the course selector field
3. THE System SHALL provide a searchable dropdown of all courses with code and full name
4. WHEN the Admin selects a course from the dropdown, THE System SHALL link the exam to that course
5. WHEN the Admin saves the course link, THE System SHALL remove the warning indicator from the exam
6. THE System SHALL allow the Admin to change the linked course at any time

### Requirement 6: Supervisor Requirement Management

**User Story:** As an Admin, I want to specify the number of supervisors required for each exam, so that I can track staffing needs.

#### Acceptance Criteria

1. WHEN the Admin edits an exam, THE System SHALL provide a numeric input field for the number of required supervisors
2. THE System SHALL accept values between 0 and 99 for the supervisor requirement field
3. WHEN the Admin saves the supervisor requirement, THE System SHALL store the value with the exam record
4. THE System SHALL display the supervisor requirement in the exam list
5. IF no supervisor requirement is set, THEN THE System SHALL display a dash or "Not set" indicator

### Requirement 7: Teacher Response Status Tracking

**User Story:** As an Admin, I want to see which exams have received teacher presence declarations, so that I can identify exams that need follow-up.

#### Acceptance Criteria

1. WHEN displaying an exam in the list, THE System SHALL check if at least one teacher presence declaration exists for that exam
2. IF at least one presence declaration exists, THEN THE System SHALL display a "Declared" badge in green
3. IF no presence declarations exist, THEN THE System SHALL display a "Pending" badge in yellow or orange
4. WHEN the Admin filters by response status, THE System SHALL show only exams matching the selected status
5. THE System SHALL update the response status badge in real-time when a teacher submits a presence declaration

### Requirement 8: Exam Creation and Deletion

**User Story:** As an Admin, I want to manually create new exams and delete existing exams, so that I can manage the exam schedule completely.

#### Acceptance Criteria

1. WHEN the Admin clicks the "Add Exam" button, THE System SHALL open a modal with empty fields for creating a new exam
2. THE System SHALL require the Admin to select a course, enter a date, and specify start and end times for the new exam
3. WHEN the Admin saves the new exam, THE System SHALL validate all required fields and create the exam record
4. THE System SHALL provide a delete button for each exam in the list
5. WHEN the Admin clicks the delete button, THE System SHALL display a confirmation dialog
6. WHEN the Admin confirms deletion, THE System SHALL remove the exam and all associated presence declarations
7. IF the deletion fails, THEN THE System SHALL display an error message and keep the exam in the list

### Requirement 9: Exam Dashboard

**User Story:** As an Admin, I want to view a dashboard with exam statistics, so that I can monitor the overall readiness of the exam session.

#### Acceptance Criteria

1. WHEN the Admin navigates to the exam dashboard, THE System SHALL display the total number of exams for the active session
2. THE System SHALL display the number of exams with teacher presence declarations received
3. THE System SHALL display the number of exams pending teacher presence declarations
4. THE System SHALL display the total number of supervisors required across all exams
5. THE System SHALL display the number of exams without a linked course
6. THE System SHALL display the number of exams without supervisor requirements set
7. THE System SHALL calculate and display the percentage of exams with complete information (course linked, supervisors set, presence declared)
8. THE System SHALL provide visual indicators (progress bars or charts) for key metrics
9. WHEN the Admin clicks on a metric, THE System SHALL navigate to the exam list with appropriate filters applied

### Requirement 10: Secretariat Field Management

**User Story:** As an Admin, I want to view and edit the secretariat responsible for each exam, so that I can ensure proper administrative assignment.

#### Acceptance Criteria

1. WHEN displaying an exam, THE System SHALL show the secretariat field value if present
2. IF the secretariat field is empty, THEN THE System SHALL display a placeholder indicating "Not assigned"
3. WHEN the Admin edits an exam, THE System SHALL allow modification of the secretariat field
4. THE System SHALL accept text input for the secretariat field with a maximum length of 100 characters
5. WHEN the Admin saves changes to the secretariat field, THE System SHALL update the exam record

### Requirement 11: Session-Specific Exam Management

**User Story:** As an Admin, I want exams to be associated with specific sessions, so that I can manage multiple exam periods independently.

#### Acceptance Criteria

1. WHEN importing exams, THE System SHALL associate all imported exams with the currently active session
2. WHEN displaying the exam list, THE System SHALL show only exams for the currently active session
3. WHEN the Admin switches to a different session, THE System SHALL update the exam list to show exams for the new session
4. THE System SHALL prevent exams from one session from appearing in another session's list
5. WHEN calculating dashboard statistics, THE System SHALL include only exams from the currently active session

### Requirement 12: Exam Data Validation

**User Story:** As an Admin, I want the system to validate exam data, so that I can ensure data quality and consistency.

#### Acceptance Criteria

1. WHEN the Admin enters a date for an exam, THE System SHALL validate that the date is in the format YYYY-MM-DD
2. WHEN the Admin enters start or end times, THE System SHALL validate that the times are in the format HH:MM
3. WHEN the Admin enters an end time, THE System SHALL validate that the end time is after the start time
4. IF validation fails, THEN THE System SHALL display a clear error message indicating the issue
5. THE System SHALL prevent saving of exam data that fails validation
6. WHEN the Admin enters a supervisor requirement, THE System SHALL validate that the value is a non-negative integer
