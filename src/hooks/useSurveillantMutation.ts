/**
 * Surveillant Mutations
 * 
 * Provides mutation hooks for creating, updating, and deleting surveillants.
 * Includes optimistic updates for better UX.
 */

import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { 
  createSurveillant, 
  updateSurveillant, 
  deleteSurveillant 
} from '../../lib/api';
import { Surveillant } from '../../types';
import { queryKeys } from '../lib/queryKeys';
import { handleError } from '../lib/errorHandler';
import toast from 'react-hot-toast';

/**
 * Hook to create a new surveillant
 */
export function useCreateSurveillant(): UseMutationResult<
  Surveillant,
  Error,
  Partial<Surveillant>
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Surveillant>) => {
      try {
        return await createSurveillant(data);
      } catch (error) {
        throw handleError(error, { context: 'createSurveillant', data });
      }
    },
    onSuccess: (newSurveillant) => {
      // Invalidate all surveillants queries to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.surveillants.all });
      toast.success(`${newSurveillant.prenom} ${newSurveillant.nom} a été ajouté.`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la création du surveillant.');
    },
  });
}

/**
 * Hook to update a surveillant with optimistic updates
 */
export function useUpdateSurveillant(): UseMutationResult<
  Surveillant,
  Error,
  { id: string; updates: Partial<Surveillant> }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      try {
        return await updateSurveillant(id, updates);
      } catch (error) {
        throw handleError(error, { context: 'updateSurveillant', id, updates });
      }
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.surveillants.all });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<Surveillant[]>(
        queryKeys.surveillants.lists()
      );

      // Optimistically update
      if (previousData) {
        queryClient.setQueryData<Surveillant[]>(
          queryKeys.surveillants.lists(),
          previousData.map(s => 
            s.id === id ? { ...s, ...updates } : s
          )
        );
      }

      return { previousData };
    },
    onError: (error: Error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.surveillants.lists(),
          context.previousData
        );
      }
      toast.error(error.message || 'Erreur lors de la mise à jour.');
    },
    onSuccess: (updatedSurveillant) => {
      toast.success(`${updatedSurveillant.prenom} ${updatedSurveillant.nom} a été mis à jour.`);
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.surveillants.all });
    },
  });
}

/**
 * Hook to delete a surveillant
 */
export function useDeleteSurveillant(): UseMutationResult<
  void,
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await deleteSurveillant(id);
      } catch (error) {
        throw handleError(error, { context: 'deleteSurveillant', id });
      }
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.surveillants.all });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<Surveillant[]>(
        queryKeys.surveillants.lists()
      );

      // Optimistically remove
      if (previousData) {
        queryClient.setQueryData<Surveillant[]>(
          queryKeys.surveillants.lists(),
          previousData.filter(s => s.id !== id)
        );
      }

      return { previousData };
    },
    onError: (error: Error, id, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.surveillants.lists(),
          context.previousData
        );
      }
      toast.error(error.message || 'Erreur lors de la suppression.');
    },
    onSuccess: () => {
      toast.success('Surveillant supprimé.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.surveillants.all });
    },
  });
}

/**
 * Hook to toggle surveillant active status with optimistic update
 */
export function useToggleSurveillantActive(): UseMutationResult<
  Surveillant,
  Error,
  Surveillant
> {
  const updateMutation = useUpdateSurveillant();

  return useMutation({
    mutationFn: async (surveillant: Surveillant) => {
      return updateMutation.mutateAsync({
        id: surveillant.id,
        updates: { is_active: !surveillant.is_active },
      });
    },
  });
}

/**
 * Hook to toggle surveillant dispense status with optimistic update
 */
export function useToggleSurveillantDispense(): UseMutationResult<
  Surveillant,
  Error,
  Surveillant
> {
  const updateMutation = useUpdateSurveillant();

  return useMutation({
    mutationFn: async (surveillant: Surveillant) => {
      const newStatus = !surveillant.dispense_surveillance;
      const result = await updateMutation.mutateAsync({
        id: surveillant.id,
        updates: { dispense_surveillance: newStatus },
      });
      
      // Custom toast message
      toast.success(
        newStatus 
          ? `${surveillant.prenom} ${surveillant.nom} est dispensé(e)`
          : `${surveillant.prenom} ${surveillant.nom} n'est plus dispensé(e)`
      );
      
      return result;
    },
  });
}

/**
 * Hook to bulk delete surveillants
 */
export function useBulkDeleteSurveillants(): UseMutationResult<
  { deleted: number; failed: number },
  Error,
  string[]
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      let deleted = 0;
      let failed = 0;

      for (const id of ids) {
        try {
          await deleteSurveillant(id);
          deleted++;
        } catch (error) {
          failed++;
          console.error('Erreur suppression:', id, error);
        }
      }

      return { deleted, failed };
    },
    onSuccess: ({ deleted, failed }) => {
      if (deleted > 0) {
        toast.success(
          `${deleted} surveillant(s) supprimé(s)${failed > 0 ? `, ${failed} échec(s)` : ''}`
        );
      } else {
        toast.error("Aucun surveillant n'a pu être supprimé.");
      }
      
      queryClient.invalidateQueries({ queryKey: queryKeys.surveillants.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la suppression en bloc.');
    },
  });
}
