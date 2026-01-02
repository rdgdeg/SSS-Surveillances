-- Test rapide du système de versioning

-- 1. Vérifier que les tables existent
SELECT 
    'Tables système' as check_name,
    COUNT(*) as count,
    CASE WHEN COUNT(*) = 3 THEN '✅ OK' ELSE '❌ MANQUANT' END as status
FROM information_schema.tables 
WHERE table_name IN ('data_versions', 'version_snapshots', 'versioning_metadata');

-- 2. Vérifier les triggers
SELECT 
    'Triggers actifs' as check_name,
    COUNT(*) as count,
    CASE WHEN COUNT(*) >= 5 THEN '✅ OK' ELSE '❌ INSUFFISANT' END as status
FROM information_schema.triggers 
WHERE trigger_name LIKE 'trigger_version_%';

-- 3. Vérifier l'activité récente
SELECT 
    'Activité récente (7j)' as check_name,
    COUNT(*) as count,
    CASE WHEN COUNT(*) > 0 THEN '✅ ACTIF' ELSE '⚠️ AUCUNE ACTIVITÉ' END as status
FROM data_versions 
WHERE created_at >= NOW() - INTERVAL '7 days';

-- 4. Vérifier les utilisateurs capturés
SELECT 
    'Utilisateurs capturés' as check_name,
    COUNT(DISTINCT username) as unique_users,
    CASE 
        WHEN COUNT(DISTINCT username) > 1 THEN '✅ UTILISATEURS RÉELS'
        WHEN COUNT(DISTINCT username) = 1 AND MAX(username) != 'Système' THEN '✅ UTILISATEUR RÉEL'
        ELSE '⚠️ SEULEMENT SYSTÈME'
    END as status
FROM data_versions 
WHERE created_at >= NOW() - INTERVAL '7 days';

-- 5. Afficher les dernières modifications
SELECT 
    'Dernières modifications' as info,
    table_name,
    operation_type,
    username,
    created_at,
    array_length(changed_fields, 1) as fields_changed
FROM data_versions 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;

-- 6. Résumé par table
SELECT 
    'Résumé par table' as info,
    table_name,
    COUNT(*) as total_versions,
    MAX(created_at) as last_change
FROM data_versions 
GROUP BY table_name
ORDER BY total_versions DESC;

-- 7. Test simple si possible
DO $$
DECLARE
    v_test_count INTEGER;
BEGIN
    -- Compter les demandes existantes
    SELECT COUNT(*) INTO v_test_count FROM demandes_modification;
    
    IF v_test_count > 0 THEN
        -- Faire une modification mineure sur une demande existante
        UPDATE demandes_modification 
        SET updated_at = NOW() 
        WHERE id = (SELECT id FROM demandes_modification LIMIT 1);
        
        -- Vérifier qu'une version a été créée
        SELECT COUNT(*) INTO v_test_count
        FROM data_versions 
        WHERE table_name = 'demandes_modification' 
        AND created_at >= NOW() - INTERVAL '1 minute';
        
        RAISE NOTICE 'Test modification: % nouvelles versions créées', v_test_count;
    ELSE
        RAISE NOTICE 'Aucune demande existante pour le test';
    END IF;
END $$;

-- Message final
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('data_versions', 'version_snapshots', 'versioning_metadata')) = 3
        AND (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name LIKE 'trigger_version_%') >= 5
        THEN '🎉 SYSTÈME DE VERSIONING OPÉRATIONNEL'
        ELSE '⚠️ PROBLÈMES DÉTECTÉS - Voir les résultats ci-dessus'
    END as status_final;