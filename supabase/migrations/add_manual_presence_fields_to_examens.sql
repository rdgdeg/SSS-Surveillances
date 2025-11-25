-- Migration: Add manual presence fields to examens table
-- Description: Allow manual entry of teacher presence and accompanying persons count

-- Add columns for manual entry
ALTER TABLE examens
ADD COLUMN IF NOT EXISTS nb_enseignants_presents_manuel INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS nb_accompagnants_manuel INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS use_manual_counts BOOLEAN DEFAULT FALSE;

-- Add comments
COMMENT ON COLUMN examens.nb_enseignants_presents_manuel IS 'Nombre d''enseignants présents (saisie manuelle)';
COMMENT ON COLUMN examens.nb_accompagnants_manuel IS 'Nombre d''accompagnants/personnes apportées (saisie manuelle)';
COMMENT ON COLUMN examens.use_manual_counts IS 'Si true, utilise les valeurs manuelles au lieu des déclarations';

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_examens_use_manual_counts ON examens(use_manual_counts);
