# Implementation Plan - Exam Management System

- [x] 1. Set up database schema and migrations
  - Create examens table with all required fields and constraints
  - Update presences_enseignants table to link to examens
  - Create indexes for performance optimization
  - Set up Row Level Security policies
  - Add database triggers for updated_at timestamps
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 11.1, 11.2, 12.1, 12.2, 12.3, 12.6_

- [x] 2. Implement CSV parser for exam import
  - [x] 2.1 Create examenCsvParser.ts with parsing logic
    - Implement parseExamenCSV function to parse semicolon-delimited CSV
    - Implement extractCourseCode function to clean activity codes
    - Implement convertDateFormat function (DD-MM-YY to YYYY-MM-DD)
    - Implement convertTimeFormat function ("09h00" to "09:00")
    - Implement parseDuration function ("02h00" to minutes)
    - Handle errors and warnings for malformed data
    - _Requirements: 1.1, 1.2_

  - [x] 2.2 Write unit tests for CSV parser
    - Test course code extraction with various formats
    - Test date and time conversion functions
    - Test duration parsing
    - Test error handling for invalid data
    - _Requirements: 1.1, 1.2_

- [x] 3. Create TypeScript types and interfaces
  - Add Examen, ExamenWithStatus, ExamenFormData types to types.ts
  - Add ExamenFilters, ExamenDashboardStats types
  - Add ParsedCSVExamen type for CSV parsing
  - Add ExamenImportResult type
  - Update PresenceEnseignant type to include examen_id
  - _Requirements: All requirements_

- [x] 4. Implement exam management API layer
  - [x] 4.1 Create examenManagementApi.ts with CRUD operations
    - Implement getExamens with filtering, sorting, and pagination
    - Implement getExamenById with course and presence joins
    - Implement createExamen with validation
    - Implement updateExamen with partial updates
    - Implement deleteExamen with cascade handling
    - Implement linkExamenToCours for manual course linking
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 4.2 Implement CSV import functionality
    - Implement importExamensFromCSV with batch processing
    - Implement course matching logic using extracted codes
    - Implement duplicate detection (session + code + date)
    - Add progress callback support
    - Handle errors and warnings appropriately
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 4.3 Implement dashboard statistics functions
    - Implement getExamenDashboardStats with aggregations
    - Calculate total exams, declarations, pending counts
    - Calculate total supervisors required
    - Calculate completion percentage
    - Group exams by secretariat and date
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

  - [x] 4.4 Implement presence status checking
    - Implement checkExamenPresenceStatus function
    - Query presences_enseignants for exam declarations
    - Return boolean flag and count
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 4.5 Write unit tests for API functions
    - Test CRUD operations with mock data
    - Test filtering and sorting logic
    - Test import with various CSV scenarios
    - Test dashboard statistics calculations
    - Test presence status checking
    - _Requirements: All API requirements_

- [x] 5. Create custom React hooks
  - [x] 5.1 Implement useExamens hook
    - Fetch examens with filters and pagination
    - Set up real-time subscription for changes
    - Handle loading and error states
    - Provide refetch function
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 5.2 Implement useExamenDashboard hook
    - Fetch dashboard statistics
    - Set up real-time updates
    - Handle loading states
    - Provide refetch function
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9_

- [x] 6. Build ExamStatusBadge component
  - Create shared component for response status display
  - Implement "Declared" badge (green) for exams with declarations
  - Implement "Pending" badge (yellow/orange) for exams without declarations
  - Add optional count display
  - Style with Tailwind CSS
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 7. Build ExamList component
  - [x] 7.1 Create base ExamList component structure
    - Set up component with table layout
    - Implement data fetching using useExamens hook
    - Display exam columns (date, time, code, name, rooms, supervisors, status)
    - Add loading and error states
    - _Requirements: 2.1, 2.4_

  - [x] 7.2 Implement filter controls
    - Add search input for code/name
    - Add date range picker
    - Add secretariat dropdown
    - Add response status filter (all/declared/pending)
    - Add course linked filter
    - Add supervisor requirement filter
    - Wire filters to useExamens hook
    - _Requirements: 2.2, 2.6_

  - [x] 7.3 Implement sorting functionality
    - Add sortable column headers
    - Implement sort by date, time, code, status
    - Add ascending/descending toggle
    - Update URL params for sort state
    - _Requirements: 2.3_

  - [x] 7.4 Implement inline editing
    - Add click-to-edit for date, time, rooms, secretariat fields
    - Implement auto-save on blur
    - Add validation for date and time formats
    - Show loading indicator during save
    - Handle save errors with revert
    - Support Escape key to cancel edit
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 7.5 Add action buttons
    - Add edit button to open modal
    - Add delete button with confirmation dialog
    - Implement delete functionality
    - Show success/error messages
    - _Requirements: 8.4, 8.5, 8.6, 8.7_

  - [x] 7.6 Implement pagination
    - Add pagination controls at bottom
    - Show page numbers and total count
    - Implement page size selector (25/50/100)
    - Update URL params for pagination state
    - _Requirements: 2.7_

  - [x] 7.7 Add status indicators
    - Display ExamStatusBadge for each exam
    - Show warning icon for exams without course link
    - Show warning icon for exams without supervisor requirement
    - Add tooltips for warnings
    - _Requirements: 5.1, 7.1, 7.2, 7.3, 7.4_

- [x] 8. Build ExamEditModal component
  - [x] 8.1 Create modal structure and form layout
    - Set up modal dialog with overlay
    - Create form with all exam fields
    - Add close button and backdrop click handling
    - Implement controlled form inputs
    - _Requirements: 4.1, 4.2_

  - [x] 8.2 Implement course selector
    - Add searchable dropdown for courses
    - Fetch courses from database
    - Display code and full name
    - Highlight field if no course linked
    - _Requirements: 4.3, 5.2, 5.3, 5.4_

  - [x] 8.3 Implement teacher list editor
    - Display current teachers as chips/tags
    - Add input to add new teachers
    - Add remove button for each teacher
    - Support comma-separated paste
    - _Requirements: 4.2_

  - [x] 8.4 Implement supervisor requirement input
    - Add numeric input field
    - Validate range (0-99)
    - Show current value or "Not set"
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 8.5 Add form validation
    - Validate required fields (course, date, times)
    - Validate date format (YYYY-MM-DD)
    - Validate time format (HH:MM)
    - Validate end time after start time
    - Display inline error messages
    - Prevent save if validation fails
    - _Requirements: 4.5, 4.6, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [x] 8.6 Implement save and cancel actions
    - Wire save button to updateExamen API
    - Show loading state during save
    - Close modal on successful save
    - Refresh exam list after save
    - Discard changes on cancel
    - _Requirements: 4.4, 4.7, 4.8_

- [x] 9. Build ExamImport component
  - [x] 9.1 Create file upload interface
    - Add file input for CSV upload
    - Validate file type (.csv)
    - Validate file size (max 5MB)
    - Display selected file name
    - _Requirements: 1.1_

  - [x] 9.2 Implement CSV preview
    - Parse uploaded CSV
    - Display first 10 rows in table
    - Show column headers
    - Highlight any parsing errors
    - _Requirements: 1.1, 1.2_

  - [x] 9.3 Implement import process
    - Add "Import" button to start process
    - Call importExamensFromCSV API
    - Show progress bar with percentage
    - Update progress every 10 records
    - Disable UI during import
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 9.4 Display import results
    - Show summary card with imported, updated, skipped counts
    - Display error list with details
    - Display warning list for unlinked courses
    - Add "View Exams" button to navigate to list
    - Add "Import Another" button to reset
    - _Requirements: 1.5, 1.6_

- [x] 10. Build ExamDashboard component
  - [x] 10.1 Create dashboard layout
    - Set up grid layout for metric cards
    - Add section for charts
    - Implement responsive design
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [x] 10.2 Implement metric cards
    - Create card for total exams
    - Create card for exams with declarations
    - Create card for pending declarations
    - Create card for total supervisors required
    - Create card for exams without course
    - Create card for exams without supervisor requirement
    - Add icons and colors for each metric
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 10.3 Implement completion percentage display
    - Calculate percentage of complete exams
    - Display progress bar
    - Show percentage number
    - Add color coding (red < 50%, yellow 50-80%, green > 80%)
    - _Requirements: 9.7_

  - [x] 10.4 Implement charts
    - Create bar chart for exams by date
    - Create pie chart for exams by secretariat
    - Use chart library (recharts or similar)
    - Add tooltips and legends
    - _Requirements: 9.8_

  - [x] 10.5 Add clickable metrics
    - Make metric cards clickable
    - Navigate to exam list with appropriate filters
    - Pass filter params via URL
    - _Requirements: 9.9_

  - [x] 10.6 Implement real-time updates
    - Set up subscription to exam changes
    - Refresh dashboard when exams change
    - Show loading indicator during refresh
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 11. Build ExamManagementPage component
  - [x] 11.1 Create page structure with tabs
    - Set up AdminLayout wrapper
    - Create tab navigation (List, Dashboard, Import)
    - Implement tab switching
    - Persist active tab in URL
    - _Requirements: All requirements_

  - [x] 11.2 Integrate child components
    - Render ExamList in List tab
    - Render ExamDashboard in Dashboard tab
    - Render ExamImport in Import tab
    - Pass sessionId to all components
    - _Requirements: All requirements_

  - [x] 11.3 Add page header
    - Display page title "Exam Management"
    - Show active session name
    - Add "Create Exam" button
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 11.4 Implement create exam functionality
    - Open ExamEditModal with empty form
    - Call createExamen API on save
    - Refresh exam list after creation
    - Show success message
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 12. Update navigation and routing
  - Add "Exams" menu item to admin navigation
  - Add route for /admin/exams
  - Update AdminLayout to include new route
  - Add icon for exams menu item
  - _Requirements: All requirements_

- [x] 13. Update presences_enseignants integration
  - [x] 13.1 Update presence submission to link to examen
    - Modify submitPresence API to accept examen_id
    - Update PresenceEnseignant type with examen_id
    - Update database queries to use examen_id
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 13.2 Update teacher presence form
    - Modify TeacherPresenceForm to work with exams
    - Update TeacherExamSearch to search examens table
    - Display exam details (date, time, rooms)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 13.3 Update admin presence view
    - Modify PresencesEnseignantsPage to show exam details
    - Display exam information alongside presence data
    - Update filters to work with exams
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 14. Add error handling and user feedback
  - Implement error boundaries for components
  - Add toast notifications for success/error messages
  - Add loading skeletons for data fetching
  - Add empty states for no data scenarios
  - Add confirmation dialogs for destructive actions
  - _Requirements: All requirements_

- [x] 15. Implement session filtering
  - Ensure all queries filter by active session
  - Update dashboard to show session-specific stats
  - Prevent cross-session data leakage
  - Update exam list when session changes
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 16. Add audit logging
  - Log exam creation with user and timestamp
  - Log exam updates with changed fields
  - Log exam deletion with user
  - Log CSV imports with result summary
  - _Requirements: All requirements_

- [ ] 17. Write integration tests
  - Test complete import workflow
  - Test exam editing workflow
  - Test presence status updates
  - Test dashboard calculations
  - Test session filtering
  - _Requirements: All requirements_

- [ ] 18. Perform end-to-end testing
  - Test CSV import with real data
  - Test manual course linking
  - Test inline editing
  - Test modal editing
  - Test dashboard metrics
  - Test multi-session workflow
  - _Requirements: All requirements_

- [ ] 19. Update documentation
  - Create user guide for exam management
  - Document CSV format requirements
  - Document course code extraction rules
  - Add screenshots and examples
  - Update admin documentation
  - _Requirements: All requirements_

- [ ] 20. Deploy and monitor
  - Run database migrations in production
  - Deploy updated application
  - Monitor for errors and performance issues
  - Gather user feedback
  - _Requirements: All requirements_
