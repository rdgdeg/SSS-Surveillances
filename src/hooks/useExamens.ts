import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import {
  searchExamens,
  getExamenById,
  getExamensBySession,
  createManualExamen,
  importExamens,
  getExamensWithPresences,
  validateManualExamen,
  deleteExamen,
  submitPresence,
  getExistingPresence,
  updatePresence,
  getUnreadNotifications,
  getAllNotifications,
  markNotificationAsRead,
  archiveNotification,
  getUnreadNotificationCount
} from '../../lib/examenApi';
import { parseExamenCSV, readFileAsText, validateExamenCSVFile } from '../../lib/examenCsvParser';
import {
  Examen,
  ExamenWithPresence,
  ExamenImportResult,
  PresenceFormData,
  ManualExamenFormData,
  NotificationAdmin
} from '../../types';

// ============================================
// Hooks pour les examens
// ============================================

/**
 * Hook pour récupérer les examens d'une session
 */
export function useExamensQuery(sessionId: string | null) {
  return useQuery({
    queryKey: ['examens', sessionId],
    queryFn: () => getExamensBySession(sessionId!),
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook pour récupérer un examen par son ID
 */
export function useExamenDetailQuery(id: string | null) {
  return useQuery({
    queryKey: ['examen', id],
    queryFn: () => getExamenById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook pour la recherche d'examens avec debounce
 */
export function useExamenSearchQuery(sessionId: string | null, query: string, debounceMs: number = 300) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  
  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);
    
    return () => clearTimeout(timer);
  }, [query, debounceMs]);
  
  return useQuery({
    queryKey: ['examens', 'search', sessionId, debouncedQuery],
    queryFn: () => searchExamens(sessionId!, debouncedQuery),
    enabled: !!sessionId && debouncedQuery.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook pour les mutations d'examens (CRUD)
 */
export function useExamenMutation() {
  const queryClient = useQueryClient();
  
  const createManualMutation = useMutation({
    mutationFn: ({ sessionId, data, email }: { sessionId: string; data: ManualExamenFormData; email: string }) =>
      createManualExamen(sessionId, data, email),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['examens'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.setQueryData(['examen', data.id], data);
    },
  });
  
  const validateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates?: Partial<Examen> }) =>
      validateManualExamen(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['examens'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.setQueryData(['examen', data.id], data);
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: deleteExamen,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examens'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
  
  return {
    createManual: createManualMutation,
    validate: validateMutation,
    delete: deleteMutation,
  };
}

/**
 * Hook pour l'import CSV d'examens
 */
export function useExamenImport(onProgress?: (current: number, total: number) => void) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sessionId, file }: { sessionId: string; file: File }): Promise<ExamenImportResult> => {
      // Valider le fichier
      const validationError = validateExamenCSVFile(file);
      if (validationError) {
        throw new Error(validationError);
      }
      
      // Lire le contenu du fichier
      const content = await readFileAsText(file);
      
      // Parser le CSV
      const { examens, errors: parseErrors, warnings: parseWarnings } = parseExamenCSV(content);
      
      if (examens.length === 0) {
        throw new Error('Aucun examen valide trouvé dans le fichier');
      }
      
      // Importer les examens avec suivi de progression
      const result = await importExamens(sessionId, examens, onProgress);
      
      // Ajouter les erreurs et warnings de parsing aux résultats
      return {
        ...result,
        errors: [...parseErrors, ...result.errors],
        warnings: [...parseWarnings, ...result.warnings]
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examens'] });
    },
  });
}

/**
 * Hook pour récupérer les examens avec leurs présences
 */
export function useExamensWithPresencesQuery(sessionId: string | null) {
  return useQuery({
    queryKey: ['examens', 'with-presences', sessionId],
    queryFn: () => getExamensWithPresences(sessionId!),
    enabled: !!sessionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============================================
// Hooks pour les présences
// ============================================

/**
 * Hook pour récupérer la présence existante d'un enseignant
 */
export function useExistingPresenceQuery(examenId: string | null, enseignantEmail: string | null) {
  return useQuery({
    queryKey: ['presence', examenId, enseignantEmail],
    queryFn: () => getExistingPresence(examenId!, enseignantEmail!),
    enabled: !!examenId && !!enseignantEmail,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook pour les mutations de présences
 */
export function usePresenceMutation() {
  const queryClient = useQueryClient();
  
  const submitMutation = useMutation({
    mutationFn: ({ examenId, data }: { examenId: string; data: PresenceFormData }) =>
      submitPresence(examenId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['examens'] });
      queryClient.invalidateQueries({ queryKey: ['presence'] });
      queryClient.setQueryData(['presence', data.examen_id, data.enseignant_email], data);
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ presenceId, data }: { presenceId: string; data: Partial<PresenceFormData> }) =>
      updatePresence(presenceId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['examens'] });
      queryClient.invalidateQueries({ queryKey: ['presence'] });
      queryClient.setQueryData(['presence', data.examen_id, data.enseignant_email], data);
    },
  });
  
  return {
    submit: submitMutation,
    update: updateMutation,
  };
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
 * Hook pour récupérer toutes les notifications
 */
export function useAllNotificationsQuery(includeArchived: boolean = false) {
  return useQuery({
    queryKey: ['notifications', 'all', includeArchived],
    queryFn: () => getAllNotifications(includeArchived),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook pour le compteur de notifications non lues
 */
export function useUnreadNotificationCountQuery() {
  return useQuery({
    queryKey: ['notifications', 'count'],
    queryFn: getUnreadNotificationCount,
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
