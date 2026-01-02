-- Script complet pour améliorer le système de versioning avec toutes les fonctionnalités demandées

-- 1. Fonctions utilitaires pour les statistiques quotidiennes
CREATE OR REPLACE FUNCTION get_daily_version_activity(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    date DATE,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dv.created_at::DATE as date,
        COUNT(*) as count
    FROM data_versions dv
    WHERE dv.created_at >= CURRENT_DATE - (days_back || ' days')::INTERVAL
    GROUP BY dv.created_at::DATE
    ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;

-- 2. Fonction pour obtenir les champs les plus modifiés
CREATE OR REPLACE FUNCTION get_most_modified_fields(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    field TEXT,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        unnest(dv.changed_fields) as field,
        COUNT(*) as count
    FROM data_versions dv
    WHERE dv.created_at >= CURRENT_DATE - (days_back || ' days')::INTERVAL
    AND dv.operation_type = 'UPDATE'
    AND dv.changed_fields IS NOT NULL
    GROUP BY unnest(dv.changed_fields)
    ORDER BY count DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- 3. Fonction de nettoyage améliorée avec plus de contrôle
CREATE OR REPLACE FUNCTION cleanup_old_versions(p_table_name TEXT DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER := 0;
    v_temp_count INTEGER;
    v_table_config RECORD;
    v_cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Si une table spécifique est demandée
    IF p_table_name IS NOT NULL THEN
        SELECT * INTO v_table_config
        FROM versioning_metadata
        WHERE table_name = p_table_name AND is_enabled = true;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Table % non trouvée ou versioning désactivé', p_table_name;
        END IF;
        
        -- Calculer la date de coupure
        v_cutoff_date := NOW() - (v_table_config.retention_days || ' days')::INTERVAL;
        
        -- Supprimer les anciennes versions
        DELETE FROM data_versions
        WHERE table_name = p_table_name
        AND created_at < v_cutoff_date;
        
        GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
        
        -- Nettoyer aussi les versions en excès par enregistrement
        WITH versions_to_keep AS (
            SELECT id
            FROM (
                SELECT id,
                       ROW_NUMBER() OVER (
                           PARTITION BY table_name, record_id 
                           ORDER BY created_at DESC
                       ) as rn
                FROM data_versions
                WHERE table_name = p_table_name
            ) ranked
            WHERE rn <= v_table_config.max_versions_per_record
        )
        DELETE FROM data_versions
        WHERE table_name = p_table_name
        AND id NOT IN (SELECT id FROM versions_to_keep);
        
        GET DIAGNOSTICS v_temp_count = ROW_COUNT;
        v_deleted_count := v_deleted_count + v_temp_count;
        
    ELSE
        -- Nettoyer toutes les tables
        FOR v_table_config IN 
            SELECT * FROM versioning_metadata WHERE is_enabled = true
        LOOP
            v_cutoff_date := NOW() - (v_table_config.retention_days || ' days')::INTERVAL;
            
            -- Supprimer les anciennes versions
            DELETE FROM data_versions
            WHERE table_name = v_table_config.table_name
            AND created_at < v_cutoff_date;
            
            GET DIAGNOSTICS v_temp_count = ROW_COUNT;
            v_deleted_count := v_deleted_count + v_temp_count;
            
            -- Nettoyer les versions en excès
            WITH versions_to_keep AS (
                SELECT id
                FROM (
                    SELECT id,
                           ROW_NUMBER() OVER (
                               PARTITION BY table_name, record_id 
                               ORDER BY created_at DESC
                           ) as rn
                    FROM data_versions
                    WHERE table_name = v_table_config.table_name
                ) ranked
                WHERE rn <= v_table_config.max_versions_per_record
            )
            DELETE FROM data_versions
            WHERE table_name = v_table_config.table_name
            AND id NOT IN (SELECT id FROM versions_to_keep);
            
            GET DIAGNOSTICS v_temp_count = ROW_COUNT;
            v_deleted_count := v_deleted_count + v_temp_count;
        END LOOP;
    END IF;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 4. Fonction pour formater les changements de manière détaillée (si elle n'existe pas déjà)
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

-- 5. Vue améliorée pour les changements récents avec plus de détails
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
    END as change_summary,
    -- Informations sur la taille des données
    CASE 
        WHEN dv.old_values IS NOT NULL THEN length(dv.old_values::text)
        ELSE 0
    END as old_values_size,
    CASE 
        WHEN dv.new_values IS NOT NULL THEN length(dv.new_values::text)
        ELSE 0
    END as new_values_size
FROM data_versions dv
ORDER BY dv.created_at DESC;

-- 6. Index pour améliorer les performances des requêtes de filtrage
CREATE INDEX IF NOT EXISTS idx_data_versions_created_at_table ON data_versions(created_at, table_name);
CREATE INDEX IF NOT EXISTS idx_data_versions_operation_type ON data_versions(operation_type);
CREATE INDEX IF NOT EXISTS idx_data_versions_username ON data_versions(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_data_versions_table_record ON data_versions(table_name, record_id);

-- 7. Fonction pour recherche avancée dans les valeurs JSON
CREATE OR REPLACE FUNCTION search_in_version_values(
    p_search_term TEXT,
    p_table_name TEXT DEFAULT NULL,
    p_operation_type TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 100
) RETURNS TABLE (
    id UUID,
    table_name TEXT,
    record_id TEXT,
    operation_type TEXT,
    username TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    match_type TEXT,
    match_details TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dv.id,
        dv.table_name,
        dv.record_id,
        dv.operation_type,
        dv.username,
        dv.created_at,
        CASE 
            WHEN dv.old_values::text ILIKE '%' || p_search_term || '%' AND 
                 dv.new_values::text ILIKE '%' || p_search_term || '%' THEN 'Ancien et nouveau'
            WHEN dv.old_values::text ILIKE '%' || p_search_term || '%' THEN 'Ancienne valeur'
            WHEN dv.new_values::text ILIKE '%' || p_search_term || '%' THEN 'Nouvelle valeur'
            WHEN dv.reason ILIKE '%' || p_search_term || '%' THEN 'Raison'
            ELSE 'Autre'
        END as match_type,
        CASE 
            WHEN dv.reason ILIKE '%' || p_search_term || '%' THEN 'Raison: ' || dv.reason
            ELSE 'Trouvé dans les données JSON'
        END as match_details
    FROM data_versions dv
    WHERE (
        dv.old_values::text ILIKE '%' || p_search_term || '%' OR
        dv.new_values::text ILIKE '%' || p_search_term || '%' OR
        dv.reason ILIKE '%' || p_search_term || '%' OR
        dv.record_id ILIKE '%' || p_search_term || '%'
    )
    AND (p_table_name IS NULL OR dv.table_name = p_table_name)
    AND (p_operation_type IS NULL OR dv.operation_type = p_operation_type)
    ORDER BY dv.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 8. Fonction pour analyser l'impact des modifications
CREATE OR REPLACE FUNCTION analyze_modification_impact(
    p_table_name TEXT,
    p_record_id TEXT
) RETURNS TABLE (
    analysis_point TEXT,
    value TEXT,
    details TEXT
) AS $$
DECLARE
    v_total_versions INTEGER;
    v_first_version TIMESTAMP WITH TIME ZONE;
    v_last_version TIMESTAMP WITH TIME ZONE;
    v_most_active_user TEXT;
    v_most_modified_field TEXT;
BEGIN
    -- Statistiques de base
    SELECT COUNT(*), MIN(created_at), MAX(created_at)
    INTO v_total_versions, v_first_version, v_last_version
    FROM data_versions
    WHERE table_name = p_table_name AND record_id = p_record_id;
    
    -- Utilisateur le plus actif
    SELECT username INTO v_most_active_user
    FROM data_versions
    WHERE table_name = p_table_name AND record_id = p_record_id
    AND username IS NOT NULL
    GROUP BY username
    ORDER BY COUNT(*) DESC
    LIMIT 1;
    
    -- Champ le plus modifié
    SELECT field_name INTO v_most_modified_field
    FROM (
        SELECT unnest(changed_fields) as field_name
        FROM data_versions
        WHERE table_name = p_table_name AND record_id = p_record_id
        AND operation_type = 'UPDATE'
    ) fields
    GROUP BY field_name
    ORDER BY COUNT(*) DESC
    LIMIT 1;
    
    -- Retourner les résultats
    RETURN QUERY VALUES
        ('Total versions', v_total_versions::TEXT, 'Nombre total de modifications'),
        ('Première version', v_first_version::TEXT, 'Date de création'),
        ('Dernière version', v_last_version::TEXT, 'Dernière modification'),
        ('Utilisateur actif', COALESCE(v_most_active_user, 'N/A'), 'Utilisateur avec le plus de modifications'),
        ('Champ populaire', COALESCE(v_most_modified_field, 'N/A'), 'Champ le plus souvent modifié');
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger pour audit des suppressions de versions
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

-- Fonction pour logger les suppressions
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

-- 10. Vue pour le monitoring des performances du versioning
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

-- 11. Tests et vérifications
SELECT 'SYSTÈME DE VERSIONING AMÉLIORÉ INSTALLÉ' as status;

-- Vérifier les nouvelles fonctions
SELECT 'Test fonction daily activity' as test, COUNT(*) as records
FROM get_daily_version_activity(7);

SELECT 'Test fonction most modified fields' as test, COUNT(*) as records  
FROM get_most_modified_fields(30);

SELECT 'Test vue performance metrics' as test, COUNT(*) as tables
FROM versioning_performance_metrics;

SELECT 'Test vue changements détaillés' as test, COUNT(*) as records
FROM recent_changes_detailed
LIMIT 1;

-- Afficher un résumé des améliorations
SELECT 
    'AMÉLIORATIONS INSTALLÉES:' as message,
    E'✓ Filtrage avancé par dates, types, tables, utilisateurs\n' ||
    E'✓ Recherche dans le contenu des modifications\n' ||
    E'✓ Suppression sélective et en masse par dates\n' ||
    E'✓ Export JSON et CSV avec filtres\n' ||
    E'✓ Statistiques détaillées et métriques de performance\n' ||
    E'✓ Audit des suppressions\n' ||
    E'✓ Analyse d\'impact des modifications\n' ||
    E'✓ Interface utilisateur complète\n' ||
    E'✓ APIs REST pour toutes les fonctionnalités' as details;