import { z } from 'zod';

/**
 * Validation schema for course data
 */
export const coursSchema = z.object({
  code: z.string()
    .min(1, 'Le code du cours est requis')
    .max(50, 'Le code ne peut pas dépasser 50 caractères')
    .trim(),
  intitule_complet: z.string()
    .min(1, "L'intitulé complet est requis")
    .max(500, "L'intitulé ne peut pas dépasser 500 caractères")
    .trim(),
  consignes: z.string()
    .max(10000, 'Les consignes ne peuvent pas dépasser 10000 caractères')
    .optional()
    .nullable()
});

/**
 * Validation schema for course update (partial)
 */
export const coursUpdateSchema = z.object({
  intitule_complet: z.string()
    .min(1, "L'intitulé complet est requis")
    .max(500, "L'intitulé ne peut pas dépasser 500 caractères")
    .trim()
    .optional(),
  consignes: z.string()
    .max(10000, 'Les consignes ne peuvent pas dépasser 10000 caractères')
    .optional()
    .nullable()
});

/**
 * Validation schema for course search parameters
 */
export const coursSearchSchema = z.object({
  search: z.string().optional(),
  sortBy: z.enum(['code', 'intitule_complet', 'updated_at']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  hasInstructions: z.boolean().optional()
});

export type CoursInput = z.infer<typeof coursSchema>;
export type CoursUpdateInput = z.infer<typeof coursUpdateSchema>;
export type CoursSearchInput = z.infer<typeof coursSearchSchema>;
