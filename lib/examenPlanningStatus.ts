/** Filtres alignés sur les étiquettes ExamenPlanningBadges */

export type AuditoiresFilterValue = 'all' | 'with' | 'without';
export type SurveillantsFilterValue = 'all' | 'complete' | 'partial' | 'incomplete';

export type SurveillantsPlanningStatus = 'neutral' | 'complete' | 'partial' | 'incomplete';

export function getSurveillantsPlanningStatus(
  nbAuditoires: number,
  totalRequis: number,
  totalAttribues: number
): SurveillantsPlanningStatus {
  if (nbAuditoires === 0) return 'neutral';
  if (totalRequis > 0 && totalAttribues >= totalRequis) return 'complete';
  if (totalRequis > 0 && totalAttribues > 0 && totalAttribues < totalRequis) return 'partial';
  return 'incomplete';
}

export function matchesAuditoiresFilter(
  nbAuditoires: number,
  filter?: AuditoiresFilterValue
): boolean {
  if (!filter || filter === 'all') return true;
  if (filter === 'with') return nbAuditoires > 0;
  return nbAuditoires === 0;
}

export function matchesSurveillantsFilter(
  nbAuditoires: number,
  totalRequis: number,
  totalAttribues: number,
  filter?: SurveillantsFilterValue
): boolean {
  if (!filter || filter === 'all') return true;
  const status = getSurveillantsPlanningStatus(nbAuditoires, totalRequis, totalAttribues);
  if (filter === 'complete') return status === 'complete';
  if (filter === 'partial') return status === 'partial';
  return status === 'incomplete';
}

export function matchesPlanningFilters(
  stats: { nb_auditoires: number; total_requis: number; total_attribues: number } | undefined,
  auditoiresFilter?: AuditoiresFilterValue,
  surveillantsFilter?: SurveillantsFilterValue
): boolean {
  const nbAuditoires = stats?.nb_auditoires ?? 0;
  const totalRequis = stats?.total_requis ?? 0;
  const totalAttribues = stats?.total_attribues ?? 0;

  return (
    matchesAuditoiresFilter(nbAuditoires, auditoiresFilter) &&
    matchesSurveillantsFilter(nbAuditoires, totalRequis, totalAttribues, surveillantsFilter)
  );
}
