import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCreneauxBySession, createCreneau, updateCreneau, deleteCreneau } from '../../lib/api';
import { Creneau } from '../../types';
import { queryKeys } from '../lib/queryKeys';
import { handleError } from '../lib/errorHandler';
import toast from 'react-hot-toast';

export function useCreneaux(sessionId?: string) {
  return useQuery({
    queryKey: queryKeys.creneaux.bySession(sessionId!),
    queryFn: async () => {
      try {
        return await getCreneauxBySession(sessionId!);
      } catch (error) {
        throw handleError(error, { context: 'useCreneaux', sessionId });
      }
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCreneau() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Creneau>) => {
      try {
        return await createCreneau(data);
      } catch (error) {
        throw handleError(error, { context: 'createCreneau' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.creneaux.all });
      toast.success('Créneau créé.');
    },
  });
}

export function useUpdateCreneau() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Creneau> }) => {
      try {
        return await updateCreneau(id, updates);
      } catch (error) {
        throw handleError(error, { context: 'updateCreneau' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.creneaux.all });
      toast.success('Créneau mis à jour.');
    },
  });
}

export function useDeleteCreneau() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await deleteCreneau(id);
      } catch (error) {
        throw handleError(error, { context: 'deleteCreneau' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.creneaux.all });
      toast.success('Créneau supprimé.');
    },
  });
}
