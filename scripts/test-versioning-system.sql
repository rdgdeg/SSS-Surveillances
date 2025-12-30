-- Script de test du système de versioning
-- À exécuter après l'installation pour vérifier le bon fonctionnement

-- 1. Vérification de l'installation
DO $$
BEGIN
    RAISE NOTICE '=== TEST DU SYSTÈME DE VERSIONING ===';
    RAISE NOTICE '';
END $$;

-- Test 1: Vérifier les tables
DO $$
DECLARE
    tables_ok BOOLEAN := true;
BEGIN
    RAISE NOTICE '1. Vérification des tables...';
    
    -- Vérifier data_versions
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'data_versions') THEN
        RAISE WARNING '   ❌ Table data_versions manquante';
        tables_ok := false;
    ELSE
        RAISE NOTICE '   ✅ Table data_versions OK';
    END IF;
    
    -- Vérifier version_snapshots
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'version_snapshots') THEN
        RAISE WARNING '   ❌ Table version_snapshots manquante';
        tables_ok := false;
    ELSE
        RAISE NOTICE '   ✅ Table version_snapshots OK';
    END IF;
    
    -- Vérifier versioning_metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'versioning_metadata') THEN
        RAISE WARNING '   ❌ Table versioning_metadata manquante';
        tables_ok := false;
    ELSE
        RAISE NOTICE '   ✅ Table versioning_metadata OK';
    END IF;
    
    IF tables_ok THEN
        RAISE NOTICE '   ✅ Toutes les tables sont présentes';
    END IF;
END $$;

-- Test 2: Vérifier les fonctions
DO $$
DECLARE
    functions_ok BOOLEAN := true;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '2. Vérification des fonctions...';
    
    -- Vérifier record_version
    IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'record_version') THEN
        RAISE WARNING '   ❌ Fonction record_version manquante';
        functions_ok := false;
    ELSE
        RAISE NOTICE '   ✅ Fonction record_version OK';
    END IF;
    
    -- Vérifier get_version_history
    IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_version_history') THEN
        RAISE WARNING '   ❌ Fonction get_version_history manquante';
        functions_ok := false;
    ELSE
        RAISE NOTICE '   ✅ Fonction get_version_history OK';
    END IF;
    
    -- Vérifier restore_version
    IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'restore_version') THEN
        RAISE WARNING '   ❌ Fonction restore_version manquante';
        functions_ok := false;
    ELSE
        RAISE NOTICE '   ✅ Fonction restore_version OK';
    END IF;
    
    IF functions_ok THEN
        RAISE NOTICE '   ✅ Toutes les fonctions sont présentes';
    END IF;
END $$;

-- Test 3: Vérifier les triggers
DO $$
DECLARE
    trigger_count INTEGER;
    expected_tables TEXT[] := ARRAY['sessions', 'creneaux', 'examens', 'presences_enseignants', 'examen_auditoires'];
    table_name TEXT;
    trigger_exists BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '3. Vérification des triggers...';
    
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_name LIKE 'trigger_version_%';
    
    RAISE NOTICE '   Triggers installés: %', trigger_count;
    
    -- Vérifier quelques tables critiques
    FOREACH table_name IN ARRAY expected_tables
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'trigger_version_' || table_name
        ) INTO trigger_exists;
        
        IF trigger_exists THEN
            RAISE NOTICE '   ✅ Trigger pour % OK', table_name;
        ELSE
            RAISE WARNING '   ❌ Trigger pour % manquant', table_name;
        END IF;
    END LOOP;
END $$;

-- Test 4: Vérifier la configuration
DO $$
DECLARE
    config_count INTEGER;
    enabled_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '4. Vérification de la configuration...';
    
    SELECT COUNT(*) INTO config_count FROM versioning_metadata;
    SELECT COUNT(*) INTO enabled_count FROM versioning_metadata WHERE is_enabled = true;
    
    RAISE NOTICE '   Tables configurées: %', config_count;
    RAISE NOTICE '   Tables activées: %', enabled_count;
    
    IF config_count > 0 AND enabled_count > 0 THEN
        RAISE NOTICE '   ✅ Configuration OK';
    ELSE
        RAISE WARNING '   ❌ Configuration incomplète';
    END IF;
END $$;

-- Test 5: Test fonctionnel complet
DO $$
DECLARE
    version_id UUID;
    history_count INTEGER;
    test_data JSONB := '{"nom": "Test Session", "year": 2025, "is_active": true}';
    updated_data JSONB := '{"nom": "Test Session Updated", "year": 2025, "is_active": false}';
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '5. Test fonctionnel...';
    
    -- Test d'enregistrement d'une version
    SELECT record_version(
        'sessions',
        'test-session-123',
        'INSERT',
        NULL,
        test_data,
        'test-user-id',
        'test-user',
        'Test d''insertion'
    ) INTO version_id;
    
    IF version_id IS NOT NULL THEN
        RAISE NOTICE '   ✅ Enregistrement de version INSERT OK (ID: %)', version_id;
    ELSE
        RAISE WARNING '   ❌ Échec enregistrement INSERT';
        RETURN;
    END IF;
    
    -- Test d'enregistrement d'une mise à jour
    SELECT record_version(
        'sessions',
        'test-session-123',
        'UPDATE',
        test_data,
        updated_data,
        'test-user-id',
        'test-user',
        'Test de mise à jour'
    ) INTO version_id;
    
    IF version_id IS NOT NULL THEN
        RAISE NOTICE '   ✅ Enregistrement de version UPDATE OK (ID: %)', version_id;
    ELSE
        RAISE WARNING '   ❌ Échec enregistrement UPDATE';
    END IF;
    
    -- Test de récupération de l'historique
    SELECT COUNT(*) INTO history_count
    FROM get_version_history('sessions', 'test-session-123', 10);
    
    IF history_count >= 2 THEN
        RAISE NOTICE '   ✅ Récupération historique OK (% versions)', history_count;
    ELSE
        RAISE WARNING '   ❌ Historique incomplet (% versions)', history_count;
    END IF;
    
    -- Nettoyage des données de test
    DELETE FROM data_versions WHERE record_id = 'test-session-123';
    DELETE FROM version_snapshots WHERE record_id = 'test-session-123';
    
    RAISE NOTICE '   ✅ Nettoyage des données de test OK';
END $$;

-- Test 6: Test des vues
DO $$
DECLARE
    summary_count INTEGER;
    recent_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '6. Test des vues...';
    
    -- Test version_summary
    SELECT COUNT(*) INTO summary_count FROM version_summary;
    RAISE NOTICE '   Vue version_summary: % tables', summary_count;
    
    -- Test recent_changes
    SELECT COUNT(*) INTO recent_count FROM recent_changes;
    RAISE NOTICE '   Vue recent_changes: % changements récents', recent_count;
    
    IF summary_count >= 0 AND recent_count >= 0 THEN
        RAISE NOTICE '   ✅ Vues fonctionnelles OK';
    ELSE
        RAISE WARNING '   ❌ Problème avec les vues';
    END IF;
END $$;

-- Test 7: Test des politiques RLS
DO $$
DECLARE
    rls_enabled BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '7. Test des politiques de sécurité...';
    
    -- Vérifier RLS sur data_versions
    SELECT row_security INTO rls_enabled
    FROM pg_tables 
    WHERE tablename = 'data_versions';
    
    IF rls_enabled THEN
        RAISE NOTICE '   ✅ RLS activé sur data_versions';
    ELSE
        RAISE WARNING '   ❌ RLS non activé sur data_versions';
    END IF;
    
    -- Vérifier les politiques
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'data_versions') THEN
        RAISE NOTICE '   ✅ Politiques de sécurité configurées';
    ELSE
        RAISE WARNING '   ❌ Politiques de sécurité manquantes';
    END IF;
END $$;

-- Résumé final
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== RÉSUMÉ DES TESTS ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Si tous les tests affichent ✅, le système est prêt à utiliser.';
    RAISE NOTICE 'Si des tests affichent ❌, vérifiez l''installation et relancez la migration.';
    RAISE NOTICE '';
    RAISE NOTICE 'Prochaines étapes:';
    RAISE NOTICE '1. Redémarrer l''application React';
    RAISE NOTICE '2. Se connecter en tant qu''admin (RaphD)';
    RAISE NOTICE '3. Accéder à /admin/versioning';
    RAISE NOTICE '4. Tester une modification sur une table versionnée';
    RAISE NOTICE '5. Vérifier que l''historique s''affiche correctement';
    RAISE NOTICE '';
END $$;

-- Affichage de la configuration finale
SELECT 
    '=== CONFIGURATION ACTUELLE ===' as info;

SELECT 
    table_name,
    is_enabled,
    retention_days,
    max_versions_per_record,
    CASE 
        WHEN exclude_fields IS NULL THEN 'Aucun'
        ELSE array_to_string(exclude_fields, ', ')
    END as excluded_fields
FROM versioning_metadata 
ORDER BY table_name;