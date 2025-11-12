import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getCours, 
  getCoursById, 
  createCours, 
  updateCours, 
  deleteCoursConsignes,
  deleteCours,
  importCours,
  getCoursStats
} from '../../lib/coursApi';
import { CoursSearchParams, Cours, CoursImportResult } from '../../types';
import { parseCoursCSV, readFileAsText, validateCSVFile } from '../../lib/csvParser';

/**
 * Hook pour récupérer la liste des cours
 */
export function useCoursQuery(params?: CoursSearchParams) {
  return useQuery({
    queryKey: ['cours', params],
    queryFn: () => getCours(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
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
  });
}

/**
 * Hook pour récupérer les statistiques des cours
 */
export function useCoursStatsQuery() {
  return useQuery({
    queryKey: ['cours', 'stats'],
    queryFn: getCoursStats,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook pour les mutations de cours (admin)
 */
export function useCoursMutation() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createCours,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cours'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { intitule_complet?: string; consignes?: string | null } }) =>
      updateCours(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cours'] });
      queryClient.setQueryData(['cours', data.id], data);
    },
  });

  const deleteConsignesMutation = useMutation({
    mutationFn: deleteCoursConsignes,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cours'] });
      queryClient.setQueryData(['cours', data.id], data);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCours,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cours'] });
    },
  });

  return {
    create: createMutation,
    update: updateMutation,
    deleteConsignes: deleteConsignesMutation,
    delete: deleteMutation,
  };
}

/**
 * Hook pour l'import CSV de cours
 */
export function useCoursImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File): Promise<CoursImportResult> => {
      // Valider le fichier
      const validationError = validateCSVFile(file);
      if (validationError) {
        throw new Error(validationError);
      }

      // Lire le contenu du fichier
      const content = await readFileAsText(file);

      // Parser le CSV
      const { courses, errors: parseErrors } = parseCoursCSV(content);

      if (courses.length === 0) {
        throw new Error('Aucun cours valide trouvé dans le fichier');
      }

      // Importer les cours
      const result = await importCours(courses);

      // Ajouter les erreurs de parsing aux erreurs d'import
      return {
        ...result,
        errors: [...parseErrors, ...result.errors]
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cours'] });
    },
  });
}
