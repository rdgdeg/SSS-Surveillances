import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMessages, updateMessageStatus } from '../../lib/api';
import { Message } from '../../types';
import { queryKeys } from '../lib/queryKeys';
import { handleError } from '../lib/errorHandler';
import toast from 'react-hot-toast';

export function useMessages() {
  return useQuery({
    queryKey: queryKeys.messages.list(),
    queryFn: async () => {
      try {
        return await getMessages();
      } catch (error) {
        throw handleError(error, { context: 'useMessages' });
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useUpdateMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Message> }) => {
      try {
        return await updateMessageStatus(id, updates);
      } catch (error) {
        throw handleError(error, { context: 'updateMessage' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
    },
  });
}
