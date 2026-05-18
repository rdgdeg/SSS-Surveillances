/** Entrée calendrier : une surveillance (examen + auditoire) pour un surveillant */

export interface SurveillanceCalendarEntry {
  id: string;
  examenId: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  code_examen: string;
  nom_examen: string;
  auditoire: string;
}

export interface ExamenForCalendar {
  id: string;
  date_examen: string;
  heure_debut: string;
  heure_fin: string;
  code_examen: string;
  nom_examen: string;
}

export interface AuditoireForCalendar {
  examen_id: string;
  auditoire: string;
  surveillants_noms?: string[];
}

function matchesSurveillant(nom: string, surveillantName: string): boolean {
  return nom.toLowerCase().includes(surveillantName.trim().toLowerCase());
}

/** Construit les créneaux calendrier pour un surveillant (une ligne par auditoire assigné) */
export function buildSurveillanceCalendarEntries(
  surveillantName: string,
  examens: ExamenForCalendar[],
  auditoires: AuditoireForCalendar[]
): SurveillanceCalendarEntry[] {
  if (!surveillantName.trim()) return [];

  const examenMap = new Map(examens.map((e) => [e.id, e]));
  const entries: SurveillanceCalendarEntry[] = [];

  for (const aud of auditoires) {
    const assigned = (aud.surveillants_noms || []).some((nom) =>
      matchesSurveillant(nom, surveillantName)
    );
    if (!assigned) continue;

    const examen = examenMap.get(aud.examen_id);
    if (!examen?.date_examen) continue;

    entries.push({
      id: `${aud.examen_id}-${aud.auditoire}`,
      examenId: aud.examen_id,
      date: examen.date_examen,
      heure_debut: examen.heure_debut || '',
      heure_fin: examen.heure_fin || '',
      code_examen: examen.code_examen,
      nom_examen: examen.nom_examen,
      auditoire: aud.auditoire,
    });
  }

  return entries.sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    if (d !== 0) return d;
    return (a.heure_debut || '').localeCompare(b.heure_debut || '');
  });
}

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export function getWeekdayLabels(): string[] {
  return WEEKDAY_LABELS;
}

/** Grille du mois : 6 semaines × 7 jours (lundi = début de semaine) */
export function getMonthCalendarWeeks(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - startOffset);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }

  const weeks: Date[][] = [];
  for (let i = 0; i < 42; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatMonthYear(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
}

export function groupEntriesByDate(
  entries: SurveillanceCalendarEntry[]
): Map<string, SurveillanceCalendarEntry[]> {
  const map = new Map<string, SurveillanceCalendarEntry[]>();
  for (const entry of entries) {
    const list = map.get(entry.date) ?? [];
    list.push(entry);
    map.set(entry.date, list);
  }
  return map;
}

/** Mois initial pour le calendrier : premier mois contenant une surveillance, sinon aujourd'hui */
export function getInitialCalendarMonth(entries: SurveillanceCalendarEntry[]): { year: number; month: number } {
  const today = new Date();
  if (entries.length === 0) {
    return { year: today.getFullYear(), month: today.getMonth() };
  }
  const first = parseDateKey(entries[0].date);
  return { year: first.getFullYear(), month: first.getMonth() };
}
