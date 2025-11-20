-- Migration pour ajouter la colonne téléphone et synchroniser depuis les soumissions vers les surveillants

-- Étape 1: Ajouter la colonne telephone dans soumissions_disponibilites si elle n'existe pas
ALTER TABLE soumissions_disponibilites 
ADD COLUMN IF NOT EXISTS telephone TEXT;

-- Étape 2: Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_soumissions_telephone ON soumissions_disponibilites(telephone) WHERE telephone IS NOT NULL;

-- Étape 3: Fonction pour synchroniser le téléphone depuis la dernière soumission
CREATE OR REPLACE FUNCTION sync_telephone_from_soumission()
RETURNS TRIGGER AS $$
BEGIN
    -- Si un téléphone est fourni dans la soumission et que le surveillant existe
    IF NEW.telephone IS NOT NULL AND NEW.telephone != '' AND NEW.surveillant_id IS NOT NULL THEN
        -- Mettre à jour le téléphone du surveillant
        UPDATE surveillants
        SET telephone = NEW.telephone
        WHERE id = NEW.surveillant_id
        AND (telephone IS NULL OR telephone = '');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Étape 4: Créer le trigger pour synchroniser automatiquement
DROP TRIGGER IF EXISTS trigger_sync_telephone ON soumissions_disponibilites;
CREATE TRIGGER trigger_sync_telephone
    AFTER INSERT OR UPDATE OF telephone ON soumissions_disponibilites
    FOR EACH ROW
    EXECUTE FUNCTION sync_telephone_from_soumission();

-- Étape 5: Synchroniser les téléphones existants (une seule fois)
-- Prendre le téléphone de la soumission la plus récente pour chaque surveillant
UPDATE surveillants s
SET telephone = sub.telephone
FROM (
    SELECT DISTINCT ON (surveillant_id) 
        surveillant_id,
        telephone
    FROM soumissions_disponibilites
    WHERE surveillant_id IS NOT NULL 
    AND telephone IS NOT NULL 
    AND telephone != ''
    ORDER BY surveillant_id, submitted_at DESC
) sub
WHERE s.id = sub.surveillant_id
AND (s.telephone IS NULL OR s.telephone = '');

-- Commentaires
COMMENT ON COLUMN soumissions_disponibilites.telephone IS 'Numéro de téléphone du surveillant (rempli lors de la soumission)';
COMMENT ON FUNCTION sync_telephone_from_soumission() IS 'Synchronise automatiquement le téléphone depuis les soumissions de disponibilités vers la table surveillants';
