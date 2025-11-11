-- Migration pour ajouter le suivi des modifications aux soumissions
-- Date: 2025-01-11

-- Ajouter la colonne updated_at si elle n'existe pas
ALTER TABLE soumissions_disponibilites 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Ajouter la colonne historique_modifications pour tracker les changements
ALTER TABLE soumissions_disponibilites 
ADD COLUMN IF NOT EXISTS historique_modifications JSONB DEFAULT '[]'::jsonb;

-- Créer une fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer un trigger pour mettre à jour updated_at automatiquement
DROP TRIGGER IF EXISTS update_soumissions_updated_at ON soumissions_disponibilites;
CREATE TRIGGER update_soumissions_updated_at
    BEFORE UPDATE ON soumissions_disponibilites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Créer une fonction pour ajouter une entrée dans l'historique des modifications
CREATE OR REPLACE FUNCTION add_modification_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Ajouter une entrée dans l'historique seulement si les disponibilités ont changé
    IF OLD.historique_disponibilites IS DISTINCT FROM NEW.historique_disponibilites THEN
        NEW.historique_modifications = COALESCE(NEW.historique_modifications, '[]'::jsonb) || 
            jsonb_build_object(
                'date', now(),
                'type', 'modification',
                'nb_creneaux', (
                    SELECT COUNT(*) 
                    FROM jsonb_array_elements(NEW.historique_disponibilites) AS disp
                    WHERE (disp->>'est_disponible')::boolean = true
                )
            );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer un trigger pour l'historique des modifications
DROP TRIGGER IF EXISTS track_soumissions_modifications ON soumissions_disponibilites;
CREATE TRIGGER track_soumissions_modifications
    BEFORE UPDATE ON soumissions_disponibilites
    FOR EACH ROW
    EXECUTE FUNCTION add_modification_history();

-- Mettre à jour les enregistrements existants avec updated_at = submitted_at
UPDATE soumissions_disponibilites 
SET updated_at = submitted_at 
WHERE updated_at IS NULL;

-- Ajouter des commentaires pour la documentation
COMMENT ON COLUMN soumissions_disponibilites.updated_at IS 'Date et heure de la dernière modification';
COMMENT ON COLUMN soumissions_disponibilites.historique_modifications IS 'Historique des modifications: [{date, type, nb_creneaux}]';
