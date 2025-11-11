import { z } from 'zod';

/**
 * Session Form Validation Schema
 */
export const sessionSchema = z.object({
  name: z.string()
    .min(1, 'Le nom de la session est requis')
    .max(200, 'Le nom est trop long'),
  
  year: z.number()
    .int('L\'année doit être un nombre entier')
    .min(2020, 'Année invalide')
    .max(2100, 'Année invalide'),
  
  period: z.union([z.literal(1), z.literal(2), z.literal(3)], {
    errorMap: () => ({ message: 'Période invalide (1=Jan, 2=Jun, 3=Aug)' }),
  }),
  
  is_active: z.boolean(),
});

export type SessionFormData = z.infer<typeof sessionSchema>;
