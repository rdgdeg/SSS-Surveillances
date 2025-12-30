-- INSTALLATION FINALE DU SYSTÈME DE VERSIONING
-- Version ultra-simple sans messages de debug

-- ===== NETTOYAGE =====

-- Supprimer les triggers existants
DROP TRIGGER IF EXISTS trigger_version_sessions ON sessions CASCADE;
DROP TRIGGER IF EXISTS trigger_version_creneaux ON creneaux CASCADE;
DROP TRIGGER IF EXISTS trigger_version_examens ON examens CASCADE;
DROP TRIGGER IF EXISTS trigger_version_presences_enseignants ON presences_enseignants CASCADE;
DROP TRIGGER IF EXISTS trigger_version_examen_auditoires ON examen_auditoires CASCADE;
DROP TRIGGER IF EXISTS trigger_version_consignes_secretariat ON consignes_secretariat CASCADE;
DROP TRIGGER IF EXISTS trigger_version_soumissions_disponibilites ON soumissions_disponibilites CASCADE;
DROP TRIGGER IF EXISTS trigger_version_demandes_modification ON demandes_modification CASCADE;
DROP TRIGGER IF EXISTS trigger_version_surveillants ON surveillants CASCADE;
DROP TRIGGER IF EXISTS trigger_version_admin_users ON admin_users CASCADE;

-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "Admin access only" ON data_versions;
DROP POLICY IF EXISTS "Admin access only" ON version_snapshots;
DROP POLICY IF EXISTS "Admin access only" ON versioning_metadata;

-- Supprimer les vues
DROP VIEW IF EXISTS version_summary CASCADE;
DROP VIEW IF EXISTS recent_changes CASCADE;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS trigger_record_version() CASCADE;
DROP FUNCTION IF EXISTS record_version(TEXT, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_version_history(TEXT, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS compare_versions(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS restore_version(TEXT, TEXT, UUID, TEXT, TEXT, TEXT) CASCADE;

-- Supprimer les tables
DROP TABLE IF EXISTS version_snapshots CASCADE;
DROP TABLE IF EXISTS data_versions CASCADE;
DROP TABLE IF EXISTS versioning_metadata CASCADE;

-- ===== CRÉATION DES TABLES =====

CREATE TABLE data_versions (
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

CREATE INDEX idx_data_versions_table_record ON data_versions (table_name, record_id);
CREATE INDEX idx_data_versions_created_at ON data_versions (created_at DESC);
CREATE INDEX idx_data_versions_username ON data_versions (username);
CREATE INDEX idx_data_versions_operation ON data_versions (operation_type);

CREATE TABLE version_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    snapshot_data JSONB NOT NULL,
    version_number INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT
);

CREATE UNIQUE INDEX unique_table_record_version ON version_snapshots (table_name, record_id, version_number);
CREATE INDEX idx_snapshots_table_record ON version_snapshots (table_name, record_id);
CREATE INDEX idx_snapshots_version ON version_snapshots (version_number DESC);

CREATE TABLE versioning_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT true,
    retention_days INTEGER DEFAULT 365,
    max_versions_per_record INTEGER DEFAULT 100,
    track_fields TEXT[],
    exclude_fields TEXT[] DEFAULT ARRAY['updated_at', 'last_modified'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== FONCTIONS =====

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
    SELECT * INTO v_metadata 
    FROM versioning_metadata 
    WHERE table_name = p_table_name AND is_enabled = true;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    IF p_old_values IS NOT NULL AND p_new_values IS NOT NULL THEN
        SELECT ARRAY_AGG(key) INTO v_changed_fields
        FROM (
            SELECT key 
            FROM jsonb_each(p_new_values) 
            WHERE key NOT IN (SELECT unnest(COALESCE(v_metadata.exclude_fields, ARRAY[]::TEXT[])))
            AND (p_old_values->key IS DISTINCT FROM p_new_values->key)
        ) AS changed;
    END IF;
    
    INSERT INTO data_versions (
        table_name, record_id, operation_type, old_values, new_values,
        changed_fields, user_id, username, reason
    ) VALUES (
        p_table_name, p_record_id, p_operation_type, p_old_values, p_new_values,
        v_changed_fields, p_user_id, p_username, p_reason
    ) RETURNING id INTO v_version_id;
    
    IF p_operation_type IN ('INSERT', 'UPDATE') AND p_new_values IS NOT NULL THEN
        SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version_number
        FROM version_snapshots 
        WHERE table_name = p_table_name AND record_id = p_record_id;
        
        INSERT INTO version_snapshots (
            table_name, record_id, snapshot_data, version_number, created_by
        ) VALUES (
            p_table_name, p_record_id, p_new_values, v_version_number, p_username
        );
        
        DELETE FROM version_snapshots 
        WHERE table_name = p_table_name 
        AND record_id = p_record_id 
        AND version_number <= v_version_number - v_metadata.max_versions_per_record;
    END IF;
    
    RETURN v_version_id;
END;
$$ LANGUAGE plpgsql;

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
        dv.id, dv.record_id, dv.operation_type, dv.old_values, dv.new_values,
        dv.changed_fields, dv.username, dv.reason, dv.created_at
    FROM data_versions dv
    WHERE dv.table_name = p_table_name
    AND (p_record_id IS NULL OR dv.record_id = p_record_id)
    ORDER BY dv.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

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
    SELECT new_values INTO v_data_1 FROM data_versions WHERE id = p_version_id_1;
    SELECT new_values INTO v_data_2 FROM data_versions WHERE id = p_version_id_2;
    
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
    SELECT new_values INTO v_version_data
    FROM data_versions 
    WHERE id = p_version_id AND table_name = p_table_name AND record_id = p_record_id;
    
    IF v_version_data IS NULL THEN
        RETURN FALSE;
    END IF;
    
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
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_record_version() RETURNS TRIGGER AS $$
DECLARE
    v_user_id TEXT;
    v_username TEXT;
BEGIN
    v_user_id := current_setting('app.current_user_id', true);
    v_username := current_setting('app.current_username', true);
    
    IF TG_OP = 'DELETE' THEN
        PERFORM record_version(
            TG_TABLE_NAME, OLD.id::TEXT, 'DELETE',
            row_to_json(OLD)::JSONB, NULL,
            v_user_id, v_username, 'Suppression automatique'
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM record_version(
            TG_TABLE_NAME, NEW.id::TEXT, 'UPDATE',
            row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB,
            v_user_id, v_username, 'Modification automatique'
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        PERFORM record_version(
            TG_TABLE_NAME, NEW.id::TEXT, 'INSERT',
            NULL, row_to_json(NEW)::JSONB,
            v_user_id, v_username, 'Création automatique'
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ===== CONFIGURATION =====

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
('admin_users', true, 730, 10, ARRAY['updated_at', 'last_login_at']);

-- ===== TRIGGERS =====

CREATE TRIGGER trigger_version_sessions 
    AFTER INSERT OR UPDATE OR DELETE ON sessions
    FOR EACH ROW EXECUTE FUNCTION trigger_record_version();

CREATE TRIGGER trigger_version_creneaux 
    AFTER INSERT OR UPDATE OR DELETE ON creneaux
    FOR EACH ROW EXECUTE FUNCTION trigger_record_version();

CREATE TRIGGER trigger_version_examens 
    AFTER INSERT OR UPDATE OR DELETE ON examens
    FOR EACH ROW EXECUTE FUNCTION trigger_record_version();

CREATE TRIGGER trigger_version_presences_enseignants 
    AFTER INSERT OR UPDATE OR DELETE ON presences_enseignants
    FOR EACH ROW EXECUTE FUNCTION trigger_record_version();

CREATE TRIGGER trigger_version_examen_auditoires 
    AFTER INSERT OR UPDATE OR DELETE ON examen_auditoires
    FOR EACH ROW EXECUTE FUNCTION trigger_record_version();

CREATE TRIGGER trigger_version_consignes_secretariat 
    AFTER INSERT OR UPDATE OR DELETE ON consignes_secretariat
    FOR EACH ROW EXECUTE FUNCTION trigger_record_version();

CREATE TRIGGER trigger_version_soumissions_disponibilites 
    AFTER INSERT OR UPDATE OR DELETE ON soumissions_disponibilites
    FOR EACH ROW EXECUTE FUNCTION trigger_record_version();

CREATE TRIGGER trigger_version_demandes_modification 
    AFTER INSERT OR UPDATE OR DELETE ON demandes_modification
    FOR EACH ROW EXECUTE FUNCTION trigger_record_version();

CREATE TRIGGER trigger_version_surveillants 
    AFTER INSERT OR UPDATE OR DELETE ON surveillants
    FOR EACH ROW EXECUTE FUNCTION trigger_record_version();

CREATE TRIGGER trigger_version_admin_users 
    AFTER INSERT OR UPDATE OR DELETE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION trigger_record_version();

-- ===== VUES =====

CREATE VIEW version_summary AS
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

CREATE VIEW recent_changes AS
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

-- ===== SÉCURITÉ =====

ALTER TABLE data_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE versioning_metadata ENABLE ROW LEVEL SECURITY;

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

-- ===== TEST SIMPLE =====

SELECT record_version(
    'test_table',
    'test_record',
    'INSERT',
    NULL,
    '{"test": "data"}'::JSONB,
    'system',
    'test_user',
    'Test installation'
);

DELETE FROM data_versions WHERE record_id = 'test_record';
DELETE FROM version_snapshots WHERE record_id = 'test_record';

-- ===== VÉRIFICATION =====

SELECT 
    'Tables créées' as status,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_name IN ('data_versions', 'version_snapshots', 'versioning_metadata')

UNION ALL

SELECT 
    'Triggers installés' as status,
    COUNT(*) as count
FROM information_schema.triggers 
WHERE trigger_name LIKE 'trigger_version_%'

UNION ALL

SELECT 
    'Tables configurées' as status,
    COUNT(*) as count
FROM versioning_metadata 
WHERE is_enabled = true;

-- Configuration finale
SELECT 
    table_name,
    is_enabled,
    retention_days,
    max_versions_per_record
FROM versioning_metadata 
ORDER BY table_name;