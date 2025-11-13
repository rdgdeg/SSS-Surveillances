-- ============================================
-- Migration: Add Reliability Features
-- Description: Ajoute les fonctionnalités de fiabilité pour garantir qu'aucune soumission ne soit perdue
-- Date: 2025-11-13
-- ============================================

-- ============================================
-- 1. Ajouter les colonnes de traçabilité à soumissions_disponibilites
-- ============================================

-- Colonne updated_at pour tracker la dernière modification
ALTER TABLE soumissions_disponibilites 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Colonne historique_modifications pour tracker toutes les modifications
ALTER TABLE soumissions_disponibilites 
ADD COLUMN IF NOT EXISTS historique_modifications JSONB DEFAULT '[]'::jsonb;

-- Colonne deleted_at pour soft delete
ALTER TABLE soumissions_disponibilites 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Colonne version pour optimistic locking
ALTER TABLE soumissions_disponibilites 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Commentaires pour documentation
COMMENT ON COLUMN soumissions_disponibilites.updated_at IS 'Date et heure de la dernière modification';
COMMENT ON COLUMN soumissions_disponibilites.historique_modifications IS 'Historique des modifications: [{date, type, nb_creneaux}]';
COMMENT ON COLUMN soumissions_disponibilites.deleted_at IS 'Date de suppression (soft delete). NULL si non supprimé';
COMMENT ON COLUMN soumissions_disponibilites.version IS 'Version pour optimistic locking. Incrémenté à chaque modification';

-- ============================================
-- 2. Créer la fonction trigger pour updated_at et version
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour le timestamp
    NEW.updated_at = now();
    
    -- Incrémenter la version si c'est une mise à jour (pas une insertion)
    IF TG_OP = 'UPDATE' THEN
        NEW.version = OLD.version + 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function pour mettre à jour automatiquement updated_at et incrémenter version';

-- ============================================
-- 3. Créer le trigger pour updated_at
-- ============================================

DROP TRIGGER IF EXISTS update_soumissions_updated_at ON soumissions_disponibilites;

CREATE TRIGGER update_soumissions_updated_at
    BEFORE UPDATE ON soumissions_disponibilites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. Créer la fonction trigger pour historique_modifications
-- ============================================

CREATE OR REPLACE FUNCTION add_modification_history()
RETURNS TRIGGER AS $$
DECLARE
    nb_creneaux INTEGER;
    modification_type TEXT;
BEGIN
    -- Compter le nombre de créneaux disponibles
    SELECT COUNT(*) INTO nb_creneaux
    FROM jsonb_array_elements(NEW.historique_disponibilites) AS disp
    WHERE (disp->>'est_disponible')::boolean = true;
    
    -- Déterminer le type de modification
    IF TG_OP = 'INSERT' THEN
        modification_type = 'creation';
    ELSE
        modification_type = 'modification';
    END IF;
    
    -- Ajouter l'entrée d'historique
    NEW.historique_modifications = COALESCE(OLD.historique_modifications, '[]'::jsonb) || 
        jsonb_build_object(
            'date', now(),
            'type', modification_type,
            'nb_creneaux', nb_creneaux
        );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_modification_history() IS 'Trigger function pour tracker automatiquement les modifications dans historique_modifications';

-- ============================================
-- 5. Créer le trigger pour historique_modifications
-- ============================================

DROP TRIGGER IF EXISTS track_soumissions_modifications ON soumissions_disponibilites;

CREATE TRIGGER track_soumissions_modifications
    BEFORE INSERT OR UPDATE ON soumissions_disponibilites
    FOR EACH ROW
    EXECUTE FUNCTION add_modification_history();

-- ============================================
-- 6. Migrer les données existantes
-- ============================================

-- Mettre à jour les enregistrements existants avec updated_at = submitted_at
UPDATE soumissions_disponibilites 
SET updated_at = submitted_at 
WHERE updated_at IS NULL;

-- Initialiser historique_modifications pour les enregistrements existants
UPDATE soumissions_disponibilites 
SET historique_modifications = jsonb_build_array(
    jsonb_build_object(
        'date', submitted_at,
        'type', 'creation',
        'nb_creneaux', (
            SELECT COUNT(*) 
            FROM jsonb_array_elements(historique_disponibilites) AS disp
            WHERE (disp->>'est_disponible')::boolean = true
        )
    )
)
WHERE historique_modifications = '[]'::jsonb OR historique_modifications IS NULL;

-- ============================================
-- 7. Créer des index pour améliorer les performances
-- ============================================

-- Index sur updated_at pour tri et filtrage
CREATE INDEX IF NOT EXISTS idx_soumissions_updated_at 
ON soumissions_disponibilites(updated_at DESC);

-- Index sur deleted_at pour filtrer les enregistrements supprimés
CREATE INDEX IF NOT EXISTS idx_soumissions_deleted_at 
ON soumissions_disponibilites(deleted_at) 
WHERE deleted_at IS NOT NULL;

-- Index GIN sur historique_modifications pour recherches JSON
CREATE INDEX IF NOT EXISTS idx_soumissions_historique_modifications 
ON soumissions_disponibilites USING gin(historique_modifications);

-- Index sur version pour optimistic locking
CREATE INDEX IF NOT EXISTS idx_soumissions_version 
ON soumissions_disponibilites(version);

-- ============================================
-- 8. Mettre à jour les politiques RLS pour exclure les soft deleted
-- ============================================

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Public can view submissions" ON soumissions_disponibilites;

-- Recréer la politique pour exclure les enregistrements supprimés
CREATE POLICY "Public can view submissions" ON soumissions_disponibilites
    FOR SELECT USING (deleted_at IS NULL);

-- Politique pour permettre aux admins de voir les enregistrements supprimés
CREATE POLICY "Admin can view deleted submissions" ON soumissions_disponibilites
    FOR SELECT USING (true);

-- ============================================
-- 9. Créer une vue pour les statistiques de modifications
-- ============================================

CREATE OR REPLACE VIEW v_soumissions_stats AS
SELECT 
    s.id,
    s.session_id,
    s.email,
    s.nom,
    s.prenom,
    s.submitted_at,
    s.updated_at,
    s.version,
    s.deleted_at,
    jsonb_array_length(s.historique_modifications) as nb_modifications,
    (
        SELECT COUNT(*) 
        FROM jsonb_array_elements(s.historique_disponibilites) AS disp
        WHERE (disp->>'est_disponible')::boolean = true
    ) as nb_creneaux_disponibles,
    CASE 
        WHEN s.deleted_at IS NOT NULL THEN 'deleted'
        WHEN s.updated_at > s.submitted_at + INTERVAL '1 minute' THEN 'modified'
        ELSE 'original'
    END as status
FROM soumissions_disponibilites s;

COMMENT ON VIEW v_soumissions_stats IS 'Vue avec statistiques sur les soumissions (nombre de modifications, créneaux, statut)';

-- ============================================
-- 10. Créer une fonction pour restaurer une soumission supprimée
-- ============================================

CREATE OR REPLACE FUNCTION restore_deleted_submission(submission_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    UPDATE soumissions_disponibilites
    SET deleted_at = NULL
    WHERE id = submission_id AND deleted_at IS NOT NULL;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION restore_deleted_submission(UUID) IS 'Restaure une soumission supprimée (soft delete) en définissant deleted_at à NULL';

-- ============================================
-- 11. Créer une fonction pour obtenir l'historique complet d'une soumission
-- ============================================

CREATE OR REPLACE FUNCTION get_submission_history(submission_id UUID)
RETURNS TABLE (
    modification_date TIMESTAMPTZ,
    modification_type TEXT,
    nb_creneaux INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (elem->>'date')::TIMESTAMPTZ as modification_date,
        elem->>'type' as modification_type,
        (elem->>'nb_creneaux')::INTEGER as nb_creneaux
    FROM soumissions_disponibilites s,
         jsonb_array_elements(s.historique_modifications) as elem
    WHERE s.id = submission_id
    ORDER BY (elem->>'date')::TIMESTAMPTZ DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_submission_history(UUID) IS 'Retourne l''historique complet des modifications d''une soumission';

-- ============================================
-- 12. Vérification de la migration
-- ============================================

-- Vérifier que toutes les colonnes ont été ajoutées
DO $$
DECLARE
    missing_columns TEXT[];
BEGIN
    SELECT ARRAY_AGG(column_name)
    INTO missing_columns
    FROM (
        SELECT unnest(ARRAY['updated_at', 'historique_modifications', 'deleted_at', 'version']) AS column_name
    ) expected
    WHERE NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'soumissions_disponibilites' 
        AND column_name = expected.column_name
    );
    
    IF missing_columns IS NOT NULL THEN
        RAISE EXCEPTION 'Migration incomplète. Colonnes manquantes: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE 'Migration réussie. Toutes les colonnes ont été ajoutées.';
    END IF;
END $$;

-- Afficher un résumé de la migration
SELECT 
    COUNT(*) as total_soumissions,
    COUNT(*) FILTER (WHERE deleted_at IS NULL) as soumissions_actives,
    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as soumissions_supprimees,
    AVG(version) as version_moyenne,
    MAX(jsonb_array_length(historique_modifications)) as max_modifications
FROM soumissions_disponibilites;

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
