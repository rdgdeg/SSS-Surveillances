import { useQuery } from '@tanstack/react-query';
import { getDisponibilitesData } from '../../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { handleError } from '../lib/errorHandler';

export function useDisponibilites() {
  return useQuery({
    queryKey: queryKeys.disponibilites.matrix(),
    queryFn: async () => {
      try {
        return await getDisponibilitesData();
      } catch (error) {
        throw handleError(error, { context: 'useDisponibilites' });
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent updates)
  });
}
