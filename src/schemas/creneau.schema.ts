import { z } from 'zod';

/**
 * Creneau (Time Slot) Form Validation Schema
 */
export const creneauSchema = z.object({
  session_id: z.string()
    .uuid('ID de session invalide'),
  
  examen_id: z.string()
    .min(1, 'ID examen requis')
    .max(100, 'ID examen trop long'),
  
  date_surveillance: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)')
    .nullable(),
  
  heure_debut_surveillance: z.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format d\'heure invalide (HH:MM)')
    .nullable(),
  
  heure_fin_surveillance: z.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format d\'heure invalide (HH:MM)')
    .nullable(),
  
  type_creneau: z.enum(['PRINCIPAL', 'RESERVE'], {
    errorMap: () => ({ message: 'Type de créneau invalide' }),
  }),
}).refine(
  (data) => {
    // Validate that end time is after start time
    if (data.heure_debut_surveillance && data.heure_fin_surveillance) {
      return data.heure_fin_surveillance > data.heure_debut_surveillance;
    }
    return true;
  },
  {
    message: 'L\'heure de fin doit être après l\'heure de début',
    path: ['heure_fin_surveillance'],
  }
);

export type CreneauFormData = z.infer<typeof creneauSchema>;
