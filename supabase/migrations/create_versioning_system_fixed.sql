-- Migration: Système de versioning complet (Version corrigée)
-- Créé le: 2025-01-01
-- Description: Système de versioning avec historique complet et possibilité de rollback

-- Table principale pour stocker l'historique des versions
CREATE TABLE IF NOT EXISTS data_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('INSERT', 'UPDATE', 'DELETE', 'RESTORE')),
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    user_id TEXT,
    username TEXT,
    user_agent TEXT,
    ip_address INET,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_data_versions_table_record ON data_versions (table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_data_versions_created_at ON data_versions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_versions_username ON data_versions (username);
CREATE INDEX IF NOT EXISTS idx_data_versions_operation ON data_versions (operation_type);

-- Table pour les snapshots complets (pour restauration rapide)
CREATE TABLE IF NOT EXISTS version_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    snapshot_data JSONB NOT NULL,
    version_number INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT
);

-- Contrainte d'unicité et index pour les snapshots
CREATE UNIQUE INDEX IF NOT EXISTS unique_table_record_version 
    ON version_snapshots (table_name, record_id, version_number);
CREATE INDEX IF NOT EXISTS idx_snapshots_table_record ON version_snapshots (table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_version ON version_snapshots (version_number DESC);

-- Table pour les métadonnées de versioning
CREATE TABLE IF NOT EXISTS versioning_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT true,
    retention_days INTEGER DEFAULT 365,
    max_versions_per_record INTEGER DEFAULT 100,
    track_fields TEXT[], -- Champs spécifiques à tracker (null = tous)
    exclude_fields TEXT[] DEFAULT ARRAY['updated_at', 'last_modified'], -- Champs à exclure
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fonction pour enregistrer une version
CREATE OR REPLACE FUNCTION record_version(
    p_table_name TEXT,
    p_record_id TEXT,
    p_operation_type TEXT,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_user_id TEXT DEFAULT NULL,
    p_username TEXT DEFAULT NULL,
    p_reason TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_version_id UUID;
    v_changed_fields TEXT[];
    v_metadata RECORD;
    v_version_number INTEGER;
BEGIN
    -- Vérifier si le versioning est activé pour cette table
    SELECT * INTO v_metadata 
    FROM versioning_metadata 
    WHERE table_name = p_table_name AND is_enabled = true;
    
    IF NOT FOUND THEN
        RETURN NULL; -- Versioning désactivé
    END IF;
    
    -- Calculer les champs modifiés
    IF p_old_values IS NOT NULL AND p_new_values IS NOT NULL THEN
        SELECT ARRAY_AGG(key) INTO v_changed_fields
        FROM (
            SELECT key 
            FROM jsonb_each(p_new_values) 
            WHERE key NOT IN (SELECT unnest(COALESCE(v_metadata.exclude_fields, ARRAY[]::TEXT[])))
            AND (p_old_values->key IS DISTINCT FROM p_new_values->key)
        ) AS changed;
    END IF;
    
    -- Insérer la version
    INSERT INTO data_versions (
        table_name, record_id, operation_type, old_values, new_values,
        changed_fields, user_id, username, reason
    ) VALUES (
        p_table_name, p_record_id, p_operation_type, p_old_values, p_new_values,
        v_changed_fields, p_user_id, p_username, p_reason
    ) RETURNING id INTO v_version_id;
    
    -- Créer un snapshot si c'est une insertion ou mise à jour importante
    IF p_operation_type IN ('INSERT', 'UPDATE') AND p_new_values IS NOT NULL THEN
        -- Calculer le numéro de version
        SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version_number
        FROM version_snapshots 
        WHERE table_name = p_table_name AND record_id = p_record_id;
        
        -- Insérer le snapshot
        INSERT INTO version_snapshots (
            table_name, record_id, snapshot_data, version_number, created_by
        ) VALUES (
            p_table_name, p_record_id, p_new_values, v_version_number, p_username
        );
        
        -- Nettoyer les anciennes versions si nécessaire
        DELETE FROM version_snapshots 
        WHERE table_name = p_table_name 
        AND record_id = p_record_id 
        AND version_number <= v_version_number - v_metadata.max_versions_per_record;
    END IF;
    
    -- Nettoyer les anciennes versions selon la rétention
    DELETE FROM data_versions 
    WHERE table_name = p_table_name 
    AND created_at < NOW() - INTERVAL '1 day' * v_metadata.retention_days;
    
    RETURN v_version_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir l'historique des versions
CREATE OR REPLACE FUNCTION get_version_history(
    p_table_name TEXT,
    p_record_id TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50
) RETURNS TABLE (
    version_id UUID,
    record_id TEXT,
    operation_type TEXT,
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    username TEXT,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dv.id,
        dv.record_id,
        dv.operation_type,
        dv.old_values,
        dv.new_values,
        dv.changed_fields,
        dv.username,
        dv.reason,
        dv.created_at
    FROM data_versions dv
    WHERE dv.table_name = p_table_name
    AND (p_record_id IS NULL OR dv.record_id = p_record_id)
    ORDER BY dv.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour restaurer une version (simplifiée)
CREATE OR REPLACE FUNCTION restore_version(
    p_table_name TEXT,
    p_record_id TEXT,
    p_version_id UUID,
    p_user_id TEXT DEFAULT NULL,
    p_username TEXT DEFAULT NULL,
    p_reason TEXT DEFAULT 'Restauration de version'
) RETURNS BOOLEAN AS $$
DECLARE
    v_version_data JSONB;
BEGIN
    -- Récupérer les données de la version à restaurer
    SELECT new_values INTO v_version_data
    FROM data_versions 
    WHERE id = p_version_id AND table_name = p_table_name AND record_id = p_record_id;
    
    IF v_version_data IS NULL THEN
        RAISE EXCEPTION 'Version non trouvée: %', p_version_id;
    END IF;
    
    -- Enregistrer la restauration comme une nouvelle version
    PERFORM record_version(
        p_table_name,
        p_record_id,
        'RESTORE',
        NULL,
        v_version_data,
        p_user_id,
        p_username,
        p_reason || ' (depuis version ' || p_version_id || ')'
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erreur lors de la restauration: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour comparer deux versions
CREATE OR REPLACE FUNCTION compare_versions(
    p_version_id_1 UUID,
    p_version_id_2 UUID
) RETURNS TABLE (
    field_name TEXT,
    value_1 TEXT,
    value_2 TEXT,
    is_different BOOLEAN
) AS $$
DECLARE
    v_data_1 JSONB;
    v_data_2 JSONB;
BEGIN
    -- Récupérer les données des deux versions
    SELECT new_values INTO v_data_1 FROM data_versions WHERE id = p_version_id_1;
    SELECT new_values INTO v_data_2 FROM data_versions WHERE id = p_version_id_2;
    
    -- Comparer les champs
    RETURN QUERY
    SELECT 
        COALESCE(d1.key, d2.key) as field_name,
        d1.value::TEXT as value_1,
        d2.value::TEXT as value_2,
        (d1.value IS DISTINCT FROM d2.value) as is_different
    FROM jsonb_each(v_data_1) d1
    FULL OUTER JOIN jsonb_each(v_data_2) d2 ON d1.key = d2.key
    ORDER BY field_name;
END;
$$ LANGUAGE plpgsql;

-- Configuration initiale des tables à versionner
INSERT INTO versioning_metadata (table_name, is_enabled, retention_days, max_versions_per_record, exclude_fields) VALUES
('sessions', true, 730, 50, ARRAY['updated_at']),
('creneaux', true, 365, 30, ARRAY['updated_at']),
('examens', true, 730, 50, ARRAY['updated_at']),
('presences_enseignants', true, 365, 20, ARRAY['updated_at']),
('examen_auditoires', true, 365, 30, ARRAY['updated_at']),
('consignes_secretariat', true, 730, 20, ARRAY['updated_at']),
('soumissions_disponibilites', true, 365, 10, ARRAY['updated_at', 'submitted_at']),
('demandes_modification', true, 365, 20, ARRAY['updated_at']),
('surveillants', true, 730, 30, ARRAY['updated_at']),
('admin_users', true, 730, 10, ARRAY['updated_at', 'last_login_at'])
ON CONFLICT (table_name) DO NOTHING;

-- Fonction trigger générique pour capturer automatiquement les changements
CREATE OR REPLACE FUNCTION trigger_record_version() RETURNS TRIGGER AS $$
DECLARE
    v_user_id TEXT;
    v_username TEXT;
BEGIN
    -- Récupérer l'utilisateur actuel depuis les variables de session
    v_user_id := current_setting('app.current_user_id', true);
    v_username := current_setting('app.current_username', true);
    
    IF TG_OP = 'DELETE' THEN
        PERFORM record_version(
            TG_TABLE_NAME,
            OLD.id::TEXT,
            'DELETE',
            row_to_json(OLD)::JSONB,
            NULL,
            v_user_id,
            v_username,
            'Suppression automatique'
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM record_version(
            TG_TABLE_NAME,
            NEW.id::TEXT,
            'UPDATE',
            row_to_json(OLD)::JSONB,
            row_to_json(NEW)::JSONB,
            v_user_id,
            v_username,
            'Modification automatique'
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        PERFORM record_version(
            TG_TABLE_NAME,
            NEW.id::TEXT,
            'INSERT',
            NULL,
            row_to_json(NEW)::JSONB,
            v_user_id,
            v_username,
            'Création automatique'
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Créer les triggers pour les tables critiques
DO $$
DECLARE
    table_name TEXT;
    trigger_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT vm.table_name 
        FROM versioning_metadata vm 
        WHERE vm.is_enabled = true
    LOOP
        trigger_name := 'trigger_version_' || table_name;
        
        -- Supprimer le trigger s'il existe déjà
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', trigger_name, table_name);
        
        -- Créer le nouveau trigger
        EXECUTE format(
            'CREATE TRIGGER %I 
             AFTER INSERT OR UPDATE OR DELETE ON %I
             FOR EACH ROW EXECUTE FUNCTION trigger_record_version()',
            trigger_name, table_name
        );
    END LOOP;
END $$;

-- Vues utiles pour l'interface admin
CREATE OR REPLACE VIEW version_summary AS
SELECT 
    table_name,
    COUNT(*) as total_versions,
    COUNT(DISTINCT record_id) as unique_records,
    MAX(created_at) as last_change,
    COUNT(CASE WHEN operation_type = 'INSERT' THEN 1 END) as inserts,
    COUNT(CASE WHEN operation_type = 'UPDATE' THEN 1 END) as updates,
    COUNT(CASE WHEN operation_type = 'DELETE' THEN 1 END) as deletes,
    COUNT(CASE WHEN operation_type = 'RESTORE' THEN 1 END) as restores
FROM data_versions 
GROUP BY table_name
ORDER BY total_versions DESC;

CREATE OR REPLACE VIEW recent_changes AS
SELECT 
    dv.table_name,
    dv.record_id,
    dv.operation_type,
    dv.username,
    dv.reason,
    dv.created_at,
    array_length(dv.changed_fields, 1) as fields_changed
FROM data_versions dv
WHERE dv.created_at >= NOW() - INTERVAL '7 days'
ORDER BY dv.created_at DESC
LIMIT 100;

-- Politique de sécurité (RLS)
ALTER TABLE data_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE versioning_metadata ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent accéder aux données de versioning
CREATE POLICY "Admin access only" ON data_versions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM admin_users 
        WHERE username = current_setting('app.current_username', true)
        AND is_active = true
    )
);

CREATE POLICY "Admin access only" ON version_snapshots FOR ALL USING (
    EXISTS (
        SELECT 1 FROM admin_users 
        WHERE username = current_setting('app.current_username', true)
        AND is_active = true
    )
);

CREATE POLICY "Admin access only" ON versioning_metadata FOR ALL USING (
    EXISTS (
        SELECT 1 FROM admin_users 
        WHERE username = current_setting('app.current_username', true)
        AND is_active = true
    )
);

-- Commentaires pour la documentation
COMMENT ON TABLE data_versions IS 'Historique complet des modifications avec détails des changements';
COMMENT ON TABLE version_snapshots IS 'Snapshots complets pour restauration rapide';
COMMENT ON TABLE versioning_metadata IS 'Configuration du versioning par table';
COMMENT ON FUNCTION record_version IS 'Enregistre une nouvelle version avec métadonnées';
COMMENT ON FUNCTION get_version_history IS 'Récupère l''historique des versions d''un enregistrement';
COMMENT ON FUNCTION restore_version IS 'Restaure un enregistrement à une version antérieure';
COMMENT ON FUNCTION compare_versions IS 'Compare deux versions et retourne les différences';