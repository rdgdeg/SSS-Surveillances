-- Script de vérification post-installation du système d'héritage des consignes
-- Description: Vérifie que tout est correctement installé et fonctionne

-- 1. Vérifier les colonnes
SELECT 
    'VÉRIFICATION DES COLONNES' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'examens' 
  AND column_name IN ('consignes_specifiques_arrivee', 'consignes_specifiques_mise_en_place', 
                      'consignes_specifiques_generales', 'utiliser_consignes_specifiques')
ORDER BY column_name;

-- 2. Vérifier les fonctions
SELECT 
    'VÉRIFICATION DES FONCTIONS' as section,
    p.proname as function_name,
    pg_get_function_result(p.oid) as return_type,
    p.pronargs as nb_arguments
FROM pg_proc p 
JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE n.nspname = 'public' 
  AND p.proname IN ('get_consignes_examen', 'initialiser_consignes_specifiques', 'utiliser_consignes_secretariat')
ORDER BY p.proname;

-- 3. Vérifier les vues
SELECT 
    'VÉRIFICATION DES VUES' as section,
    table_name as view_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('examens_with_consignes', 'planning_examens_public', 'stats_consignes_examens')
  AND table_type = 'VIEW'
ORDER BY table_name;

-- 4. Test fonctionnel complet
DO $test_complet$
DECLARE
    v_examen_id UUID;
    v_consignes RECORD;
    v_count INTEGER;
    v_success BOOLEAN := TRUE;
BEGIN
    RAISE NOTICE 'TEST FONCTIONNEL COMPLET';
    RAISE NOTICE '=======================';
    
    -- Test 1: Vue examens_with_consignes
    SELECT COUNT(*) INTO v_count FROM examens_with_consignes;
    IF v_count > 0 THEN
        RAISE NOTICE '✓ Vue examens_with_consignes: % examens', v_count;
    ELSE
        RAISE NOTICE '✗ Vue examens_with_consignes: Aucun examen trouvé';
        v_success := FALSE;
    END IF;
    
    -- Test 2: Vue planning_examens_public
    SELECT COUNT(*) INTO v_count FROM planning_examens_public;
    RAISE NOTICE '✓ Vue planning_examens_public: % examens publics', v_count;
    
    -- Test 3: Vue stats_consignes_examens
    SELECT COUNT(*) INTO v_count FROM stats_consignes_examens;
    RAISE NOTICE '✓ Vue stats_consignes_examens: % secrétariats', v_count;
    
    -- Test 4: Fonction get_consignes_examen
    SELECT id INTO v_examen_id FROM examens LIMIT 1;
    IF v_examen_id IS NOT NULL THEN
        SELECT * INTO v_consignes FROM get_consignes_examen(v_examen_id);
        IF v_consignes IS NOT NULL THEN
            RAISE NOTICE '✓ Fonction get_consignes_examen: Fonctionne';
            RAISE NOTICE '  - Source: %', v_consignes.source_consignes;
            RAISE NOTICE '  - Consignes générales: %', 
                CASE WHEN v_consignes.consignes_generales IS NOT NULL 
                     THEN LEFT(v_consignes.consignes_generales, 50) || '...'
                     ELSE '[Aucune]' 
                END;
        ELSE
            RAISE NOTICE '✗ Fonction get_consignes_examen: Retourne NULL';
            v_success := FALSE;
        END IF;
    ELSE
        RAISE NOTICE '⚠ Aucun examen disponible pour tester la fonction';
    END IF;
    
    -- Test 5: Fonction initialiser_consignes_specifiques
    IF v_examen_id IS NOT NULL THEN
        SELECT initialiser_consignes_specifiques(v_examen_id) INTO v_success;
        IF v_success THEN
            RAISE NOTICE '✓ Fonction initialiser_consignes_specifiques: Fonctionne';
            
            -- Revenir à l'état initial
            SELECT utiliser_consignes_secretariat(v_examen_id) INTO v_success;
            RAISE NOTICE '✓ Fonction utiliser_consignes_secretariat: Fonctionne';
        ELSE
            RAISE NOTICE '✗ Fonction initialiser_consignes_specifiques: Échec';
        END IF;
    END IF;
    
    RAISE NOTICE '';
    IF v_success THEN
        RAISE NOTICE '🎉 TOUS LES TESTS SONT RÉUSSIS !';
        RAISE NOTICE 'Le système d''héritage des consignes est complètement opérationnel.';
    ELSE
        RAISE NOTICE '⚠️  CERTAINS TESTS ONT ÉCHOUÉ';
        RAISE NOTICE 'Vérifiez les messages ci-dessus pour identifier les problèmes.';
    END IF;
END $test_complet$;

-- 5. Statistiques du système
SELECT 
    'STATISTIQUES DU SYSTÈME' as section,
    (SELECT COUNT(*) FROM examens) as total_examens,
    (SELECT COUNT(*) FROM examens WHERE secretariat IS NOT NULL) as examens_avec_secretariat,
    (SELECT COUNT(*) FROM examens WHERE utiliser_consignes_specifiques = true) as examens_consignes_specifiques,
    (SELECT COUNT(*) FROM consignes_secretariat WHERE is_active = true) as secretariats_actifs;

-- 6. Exemples d'utilisation
SELECT 
    'EXEMPLES D''UTILISATION' as section,
    'SELECT * FROM get_consignes_examen(''uuid-examen'');' as exemple_fonction,
    'SELECT * FROM examens_with_consignes LIMIT 5;' as exemple_vue,
    'SELECT * FROM stats_consignes_examens;' as exemple_statistiques;

-- 7. Résumé final
SELECT 
    'VÉRIFICATION TERMINÉE' as status,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_proc WHERE proname = 'get_consignes_examen') > 0
        THEN 'SYSTÈME INSTALLÉ ET FONCTIONNEL'
        ELSE 'SYSTÈME NON INSTALLÉ'
    END as resultat,
    NOW() as verified_at;