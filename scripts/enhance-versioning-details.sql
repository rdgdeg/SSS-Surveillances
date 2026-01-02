-- Amélioration du système de versioning pour plus de détails

-- 1. Fonction pour formater les changements de manière détaillée
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

-- 2. Vue enrichie pour les changements récents avec détails complets
CREATE OR REPLACE VIEW recent_changes_detailed AS
SELECT 
    dv.id,
    dv.table_name,
    dv.record_id,
    dv.operation_type,
    dv.username,
    dv.reason,
    dv.created_at,
    dv.changed_fields,
    array_length(dv.changed_fields, 1) as fields_changed_count,
    format_field_changes(dv.old_values, dv.new_values, dv.changed_fields) as detailed_changes,
    dv.old_values,
    dv.new_values,
    -- Extraire des informations spécifiques selon la table
    CASE 
        WHEN dv.table_name = 'examens' THEN 
            COALESCE((dv.new_values->>'code'), (dv.old_values->>'code'), 'N/A')
        WHEN dv.table_name = 'surveillants' THEN 
            COALESCE((dv.new_values->>'nom'), (dv.old_values->>'nom'), 'N/A') || ' ' ||
            COALESCE((dv.new_values->>'prenom'), (dv.old_values->>'prenom'), 'N/A')
        WHEN dv.table_name = 'demandes_modification' THEN 
            COALESCE((dv.new_values->>'code_examen'), (dv.old_values->>'code_examen'), 'N/A')
        ELSE 'N/A'
    END as record_identifier,
    -- Résumé du changement
    CASE 
        WHEN dv.operation_type = 'INSERT' THEN 'Création de ' || dv.table_name
        WHEN dv.operation_type = 'DELETE' THEN 'Suppression de ' || dv.table_name
        WHEN dv.operation_type = 'UPDATE' AND array_length(dv.changed_fields, 1) = 1 THEN 
            'Modification de ' || dv.changed_fields[1]
        WHEN dv.operation_type = 'UPDATE' AND array_length(dv.changed_fields, 1) > 1 THEN 
            'Modification de ' || array_length(dv.changed_fields, 1) || ' champs'
        WHEN dv.operation_type = 'RESTORE' THEN 'Restauration de ' || dv.table_name
        ELSE dv.operation_type
    END as change_summary
FROM data_versions dv
WHERE dv.created_at >= NOW() - INTERVAL '30 days'
ORDER BY dv.created_at DESC;

-- 3. Fonction pour obtenir l'historique détaillé d'un enregistrement
CREATE OR REPLACE FUNCTION get_detailed_version_history(
    p_table_name TEXT,
    p_record_id TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50
) RETURNS TABLE (
    version_id UUID,
    record_id TEXT,
    operation_type TEXT,
    change_summary TEXT,
    detailed_changes TEXT,
    username TEXT,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    fields_changed_count INTEGER,
    record_identifier TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rcd.id,
        rcd.record_id,
        rcd.operation_type,
        rcd.change_summary,
        rcd.detailed_changes,
        rcd.username,
        rcd.reason,
        rcd.created_at,
        rcd.fields_changed_count,
        rcd.record_identifier
    FROM recent_changes_detailed rcd
    WHERE rcd.table_name = p_table_name
    AND (p_record_id IS NULL OR rcd.record_id = p_record_id)
    ORDER BY rcd.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 4. Vue pour les statistiques détaillées par table
CREATE OR REPLACE VIEW version_statistics_detailed AS
SELECT 
    vm.table_name,
    vm.is_enabled,
    vm.retention_days,
    vm.max_versions_per_record,
    COALESCE(stats.total_versions, 0) as total_versions,
    COALESCE(stats.unique_records, 0) as unique_records,
    COALESCE(stats.inserts, 0) as inserts,
    COALESCE(stats.updates, 0) as updates,
    COALESCE(stats.deletes, 0) as deletes,
    COALESCE(stats.restores, 0) as restores,
    stats.last_change,
    stats.most_active_user,
    stats.avg_fields_per_update,
    -- Activité récente
    COALESCE(recent.changes_today, 0) as changes_today,
    COALESCE(recent.changes_this_week, 0) as changes_this_week,
    COALESCE(recent.changes_this_month, 0) as changes_this_month
FROM versioning_metadata vm
LEFT JOIN (
    SELECT 
        table_name,
        COUNT(*) as total_versions,
        COUNT(DISTINCT record_id) as unique_records,
        MAX(created_at) as last_change,
        COUNT(CASE WHEN operation_type = 'INSERT' THEN 1 END) as inserts,
        COUNT(CASE WHEN operation_type = 'UPDATE' THEN 1 END) as updates,
        COUNT(CASE WHEN operation_type = 'DELETE' THEN 1 END) as deletes,
        COUNT(CASE WHEN operation_type = 'RESTORE' THEN 1 END) as restores,
        MODE() WITHIN GROUP (ORDER BY username) as most_active_user,
        ROUND(AVG(array_length(changed_fields, 1))::NUMERIC, 1) as avg_fields_per_update
    FROM data_versions 
    GROUP BY table_name
) stats ON vm.table_name = stats.table_name
LEFT JOIN (
    SELECT 
        table_name,
        COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as changes_today,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as changes_this_week,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as changes_this_month
    FROM data_versions 
    GROUP BY table_name
) recent ON vm.table_name = recent.table_name
ORDER BY COALESCE(stats.total_versions, 0) DESC;

-- 5. Fonction pour analyser les patterns de modification
CREATE OR REPLACE FUNCTION analyze_modification_patterns(
    p_table_name TEXT DEFAULT NULL,
    p_days INTEGER DEFAULT 30
) RETURNS TABLE (
    analysis_type TEXT,
    metric TEXT,
    value TEXT,
    details TEXT
) AS $$
BEGIN
    -- Utilisateurs les plus actifs
    RETURN QUERY
    SELECT 
        'Utilisateurs actifs'::TEXT,
        'Top utilisateur'::TEXT,
        COALESCE(dv.username, 'Système')::TEXT,
        ('Modifications: ' || COUNT(*) || ' | Dernière: ' || MAX(dv.created_at)::TEXT)::TEXT
    FROM data_versions dv
    WHERE (p_table_name IS NULL OR dv.table_name = p_table_name)
    AND dv.created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY dv.username
    ORDER BY COUNT(*) DESC
    LIMIT 5;
    
    -- Champs les plus modifiés
    RETURN QUERY
    SELECT 
        'Champs modifiés'::TEXT,
        'Champ populaire'::TEXT,
        field_name::TEXT,
        ('Modifications: ' || modification_count)::TEXT
    FROM (
        SELECT 
            unnest(dv.changed_fields) as field_name,
            COUNT(*) as modification_count
        FROM data_versions dv
        WHERE (p_table_name IS NULL OR dv.table_name = p_table_name)
        AND dv.created_at >= NOW() - (p_days || ' days')::INTERVAL
        AND dv.operation_type = 'UPDATE'
        GROUP BY unnest(dv.changed_fields)
        ORDER BY COUNT(*) DESC
        LIMIT 10
    ) field_stats;
    
    -- Heures d'activité
    RETURN QUERY
    SELECT 
        'Activité temporelle'::TEXT,
        'Heure de pointe'::TEXT,
        EXTRACT(HOUR FROM dv.created_at)::TEXT,
        ('Modifications: ' || COUNT(*))::TEXT
    FROM data_versions dv
    WHERE (p_table_name IS NULL OR dv.table_name = p_table_name)
    AND dv.created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY EXTRACT(HOUR FROM dv.created_at)
    ORDER BY COUNT(*) DESC
    LIMIT 3;
    
    -- Types d'opérations
    RETURN QUERY
    SELECT 
        'Types opérations'::TEXT,
        dv.operation_type::TEXT,
        COUNT(*)::TEXT,
        ('Pourcentage: ' || ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) || '%')::TEXT
    FROM data_versions dv
    WHERE (p_table_name IS NULL OR dv.table_name = p_table_name)
    AND dv.created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY dv.operation_type
    ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql;

-- 6. Test de la nouvelle fonctionnalité
SELECT 'NOUVELLES FONCTIONNALITÉS INSTALLÉES' as status;

-- Test de la vue détaillée
SELECT 
    'Vue changements détaillés' as test,
    COUNT(*) as records_found
FROM recent_changes_detailed
LIMIT 1;

-- Test de la fonction d'analyse
SELECT 
    'Analyse des patterns' as test,
    COUNT(*) as analysis_points
FROM analyze_modification_patterns(NULL, 7)
LIMIT 1;

-- Test des statistiques détaillées
SELECT 
    'Statistiques détaillées' as test,
    COUNT(*) as tables_configured
FROM version_statistics_detailed
LIMIT 1;

SELECT 'SYSTÈME DE VERSIONING ENRICHI - Redémarrez l''application pour voir les améliorations' as message;