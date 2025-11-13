-- ============================================
-- Migration: Ajout du champ noms_accompagnants
-- Description: Ajoute le champ pour stocker les noms des personnes amenées
-- Date: 2025-01-13
-- ============================================

-- Ajouter la colonne noms_accompagnants si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'presences_enseignants' 
    AND column_name = 'noms_accompagnants'
  ) THEN
    ALTER TABLE presences_enseignants 
    ADD COLUMN noms_accompagnants TEXT;
    
    COMMENT ON COLUMN presences_enseignants.noms_accompagnants IS 'Noms des personnes amenées pour surveiller (séparés par des virgules)';
  END IF;
END $$;
