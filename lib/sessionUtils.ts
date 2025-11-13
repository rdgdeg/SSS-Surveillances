/**
 * Utilitaires pour la gestion des sessions
 */

import { Session } from '../types';

/**
 * Labels des périodes de session
 */
export const PERIOD_LABELS: Record<number, string> = {
  1: 'Janvier',
  2: 'Juin',
  3: 'Août/Septembre',
  4: 'Hors-Session Janvier',
  5: 'Hors-Session Juin',
};

/**
 * Labels courts des périodes
 */
export const PERIOD_SHORT_LABELS: Record<number, string> = {
  1: 'Jan',
  2: 'Jun',
  3: 'Aug/Sep',
  4: 'HS Jan',
  5: 'HS Jun',
};

/**
 * Obtient le label complet d'une période
 */
export function getPeriodLabel(period: number): string {
  return PERIOD_LABELS[period] || `Période ${period}`;
}

/**
 * Obtient le label court d'une période
 */
export function getPeriodShortLabel(period: number): string {
  return PERIOD_SHORT_LABELS[period] || `P${period}`;
}

/**
 * Formate le nom complet d'une session
 */
export function formatSessionName(session: Session): string {
  return `${session.name} - ${session.year} (${getPeriodLabel(session.period)})`;
}

/**
 * Formate le nom court d'une session
 */
export function formatSessionShortName(session: Session): string {
  return `${session.year} ${getPeriodShortLabel(session.period)}`;
}

/**
 * Vérifie si une session est une session hors-session
 */
export function isHorsSession(session: Session): boolean {
  return session.period === 4 || session.period === 5;
}

/**
 * Obtient la période régulière correspondante pour une session hors-session
 * (4 -> 1, 5 -> 2)
 */
export function getRegularPeriod(period: number): number {
  if (period === 4) return 1; // Hors-Session Jan -> Jan
  if (period === 5) return 2; // Hors-Session Jun -> Jun
  return period;
}

/**
 * Obtient toutes les périodes disponibles pour la création de session
 */
export function getAvailablePeriods(): Array<{ value: number; label: string }> {
  return [
    { value: 1, label: PERIOD_LABELS[1] },
    { value: 2, label: PERIOD_LABELS[2] },
    { value: 3, label: PERIOD_LABELS[3] },
    { value: 4, label: PERIOD_LABELS[4] },
    { value: 5, label: PERIOD_LABELS[5] },
  ];
}
