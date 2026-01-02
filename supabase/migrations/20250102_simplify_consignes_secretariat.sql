-- Migration: Simplifier les consignes de secrétariat en un seul champ
-- Date: 2025-01-02
-- Description: Remplace les 3 champs séparés par un seul champ de consignes multilignes

-- 1. Ajouter la nouvelle colonne consignes (texte multilignes)
ALTER TABLE consignes_secretariat 
ADD COLUMN IF NOT EXISTS consignes TEXT;

-- 2. Migrer les données existantes vers le nouveau champ
-- Concaténer les 3 champs existants en un seul avec des séparateurs clairs
UPDATE consignes_secretariat 
SET consignes = CASE 
  WHEN consignes_arrivee IS NOT NULL OR consignes_mise_en_place IS NOT NULL OR consignes_generales IS NOT NULL THEN
    TRIM(BOTH E'\n' FROM 
      COALESCE(consignes_arrivee, '') ||
      CASE WHEN consignes_arrivee IS NOT NULL AND (consignes_mise_en_place IS NOT NULL OR consignes_generales IS NOT NULL) THEN E'\n\n' ELSE '' END ||
      COALESCE(consignes_mise_en_place, '') ||
      CASE WHEN consignes_mise_en_place IS NOT NULL AND consignes_generales IS NOT NULL THEN E'\n\n' ELSE '' END ||
      COALESCE(consignes_generales, '')
    )
  ELSE NULL
END
WHERE consignes IS NULL;

-- 3. Commentaire pour documenter la nouvelle colonne
COMMENT ON COLUMN consignes_secretariat.consignes IS 'Consignes complètes pour les surveillants (texte multilignes)';

-- 4. Afficher un résumé de la migration
DO $migration_summary$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ MIGRATION TERMINÉE: Simplification des consignes de secrétariat';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✓ Nouvelle colonne "consignes" ajoutée';
  RAISE NOTICE '✓ Données migrées depuis les 3 champs séparés';
  RAISE NOTICE '✓ Les anciennes colonnes sont conservées pour compatibilité';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Prochaines étapes:';
  RAISE NOTICE '1. Mettre à jour l''interface pour utiliser le champ "consignes"';
  RAISE NOTICE '2. Tester la nouvelle interface';
  RAISE NOTICE '3. Supprimer les anciennes colonnes si tout fonctionne';
  RAISE NOTICE '';
END $migration_summary$;