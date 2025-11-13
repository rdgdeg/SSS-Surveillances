import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import {
  searchCours,
  getCoursById,
  submitPresence,
  getExistingPresence,
  getCoursWithPresences,
  getUnreadNotifications,
  markNotificationAsRead,
  archiveNotification
} from '../../lib/teacherPresenceApi';
import {
  Cours,
  CoursWithPresence,
  PresenceFormData,
  NotificationAdmin
} from '../../types';

// ============================================
// Hooks pour la recherche de cours
// ============================================

/**
 * Hook pour la recherche de cours avec debounce
 */
export function useCoursSearchQuery(query: string, debounceMs: number = 300) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  
  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);
    
    return () => clearTimeout(timer);
  }, [query, debounceMs]);
  
  return useQuery({
    queryKey: ['cours', 'search', debouncedQuery],
    queryFn: () => searchCours(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook pour récupérer un cours par son ID
 */
export function useCoursDetailQuery(id: string | null) {
  return useQuery({
    queryKey: ['cours', id],
    queryFn: () => getCoursById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================
// Hooks pour les présences
// ============================================

/**
 * Hook pour récupérer la présence existante d'un enseignant
 */
export function useExistingPresenceQuery(
  coursId: string | null,
  sessionId: string | null,
  enseignantEmail: string | null
) {
  return useQuery({
    queryKey: ['presence', coursId, sessionId, enseignantEmail],
    queryFn: () => getExistingPresence(coursId!, sessionId!, enseignantEmail!),
    enabled: !!coursId && !!sessionId && !!enseignantEmail,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook pour les mutations de présences
 */
export function usePresenceMutation() {
  const queryClient = useQueryClient();
  
  const submitMutation = useMutation({
    mutationFn: ({ coursId, sessionId, data }: { coursId: string; sessionId: string; data: PresenceFormData }) =>
      submitPresence(coursId, sessionId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cours'] });
      queryClient.invalidateQueries({ queryKey: ['presence'] });
      queryClient.setQueryData(['presence', data.cours_id, data.session_id, data.enseignant_email], data);
    },
  });
  
  return {
    submit: submitMutation,
  };
}

// ============================================
// Hooks pour le dashboard admin
// ============================================

/**
 * Hook pour récupérer les cours avec leurs présences
 */
export function useCoursWithPresencesQuery(sessionId: string | null) {
  return useQuery({
    queryKey: ['cours', 'with-presences', sessionId],
    queryFn: () => getCoursWithPresences(sessionId!),
    enabled: !!sessionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============================================
// Hooks pour les notifications admin
// ============================================

/**
 * Hook pour récupérer les notifications non lues
 */
export function useUnreadNotificationsQuery() {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: getUnreadNotifications,
    staleTime: 30 * 1000, // 30 secondes
    refetchInterval: 30 * 1000, // Polling toutes les 30 secondes
  });
}

/**
 * Hook pour les mutations de notifications
 */
export function useNotificationMutation() {
  const queryClient = useQueryClient();
  
  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
  
  const archiveMutation = useMutation({
    mutationFn: archiveNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
  
  return {
    markAsRead: markAsReadMutation,
    archive: archiveMutation,
  };
}
