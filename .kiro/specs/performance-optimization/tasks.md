# Implementation Plan - Performance Optimization

## Phase 1: Foundation Setup

- [x] 1. Configure environment variables and security
- [x] 1.1 Create .env.example file with all required variables
  - Document VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
  - Add APP_ENV and DEBUG flags
  - _Requirements: 1.4_

- [x] 1.2 Create src/config/env.ts for environment validation
  - Implement validateEnv() function to check required variables at startup
  - Export typed env object with all configuration
  - Throw descriptive errors if variables are missing
  - _Requirements: 1.3_

- [x] 1.3 Update lib/supabaseClient.ts to use environment variables
  - Replace hardcoded values with import from config/env
  - Add runtime validation
  - _Requirements: 1.1_

- [x] 1.4 Update .gitignore to exclude .env files
  - Add .env.local, .env.production, .env.development
  - Ensure .env.example is tracked
  - _Requirements: 1.5_

- [x] 2. Install and configure React Query
- [x] 2.1 Install @tanstack/react-query and @tanstack/react-query-devtools
  - Run: npm install @tanstack/react-query @tanstack/react-query-devtools
  - _Requirements: 2.1_

- [x] 2.2 Create src/lib/queryClient.ts with QueryClient configuration
  - Configure staleTime, cacheTime, retry strategy
  - Set up default options for queries and mutations
  - _Requirements: 2.2, 2.5_

- [x] 2.3 Create src/lib/queryKeys.ts with query key factory
  - Define hierarchical query keys for all entities
  - Export queryKeys object with typed keys
  - _Requirements: 2.2_

- [x] 2.4 Wrap App with QueryClientProvider in App.tsx
  - Import QueryClientProvider and queryClient
  - Add ReactQueryDevtools in development mode
  - _Requirements: 2.1_

- [x] 3. Set up validation with Zod
- [x] 3.1 Install zod and @hookform/resolvers
  - Run: npm install zod @hookform/resolvers react-hook-form
  - _Requirements: 5.1_

- [x] 3.2 Create src/schemas/surveillant.schema.ts
  - Define surveillantSchema with all validation rules
  - Export SurveillantFormData type
  - Add custom refinements for ETP validation
  - _Requirements: 5.1, 5.2_

- [x] 3.3 Create src/schemas/session.schema.ts
  - Define sessionSchema for session creation/update
  - _Requirements: 5.1_

- [x] 3.4 Create src/schemas/creneau.schema.ts
  - Define creneauSchema for time slot validation
  - _Requirements: 5.1_

- [x] 3.5 Create src/hooks/useValidatedForm.ts
  - Implement generic hook with zodResolver
  - Support real-time validation with debounce
  - _Requirements: 5.4_

- [x] 4. Database optimizations - Indexes
- [x] 4.1 Create supabase-add-indexes.sql migration file
  - Add index on surveillants(email)
  - Add index on surveillants(is_active)
  - Add index on surveillants(type)
  - Add index on creneaux(session_id)
  - Add index on creneaux(date_surveillance)
  - Add index on soumissions_disponibilites(session_id, email)
  - Add index on sessions(is_active)
  - _Requirements: 9.1_

- [x] 4.2 Execute the migration on Supabase
  - Test query performance before and after
  - _Requirements: 9.1_

## Phase 2: Core Optimizations

- [x] 5. Implement error handling system
- [x] 5.1 Create src/lib/errors.ts with error types
  - Define ErrorCode enum
  - Create AppError class
  - _Requirements: 8.1_

- [x] 5.2 Create src/lib/errorHandler.ts
  - Implement handleApiError function
  - Map Supabase errors to AppError
  - Detect network errors
  - _Requirements: 8.3_

- [x] 5.3 Create src/lib/retry.ts for retry logic
  - Implement withRetry function with exponential backoff
  - Configure retryable error codes
  - _Requirements: 8.2_

- [x] 5.4 Update ErrorBoundary component
  - Add retry mechanism
  - Display user-friendly error messages
  - Log errors for monitoring
  - _Requirements: 8.3_

- [x] 6. Migrate API layer to React Query
- [x] 6.1 Create src/hooks/useSurveillants.ts
  - Implement useSurveillants hook with React Query
  - Support filters and sorting
  - Use queryKeys.surveillants
  - _Requirements: 2.1, 2.2_

- [x] 6.2 Create src/hooks/useSurveillantMutation.ts
  - Implement create, update, delete mutations
  - Add optimistic updates for toggle actions
  - Invalidate relevant queries on success
  - _Requirements: 2.4, 7.1, 7.2_

- [x] 6.3 Create src/hooks/useSessions.ts
  - Implement useSessions and useActiveSession hooks
  - Cache active session data
  - _Requirements: 2.2, 2.3_

- [x] 6.4 Create src/hooks/useCreneaux.ts
  - Implement useCreneaux hook with session filtering
  - _Requirements: 2.2_

- [x] 6.5 Create src/hooks/useDisponibilites.ts
  - Implement useDisponibilites hook for availability matrix
  - _Requirements: 2.2_

- [x] 6.6 Create src/hooks/useMessages.ts
  - Implement useMessages hook with real-time updates
  - _Requirements: 2.2_

- [x] 7. Implement Zustand store
- [x] 7.1 Install zustand
  - Run: npm install zustand
  - _Requirements: 10.1_

- [x] 7.2 Create src/stores/appStore.ts
  - Implement activeSession state
  - Implement currentUser state
  - Add UI state (sidebar, theme)
  - Configure persistence with localStorage
  - _Requirements: 10.1, 10.2, 10.4_

- [x] 7.3 Create src/stores/sessionStore.ts for cross-tab sync
  - Implement broadcast channel for session sync
  - _Requirements: 10.5_

- [x] 7.4 Update AuthContext to use Zustand store
  - Replace local state with store
  - _Requirements: 10.2_

## Phase 3: Advanced Features

- [ ] 8. Implement server-side pagination
- [ ] 8.1 Update lib/api.ts with pagination support
  - Create PaginatedResponse interface
  - Implement getSurveillantsPaginated function
  - Use Supabase .range() for pagination
  - Return totalCount with { count: 'exact' }
  - _Requirements: 3.2, 3.3, 9.5_

- [ ] 8.2 Update useSurveillants hook for pagination
  - Accept page and pageSize parameters
  - Return pagination metadata
  - _Requirements: 3.2_

- [ ] 8.3 Update SurveillantsPage to use server-side pagination
  - Replace client-side pagination with server calls
  - Maintain filters and sorting with pagination
  - Update UI to show total pages
  - _Requirements: 3.3, 3.4, 3.5_

- [ ] 9. Implement list virtualization
- [ ] 9.1 Install react-window
  - Run: npm install react-window @types/react-window
  - _Requirements: 4.1_

- [ ] 9.2 Create src/components/shared/VirtualizedTable.tsx
  - Implement generic virtualized table component
  - Support dynamic row heights
  - Maintain scroll position on data updates
  - _Requirements: 4.2, 4.3_

- [ ] 9.3 Update DisponibilitesPage to use virtualization
  - Replace standard table with VirtualizedTable
  - Optimize for 1000+ rows
  - Preserve filtering and sorting
  - _Requirements: 4.1, 4.4, 4.5_

- [ ] 9.4 Update SurveillantsPage table with virtualization
  - Apply virtualization when list exceeds 100 items
  - _Requirements: 4.1_

- [ ] 10. Implement optimistic updates
- [ ] 10.1 Add optimistic update to surveillant toggle actions
  - Implement onMutate, onError, onSettled in useSurveillantMutation
  - Update cache immediately on toggle
  - Rollback on error
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 10.2 Add visual feedback during optimistic updates
  - Show subtle loading indicator
  - Disable actions during server confirmation
  - _Requirements: 7.4_

- [ ] 10.3 Implement optimistic updates for dispense toggle
  - Update handleToggleDispense in SurveillantsPage
  - _Requirements: 7.1, 7.3_

- [ ] 10.4 Handle concurrent update conflicts
  - Implement last-write-wins strategy
  - Show warning on conflict detection
  - _Requirements: 7.5_

## Phase 4: Database & Bundle Optimization

- [ ] 11. Create materialized views and functions
- [ ] 11.1 Create supabase-create-dashboard-view.sql
  - Create dashboard_stats materialized view
  - Add refresh function
  - Create index on view
  - _Requirements: 9.3_

- [ ] 11.2 Create supabase-create-availability-function.sql
  - Implement get_availability_stats PostgreSQL function
  - Optimize with proper indexes
  - _Requirements: 9.4_

- [ ] 11.3 Update getDashboardStats in lib/api.ts
  - Query materialized view instead of calculating
  - Add refresh trigger on data changes
  - _Requirements: 9.3_

- [ ] 11.4 Update getDisponibilitesData to use PostgreSQL function
  - Call get_availability_stats for statistics
  - Reduce client-side calculations
  - _Requirements: 9.4_

- [ ] 12. Optimize imports and bundle size
- [ ] 12.1 Update all lucide-react imports to named imports
  - Replace `import { Icon } from 'lucide-react'` patterns
  - Use specific imports: `import { Icon } from 'lucide-react/dist/esm/icons/icon'`
  - _Requirements: 6.1_

- [ ] 12.2 Configure Vite for optimal tree-shaking
  - Update vite.config.ts with build optimizations
  - Configure manual chunks for vendor splitting
  - _Requirements: 6.2, 6.5_

- [ ] 12.3 Lazy load heavy components
  - Lazy load VirtualizedTable
  - Lazy load chart components if any
  - _Requirements: 6.3_

- [ ] 12.4 Analyze bundle size with rollup-plugin-visualizer
  - Install and configure bundle analyzer
  - Identify and optimize large dependencies
  - Ensure main bundle < 500KB
  - _Requirements: 6.4_

- [ ] 13. Update form validation
- [ ] 13.1 Update SurveillantForm to use Zod validation
  - Replace manual validation with useValidatedForm
  - Use surveillantSchema
  - Display Zod error messages
  - _Requirements: 5.2, 5.3, 5.4_

- [ ] 13.2 Update AvailabilityForm to use Zod validation
  - Create availability submission schema
  - Validate email, personal info, and selections
  - _Requirements: 5.2, 5.3_

- [ ] 13.3 Update SessionForm to use Zod validation
  - Use sessionSchema
  - _Requirements: 5.2_

- [ ] 13.4 Update CreneauForm to use Zod validation
  - Use creneauSchema
  - Validate time ranges
  - _Requirements: 5.2_

## Phase 5: Migration & Polish

- [ ] 14. Migrate existing pages to new hooks
- [ ] 14.1 Update SurveillantsPage to use useSurveillants
  - Replace useDataFetching with useSurveillants
  - Use useSurveillantMutation for all mutations
  - Test all CRUD operations
  - _Requirements: 2.1, 2.2_

- [ ] 14.2 Update SessionsPage to use useSessions
  - Replace useDataFetching with useSessions
  - _Requirements: 2.1_

- [ ] 14.3 Update CreneauxPage to use useCreneaux
  - Replace useDataFetching with useCreneaux
  - _Requirements: 2.1_

- [ ] 14.4 Update DisponibilitesPage to use useDisponibilites
  - Replace useDataFetching with useDisponibilites
  - _Requirements: 2.1_

- [ ] 14.5 Update DashboardPage to use new hooks
  - Use materialized view data
  - _Requirements: 2.1, 9.3_

- [ ] 14.6 Update MessagesPage to use useMessages
  - Replace useDataFetching with useMessages
  - _Requirements: 2.1_

- [ ] 15. Improve error handling across the app
- [ ] 15.1 Add error boundaries to each major page
  - Wrap admin pages with ErrorBoundary
  - Provide page-specific error recovery
  - _Requirements: 8.3_

- [ ] 15.2 Implement toast notifications for all mutations
  - Success toasts with undo option where applicable
  - Error toasts with retry button
  - _Requirements: 8.2, 8.3_

- [ ] 15.3 Add loading states to all async operations
  - Skeleton loaders for initial loads
  - Inline spinners for mutations
  - _Requirements: 7.4_

- [ ] 16. Performance testing and optimization
- [ ] 16.1 Set up Lighthouse CI
  - Configure lighthouse in CI pipeline
  - Set performance budgets
  - _Requirements: Testing Strategy_

- [ ] 16.2 Profile components with React DevTools
  - Identify unnecessary re-renders
  - Add React.memo where beneficial
  - _Requirements: Testing Strategy_

- [ ] 16.3 Measure and optimize API response times
  - Log slow queries
  - Optimize with additional indexes if needed
  - _Requirements: Performance Metrics_

- [ ] 16.4 Test cache hit rates
  - Monitor React Query cache effectiveness
  - Adjust staleTime/cacheTime if needed
  - _Requirements: Performance Metrics_

- [ ] 17. Documentation and cleanup
- [ ] 17.1 Update README with new environment setup
  - Document all environment variables
  - Add setup instructions
  - _Requirements: 1.4_

- [ ] 17.2 Create PERFORMANCE.md documentation
  - Document optimization strategies
  - Explain caching behavior
  - Provide troubleshooting guide
  - _Requirements: Documentation_

- [ ] 17.3 Remove deprecated useDataFetching hook
  - Ensure all usages are migrated
  - Remove hook file
  - _Requirements: Backward Compatibility_

- [ ] 17.4 Clean up unused imports and code
  - Run linter to find unused code
  - Remove console.logs
  - _Requirements: Code Quality_
