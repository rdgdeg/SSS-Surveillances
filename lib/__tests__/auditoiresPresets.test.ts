import { describe, it, expect } from 'vitest';
import {
  AUDITOIRES_PRESETS,
  isAuditoireAlreadyAdded,
  normalizeAuditoireName,
} from '../auditoiresPresets';

describe('auditoiresPresets', () => {
  it('contient les 13 auditoires demandés', () => {
    expect(AUDITOIRES_PRESETS).toHaveLength(13);
    expect(AUDITOIRES_PRESETS.find((p) => p.auditoire === '51A Lacroix')?.nb_surveillants_requis).toBe(3);
    expect(AUDITOIRES_PRESETS.find((p) => p.auditoire === 'Simonart')?.nb_surveillants_requis).toBe(5);
  });

  it('détecte les doublons sans tenir compte de la casse', () => {
    expect(isAuditoireAlreadyAdded('10A', ['10a'])).toBe(true);
    expect(isAuditoireAlreadyAdded('10D', ['10A', '10B'])).toBe(false);
  });

  it('normalise les espaces', () => {
    expect(normalizeAuditoireName('  10A  ')).toBe('10a');
  });
});
