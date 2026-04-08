/**
 * Normalise une cellule « activité » type WFSP2271=E ou WFSP2271=anything
 * pour comparaison avec cours.code : uniquement le segment avant le premier '='.
 */
export function normalizeActiviteToCoursCode(raw: string | null | undefined): string {
  if (raw == null || typeof raw !== 'string') return '';
  const s = raw.trim();
  if (!s) return '';
  const eq = s.indexOf('=');
  if (eq === -1) return s;
  return s.slice(0, eq).trim();
}
