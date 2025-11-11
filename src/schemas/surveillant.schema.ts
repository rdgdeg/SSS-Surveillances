import { z } from 'zod';
import { SurveillantType } from '../../types';

/**
 * Surveillant Form Validation Schema
 * 
 * Validates all fields for creating or updating a surveillant.
 * Includes custom refinements for business logic validation.
 */
export const surveillantSchema = z.object({
  prenom: z.string()
    .min(1, 'Le prénom est requis')
    .max(100, 'Le prénom est trop long'),
  
  nom: z.string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom est trop long'),
  
  email: z.string()
    .min(1, "L'email est requis")
    .email('Format email invalide')
    .toLowerCase(),
  
  type: z.nativeEnum(SurveillantType, {
    errorMap: () => ({ message: 'Type de surveillant invalide' }),
  }),
  
  affectation_faculte: z.string()
    .max(50, 'Affectation faculté trop longue')
    .optional(),
  
  affectation_institut: z.string()
    .max(100, 'Affectation institut trop longue')
    .optional(),
  
  statut_salarial: z.string()
    .max(100, 'Statut salarial trop long')
    .optional(),
  
  etp_total: z.number()
    .min(0, 'EFT T. doit être positif')
    .max(1, 'EFT T. ne peut pas dépasser 1.0')
    .optional()
    .nullable(),
  
  etp_recherche: z.number()
    .min(0, 'EFT R. doit être positif')
    .max(1, 'EFT R. ne peut pas dépasser 1.0')
    .optional()
    .nullable(),
  
  etp_autre: z.number()
    .min(0, 'EFT Autre doit être positif')
    .max(1, 'EFT Autre ne peut pas dépasser 1.0')
    .optional()
    .nullable(),
  
  categorie_presence: z.string()
    .max(100, 'Catégorie présence trop longue')
    .optional(),
  
  fin_absence: z.string()
    .optional(),
  
  fin_repos_postnatal: z.string()
    .optional(),
  
  type_occupation: z.string()
    .max(100, 'Type occupation trop long')
    .optional(),
  
  telephone: z.string()
    .max(20, 'Numéro de téléphone trop long')
    .optional(),
  
  quota_surveillances: z.number()
    .int('Le quota doit être un nombre entier')
    .min(0, 'Le quota doit être positif'),
  
  is_active: z.boolean(),
  
  dispense_surveillance: z.boolean()
    .optional(),
}).refine(
  (data) => {
    // Au moins un ETP doit être rempli
    return data.etp_total !== undefined && data.etp_total !== null ||
           data.etp_recherche !== undefined && data.etp_recherche !== null;
  },
  {
    message: 'Au moins EFT T. ou EFT R. doit être rempli',
    path: ['etp_total'],
  }
);

/**
 * Type inferred from the schema for type-safe form data
 */
export type SurveillantFormData = z.infer<typeof surveillantSchema>;

/**
 * Partial schema for updates (all fields optional except id)
 */
export const surveillantUpdateSchema = surveillantSchema.partial();

export type SurveillantUpdateData = z.infer<typeof surveillantUpdateSchema>;
