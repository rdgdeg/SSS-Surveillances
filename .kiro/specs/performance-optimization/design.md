# Design Document - Performance Optimization

## Overview

Ce document décrit l'architecture et les décisions de design pour l'optimisation des performances de l'application de gestion des surveillances. Les optimisations sont organisées en modules indépendants qui peuvent être implémentés progressivement sans perturber les fonctionnalités existantes.

## Architecture

### Architecture globale

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │  Components  │  │   Contexts   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └─────────────────┼──────────────────┘               │
│                           │                                  │
├───────────────────────────┼──────────────────────────────────┤
│                    Data Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ React Query  │  │   Zustand    │  │  Validation  │      │
│  │   (Cache)    │  │   (State)    │  │    (Zod)     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └─────────────────┼──────────────────┘               │
│                           │                                  │
├───────────────────────────┼──────────────────────────────────┤
│                    API Layer                                 │
│  ┌──────────────────────────────────────────────────┐       │
│  │         Enhanced API Client (lib/api.ts)         │       │
│  │  - Error handling  - Retry logic  - Pagination  │       │
│  └──────────────────────┬───────────────────────────┘       │
│                         │                                    │
├─────────────────────────┼────────────────────────────────────┤
│                  Backend Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Supabase   │  │  PostgreSQL  │  │    Indexes   │      │
│  │    Client    │  │   Functions  │  │  & Views     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Configuration Management

#### Structure des fichiers

```
project-root/
├── .env.example              # Template des variables
├── .env.local               # Variables locales (gitignored)
├── .env.production          # Variables production (gitignored)
└── src/
    └── config/
        └── env.ts           # Validation et export des variables
```

#### Interface de configuration

```typescript
// src/config/env.ts
interface EnvironmentConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  app: {
    environment: 'development' | 'production' | 'test';
    debug: boolean;
  };
}

export const env: EnvironmentConfig;
export function validateEnv(): void;
```

### 2. React Query Setup

#### Configuration du QueryClient

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 minutes
      cacheTime: 10 * 60 * 1000,       // 10 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

#### Query Keys Structure

```typescript
// src/lib/queryKeys.ts
export const queryKeys = {
  surveillants: {
    all: ['surveillants'] as const,
    lists: () => [...queryKeys.surveillants.all, 'list'] as const,
    list: (filters: SurveillantFilters) => 
      [...queryKeys.surveillants.lists(), filters] as const,
    detail: (id: string) => 
      [...queryKeys.surveillants.all, 'detail', id] as const,
  },
  sessions: {
    all: ['sessions'] as const,
    active: () => [...queryKeys.sessions.all, 'active'] as const,
  },
  creneaux: {
    all: ['creneaux'] as const,
    bySession: (sessionId: string) => 
      [...queryKeys.creneaux.all, 'session', sessionId] as const,
  },
  disponibilites: {
    all: ['disponibilites'] as const,
    matrix: (sessionId: string) => 
      [...queryKeys.disponibilites.all, 'matrix', sessionId] as const,
  },
};
```

### 3. Custom Hooks avec React Query

```typescript
// src/hooks/useSurveillants.ts
interface UseSurveillantsOptions {
  page?: number;
  pageSize?: number;
  filters?: SurveillantFilters;
}

interface UseSurveillantsResult {
  surveillants: Surveillant[];
  totalCount: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useSurveillants(options: UseSurveillantsOptions): UseSurveillantsResult;
export function useSurveillantMutation(): UseMutationResult<...>;
```

### 4. Pagination côté serveur

#### API Enhancement

```typescript
// src/lib/api.ts
interface PaginationParams {
  page: number;
  pageSize: number;
}

interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getSurveillantsPaginated(
  params: PaginationParams & { filters?: SurveillantFilters }
): Promise<PaginatedResponse<Surveillant>>;
```

#### Supabase Query Pattern

```typescript
// Utilisation de .range() pour la pagination
const from = (page - 1) * pageSize;
const to = from + pageSize - 1;

const { data, error, count } = await supabase
  .from('surveillants')
  .select('*', { count: 'exact' })
  .range(from, to)
  .order('nom', { ascending: true });
```

### 5. Virtualisation avec react-window

#### Component Structure

```typescript
// src/components/shared/VirtualizedTable.tsx
interface VirtualizedTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  rowHeight: number;
  height: number;
  onRowClick?: (item: T) => void;
}

export function VirtualizedTable<T>(props: VirtualizedTableProps<T>): JSX.Element;
```

#### Integration Pattern

```typescript
// Usage dans DisponibilitesPage
<VirtualizedTable
  data={filteredSoumissions}
  columns={columns}
  rowHeight={60}
  height={600}
  renderRow={(item, style) => <SurveillantRow {...item} style={style} />}
/>
```

### 6. Validation avec Zod

#### Schema Definitions

```typescript
// src/schemas/surveillant.schema.ts
import { z } from 'zod';

export const surveillantSchema = z.object({
  prenom: z.string().min(1, 'Le prénom est requis'),
  nom: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Format email invalide'),
  type: z.enum(['assistant', 'pat', 'jobiste', 'autre']),
  etp_total: z.number().min(0).max(1).optional(),
  etp_recherche: z.number().min(0).max(1).optional(),
  quota_surveillances: z.number().int().min(0),
  is_active: z.boolean(),
}).refine(
  (data) => data.etp_total !== undefined || data.etp_recherche !== undefined,
  { message: 'Au moins un ETP doit être rempli', path: ['etp_total'] }
);

export type SurveillantFormData = z.infer<typeof surveillantSchema>;
```

#### Form Integration

```typescript
// src/hooks/useValidatedForm.ts
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

export function useValidatedForm<T extends z.ZodType>(schema: T) {
  return useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });
}
```

### 7. Optimistic Updates

#### Pattern Implementation

```typescript
// src/hooks/useSurveillantMutation.ts
export function useSurveillantMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateSurveillant,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.surveillants.all });
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKeys.surveillants.lists());
      
      // Optimistically update
      queryClient.setQueryData(queryKeys.surveillants.lists(), (old) => {
        return old?.map(s => s.id === variables.id ? { ...s, ...variables.updates } : s);
      });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(queryKeys.surveillants.lists(), context?.previousData);
      toast.error('Erreur lors de la mise à jour');
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.surveillants.all });
    },
  });
}
```

### 8. Error Handling System

#### Error Types

```typescript
// src/lib/errors.ts
export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public userMessage: string,
    public retryable: boolean = false
  ) {
    super(message);
  }
}
```

#### Error Handler

```typescript
// src/lib/errorHandler.ts
export function handleApiError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  
  if (isSupabaseError(error)) {
    return mapSupabaseError(error);
  }
  
  if (isNetworkError(error)) {
    return new AppError(
      ErrorCode.NETWORK_ERROR,
      'Network request failed',
      'Problème de connexion. Vérifiez votre réseau.',
      true
    );
  }
  
  return new AppError(
    ErrorCode.SERVER_ERROR,
    'Unknown error',
    'Une erreur inattendue est survenue.',
    false
  );
}
```

### 9. Zustand Store

#### Store Structure

```typescript
// src/stores/appStore.ts
interface AppState {
  // Session state
  activeSession: Session | null;
  setActiveSession: (session: Session | null) => void;
  
  // User state
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  
  // UI state
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeSession: null,
      setActiveSession: (session) => set({ activeSession: session }),
      
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        activeSession: state.activeSession,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
```

### 10. Database Optimizations

#### Index Creation

```sql
-- Indexes pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_surveillants_email ON surveillants(email);
CREATE INDEX IF NOT EXISTS idx_surveillants_is_active ON surveillants(is_active);
CREATE INDEX IF NOT EXISTS idx_surveillants_type ON surveillants(type);
CREATE INDEX IF NOT EXISTS idx_creneaux_session_id ON creneaux(session_id);
CREATE INDEX IF NOT EXISTS idx_creneaux_date ON creneaux(date_surveillance);
CREATE INDEX IF NOT EXISTS idx_soumissions_session_email ON soumissions_disponibilites(session_id, email);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active);
```

#### Materialized View for Dashboard

```sql
-- Vue matérialisée pour les statistiques du dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats AS
SELECT 
  s.id as session_id,
  s.name as session_name,
  COUNT(DISTINCT surv.id) as total_surveillants,
  COUNT(DISTINCT sub.id) as total_submissions,
  COUNT(DISTINCT c.id) as total_creneaux,
  SUM(
    CASE WHEN jsonb_array_length(sub.historique_disponibilites) > 0 
    THEN (
      SELECT COUNT(*) 
      FROM jsonb_array_elements(sub.historique_disponibilites) elem
      WHERE (elem->>'est_disponible')::boolean = true
    )
    ELSE 0 END
  ) as total_availabilities
FROM sessions s
LEFT JOIN surveillants surv ON surv.is_active = true
LEFT JOIN soumissions_disponibilites sub ON sub.session_id = s.id
LEFT JOIN creneaux c ON c.session_id = s.id
WHERE s.is_active = true
GROUP BY s.id, s.name;

-- Index sur la vue matérialisée
CREATE UNIQUE INDEX ON dashboard_stats (session_id);

-- Fonction pour rafraîchir la vue
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
END;
$$ LANGUAGE plpgsql;
```

#### PostgreSQL Function for Complex Calculations

```sql
-- Fonction pour calculer les statistiques de disponibilité
CREATE OR REPLACE FUNCTION get_availability_stats(p_session_id UUID)
RETURNS TABLE (
  creneau_id UUID,
  available_count INTEGER,
  total_submissions INTEGER,
  availability_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as creneau_id,
    COUNT(CASE WHEN avail.est_disponible THEN 1 END)::INTEGER as available_count,
    COUNT(*)::INTEGER as total_submissions,
    ROUND(
      COUNT(CASE WHEN avail.est_disponible THEN 1 END)::NUMERIC / 
      NULLIF(COUNT(*), 0) * 100, 
      2
    ) as availability_rate
  FROM creneaux c
  CROSS JOIN soumissions_disponibilites sub
  LEFT JOIN LATERAL jsonb_to_recordset(sub.historique_disponibilites) 
    AS avail(creneau_id UUID, est_disponible BOOLEAN) 
    ON avail.creneau_id = c.id
  WHERE c.session_id = p_session_id
    AND sub.session_id = p_session_id
  GROUP BY c.id;
END;
$$ LANGUAGE plpgsql;
```

## Data Models

### Enhanced API Response Types

```typescript
// src/types/api.ts
export interface ApiResponse<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: AppError;
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

export interface PaginatedData<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
```

## Error Handling

### Error Boundary Enhancement

```typescript
// src/components/ErrorBoundary.tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<Props, ErrorBoundaryState> {
  // Capture errors and provide retry mechanism
  // Log errors to monitoring service
  // Display user-friendly error messages
}
```

### Retry Strategy

```typescript
// src/lib/retry.ts
interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoff: 'linear' | 'exponential';
  retryableErrors: ErrorCode[];
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T>;
```

## Testing Strategy

### Unit Tests
- Validation schemas avec Zod
- Error handling functions
- Query key generators
- Store actions

### Integration Tests
- React Query hooks avec MSW (Mock Service Worker)
- Optimistic updates
- Pagination logic
- Form validation

### Performance Tests
- Bundle size analysis avec webpack-bundle-analyzer
- Lighthouse CI pour les métriques de performance
- React DevTools Profiler pour identifier les re-renders

## Migration Strategy

### Phase 1: Foundation (Non-breaking)
1. Ajouter les variables d'environnement
2. Installer et configurer React Query
3. Créer les schémas Zod
4. Ajouter les indexes en base de données

### Phase 2: Gradual Adoption
1. Migrer un hook à la fois vers React Query (commencer par getSurveillants)
2. Remplacer useDataFetching par les nouveaux hooks
3. Ajouter la validation Zod aux formulaires un par un
4. Implémenter le store Zustand pour la session active

### Phase 3: Optimization
1. Ajouter la pagination côté serveur
2. Implémenter la virtualisation pour les grandes listes
3. Ajouter les mises à jour optimistes
4. Créer les vues matérialisées

### Phase 4: Polish
1. Optimiser les imports et le bundle
2. Améliorer la gestion d'erreurs
3. Ajouter le monitoring
4. Documentation et tests

## Performance Metrics

### Target Metrics
- First Contentful Paint (FCP): < 1.5s
- Time to Interactive (TTI): < 3.5s
- Bundle size (main): < 500KB gzipped
- API response time (p95): < 500ms
- Cache hit rate: > 80%

### Monitoring
- Utiliser React Query Devtools en développement
- Implémenter des custom metrics avec Performance API
- Logger les temps de réponse API
- Tracker les erreurs avec Sentry (optionnel)

## Security Considerations

1. **Environment Variables**: Ne jamais commiter les fichiers .env
2. **API Keys**: Utiliser les Row Level Security de Supabase
3. **Validation**: Toujours valider côté serveur en plus du client
4. **Rate Limiting**: Implémenter des limites sur les mutations
5. **CORS**: Configurer correctement les origines autorisées

## Backward Compatibility

- Les anciens hooks (useDataFetching) resteront fonctionnels pendant la migration
- Les nouveaux hooks seront opt-in
- Pas de breaking changes dans l'API publique
- Migration progressive page par page
