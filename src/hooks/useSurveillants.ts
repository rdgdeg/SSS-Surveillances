/**
 * Surveillants React Query Hooks
 * 
 * Provides hooks for fetching and managing surveillants data with caching.
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getSurveillants } from '../../lib/api';
import { Surveillant } from '../../types';
import { queryKeys, SurveillantFilters } from '../lib/queryKeys';
import { handleError } from '../lib/errorHandler';

/**
 * Hook to fetch all surveillants with optional filtering
 * 
 * @param filters - Optional filters for surveillants
 * @returns Query result with surveillants data
 * 
 * @example
 * ```tsx
 * const { data: surveillants, isLoading, error } = useSurveillants({
 *   type: 'assistant',
 *   active: 'active'
 * });
 * ```
 */
export function useSurveillants(
  filters?: SurveillantFilters
): UseQueryResult<Surveillant[], Error> {
  return useQuery({
    queryKey: queryKeys.surveillants.list(filters),
    queryFn: async () => {
      try {
        const data = await getSurveillants();
        
        // Apply client-side filters if provided
        if (!filters) return data;
        
        let filtered = data;
        
        if (filters.type && filters.type !== 'all') {
          filtered = filtered.filter(s => s.type === filters.type);
        }
        
        if (filters.active === 'active') {
          filtered = filtered.filter(s => s.is_active);
        } else if (filters.active === 'inactive') {
          filtered = filtered.filter(s => !s.is_active);
        }
        
        if (filters.faculte && filters.faculte !== 'all') {
          filtered = filtered.filter(s => s.affectation_faculte === filters.faculte);
        }
        
        if (filters.search) {
          const search = filters.search.toLowerCase();
          filtered = filtered.filter(s => 
            `${s.prenom} ${s.nom} ${s.email}`.toLowerCase().includes(search)
          );
        }
        
        // Apply sorting
        if (filters.sort) {
          const [key, dir] = filters.sort.split('-');
          filtered.sort((a, b) => {
            const valA = a[key as keyof Surveillant] ?? '';
            const valB = b[key as keyof Surveillant] ?? '';
            
            if (typeof valA === 'string' && typeof valB === 'string') {
              return dir === 'asc' 
                ? valA.localeCompare(valB) 
                : valB.localeCompare(valA);
            }
            
            return dir === 'asc' 
              ? (valA as number) - (valB as number) 
              : (valB as number) - (valA as number);
          });
        }
        
        return filtered;
      } catch (error) {
        throw handleError(error, { context: 'useSurveillants' });
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single surveillant by ID
 * 
 * @param id - Surveillant ID
 * @returns Query result with surveillant data
 */
export function useSurveillant(
  id: string | undefined
): UseQueryResult<Surveillant | undefined, Error> {
  return useQuery({
    queryKey: queryKeys.surveillants.detail(id!),
    queryFn: async () => {
      try {
        const surveillants = await getSurveillants();
        return surveillants.find(s => s.id === id);
      } catch (error) {
        throw handleError(error, { context: 'useSurveillant', id });
      }
    },
    enabled: !!id, // Only run query if id is provided
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get active surveillants count
 */
export function useActiveSurveillantsCount(): UseQueryResult<number, Error> {
  return useQuery({
    queryKey: [...queryKeys.surveillants.all, 'active-count'],
    queryFn: async () => {
      try {
        const surveillants = await getSurveillants();
        return surveillants.filter(s => s.is_active).length;
      } catch (error) {
        throw handleError(error, { context: 'useActiveSurveillantsCount' });
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}
