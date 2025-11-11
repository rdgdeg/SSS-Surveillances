/**
 * Query Keys Factory
 * 
 * Centralized query key management for React Query.
 * Provides type-safe, hierarchical query keys for cache invalidation and management.
 * 
 * Pattern:
 * - ['entity'] - All data for that entity
 * - ['entity', 'list'] - All lists
 * - ['entity', 'list', filters] - Specific filtered list
 * - ['entity', 'detail', id] - Single item detail
 */

export interface SurveillantFilters {
  type?: string;
  active?: string;
  faculte?: string;
  sort?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreneauFilters {
  sessionId?: string;
  date?: string;
  type?: string;
}

export const queryKeys = {
  // Surveillants
  surveillants: {
    all: ['surveillants'] as const,
    lists: () => [...queryKeys.surveillants.all, 'list'] as const,
    list: (filters?: SurveillantFilters) => 
      [...queryKeys.surveillants.lists(), filters] as const,
    detail: (id: string) => 
      [...queryKeys.surveillants.all, 'detail', id] as const,
  },
  
  // Sessions
  sessions: {
    all: ['sessions'] as const,
    lists: () => [...queryKeys.sessions.all, 'list'] as const,
    list: () => [...queryKeys.sessions.lists()] as const,
    active: () => [...queryKeys.sessions.all, 'active'] as const,
    detail: (id: string) => 
      [...queryKeys.sessions.all, 'detail', id] as const,
  },
  
  // Creneaux
  creneaux: {
    all: ['creneaux'] as const,
    lists: () => [...queryKeys.creneaux.all, 'list'] as const,
    list: (filters?: CreneauFilters) => 
      [...queryKeys.creneaux.lists(), filters] as const,
    bySession: (sessionId: string) => 
      [...queryKeys.creneaux.all, 'session', sessionId] as const,
    detail: (id: string) => 
      [...queryKeys.creneaux.all, 'detail', id] as const,
  },
  
  // Disponibilites
  disponibilites: {
    all: ['disponibilites'] as const,
    matrix: (sessionId?: string) => 
      [...queryKeys.disponibilites.all, 'matrix', sessionId] as const,
  },
  
  // Soumissions
  soumissions: {
    all: ['soumissions'] as const,
    lists: () => [...queryKeys.soumissions.all, 'list'] as const,
    bySession: (sessionId: string) => 
      [...queryKeys.soumissions.all, 'session', sessionId] as const,
    status: (sessionId?: string) => 
      [...queryKeys.soumissions.all, 'status', sessionId] as const,
    detail: (id: string) => 
      [...queryKeys.soumissions.all, 'detail', id] as const,
  },
  
  // Messages
  messages: {
    all: ['messages'] as const,
    lists: () => [...queryKeys.messages.all, 'list'] as const,
    list: (filters?: { unread?: boolean; archived?: boolean }) => 
      [...queryKeys.messages.lists(), filters] as const,
    detail: (id: string) => 
      [...queryKeys.messages.all, 'detail', id] as const,
  },
  
  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
  },
};
