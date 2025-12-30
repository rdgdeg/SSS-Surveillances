-- Script d'application de la migration de versioning
-- À exécuter dans Supabase SQL Editor ou via psql

-- 1. Vérifier que les tables n'existent pas déjà
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'data_versions') THEN
        RAISE NOTICE 'Le système de versioning semble déjà installé. Vérification...';
        
        -- Afficher les statistiques existantes
        RAISE NOTICE 'Tables de versioning existantes:';
        PERFORM pg_sleep(1);
    ELSE
        RAISE NOTICE 'Installation du système de versioning...';
    END IF;
END $$;

-- 2. Appliquer la migration principale
\i supabase/migrations/create_versioning_system_fixed.sql

-- 3. Vérifier l'installation
DO $$
DECLARE
    table_count INTEGER;
    trigger_count INTEGER;
    metadata_count INTEGER;
BEGIN
    -- Compter les tables créées
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_name IN ('data_versions', 'version_snapshots', 'versioning_metadata');
    
    -- Compter les triggers créés
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_name LIKE 'trigger_version_%';
    
    -- Compter les métadonnées configurées
    SELECT COUNT(*) INTO metadata_count
    FROM versioning_metadata 
    WHERE is_enabled = true;
    
    RAISE NOTICE 'Installation terminée:';
    RAISE NOTICE '- Tables créées: %', table_count;
    RAISE NOTICE '- Triggers installés: %', trigger_count;
    RAISE NOTICE '- Tables configurées: %', metadata_count;
    
    IF table_count = 3 AND trigger_count > 0 AND metadata_count > 0 THEN
        RAISE NOTICE 'SUCCESS: Système de versioning installé avec succès!';
    ELSE
        RAISE WARNING 'ATTENTION: Installation incomplète, vérifiez les erreurs ci-dessus';
    END IF;
END $$;

-- 4. Afficher la configuration actuelle
SELECT 
    table_name,
    is_enabled,
    retention_days,
    max_versions_per_record,
    array_length(exclude_fields, 1) as excluded_fields_count
FROM versioning_metadata 
ORDER BY table_name;

-- 5. Afficher les triggers installés
SELECT 
    trigger_name,
    event_object_table as table_name,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_name LIKE 'trigger_version_%'
ORDER BY event_object_table;

-- 6. Test rapide du système
DO $$
DECLARE
    test_version_id UUID;
BEGIN
    -- Tester l'enregistrement d'une version fictive
    SELECT record_version(
        'test_table',
        'test_record',
        'INSERT',
        NULL,
        '{"test": "data"}'::JSONB,
        'system',
        'test_user',
        'Test d''installation'
    ) INTO test_version_id;
    
    IF test_version_id IS NOT NULL THEN
        RAISE NOTICE 'Test réussi: Version créée avec ID %', test_version_id;
        
        -- Nettoyer le test
        DELETE FROM data_versions WHERE id = test_version_id;
        RAISE NOTICE 'Test nettoyé';
    ELSE
        RAISE WARNING 'Test échoué: Impossible de créer une version de test';
    END IF;
END $$;

-- 7. Instructions finales
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== INSTALLATION TERMINÉE ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Prochaines étapes:';
    RAISE NOTICE '1. Redémarrer l''application pour charger les nouveaux composants';
    RAISE NOTICE '2. Accéder à /admin/versioning pour tester l''interface';
    RAISE NOTICE '3. Vérifier que les modifications sont bien trackées';
    RAISE NOTICE '4. Configurer les alertes de monitoring si nécessaire';
    RAISE NOTICE '';
    RAISE NOTICE 'Documentation: Voir VERSIONING-SYSTEM-GUIDE.md';
    RAISE NOTICE '';
END $$;