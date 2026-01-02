-- Diagnostic complet du système de versioning

-- ===== 1. VÉRIFICATION DES TABLES =====
SELECT 'TABLES DE VERSIONING' as section;

SELECT 
    'Tables système' as check_type,
    table_name,
    CASE WHEN table_name IS NOT NULL THEN 'PRÉSENT' ELSE 'MANQUANT' END as status
FROM information_schema.tables 
WHERE table_name IN ('data_versions', 'version_snapshots', 'versioning_metadata')
ORDER BY table_name;

-- ===== 2. VÉRIFICATION DES TRIGGERS =====
SELECT 'TRIGGERS DE VERSIONING' as section;

SELECT 
    'Triggers installés' as check_type,
    trigger_name,
    event_object_table as table_name,
    event_manipulation as operation,
    action_timing as timing
FROM information_schema.triggers 
WHERE trigger_name LIKE 'trigger_version_%'
ORDER BY event_object_table;

-- ===== 3. VÉRIFICATION DES FONCTIONS =====
SELECT 'FONCTIONS DE VERSIONING' as section;

SELECT 
    'Fonctions système' as check_type,
    routine_name as function_name,
    routine_type,
    CASE WHEN routine_name IS NOT NULL THEN 'PRÉSENT' ELSE 'MANQUANT' END as status
FROM information_schema.routines 
WHERE routine_name IN (
    'trigger_record_version',
    'record_version',
    'get_version_history',
    'compare_versions',
    'restore_version'
)
ORDER BY routine_name;

-- ===== 4. CONFIGURATION DES TABLES =====
SELECT 'CONFIGURATION VERSIONING' as section;

SELECT 
    'Configuration tables' as check_type,
    table_name,
    is_enabled,
    retention_days,
    max_versions_per_record,
    array_length(exclude_fields, 1) as excluded_fields_count
FROM versioning_metadata 
ORDER BY table_name;

-- ===== 5. STATISTIQUES DES VERSIONS =====
SELECT 'STATISTIQUES VERSIONS' as section;

-- Résumé par table
SELECT 
    'Résumé par table' as stat_type,
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

-- ===== 6. ACTIVITÉ RÉCENTE =====
SELECT 'ACTIVITÉ RÉCENTE' as section;

-- Changements des dernières 24h
SELECT 
    'Dernières 24h' as period,
    table_name,
    operation_type,
    username,
    reason,
    created_at,
    array_length(changed_fields, 1) as fields_changed
FROM data_versions 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 20;

-- ===== 7. VÉRIFICATION DES VUES =====
SELECT 'VUES SYSTÈME' as section;

SELECT 
    'Vues versioning' as check_type,
    table_name as view_name,
    CASE WHEN table_name IS NOT NULL THEN 'PRÉSENT' ELSE 'MANQUANT' END as status
FROM information_schema.views 
WHERE table_name IN ('version_summary', 'recent_changes')
ORDER BY table_name;

-- ===== 8. TEST DE FONCTIONNEMENT =====
SELECT 'TEST FONCTIONNEMENT' as section;

-- Test simple d'insertion et suppression
DO $$
DECLARE
    v_test_id UUID;
    v_version_count INTEGER;
    v_table_exists BOOLEAN := FALSE;
BEGIN
    -- Vérifier si la table examens existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'examens'
    ) INTO v_table_exists;
    
    IF v_table_exists THEN
        BEGIN
            -- Insérer un examen de test
            INSERT INTO examens (code, nom, date, heure, duree, type_examen)
            VALUES ('TEST_VERS', 'Test Versioning', CURRENT_DATE, '09:00', 120, 'Écrit')
            RETURNING id INTO v_test_id;
            
            -- Vérifier qu'une version a été créée
            SELECT COUNT(*) INTO v_version_count
            FROM data_versions 
            WHERE table_name = 'examens' AND record_id = v_test_id::TEXT;
            
            RAISE NOTICE 'Test INSERT: % versions créées pour l''examen %', v_version_count, v_test_id;
            
            -- Modifier l'examen
            UPDATE examens 
            SET nom = 'Test Versioning Modifié'
            WHERE id = v_test_id;
            
            -- Vérifier les versions après modification
            SELECT COUNT(*) INTO v_version_count
            FROM data_versions 
            WHERE table_name = 'examens' AND record_id = v_test_id::TEXT;
            
            RAISE NOTICE 'Test UPDATE: % versions totales pour l''examen %', v_version_count, v_test_id;
            
            -- Nettoyer
            DELETE FROM examens WHERE id = v_test_id;
            DELETE FROM data_versions WHERE record_id = v_test_id::TEXT;
            DELETE FROM version_snapshots WHERE record_id = v_test_id::TEXT;
            
            RAISE NOTICE 'Test terminé et nettoyé';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erreur lors du test: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Table examens non trouvée pour le test';
    END IF;
END $$;

-- ===== 9. DIAGNOSTIC FINAL =====
SELECT 'DIAGNOSTIC FINAL' as section;

SELECT 
    'État général' as check_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('data_versions', 'version_snapshots', 'versioning_metadata')) = 3
        AND (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name LIKE 'trigger_version_%') >= 5
        AND (SELECT COUNT(*) FROM versioning_metadata WHERE is_enabled = true) >= 5
        THEN 'SYSTÈME OPÉRATIONNEL'
        ELSE 'PROBLÈMES DÉTECTÉS'
    END as status;

-- Recommandations
SELECT 
    'Recommandations' as check_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'data_versions') = 0 
        THEN 'Exécuter VERSIONING-FINAL-INSTALL.sql'
        WHEN (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name LIKE 'trigger_version_%') < 5
        THEN 'Réinstaller les triggers avec fix-versioning-triggers-only.sql'
        WHEN (SELECT COUNT(*) FROM data_versions WHERE created_at >= NOW() - INTERVAL '24 hours') = 0
        THEN 'Aucune activité récente - vérifier que les modifications sont bien capturées'
        ELSE 'Système fonctionnel'
    END as recommendation;