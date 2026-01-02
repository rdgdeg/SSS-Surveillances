-- Script pour appliquer les corrections du système de versioning et des demandes de modification

-- 1. Ajouter le champ code_examen aux demandes de modification
ALTER TABLE demandes_modification 
ADD COLUMN IF NOT EXISTS code_examen TEXT;

CREATE INDEX IF NOT EXISTS idx_demandes_modification_code_examen 
ON demandes_modification(code_examen);

COMMENT ON COLUMN demandes_modification.code_examen IS 'Code de l''examen (ex: WFARM1300, WSBIM1207, etc.)';

-- 2. Corriger la fonction set_config pour le versioning
CREATE OR REPLACE FUNCTION set_config(setting_name TEXT, setting_value TEXT, is_local BOOLEAN DEFAULT true)
RETURNS TEXT AS $$
BEGIN
    PERFORM set_config(setting_name, setting_value, is_local);
    RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Améliorer la fonction trigger_record_version
CREATE OR REPLACE FUNCTION trigger_record_version() RETURNS TRIGGER AS $$
DECLARE
    v_user_id TEXT;
    v_username TEXT;
    v_operation_reason TEXT;
BEGIN
    -- Essayer de récupérer l'utilisateur depuis les variables de session
    BEGIN
        v_user_id := current_setting('app.current_user_id', true);
        v_username := current_setting('app.current_username', true);
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
        v_username := NULL;
    END;
    
    -- Si pas d'utilisateur configuré, essayer de récupérer depuis auth
    IF v_user_id IS NULL OR v_user_id = '' THEN
        BEGIN
            -- Récupérer l'utilisateur authentifié
            SELECT auth.uid()::TEXT INTO v_user_id;
            
            -- Essayer de récupérer le nom depuis admin_users
            IF v_user_id IS NOT NULL THEN
                SELECT COALESCE(nom || ' ' || prenom, username, 'Admin') 
                INTO v_username
                FROM admin_users 
                WHERE user_id::TEXT = v_user_id
                LIMIT 1;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- En cas d'erreur, utiliser des valeurs par défaut
            v_user_id := 'system';
            v_username := 'Système';
        END;
    END IF;
    
    -- Valeurs par défaut si toujours NULL
    v_user_id := COALESCE(v_user_id, 'system');
    v_username := COALESCE(v_username, 'Système');
    
    -- Définir la raison selon l'opération
    CASE TG_OP
        WHEN 'DELETE' THEN v_operation_reason := 'Suppression automatique';
        WHEN 'UPDATE' THEN v_operation_reason := 'Modification automatique';
        WHEN 'INSERT' THEN v_operation_reason := 'Création automatique';
        ELSE v_operation_reason := 'Opération automatique';
    END CASE;
    
    -- Enregistrer la version selon le type d'opération
    IF TG_OP = 'DELETE' THEN
        PERFORM record_version(
            TG_TABLE_NAME, 
            OLD.id::TEXT, 
            'DELETE',
            row_to_json(OLD)::JSONB, 
            NULL,
            v_user_id, 
            v_username, 
            v_operation_reason
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
            v_operation_reason
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
            v_operation_reason
        );
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Fonction pour tester le versioning
CREATE OR REPLACE FUNCTION test_versioning_system()
RETURNS TABLE (
    test_name TEXT,
    status TEXT,
    details TEXT
) AS $$
DECLARE
    v_test_id UUID;
    v_version_count INTEGER;
BEGIN
    -- Test 1: Insertion
    INSERT INTO sessions (nom, date_debut, date_fin, description)
    VALUES ('Test Versioning', '2024-01-01', '2024-01-31', 'Test du système de versioning')
    RETURNING id INTO v_test_id;
    
    SELECT COUNT(*) INTO v_version_count
    FROM data_versions 
    WHERE table_name = 'sessions' AND record_id = v_test_id::TEXT;
    
    RETURN QUERY SELECT 
        'Test INSERT'::TEXT,
        CASE WHEN v_version_count > 0 THEN 'SUCCESS' ELSE 'FAILED' END::TEXT,
        ('Versions créées: ' || v_version_count)::TEXT;
    
    -- Test 2: Modification
    UPDATE sessions 
    SET description = 'Test modifié'
    WHERE id = v_test_id;
    
    SELECT COUNT(*) INTO v_version_count
    FROM data_versions 
    WHERE table_name = 'sessions' AND record_id = v_test_id::TEXT;
    
    RETURN QUERY SELECT 
        'Test UPDATE'::TEXT,
        CASE WHEN v_version_count >= 2 THEN 'SUCCESS' ELSE 'FAILED' END::TEXT,
        ('Versions totales: ' || v_version_count)::TEXT;
    
    -- Test 3: Suppression
    DELETE FROM sessions WHERE id = v_test_id;
    
    SELECT COUNT(*) INTO v_version_count
    FROM data_versions 
    WHERE table_name = 'sessions' AND record_id = v_test_id::TEXT;
    
    RETURN QUERY SELECT 
        'Test DELETE'::TEXT,
        CASE WHEN v_version_count >= 3 THEN 'SUCCESS' ELSE 'FAILED' END::TEXT,
        ('Versions finales: ' || v_version_count)::TEXT;
    
    -- Nettoyage
    DELETE FROM data_versions WHERE record_id = v_test_id::TEXT;
    DELETE FROM version_snapshots WHERE record_id = v_test_id::TEXT;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- 5. Fonction pour diagnostiquer les problèmes
CREATE OR REPLACE FUNCTION diagnose_versioning()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    message TEXT
) AS $$
BEGIN
    -- Vérifier les tables
    RETURN QUERY SELECT 
        'Tables de versioning'::TEXT,
        CASE WHEN COUNT(*) = 3 THEN 'OK' ELSE 'ERROR' END::TEXT,
        ('Tables trouvées: ' || COUNT(*))::TEXT
    FROM information_schema.tables 
    WHERE table_name IN ('data_versions', 'version_snapshots', 'versioning_metadata');
    
    -- Vérifier les triggers
    RETURN QUERY SELECT 
        'Triggers installés'::TEXT,
        CASE WHEN COUNT(*) >= 10 THEN 'OK' ELSE 'WARNING' END::TEXT,
        ('Triggers actifs: ' || COUNT(*))::TEXT
    FROM information_schema.triggers 
    WHERE trigger_name LIKE 'trigger_version_%';
    
    -- Vérifier la configuration
    RETURN QUERY SELECT 
        'Configuration des tables'::TEXT,
        CASE WHEN COUNT(*) >= 10 THEN 'OK' ELSE 'WARNING' END::TEXT,
        ('Tables configurées: ' || COUNT(*))::TEXT
    FROM versioning_metadata 
    WHERE is_enabled = true;
    
    -- Vérifier les versions récentes
    RETURN QUERY SELECT 
        'Activité récente'::TEXT,
        CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'INFO' END::TEXT,
        ('Versions des 7 derniers jours: ' || COUNT(*))::TEXT
    FROM data_versions 
    WHERE created_at >= NOW() - INTERVAL '7 days';
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- 6. Exécuter les tests et diagnostics
SELECT 'DIAGNOSTIC DU SYSTÈME' as section;
SELECT * FROM diagnose_versioning();

SELECT 'TEST DU SYSTÈME' as section;
SELECT * FROM test_versioning_system();

-- 7. Vérifier la configuration finale
SELECT 'CONFIGURATION ACTUELLE' as section;
SELECT 
    table_name,
    is_enabled,
    retention_days,
    max_versions_per_record
FROM versioning_metadata 
WHERE is_enabled = true
ORDER BY table_name;

-- 8. Afficher les versions récentes pour vérifier le fonctionnement
SELECT 'VERSIONS RÉCENTES' as section;
SELECT 
    table_name,
    operation_type,
    username,
    reason,
    created_at
FROM data_versions 
WHERE created_at >= NOW() - INTERVAL '1 day'
ORDER BY created_at DESC
LIMIT 10;