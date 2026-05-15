/**
 * Auditoires prédéfinis avec nombre de surveillants par défaut.
 * Utilisés dans le modal « Auditoires et Surveillants » pour ajout rapide.
 */
export interface AuditoirePreset {
  auditoire: string;
  nb_surveillants_requis: number;
}

export const AUDITOIRES_PRESETS: AuditoirePreset[] = [
  { auditoire: '10A', nb_surveillants_requis: 2 },
  { auditoire: '10B', nb_surveillants_requis: 2 },
  { auditoire: '10C', nb_surveillants_requis: 2 },
  { auditoire: '51A Lacroix', nb_surveillants_requis: 3 },
  { auditoire: '51B', nb_surveillants_requis: 2 },
  { auditoire: '51C', nb_surveillants_requis: 2 },
  { auditoire: '51D', nb_surveillants_requis: 2 },
  { auditoire: '51E', nb_surveillants_requis: 2 },
  { auditoire: '51F', nb_surveillants_requis: 2 },
  { auditoire: '51G', nb_surveillants_requis: 2 },
  { auditoire: 'Simonart', nb_surveillants_requis: 5 },
  { auditoire: 'Simonart Bas', nb_surveillants_requis: 3 },
  { auditoire: 'Simonart + 1/2 balcon', nb_surveillants_requis: 4 },
];

export function normalizeAuditoireName(name: string): string {
  return name.trim().toLowerCase();
}

export function isAuditoireAlreadyAdded(
  presetName: string,
  existingNames: string[]
): boolean {
  const normalized = normalizeAuditoireName(presetName);
  return existingNames.some((n) => normalizeAuditoireName(n) === normalized);
}
