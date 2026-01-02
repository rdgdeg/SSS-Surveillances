-- Script simplifié pour améliorer le système de versioning

-- 1. Fonction pour formater les changements (si elle n'existe pas déjà)
CREATE OR REPLACE FUNCTION format_field_changes(
    p_old_values JSONB,
    p_new_values JSONB,
    p_changed_fields TEXT[]
) RETURNS TEXT AS $$
DECLARE
    v_result TEXT := '';
    v_field TEXT;
    v_old_val TEXT;
    v_new_val TEXT;
BEGIN
    IF p_changed_fields IS NULL OR array_length(p_changed_fields, 1) = 0 THEN
        RETURN 'Aucun champ modifié';
    END IF;
    
    FOREACH v_field IN ARRAY p_changed_fields LOOP
        v_old_val := COALESCE((p_old_values->v_field)::TEXT, 'NULL');
        v_new_val := COALESCE((p_new_values->v_field)::TEXT, 'NULL');
        
        -- Nettoyer les guillemets JSON
        v_old_val := TRIM(BOTH '"' FROM v_old_val);
        v_new_val := TRIM(BOTH '"' FROM v_new_val);
        
        -- Formater le changement
        IF v_result != '' THEN
            v_result := v_result || E'\n';
        END IF;
        
        v_result := v_result || '• ' || v_field || ': "' || v_old_val || '" → "' || v_new_val || '"';
    END LOOP;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 2. Vue améliorée pour les changements récents avec plus de détails
DROP VIEW IF EXISTS recent_changes_detailed;
CREATE VIEW recent_changes_detailed AS
SELECT 
    dv.id,
    dv.table_name,
    dv.record_id,
    dv.operation_type,
    dv.username,
    dv.reason,
    dv.created_at,
    dv.changed_fields,
    dv.old_values,
    dv.new_values,
    array_length(dv.changed_fields, 1) as fields_changed_count,
    format_field_changes(dv.old_values, dv.new_values, dv.changed_fields) as detailed_changes,
    -- Extraire des informations spécifiques selon la table pour identifier le record
    CASE 
        WHEN dv.table_name = 'examens' THEN 
            COALESCE((dv.new_values->>'code'), (dv.old_values->>'code'), 'N/A')
        WHEN dv.table_name = 'surveillants' THEN 
            COALESCE((dv.new_values->>'nom'), (dv.old_values->>'nom'), 'N/A') || ' ' ||
            COALESCE((dv.new_values->>'prenom'), (dv.old_values->>'prenom'), 'N/A')
        WHEN dv.table_name = 'demandes_modification' THEN 
            COALESCE((dv.new_values->>'code_examen'), (dv.old_values->>'code_examen'), 'N/A')
        WHEN dv.table_name = 'sessions' THEN 
            COALESCE((dv.new_values->>'nom'), (dv.old_values->>'nom'), 'N/A')
        WHEN dv.table_name = 'creneaux' THEN 
            COALESCE((dv.new_values->>'date_heure'), (dv.old_values->>'date_heure'), 'N/A')
        WHEN dv.table_name = 'consignes_secretariat' THEN 
            COALESCE((dv.new_values->>'titre'), (dv.old_values->>'titre'), 'N/A')
        ELSE 'N/A'
    END as record_identifier,
    -- Résumé du changement plus détaillé
    CASE 
        WHEN dv.operation_type = 'INSERT' THEN 
            'Création de ' || dv.table_name || 
            CASE WHEN dv.table_name = 'examens' THEN ' (' || COALESCE((dv.new_values->>'code'), 'N/A') || ')'
                 WHEN dv.table_name = 'surveillants' THEN ' (' || COALESCE((dv.new_values->>'nom'), 'N/A') || ')'
                 ELSE '' END
        WHEN dv.operation_type = 'DELETE' THEN 
            'Suppression de ' || dv.table_name ||
            CASE WHEN dv.table_name = 'examens' THEN ' (' || COALESCE((dv.old_values->>'code'), 'N/A') || ')'
                 WHEN dv.table_name = 'surveillants' THEN ' (' || COALESCE((dv.old_values->>'nom'), 'N/A') || ')'
                 ELSE '' END
        WHEN dv.operation_type = 'UPDATE' AND array_length(dv.changed_fields, 1) = 1 THEN 
            'Modification de ' || dv.changed_fields[1] || ' dans ' || dv.table_name
        WHEN dv.operation_type = 'UPDATE' AND array_length(dv.changed_fields, 1) > 1 THEN 
            'Modification de ' || array_length(dv.changed_fields, 1) || ' champs dans ' || dv.table_name
        WHEN dv.operation_type = 'RESTORE' THEN 
            'Restauration de ' || dv.table_name
        ELSE dv.operation_type || ' sur ' || dv.table_name
    END as change_summary
FROM data_versions dv
ORDER BY dv.created_at DESC;

-- 3. Index pour améliorer les performances des requêtes de filtrage
CREATE INDEX IF NOT EXISTS idx_data_versions_created_at_table ON data_versions(created_at, table_name);
CREATE INDEX IF NOT EXISTS idx_data_versions_operation_type ON data_versions(operation_type);
CREATE INDEX IF NOT EXISTS idx_data_versions_username ON data_versions(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_data_versions_table_record ON data_versions(table_name, record_id);

-- 4. Table pour audit des suppressions de versions
CREATE TABLE IF NOT EXISTS version_deletion_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_by TEXT,
    deletion_reason TEXT,
    deleted_versions_count INTEGER,
    table_name TEXT,
    date_range_start TIMESTAMP WITH TIME ZONE,
    date_range_end TIMESTAMP WITH TIME ZONE,
    additional_filters JSONB
);

-- 5. Fonction pour logger les suppressions
CREATE OR REPLACE FUNCTION log_version_deletion(
    p_deleted_by TEXT,
    p_reason TEXT,
    p_count INTEGER,
    p_table_name TEXT DEFAULT NULL,
    p_date_start TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_date_end TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_filters JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO version_deletion_audit (
        deleted_by,
        deletion_reason,
        deleted_versions_count,
        table_name,
        date_range_start,
        date_range_end,
        additional_filters
    ) VALUES (
        p_deleted_by,
        p_reason,
        p_count,
        p_table_name,
        p_date_start,
        p_date_end,
        p_filters
    ) RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Vue pour le monitoring des performances du versioning
CREATE OR REPLACE VIEW versioning_performance_metrics AS
SELECT 
    vm.table_name,
    vm.is_enabled,
    COALESCE(stats.total_versions, 0) as total_versions,
    COALESCE(stats.avg_size_kb, 0) as avg_version_size_kb,
    COALESCE(stats.total_size_mb, 0) as total_size_mb,
    COALESCE(stats.versions_today, 0) as versions_today,
    COALESCE(stats.versions_this_week, 0) as versions_this_week,
    stats.oldest_version,
    stats.newest_version,
    CASE 
        WHEN stats.total_size_mb > 100 THEN 'HIGH'
        WHEN stats.total_size_mb > 50 THEN 'MEDIUM'
        ELSE 'LOW'
    END as storage_usage_level,
    CASE 
        WHEN stats.versions_today > 100 THEN 'HIGH'
        WHEN stats.versions_today > 20 THEN 'MEDIUM'
        ELSE 'LOW'
    END as activity_level
FROM versioning_metadata vm
LEFT JOIN (
    SELECT 
        table_name,
        COUNT(*) as total_versions,
        ROUND(AVG(length(COALESCE(old_values::text, '') || COALESCE(new_values::text, ''))) / 1024.0, 2) as avg_size_kb,
        ROUND(SUM(length(COALESCE(old_values::text, '') || COALESCE(new_values::text, ''))) / 1024.0 / 1024.0, 2) as total_size_mb,
        COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as versions_today,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as versions_this_week,
        MIN(created_at) as oldest_version,
        MAX(created_at) as newest_version
    FROM data_versions
    GROUP BY table_name
) stats ON vm.table_name = stats.table_name
ORDER BY COALESCE(stats.total_size_mb, 0) DESC;

-- 7. Tests et vérifications
SELECT 'SYSTÈME DE VERSIONING AMÉLIORÉ INSTALLÉ (VERSION SIMPLIFIÉE)' as status;

-- Vérifier la vue changements détaillés
SELECT 'Test vue changements détaillés' as test, COUNT(*) as records
FROM recent_changes_detailed
LIMIT 1;

-- Vérifier les index
SELECT 'Index créés' as test, COUNT(*) as index_count
FROM pg_indexes 
WHERE indexname LIKE 'idx_data_versions_%';

-- Afficher un résumé des améliorations
SELECT 
    'AMÉLIORATIONS INSTALLÉES (VERSION SIMPLIFIÉE):' as message,
    E'✓ Vue enrichie pour les changements détaillés\n' ||
    E'✓ Index de performance pour requêtes rapides\n' ||
    E'✓ Table d\'audit des suppressions\n' ||
    E'✓ Fonction de logging des suppressions\n' ||
    E'✓ Vue de monitoring des performances\n' ||
    E'✓ Formatage détaillé des modifications\n' ||
    E'✓ Interface utilisateur complète disponible\n' ||
    E'✓ APIs REST pour toutes les fonctionnalités' as details;