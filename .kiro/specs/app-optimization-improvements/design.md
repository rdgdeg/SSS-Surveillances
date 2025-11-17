# Design Document

## Overview

Ce document détaille l'architecture et les stratégies d'implémentation pour optimiser l'application de gestion des surveillances d'examens. Les optimisations sont organisées par domaine et priorisées selon leur impact sur les performances et l'expérience utilisateur.

## Architecture

### Principes de Design

1. **Performance First**: Optimiser le temps de chargement initial et la réactivité
2. **Progressive Enhancement**: Améliorer progressivement sans casser l'existant
3. **Offline First**: Garantir la disponibilité même sans connexion
4. **Mobile First**: Optimiser pour les appareils mobiles en priorité
5. **Accessibility First**: Assurer l'accessibilité dès la conception

### Stack Technique Actuel

- **Frontend**: React 19.2, TypeScript 5.8
- **Build**: Vite 6.2
- **State Management**: Zustand 5.0, React Query 5.90
- **Backend**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS (via classes)
- **Icons**: Lucide React

## Components and Interfaces

### 1. Optimisation des Performances de Chargement

#### Bundle Splitting Strategy

```typescript
// vite.config.ts - Configuration optimisée
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-ui': ['lucide-react'],
          'admin': [
            './components/admin/*',
            './pages/admin/*'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
```

#### Image Optimization

- Utiliser `vite-plugin-imagemin` pour compresser les images
- Implémenter lazy loading pour les images
- Utiliser WebP avec fallback PNG/JPG


#### Route Preloading

```typescript
// lib/routePreloader.ts
export const preloadRoute = (path: string) => {
  const routes = {
    '/admin/dashboard': () => import('./pages/admin/DashboardPage'),
    '/admin/surveillants': () => import('./pages/admin/SurveillantsPage'),
    // ... autres routes
  };
  
  return routes[path]?.();
};

// Utilisation dans les liens
<Link 
  to="/admin/dashboard" 
  onMouseEnter={() => preloadRoute('/admin/dashboard')}
>
  Dashboard
</Link>
```

### 2. Optimisation des Requêtes et du Cache

#### Query Prefetching

```typescript
// src/hooks/usePrefetch.ts
export function usePrefetchQueries() {
  const queryClient = useQueryClient();
  
  const prefetchDashboard = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.dashboard.stats(),
      queryFn: getDashboardStats,
      staleTime: 5 * 60 * 1000
    });
  }, [queryClient]);
  
  return { prefetchDashboard };
}
```

#### Optimistic Updates

```typescript
// src/hooks/useOptimisticUpdate.ts
export function useUpdateCreneauOptimistic() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateCreneau,
    onMutate: async ({ id, updates }) => {
      // Annuler les requêtes en cours
      await queryClient.cancelQueries({ queryKey: queryKeys.creneaux.all });
      
      // Snapshot de l'état précédent
      const previous = queryClient.getQueryData(queryKeys.creneaux.all);
      
      // Mise à jour optimiste
      queryClient.setQueryData(queryKeys.creneaux.all, (old: Creneau[]) =>
        old.map(c => c.id === id ? { ...c, ...updates } : c)
      );
      
      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback en cas d'erreur
      queryClient.setQueryData(queryKeys.creneaux.all, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.creneaux.all });
    }
  });
}
```


#### Cache Configuration Optimisée

```typescript
// src/lib/queryClient.ts - Configuration améliorée
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Données statiques (cours, surveillants)
      staleTime: 10 * 60 * 1000, // 10 minutes
      
      // Données dynamiques configurées par hook
      refetchOnWindowFocus: false,
      refetchOnMount: 'stale',
      
      // Retry intelligent
      retry: (failureCount, error) => {
        if (error.message.includes('404')) return false;
        return failureCount < 3;
      }
    }
  }
});

// Configuration par type de données
export const queryConfigs = {
  static: { staleTime: 30 * 60 * 1000 }, // 30 min
  dynamic: { staleTime: 2 * 60 * 1000 },  // 2 min
  realtime: { staleTime: 0 }               // Toujours fresh
};
```

### 3. Amélioration de l'Expérience Utilisateur

#### Debounced Search

```typescript
// src/hooks/useDebouncedSearch.ts
export function useDebouncedSearch(delay = 300) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [searchTerm, delay]);
  
  return {
    searchTerm,
    debouncedTerm,
    setSearchTerm,
    isDebouncing: searchTerm !== debouncedTerm
  };
}
```

#### Virtual Scrolling

```typescript
// components/shared/VirtualList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualList<T>({ 
  items, 
  renderItem, 
  estimateSize = 50 
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 5
  });
  
  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`
            }}
          >
            {renderItem(items[virtualItem.index])}
          </div>
        ))}
      </div>
    </div>
  );
}
```


#### Loading States

```typescript
// components/shared/LoadingState.tsx
export function LoadingState({ 
  type = 'spinner',
  message 
}: LoadingStateProps) {
  if (type === 'skeleton') {
    return <SkeletonLoader />;
  }
  
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      {message && <p className="mt-4 text-gray-600">{message}</p>}
    </div>
  );
}

// components/shared/SkeletonLoader.tsx
export function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  );
}
```

### 4. Optimisation du Mode Offline

#### Service Worker Configuration

```typescript
// public/sw.js
const CACHE_NAME = 'exam-supervision-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => 
      cache.addAll(STATIC_ASSETS)
    )
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Cache-first pour les assets statiques
      if (response) return response;
      
      // Network-first pour les API calls
      return fetch(event.request).then(fetchResponse => {
        if (fetchResponse.ok) {
          const responseClone = fetchResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return fetchResponse;
      });
    })
  );
});
```

#### Enhanced Offline Queue

```typescript
// lib/offlineQueueManager.ts - Améliorations
export class OfflineQueueManager {
  private db: IDBDatabase;
  
  async enqueue(submission: PendingSubmission): Promise<void> {
    // Stocker dans IndexedDB au lieu de localStorage
    const tx = this.db.transaction(['queue'], 'readwrite');
    await tx.objectStore('queue').add(submission);
  }
  
  async processQueue(): Promise<ProcessResult> {
    const items = await this.getAllQueued();
    const results = await Promise.allSettled(
      items.map(item => this.processItem(item))
    );
    
    return this.aggregateResults(results);
  }
  
  private async processItem(item: PendingSubmission) {
    try {
      await submitToAPI(item.payload);
      await this.removeFromQueue(item.id);
      return { success: true };
    } catch (error) {
      await this.incrementAttempts(item.id);
      throw error;
    }
  }
}
```


### 5. Amélioration de l'Architecture du Code

#### Centralized Error Handling

```typescript
// src/lib/errorHandler.ts - Version améliorée
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown, context?: Record<string, any>): AppError {
  // Erreurs Supabase
  if (error?.code?.startsWith('PGRST')) {
    return new AppError(
      'Erreur de base de données',
      'DATABASE_ERROR',
      500,
      { ...context, originalError: error }
    );
  }
  
  // Erreurs réseau
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new AppError(
      'Erreur de connexion',
      'NETWORK_ERROR',
      0,
      context
    );
  }
  
  // Erreurs métier
  if (error instanceof AppError) {
    return error;
  }
  
  // Erreurs inconnues
  return new AppError(
    'Une erreur inattendue est survenue',
    'UNKNOWN_ERROR',
    500,
    { ...context, originalError: error }
  );
}
```

#### Shared Utilities

```typescript
// lib/utils/dateUtils.ts
export const dateUtils = {
  formatDate: (date: string) => 
    new Date(date).toLocaleDateString('fr-FR'),
  
  formatDateTime: (date: string) =>
    new Date(date).toLocaleString('fr-FR'),
  
  isToday: (date: string) => {
    const today = new Date().toDateString();
    return new Date(date).toDateString() === today;
  },
  
  addDays: (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
};

// lib/utils/validationUtils.ts
export const validationUtils = {
  isValidEmail: (email: string) => 
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  
  isUCLouvainEmail: (email: string) =>
    email.toLowerCase().endsWith('@uclouvain.be'),
  
  sanitizeInput: (input: string) =>
    input.trim().replace(/[<>]/g, ''),
  
  validateTimeRange: (start: string, end: string) => {
    const startTime = new Date(`2000-01-01T${start}`);
    const endTime = new Date(`2000-01-01T${end}`);
    return endTime > startTime;
  }
};
```


### 6. Optimisation des Composants React

#### Memoization Strategy

```typescript
// components/admin/ExamList.tsx - Optimisations
export const ExamList = memo(function ExamList({ sessionId }: Props) {
  const { examens, loading } = useExamens(sessionId);
  
  // Memoize les callbacks
  const handleEdit = useCallback((id: string) => {
    // ...
  }, []);
  
  const handleDelete = useCallback((id: string) => {
    // ...
  }, []);
  
  // Memoize les calculs coûteux
  const sortedExamens = useMemo(() => 
    [...examens].sort((a, b) => 
      a.date_examen.localeCompare(b.date_examen)
    ),
    [examens]
  );
  
  // Memoize les composants de liste
  const ExamRow = memo(({ exam }: { exam: Examen }) => (
    <tr>
      <td>{exam.code_examen}</td>
      {/* ... */}
    </tr>
  ));
  
  return (
    <table>
      <tbody>
        {sortedExamens.map(exam => (
          <ExamRow key={exam.id} exam={exam} />
        ))}
      </tbody>
    </table>
  );
});
```

#### Component Splitting

```typescript
// Avant: Un gros composant
function AvailabilityForm() {
  // 900 lignes de code...
}

// Après: Composants séparés
function AvailabilityForm() {
  return (
    <FormProvider>
      <EmailStep />
      <InfoStep />
      <AvailabilityStep />
      <ConfirmationStep />
    </FormProvider>
  );
}

// Chaque step est un composant indépendant et testable
```

### 7. Amélioration de la Sécurité

#### Token Refresh Mechanism

```typescript
// lib/auth.ts
export class AuthManager {
  private refreshTimer: NodeJS.Timeout | null = null;
  
  async refreshToken(): Promise<void> {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    
    // Planifier le prochain refresh
    this.scheduleRefresh(data.session.expires_at);
  }
  
  private scheduleRefresh(expiresAt: number): void {
    const now = Date.now();
    const expiresIn = expiresAt * 1000 - now;
    const refreshIn = expiresIn - 5 * 60 * 1000; // 5 min avant expiration
    
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    
    this.refreshTimer = setTimeout(() => {
      this.refreshToken();
    }, refreshIn);
  }
}
```

#### Input Sanitization

```typescript
// lib/security/sanitizer.ts
import DOMPurify from 'dompurify';

export const sanitizer = {
  sanitizeHTML: (dirty: string) => 
    DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] }),
  
  sanitizeInput: (input: string) =>
    input.trim().replace(/[<>'"]/g, ''),
  
  sanitizeEmail: (email: string) =>
    email.toLowerCase().trim().replace(/[^\w@.-]/g, ''),
  
  escapeSQL: (input: string) =>
    input.replace(/['";\\]/g, '\\$&')
};
```


### 8. Amélioration du Monitoring et des Logs

#### Error Tracking

```typescript
// lib/monitoring/errorTracker.ts
export class ErrorTracker {
  private static instance: ErrorTracker;
  
  track(error: Error, context?: Record<string, any>): void {
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // En production, envoyer à un service comme Sentry
    if (import.meta.env.PROD) {
      this.sendToMonitoring(errorData);
    } else {
      console.error('Error tracked:', errorData);
    }
  }
  
  private async sendToMonitoring(data: any): Promise<void> {
    // Intégration avec Sentry, LogRocket, etc.
  }
}
```

#### Performance Monitoring

```typescript
// lib/monitoring/performanceMonitor.ts
export class PerformanceMonitor {
  measureOperation<T>(
    name: string, 
    operation: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    
    return operation().finally(() => {
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
    });
  }
  
  private recordMetric(name: string, duration: number): void {
    // Stocker dans une base de métriques
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    
    // Alerter si trop lent
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${name}`);
    }
  }
}
```

### 9. Optimisation Mobile

#### Touch Interactions

```typescript
// hooks/useTouchGestures.ts
export function useTouchGestures(onSwipeLeft?: () => void, onSwipeRight?: () => void) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const minSwipeDistance = 50;
  
  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && onSwipeLeft) onSwipeLeft();
    if (isRightSwipe && onSwipeRight) onSwipeRight();
  };
  
  return { onTouchStart, onTouchMove, onTouchEnd };
}
```

#### Responsive Tables

```typescript
// components/shared/ResponsiveTable.tsx
export function ResponsiveTable({ data, columns }: Props) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  if (isMobile) {
    return (
      <div className="space-y-4">
        {data.map(row => (
          <Card key={row.id}>
            {columns.map(col => (
              <div key={col.key} className="flex justify-between py-2">
                <span className="font-medium">{col.label}:</span>
                <span>{row[col.key]}</span>
              </div>
            ))}
          </Card>
        ))}
      </div>
    );
  }
  
  return <StandardTable data={data} columns={columns} />;
}
```


### 10. Amélioration de l'Accessibilité

#### ARIA Labels and Keyboard Navigation

```typescript
// components/shared/AccessibleButton.tsx
export function AccessibleButton({ 
  onClick, 
  children, 
  ariaLabel,
  disabled 
}: Props) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      disabled={disabled}
      className="focus:ring-2 focus:ring-indigo-500 focus:outline-none"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {children}
    </button>
  );
}

// components/shared/AccessibleModal.tsx
export function AccessibleModal({ isOpen, onClose, children }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      // Trap focus dans le modal
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements?.[0] as HTMLElement;
      firstElement?.focus();
    }
  }, [isOpen]);
  
  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className={isOpen ? 'block' : 'hidden'}
    >
      {children}
    </div>
  );
}
```

### 11. Optimisation de la Base de Données

#### Database Indexes

```sql
-- Indexes pour améliorer les performances
CREATE INDEX idx_creneaux_session_date ON creneaux(session_id, date_surveillance);
CREATE INDEX idx_soumissions_session_email ON soumissions_disponibilites(session_id, email);
CREATE INDEX idx_examens_session_date ON examens(session_id, date_examen);
CREATE INDEX idx_surveillants_email ON surveillants(email);
CREATE INDEX idx_surveillants_active ON surveillants(is_active) WHERE is_active = true;

-- Index pour les recherches full-text
CREATE INDEX idx_cours_search ON cours USING gin(to_tsvector('french', code || ' ' || intitule_complet));
```

#### Optimized Views

```sql
-- Vue matérialisée pour les statistiques de disponibilités
CREATE MATERIALIZED VIEW mv_disponibilites_stats AS
SELECT 
  c.session_id,
  c.id as creneau_id,
  c.date_surveillance,
  c.heure_debut_surveillance,
  COUNT(DISTINCT s.id) FILTER (WHERE hd.est_disponible = true) as nb_disponibles,
  COUNT(DISTINCT s.id) as nb_reponses,
  c.nb_surveillants_requis,
  CASE 
    WHEN c.nb_surveillants_requis IS NOT NULL 
    THEN (COUNT(DISTINCT s.id) FILTER (WHERE hd.est_disponible = true)::float / c.nb_surveillants_requis * 100)
    ELSE NULL
  END as taux_remplissage
FROM creneaux c
LEFT JOIN soumissions_disponibilites s ON s.session_id = c.session_id
LEFT JOIN LATERAL jsonb_array_elements(s.historique_disponibilites) hd ON hd->>'creneau_id' = c.id
GROUP BY c.id, c.session_id, c.date_surveillance, c.heure_debut_surveillance, c.nb_surveillants_requis;

-- Refresh automatique toutes les 5 minutes
CREATE OR REPLACE FUNCTION refresh_disponibilites_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_disponibilites_stats;
END;
$$ LANGUAGE plpgsql;
```


### 12. Amélioration de la Gestion des Imports CSV

#### Chunked CSV Processing

```typescript
// lib/csvProcessor.ts
export class CSVProcessor {
  async processLargeFile(
    file: File,
    onProgress: (progress: number) => void
  ): Promise<ParseResult> {
    const chunkSize = 1000; // Lignes par chunk
    const reader = file.stream().getReader();
    const decoder = new TextDecoder();
    
    let buffer = '';
    let lineCount = 0;
    let results: any[] = [];
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Garder la dernière ligne incomplète
      
      // Traiter les lignes complètes
      for (const line of lines) {
        const parsed = this.parseLine(line);
        if (parsed) results.push(parsed);
        lineCount++;
        
        if (lineCount % chunkSize === 0) {
          onProgress((lineCount / file.size) * 100);
        }
      }
    }
    
    return { data: results, errors: [] };
  }
}
```

#### Enhanced Validation

```typescript
// lib/csvValidator.ts
export class CSVValidator {
  validateExamRow(row: any, rowNumber: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validations obligatoires
    if (!row.code_examen) {
      errors.push(`Ligne ${rowNumber}: Code examen manquant`);
    }
    
    if (!row.nom_examen) {
      errors.push(`Ligne ${rowNumber}: Nom examen manquant`);
    }
    
    // Validations de format
    if (row.date_examen && !this.isValidDate(row.date_examen)) {
      errors.push(`Ligne ${rowNumber}: Format de date invalide`);
    }
    
    // Warnings
    if (!row.enseignants || row.enseignants.length === 0) {
      warnings.push(`Ligne ${rowNumber}: Aucun enseignant spécifié`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  private isValidDate(date: string): boolean {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }
}
```

### 13. Optimisation des Exports

#### Async Export Generation

```typescript
// lib/exportService.ts
export class ExportService {
  async generateExport(
    data: any[],
    format: 'csv' | 'excel' | 'pdf',
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    // Utiliser un Web Worker pour ne pas bloquer l'UI
    const worker = new Worker('/workers/export-worker.js');
    
    return new Promise((resolve, reject) => {
      worker.onmessage = (e) => {
        if (e.data.type === 'progress') {
          onProgress?.(e.data.progress);
        } else if (e.data.type === 'complete') {
          resolve(e.data.blob);
          worker.terminate();
        } else if (e.data.type === 'error') {
          reject(new Error(e.data.error));
          worker.terminate();
        }
      };
      
      worker.postMessage({ data, format });
    });
  }
  
  async exportWithCompression(data: any[]): Promise<Blob> {
    const json = JSON.stringify(data);
    const compressed = await this.compress(json);
    return new Blob([compressed], { type: 'application/gzip' });
  }
  
  private async compress(data: string): Promise<Uint8Array> {
    const stream = new Blob([data]).stream();
    const compressedStream = stream.pipeThrough(
      new CompressionStream('gzip')
    );
    const blob = await new Response(compressedStream).blob();
    return new Uint8Array(await blob.arrayBuffer());
  }
}
```


### 14. Amélioration de la Gestion des Sessions

#### Session Management

```typescript
// lib/sessionManager.ts
export class SessionManager {
  private warningTimer: NodeJS.Timeout | null = null;
  private expiryTimer: NodeJS.Timeout | null = null;
  
  startSession(expiresAt: number): void {
    const now = Date.now();
    const expiresIn = expiresAt * 1000 - now;
    const warningTime = expiresIn - 5 * 60 * 1000; // 5 min avant
    
    // Avertir avant expiration
    this.warningTimer = setTimeout(() => {
      this.showExpiryWarning();
    }, warningTime);
    
    // Expirer la session
    this.expiryTimer = setTimeout(() => {
      this.handleExpiry();
    }, expiresIn);
  }
  
  private showExpiryWarning(): void {
    toast.warning(
      'Votre session expire dans 5 minutes',
      {
        duration: 60000,
        action: {
          label: 'Prolonger',
          onClick: () => this.extendSession()
        }
      }
    );
  }
  
  private async handleExpiry(): Promise<void> {
    // Sauvegarder l'état du formulaire
    const formState = this.captureFormState();
    localStorage.setItem('form_backup', JSON.stringify(formState));
    
    // Déconnecter
    await supabase.auth.signOut();
    
    toast.error('Votre session a expiré. Vos données ont été sauvegardées.');
  }
  
  async extendSession(): Promise<void> {
    const { data, error } = await supabase.auth.refreshSession();
    if (!error && data.session) {
      this.startSession(data.session.expires_at);
      toast.success('Session prolongée');
    }
  }
}
```

#### Cross-Tab Synchronization

```typescript
// lib/tabSync.ts
export class TabSynchronizer {
  private channel: BroadcastChannel;
  
  constructor() {
    this.channel = new BroadcastChannel('app-sync');
    this.setupListeners();
  }
  
  private setupListeners(): void {
    this.channel.onmessage = (event) => {
      switch (event.data.type) {
        case 'session-updated':
          this.handleSessionUpdate(event.data.session);
          break;
        case 'logout':
          this.handleLogout();
          break;
        case 'data-changed':
          this.handleDataChange(event.data.entity);
          break;
      }
    };
  }
  
  broadcastSessionUpdate(session: any): void {
    this.channel.postMessage({
      type: 'session-updated',
      session
    });
  }
  
  broadcastLogout(): void {
    this.channel.postMessage({ type: 'logout' });
  }
}
```

### 15. Optimisation des Notifications

#### Notification Manager

```typescript
// lib/notificationManager.ts
export class NotificationManager {
  private queue: Notification[] = [];
  private maxConcurrent = 3;
  private groupingDelay = 2000; // 2 secondes
  
  show(notification: Notification): void {
    // Grouper les notifications similaires
    const similar = this.queue.find(n => 
      n.type === notification.type && 
      Date.now() - n.timestamp < this.groupingDelay
    );
    
    if (similar) {
      this.groupNotifications(similar, notification);
    } else {
      this.addToQueue(notification);
    }
  }
  
  private groupNotifications(existing: Notification, newOne: Notification): void {
    existing.count = (existing.count || 1) + 1;
    existing.message = `${existing.count} ${existing.type}`;
    this.updateNotification(existing);
  }
  
  private addToQueue(notification: Notification): void {
    if (this.queue.length >= this.maxConcurrent) {
      // Remplacer la plus ancienne
      this.queue.shift();
    }
    
    this.queue.push(notification);
    this.displayNotification(notification);
  }
  
  private displayNotification(notification: Notification): void {
    toast[notification.severity](notification.message, {
      duration: notification.duration || 4000,
      action: notification.action ? {
        label: notification.action.label,
        onClick: notification.action.onClick
      } : undefined
    });
  }
}
```

## Data Models

### Performance Metrics

```typescript
interface PerformanceMetric {
  id: string;
  operation: string;
  duration: number;
  timestamp: string;
  context?: Record<string, any>;
}

interface BundleAnalysis {
  totalSize: number;
  chunks: Array<{
    name: string;
    size: number;
    modules: string[];
  }>;
  recommendations: string[];
}
```

## Error Handling

### Error Recovery Strategies

1. **Network Errors**: Retry avec backoff exponentiel
2. **Validation Errors**: Afficher les erreurs inline avec suggestions
3. **Database Errors**: Logger et afficher message générique
4. **Session Errors**: Sauvegarder l'état et rediriger vers login
5. **Unknown Errors**: Capturer dans error boundary avec option de rapport

## Testing Strategy

### Performance Testing

```typescript
// __tests__/performance/bundle-size.test.ts
describe('Bundle Size', () => {
  it('should not exceed 500KB for main bundle', async () => {
    const stats = await getBundleStats();
    expect(stats.main.size).toBeLessThan(500 * 1024);
  });
  
  it('should lazy load admin routes', async () => {
    const stats = await getBundleStats();
    expect(stats.chunks).toContainEqual(
      expect.objectContaining({ name: 'admin' })
    );
  });
});

// __tests__/performance/query-optimization.test.ts
describe('Query Optimization', () => {
  it('should deduplicate concurrent requests', async () => {
    const spy = jest.spyOn(api, 'getCreneaux');
    
    await Promise.all([
      queryClient.fetchQuery(queryKeys.creneaux.all),
      queryClient.fetchQuery(queryKeys.creneaux.all)
    ]);
    
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
```

### Accessibility Testing

```typescript
// __tests__/a11y/keyboard-navigation.test.tsx
describe('Keyboard Navigation', () => {
  it('should navigate through form with Tab key', () => {
    render(<AvailabilityForm />);
    
    const inputs = screen.getAllByRole('textbox');
    inputs[0].focus();
    
    userEvent.tab();
    expect(inputs[1]).toHaveFocus();
  });
  
  it('should submit form with Enter key', () => {
    const onSubmit = jest.fn();
    render(<AvailabilityForm onSubmit={onSubmit} />);
    
    userEvent.type(screen.getByLabelText('Email'), 'test@uclouvain.be{enter}');
    expect(onSubmit).toHaveBeenCalled();
  });
});
```

## Migration Strategy

### Phase 1: Quick Wins (1-2 semaines)
- Implémenter le code splitting
- Ajouter le debouncing sur les recherches
- Optimiser les re-renders avec memo
- Améliorer les états de chargement

### Phase 2: Infrastructure (2-3 semaines)
- Mettre en place le service worker
- Améliorer le système de cache
- Implémenter le monitoring
- Optimiser la base de données

### Phase 3: Features (3-4 semaines)
- Virtual scrolling pour les grandes listes
- Export asynchrone
- Amélioration du mode offline
- Optimisation mobile

### Phase 4: Polish (1-2 semaines)
- Amélioration de l'accessibilité
- Tests de performance
- Documentation
- Formation utilisateurs
