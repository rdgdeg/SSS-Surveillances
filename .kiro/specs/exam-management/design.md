# Design Document - Exam Management System

## Overview

The Exam Management System provides administrators with comprehensive tools to manage examination schedules, link exams to courses, track teacher presence declarations, and monitor supervisor requirements. The system integrates with the existing course catalog and teacher presence tracking features to provide a unified view of exam readiness.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Interface                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Exam List    │  │ Exam Editor  │  │ Dashboard    │      │
│  │ & Filters    │  │ Modal        │  │ Metrics      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Business Logic Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Exam API     │  │ CSV Parser   │  │ Metrics      │      │
│  │ Service      │  │              │  │ Calculator   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer (Supabase)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ examens      │  │ cours        │  │ presences_   │      │
│  │              │  │              │  │ enseignants  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **CSV Import Flow**:
   - Admin uploads CSV → CSV Parser extracts data → Course Matcher links to existing courses → Exam API creates records → Dashboard updates

2. **Exam Editing Flow**:
   - Admin edits field → Validation → Exam API updates record → UI refreshes → Dashboard recalculates

3. **Status Tracking Flow**:
   - Teacher submits presence → Presence API creates record → Exam status updates → Badge refreshes → Dashboard updates

## Components and Interfaces

### 1. Database Schema

#### New Table: `examens`

```sql
CREATE TABLE examens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  cours_id UUID REFERENCES cours(id) ON DELETE SET NULL,
  code_examen VARCHAR(50) NOT NULL,
  nom_examen VARCHAR(500) NOT NULL,
  date_examen DATE,
  heure_debut TIME,
  heure_fin TIME,
  duree_minutes INTEGER,
  auditoires TEXT,
  enseignants TEXT[], -- Array of teacher names/emails
  secretariat VARCHAR(100),
  nb_surveillants_requis INTEGER CHECK (nb_surveillants_requis >= 0 AND nb_surveillants_requis <= 99),
  saisie_manuelle BOOLEAN DEFAULT FALSE,
  cree_par_email VARCHAR(255),
  valide BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_session_code_date UNIQUE(session_id, code_examen, date_examen)
);

CREATE INDEX idx_examens_session ON examens(session_id);
CREATE INDEX idx_examens_cours ON examens(cours_id);
CREATE INDEX idx_examens_date ON examens(date_examen);
CREATE INDEX idx_examens_code ON examens(code_examen);
```

#### Modified Table: `presences_enseignants`

Update to link to exams instead of just courses:

```sql
ALTER TABLE presences_enseignants 
  ADD COLUMN examen_id UUID REFERENCES examens(id) ON DELETE CASCADE;

CREATE INDEX idx_presences_examen ON presences_enseignants(examen_id);

-- Update unique constraint to include examen
ALTER TABLE presences_enseignants 
  DROP CONSTRAINT IF EXISTS unique_cours_session_enseignant;

ALTER TABLE presences_enseignants 
  ADD CONSTRAINT unique_examen_enseignant UNIQUE(examen_id, enseignant_email);
```

### 2. TypeScript Types

```typescript
export interface Examen {
  id: string;
  session_id: string;
  cours_id: string | null;
  code_examen: string;
  nom_examen: string;
  date_examen: string | null; // YYYY-MM-DD
  heure_debut: string | null; // HH:MM
  heure_fin: string | null; // HH:MM
  duree_minutes: number | null;
  auditoires: string | null;
  enseignants: string[]; // Array of teacher names/emails
  secretariat: string | null;
  nb_surveillants_requis: number | null;
  saisie_manuelle: boolean;
  cree_par_email: string | null;
  valide: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExamenWithStatus extends Examen {
  cours?: Cours; // Joined course data
  has_presence_declarations: boolean;
  nb_presences_declarees: number;
  nb_enseignants_presents: number;
  nb_surveillants_accompagnants: number;
}

export interface ExamenFormData {
  cours_id: string | null;
  code_examen: string;
  nom_examen: string;
  date_examen: string;
  heure_debut: string;
  heure_fin: string;
  duree_minutes: number | null;
  auditoires: string;
  enseignants: string[];
  secretariat: string;
  nb_surveillants_requis: number | null;
}

export interface ExamenFilters {
  search?: string; // Search in code or name
  dateFrom?: string;
  dateTo?: string;
  secretariat?: string;
  responseStatus?: 'all' | 'declared' | 'pending';
  hasCoursLinked?: boolean;
  hasSupervisorRequirement?: boolean;
}

export interface ExamenDashboardStats {
  total_examens: number;
  examens_with_declarations: number;
  examens_pending_declarations: number;
  total_supervisors_required: number;
  examens_without_course: number;
  examens_without_supervisor_requirement: number;
  completion_percentage: number;
  examens_by_secretariat: { secretariat: string; count: number }[];
  examens_by_date: { date: string; count: number }[];
}

export interface ParsedCSVExamen {
  date: string; // DD-MM-YY
  jour: string;
  duree: string; // "02h00"
  debut: string; // "09h00"
  fin: string; // "11h00"
  activite: string; // "WMDS2221=E"
  code: string; // "SECTEUR HÉMATOLOGIE"
  auditoires: string;
  enseignants: string;
  secretariat: string;
}
```

### 3. API Layer (`lib/examenManagementApi.ts`)

```typescript
// Import examens from CSV
export async function importExamensFromCSV(
  sessionId: string,
  csvData: ParsedCSVExamen[],
  onProgress?: (current: number, total: number) => void
): Promise<ExamenImportResult>

// Get all examens for a session with filters
export async function getExamens(
  sessionId: string,
  filters?: ExamenFilters,
  page?: number,
  pageSize?: number
): Promise<{ data: ExamenWithStatus[]; total: number }>

// Get single examen by ID
export async function getExamenById(
  id: string
): Promise<ExamenWithStatus | null>

// Create new examen
export async function createExamen(
  sessionId: string,
  data: ExamenFormData
): Promise<Examen>

// Update examen
export async function updateExamen(
  id: string,
  updates: Partial<ExamenFormData>
): Promise<Examen>

// Delete examen
export async function deleteExamen(id: string): Promise<void>

// Link examen to course
export async function linkExamenToCours(
  examenId: string,
  coursId: string
): Promise<Examen>

// Get dashboard statistics
export async function getExamenDashboardStats(
  sessionId: string
): Promise<ExamenDashboardStats>

// Check if exam has presence declarations
export async function checkExamenPresenceStatus(
  examenId: string
): Promise<{ has_declarations: boolean; count: number }>
```

### 4. CSV Parser (`lib/examenCsvParser.ts`)

Enhanced to handle the new exam CSV format:

```typescript
export interface ExamenCSVParseResult {
  examens: ParsedCSVExamen[];
  errors: string[];
  warnings: string[];
}

export function parseExamenCSV(csvContent: string): ExamenCSVParseResult {
  // Parse CSV with semicolon delimiter
  // Extract course code from activity field (remove =E, (T)=E, etc.)
  // Convert date format from DD-MM-YY to YYYY-MM-DD
  // Convert time format from "09h00" to "09:00"
  // Parse duration from "02h00" to minutes
  // Split teachers by comma
  // Return parsed data with errors and warnings
}

export function extractCourseCode(activite: string): string {
  // Remove suffixes like =E, (T)=E, +2504+2515=E, etc.
  // Return clean course code
}

export function convertDateFormat(date: string): string {
  // Convert DD-MM-YY to YYYY-MM-DD
  // Handle 2-digit year (25 → 2025, 26 → 2026)
}

export function convertTimeFormat(time: string): string {
  // Convert "09h00" to "09:00"
}

export function parseDuration(duree: string): number {
  // Convert "02h00" to 120 minutes
  // Handle formats like "01h30", "02h30"
}
```

### 5. React Components

#### `pages/admin/ExamManagementPage.tsx`

Main page component with tabs:
- Exam List tab
- Dashboard tab
- Import tab

```typescript
export default function ExamManagementPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'dashboard' | 'import'>('list');
  const { activeSession } = useActiveSession();
  
  return (
    <AdminLayout>
      <div className="exam-management">
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tab value="list">Exam List</Tab>
          <Tab value="dashboard">Dashboard</Tab>
          <Tab value="import">Import</Tab>
        </Tabs>
        
        {activeTab === 'list' && <ExamList sessionId={activeSession.id} />}
        {activeTab === 'dashboard' && <ExamDashboard sessionId={activeSession.id} />}
        {activeTab === 'import' && <ExamImport sessionId={activeSession.id} />}
      </div>
    </AdminLayout>
  );
}
```

#### `components/admin/ExamList.tsx`

Displays filterable, sortable list of exams with inline editing:

```typescript
interface ExamListProps {
  sessionId: string;
}

export function ExamList({ sessionId }: ExamListProps) {
  const [examens, setExamens] = useState<ExamenWithStatus[]>([]);
  const [filters, setFilters] = useState<ExamenFilters>({});
  const [editingExamen, setEditingExamen] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  
  // Features:
  // - Filter controls (date range, secretariat, status, search)
  // - Sortable columns
  // - Inline editing for date, time, rooms, secretariat
  // - Edit button to open modal
  // - Delete button with confirmation
  // - Response status badge
  // - Course link indicator
  // - Pagination
}
```

#### `components/admin/ExamEditModal.tsx`

Modal for comprehensive exam editing:

```typescript
interface ExamEditModalProps {
  examen: ExamenWithStatus | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ExamenFormData) => Promise<void>;
  sessionId: string;
}

export function ExamEditModal({ examen, isOpen, onClose, onSave, sessionId }: ExamEditModalProps) {
  // Features:
  // - Form with all exam fields
  // - Course selector with search
  // - Teacher list editor
  // - Validation
  // - Save/Cancel buttons
  // - Loading states
}
```

#### `components/admin/ExamDashboard.tsx`

Dashboard with statistics and metrics:

```typescript
interface ExamDashboardProps {
  sessionId: string;
}

export function ExamDashboard({ sessionId }: ExamDashboardProps) {
  const [stats, setStats] = useState<ExamenDashboardStats | null>(null);
  
  // Features:
  // - Metric cards (total exams, declarations, supervisors, etc.)
  // - Progress bars for completion percentage
  // - Charts for exams by date and secretariat
  // - Clickable metrics that filter the exam list
  // - Real-time updates
}
```

#### `components/admin/ExamImport.tsx`

CSV import interface:

```typescript
interface ExamImportProps {
  sessionId: string;
}

export function ExamImport({ sessionId }: ExamImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ExamenImportResult | null>(null);
  
  // Features:
  // - File upload
  // - CSV preview
  // - Import progress bar
  // - Result summary (imported, skipped, errors)
  // - Warning list for unlinked courses
}
```

#### `components/shared/ExamStatusBadge.tsx`

Badge component for response status:

```typescript
interface ExamStatusBadgeProps {
  hasDeclarations: boolean;
  count?: number;
}

export function ExamStatusBadge({ hasDeclarations, count }: ExamStatusBadgeProps) {
  // Displays "Declared" (green) or "Pending" (yellow/orange)
  // Optional count display
}
```

### 6. Custom Hooks

#### `src/hooks/useExamens.ts`

```typescript
export function useExamens(sessionId: string, filters?: ExamenFilters) {
  const [examens, setExamens] = useState<ExamenWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  
  // Fetch examens with filters
  // Real-time subscription to changes
  // Pagination support
  
  return { examens, loading, error, total, refetch };
}
```

#### `src/hooks/useExamenDashboard.ts`

```typescript
export function useExamenDashboard(sessionId: string) {
  const [stats, setStats] = useState<ExamenDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch dashboard statistics
  // Real-time updates
  
  return { stats, loading, refetch };
}
```

## Data Models

### Exam Lifecycle

```
┌─────────────┐
│   Created   │ ← CSV Import or Manual Creation
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Unlinked   │ ← No course association
└──────┬──────┘
       │ Admin links to course
       ▼
┌─────────────┐
│   Linked    │ ← Associated with course
└──────┬──────┘
       │ Admin sets supervisor requirement
       ▼
┌─────────────┐
│ Configured  │ ← Has supervisor requirement
└──────┬──────┘
       │ Teacher submits presence
       ▼
┌─────────────┐
│  Declared   │ ← Has presence declarations
└─────────────┘
```

### Course Code Extraction Logic

The system extracts clean course codes from activity codes by removing common suffixes:

```
Input: "WMDS2221=E" → Output: "WMDS2221"
Input: "WFARM1282(T)=E" → Output: "WFARM1282"
Input: "WFARM2244+2504+2515=E" → Output: "WFARM2244"
Input: "WRDTH3120=E (Q1)" → Output: "WRDTH3120"
```

Pattern: Remove everything after and including `=`, `(`, or `+`

### Presence Status Calculation

An exam has declarations if:
```sql
EXISTS (
  SELECT 1 FROM presences_enseignants 
  WHERE examen_id = examens.id
)
```

## Error Handling

### Import Errors

1. **CSV Parse Errors**: Invalid format, missing columns
   - Display line number and error description
   - Allow partial import of valid rows

2. **Course Matching Errors**: Course code not found in database
   - Add to warnings list
   - Create exam with null cours_id
   - Flag for manual linking

3. **Duplicate Errors**: Exam already exists for session/code/date
   - Skip import
   - Add to skipped count
   - Log in import summary

### Validation Errors

1. **Date Validation**: Invalid date format or past date
   - Display inline error message
   - Prevent save until corrected

2. **Time Validation**: End time before start time
   - Display error message
   - Suggest correction

3. **Required Fields**: Missing course, date, or times
   - Highlight missing fields
   - Display summary error message

### API Errors

1. **Network Errors**: Connection issues
   - Display retry button
   - Queue changes for retry

2. **Permission Errors**: Unauthorized access
   - Redirect to login
   - Display permission error

3. **Database Errors**: Constraint violations
   - Display user-friendly error message
   - Log technical details

## Testing Strategy

### Unit Tests

1. **CSV Parser Tests**:
   - Test course code extraction with various formats
   - Test date/time conversion
   - Test duration parsing
   - Test error handling for malformed data

2. **API Function Tests**:
   - Test CRUD operations
   - Test filtering and sorting
   - Test presence status calculation
   - Test dashboard statistics calculation

3. **Component Tests**:
   - Test inline editing behavior
   - Test modal form validation
   - Test filter application
   - Test badge display logic

### Integration Tests

1. **Import Flow**:
   - Upload CSV → Parse → Match courses → Create exams → Display results

2. **Edit Flow**:
   - Open modal → Modify fields → Save → Verify updates → Check dashboard

3. **Status Tracking**:
   - Create exam → Submit presence → Verify badge update → Check dashboard

### E2E Tests

1. **Complete Exam Management Workflow**:
   - Import exams from CSV
   - Link unmatched courses
   - Set supervisor requirements
   - Verify dashboard metrics
   - Edit exam details
   - Delete exam

2. **Multi-Session Workflow**:
   - Import exams for Session A
   - Switch to Session B
   - Verify Session A exams not visible
   - Import exams for Session B
   - Switch back to Session A
   - Verify correct exams displayed

## Performance Considerations

### Database Optimization

1. **Indexes**: Create indexes on frequently queried columns (session_id, cours_id, date_examen, code_examen)
2. **Joins**: Use efficient joins for exam-course-presence queries
3. **Pagination**: Implement server-side pagination for large exam lists
4. **Caching**: Cache dashboard statistics with short TTL

### UI Optimization

1. **Lazy Loading**: Load exam details only when modal is opened
2. **Debouncing**: Debounce search and filter inputs
3. **Virtual Scrolling**: Use virtual scrolling for large exam lists
4. **Optimistic Updates**: Update UI immediately, sync with server in background

### Import Optimization

1. **Batch Processing**: Process CSV imports in batches of 50
2. **Progress Feedback**: Update progress bar every 10 records
3. **Background Processing**: Consider worker threads for large imports
4. **Validation First**: Validate all records before starting import

## Security Considerations

1. **Admin-Only Access**: All exam management features require admin authentication
2. **Input Validation**: Sanitize all user inputs to prevent injection attacks
3. **File Upload Security**: Validate CSV file type and size before processing
4. **Audit Logging**: Log all exam modifications with user and timestamp
5. **RLS Policies**: Implement Row Level Security policies for exam table

## Migration Strategy

### Phase 1: Database Setup
- Create examens table
- Update presences_enseignants table
- Create indexes and constraints
- Set up RLS policies

### Phase 2: API Development
- Implement exam CRUD operations
- Implement CSV parser
- Implement dashboard statistics
- Add presence status checks

### Phase 3: UI Development
- Build exam list component
- Build edit modal
- Build import interface
- Build dashboard

### Phase 4: Integration
- Connect to existing course system
- Connect to existing presence system
- Update navigation
- Add admin menu items

### Phase 5: Testing & Deployment
- Run test suite
- Perform user acceptance testing
- Deploy to production
- Monitor for issues

## Future Enhancements

1. **Bulk Operations**: Select multiple exams for bulk editing or deletion
2. **Export**: Export exam list to CSV or PDF
3. **Email Notifications**: Notify teachers about exams needing declarations
4. **Conflict Detection**: Detect scheduling conflicts (same room, overlapping times)
5. **Capacity Management**: Link to room capacity and student enrollment
6. **Historical Data**: Track exam changes over time
7. **Templates**: Save exam configurations as templates for future sessions
