-- Masquer des examens de la liste admin (sans surveillance à gérer)
ALTER TABLE examens
ADD COLUMN IF NOT EXISTS masque_liste BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN examens.masque_liste IS
  'Si true, examen masqué de la liste par défaut (hors filtre « examens masqués »)';

CREATE INDEX IF NOT EXISTS idx_examens_masque_liste ON examens (session_id, masque_liste);
