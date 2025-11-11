import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSessions, createSession, updateSession, duplicateSession } from '../../lib/api';
import { Session } from '../../types';
import { queryKeys } from '../lib/queryKeys';
import { handleError } from '../lib/errorHandler';
import toast from 'react-hot-toast';

export function useSessions() {
  return useQuery({
    queryKey: queryKeys.sessions.list(),
    queryFn: async () => {
      try {
        return await getSessions();
      } catch (error) {
        throw handleError(error, { context: 'useSessions' });
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useActiveSession() {
  return useQuery({
    queryKey: queryKeys.sessions.active(),
    queryFn: async () => {
      try {
        const sessions = await getSessions();
        return sessions.find(s => s.is_active) || null;
      } catch (error) {
        throw handleError(error, { context: 'useActiveSession' });
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Session>) => {
      try {
        return await createSession(data);
      } catch (error) {
        throw handleError(error, { context: 'createSession' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      toast.success('Session créée.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la création.');
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Session> }) => {
      try {
        return await updateSession(id, updates);
      } catch (error) {
        throw handleError(error, { context: 'updateSession' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      toast.success('Session mise à jour.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la mise à jour.');
    },
  });
}

export function useDuplicateSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (session: Session) => {
      try {
        return await duplicateSession(session);
      } catch (error) {
        throw handleError(error, { context: 'duplicateSession' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      toast.success('Session dupliquée.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la duplication.');
    },
  });
}
