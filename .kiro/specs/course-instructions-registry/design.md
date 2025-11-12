# Design Document - Course Instructions Registry

## Overview

The course instructions registry feature adds a comprehensive system for managing and accessing exam-specific instructions for courses. It consists of:

1. A new database table to store courses and their instructions
2. Admin interface for managing course instructions
3. Public/supervisor interface for viewing course instructions
4. CSV import functionality for the initial course list
5. Search, filter, and sort capabilities for easy navigation

## Architecture

### Database Schema

#### New Table: `cours`

```sql
CREATE TABLE cours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  intitule_complet TEXT NOT NULL,
  consignes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cours_code ON cours(code);
CREATE INDEX idx_cours_intitule ON cours USING gin(to_tsvector('french', intitule_complet));
```

**Fields:**
- `id`: Unique identifier
- `code`: Course code (e.g., LEDPH1001) - unique
- `intitule_complet`: Full course title
- `consignes`: Exam instructions (nullable)
- `updated_at`: Last modification timestamp
- `created_at`: Creation timestamp

### API Endpoints

#### Public/Supervisor Endpoints

1. **GET /api/cours**
   - Returns list of all courses with basic info
   - Query params: `search`, `sortBy`, `sortOrder`, `hasInstructions`
   - Response: `{ data: Course[], total: number }`

2. **GET /api/cours/:id**
   - Returns detailed course information including instructions
   - Response: `{ data: Course }`

#### Admin Endpoints

3. **POST /api/admin/cours**
   - Creates a new course
   - Body: `{ code, intitule_complet, consignes? }`
   - Response: `{ data: Course }`

4. **PUT /api/admin/cours/:id**
   - Updates course instructions
   - Body: `{ consignes, intitule_complet? }`
   - Response: `{ data: Course }`

5. **DELETE /api/admin/cours/:id/consignes**
   - Removes instructions for a course (sets to null)
   - Response: `{ data: Course }`

6. **POST /api/admin/cours/import**
   - Imports courses from CSV
   - Body: FormData with CSV file
   - Response: `{ imported: number, errors: string[] }`

### Component Structure

#### Public/Supervisor Components

**`pages/ConsignesPage.tsx`**
- Main page for viewing course instructions
- Includes search, filter, and sort controls
- Displays course list with instruction status indicators

**`components/public/CourseList.tsx`**
- Renders the list of courses
- Shows course code, title, and instruction status
- Handles click to view details

**`components/public/CourseInstructionsModal.tsx`**
- Modal/dialog to display course instructions
- Shows default message if no instructions exist
- Includes course code and title

**`components/public/CourseSearch.tsx`**
- Search input with real-time filtering
- Sort and filter controls

#### Admin Components

**`pages/admin/CoursPage.tsx`**
- Admin page for managing courses
- Lists all courses with instruction status
- Provides import functionality

**`components/admin/CourseInstructionsForm.tsx`**
- Form for adding/editing course instructions
- Rich text editor for instructions
- Save and cancel actions

**`components/admin/CourseImport.tsx`**
- CSV file upload component
- Progress indicator during import
- Error reporting

**`components/admin/CourseListAdmin.tsx`**
- Admin view of course list
- Shows instruction status and last update
- Quick edit actions

## Data Models

### TypeScript Interfaces

```typescript
interface Cours {
  id: string;
  code: string;
  intitule_complet: string;
  consignes: string | null;
  updated_at: string;
  created_at: string;
}

interface CoursListItem {
  id: string;
  code: string;
  intitule_complet: string;
  has_consignes: boolean;
  updated_at: string;
}

interface CoursFormData {
  code: string;
  intitule_complet: string;
  consignes?: string;
}

interface CoursSearchParams {
  search?: string;
  sortBy?: 'code' | 'intitule_complet' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
  hasInstructions?: boolean;
}
```

## Error Handling

### Validation Rules

1. **Course Code**: Required, max 50 characters, must be unique
2. **Course Title**: Required, max 500 characters
3. **Instructions**: Optional, max 10,000 characters

### Error Scenarios

1. **Duplicate Course Code**: Return 409 Conflict with message
2. **Course Not Found**: Return 404 with appropriate message
3. **Invalid CSV Format**: Return 400 with detailed error list
4. **Database Connection Error**: Return 503 with retry suggestion
5. **Unauthorized Access**: Return 403 for admin endpoints

### User-Facing Messages

- Import success: "X cours importés avec succès"
- Import partial: "X cours importés, Y erreurs"
- Save success: "Consignes enregistrées"
- Delete success: "Consignes supprimées"
- No instructions: "Se référer aux consignes générales et/ou présentes sur la feuille d'examen"

## Testing Strategy

### Unit Tests

1. CSV parsing logic
2. Search and filter functions
3. Form validation
4. API response formatting

### Integration Tests

1. Course CRUD operations
2. CSV import with various file formats
3. Search functionality with different queries
4. Permission checks for admin endpoints

### E2E Tests

1. Supervisor workflow: Navigate → Search → View instructions
2. Admin workflow: Import courses → Add instructions → Edit instructions
3. Error handling: Invalid CSV, network errors
4. Responsive design on mobile devices

## CSV Import Logic

### File Format

Expected CSV format:
```
Cours;Intit.Complet
LEDPH1001;Fondements des jeux et des sports collectifs
```

### Import Process

1. Parse CSV file (semicolon-separated)
2. Validate each row (code and title required)
3. Check for duplicates in database
4. Insert new courses or update existing titles
5. Preserve existing instructions during updates
6. Return summary with success count and errors

### Error Handling

- Skip rows with missing required fields
- Log duplicate codes (update title only)
- Continue processing on individual row errors
- Return detailed error report

## UI/UX Considerations

### Navigation

- Add "Consignes" button to main navigation menu
- Position between existing menu items
- Use appropriate icon (document/list icon)

### Course List Display

- Show course code prominently
- Display truncated title with full text on hover
- Use badge/indicator for instruction status
- Implement virtual scrolling for large lists

### Search and Filter

- Real-time search (debounced)
- Clear search button
- Filter chips for active filters
- Result count display

### Instructions Display

- Modal or side panel for instructions
- Markdown/rich text rendering
- Print-friendly format
- Copy to clipboard option

### Admin Interface

- Inline editing for quick updates
- Bulk import with progress bar
- Confirmation dialogs for destructive actions
- Last updated timestamp display

## Performance Considerations

1. **Database Indexing**: Full-text search index on course titles
2. **Pagination**: Implement cursor-based pagination for large datasets
3. **Caching**: Cache course list with short TTL (5 minutes)
4. **Lazy Loading**: Load instructions only when course is selected
5. **Debouncing**: Debounce search input (300ms)

## Security Considerations

1. **Row Level Security**: Admin-only write access to cours table
2. **Input Sanitization**: Sanitize HTML in instructions
3. **File Upload**: Validate CSV file size and format
4. **Rate Limiting**: Limit import requests per user
5. **Audit Trail**: Log all instruction modifications

## Migration Strategy

1. Create `cours` table with indexes
2. Set up RLS policies
3. Import initial course list from CSV
4. Deploy frontend components
5. Add navigation menu item
6. Announce feature to users

## Future Enhancements

1. Version history for instructions
2. Multi-language support for instructions
3. Attach documents/files to courses
4. Email notifications for instruction updates
5. Integration with exam scheduling system
6. Bulk edit capabilities
7. Export functionality (PDF, Excel)
