# Implementation Plan - Course Instructions Registry

- [x] 1. Set up database schema and initial data
  - Create the `cours` table with all required fields and indexes
  - Set up Row Level Security policies for public read and admin write access
  - Create SQL migration file for the cours table
  - _Requirements: 1.1, 3.1, 3.2, 3.3, 3.4_

- [x] 2. Implement CSV import functionality
  - [x] 2.1 Create CSV parsing utility function
    - Parse semicolon-separated CSV format
    - Handle special characters and encoding
    - Validate row structure (code and title required)
    - _Requirements: 3.2, 3.3_
  
  - [x] 2.2 Create import API endpoint
    - Implement POST /api/admin/cours/import endpoint
    - Handle file upload and validation
    - Process CSV rows with error handling
    - Return import summary with success count and errors
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 2.3 Create admin import UI component
    - Build CourseImport component with file upload
    - Display import progress and results
    - Show error messages for failed imports
    - _Requirements: 3.1, 3.2_

- [x] 3. Implement core API endpoints
  - [x] 3.1 Create public course listing endpoint
    - Implement GET /api/cours with search, sort, and filter
    - Add pagination support
    - Return course list with instruction status
    - _Requirements: 1.3, 1.4, 6.1, 6.2, 6.3, 6.4_
  
  - [x] 3.2 Create course detail endpoint
    - Implement GET /api/cours/:id
    - Return full course information including instructions
    - _Requirements: 1.5, 2.1_
  
  - [x] 3.3 Create admin CRUD endpoints
    - Implement POST /api/admin/cours for creating courses
    - Implement PUT /api/admin/cours/:id for updating instructions
    - Implement DELETE /api/admin/cours/:id/consignes for removing instructions
    - Add proper authorization checks
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 4. Create TypeScript types and schemas
  - Define Cours, CoursListItem, CoursFormData interfaces
  - Create Zod validation schemas for course data
  - Add type definitions to types.ts
  - _Requirements: 3.1, 4.4_

- [x] 5. Build supervisor/public course instructions interface
  - [x] 5.1 Create ConsignesPage component
    - Build main page layout with search and list
    - Add navigation from menu
    - Implement responsive design
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 5.2 Create CourseSearch component
    - Build search input with real-time filtering
    - Add sort controls (by code, title)
    - Implement filter for courses with/without instructions
    - Display result count
    - _Requirements: 1.4, 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 5.3 Create CourseList component
    - Display searchable and sortable course list
    - Show course code, title, and instruction status indicator
    - Handle click to view course details
    - Implement virtual scrolling for performance
    - _Requirements: 1.3, 1.4, 1.5, 2.2_
  
  - [x] 5.4 Create CourseInstructionsModal component
    - Build modal to display course instructions
    - Show default message when no instructions exist
    - Display course code and title
    - Add print and copy functionality
    - _Requirements: 1.5, 2.1, 2.3_

- [x] 6. Build admin course management interface
  - [x] 6.1 Create CoursPage admin component
    - Build admin page for course management
    - Display course list with instruction status
    - Add import button and functionality
    - Show last update timestamps
    - _Requirements: 4.1, 5.1, 5.2, 5.3, 5.4_
  
  - [x] 6.2 Create CourseListAdmin component
    - Display admin view of courses with edit actions
    - Show instruction status indicators
    - Add quick edit buttons
    - Implement filtering by instruction status
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [x] 6.3 Create CourseInstructionsForm component
    - Build form for adding/editing instructions
    - Add textarea with character count
    - Implement save and cancel actions
    - Show validation errors
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 7. Add navigation menu integration
  - Add "Consignes" button to main navigation menu
  - Add appropriate icon for the menu item
  - Ensure proper routing to ConsignesPage
  - _Requirements: 1.1, 1.2_

- [x] 8. Implement data fetching hooks
  - Create useCoursQuery hook for fetching course list
  - Create useCoursDetailQuery hook for single course
  - Create useCoursMutation hook for admin operations
  - Add proper error handling and loading states
  - _Requirements: 1.3, 1.4, 1.5, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 9. Add search and filter logic
  - Implement debounced search functionality
  - Create filter functions for instruction status
  - Add sort logic for code and title
  - Maintain filter state in URL params
  - _Requirements: 1.4, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 10. Create database migration and seed script
  - Write SQL migration file for cours table creation
  - Create seed script to import initial course list from CSV
  - Add migration to Supabase setup documentation
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 11. Implement error handling and validation
  - Add form validation for course data
  - Implement API error handling with user-friendly messages
  - Add error boundaries for components
  - Handle edge cases (empty search, no results, etc.)
  - _Requirements: 2.1, 4.4, 4.6_

- [x] 12. Add styling and responsive design
  - Style ConsignesPage and all child components
  - Ensure mobile responsiveness
  - Add loading skeletons
  - Implement consistent design with existing app
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 2.3_

- [x] 13. Integrate with existing routing
  - Add route for /consignes page
  - Add route for /admin/cours page
  - Update App.tsx with new routes
  - Ensure proper authentication checks
  - _Requirements: 1.1, 1.2, 4.1_

- [x] 14. Add documentation
  - Document CSV import format and process
  - Create user guide for supervisors
  - Create admin guide for managing instructions
  - Update README with new feature information
  - _Requirements: 3.2, 4.1_
