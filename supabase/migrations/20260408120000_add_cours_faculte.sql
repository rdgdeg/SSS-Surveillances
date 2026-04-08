-- Colonne faculté sur le référentiel cours (filtres admin, jointure examens → cours)
ALTER TABLE cours
  ADD COLUMN IF NOT EXISTS faculte TEXT;

COMMENT ON COLUMN cours.faculte IS 'Faculté importée / saisie admin (filtres, audit)';

CREATE INDEX IF NOT EXISTS idx_cours_faculte ON cours(faculte) WHERE faculte IS NOT NULL AND faculte <> '';
