-- Script de test pour le système d'héritage des consignes
-- Vérifie que toutes les fonctionnalités fonctionnent correctement

-- 1. Vérifier que la vue examens_with_consignes existe et fonctionne
SELECT 
    'Test 1: Vue examens_with_consignes' as test,
    COUNT(*) as examens_avec_vue,
    COUNT(CASE WHEN consignes_arrivee_effectives IS NOT NULL THEN 1 END) as avec_consignes_arrivee,
    COUNT(CASE WHEN consignes_generales_effectives IS NOT NULL THEN 1 END) as avec_consignes_generales
FROM examens_with_consignes
LIMIT 1;

-- 2. Tester la fonction get_consignes_examen
DO $test_function$
DECLARE
    v_examen_id UUID;
    v_result RECORD;
BEGIN
    -- Prendre le premier examen disponible
    SELECT id INTO v_examen_id FROM examens LIMIT 1;
    
    IF v_examen_id IS NOT NULL THEN
        SELECT * INTO v_result FROM get_consignes_examen(v_examen_id);
        
        IF v_result IS NOT NULL THEN
            RAISE NOTICE 'Test 2: Fonction get_consignes_examen - OK';
            RAISE NOTICE 'Source des consignes: %', v_result.source_consignes;
        ELSE
            RAISE NOTICE 'Test 2: Fonction get_consignes_examen - ÉCHEC (aucun résultat)';
        END IF;
    ELSE
        RAISE NOTICE 'Test 2: Aucun examen disponible pour le test';
    END IF;
END $test_function$;

-- 3. Tester l'initialisation de consignes spécifiques
DO $test_init$
DECLARE
    v_examen_id UUID;
    v_success BOOLEAN;
BEGIN
    -- Prendre un examen qui n'utilise pas encore de consignes spécifiques
    SELECT id INTO v_examen_id 
    FROM examens 
    WHERE utiliser_consignes_specifiques = false OR utiliser_consignes_specifiques IS NULL
    LIMIT 1;
    
    IF v_examen_id IS NOT NULL THEN
        SELECT initialiser_consignes_specifiques(v_examen_id) INTO v_success;
        
        IF v_success THEN
            RAISE NOTICE 'Test 3: Initialisation consignes spécifiques - OK';
            
            -- Vérifier que l'examen utilise maintenant des consignes spécifiques
            IF EXISTS (SELECT 1 FROM examens WHERE id = v_examen_id AND utiliser_consignes_specifiques = true) THEN
                RAISE NOTICE 'Test 3: Vérification flag utiliser_consignes_specifiques - OK';
            ELSE
                RAISE NOTICE 'Test 3: Vérification flag utiliser_consignes_specifiques - ÉCHEC';
            END IF;
        ELSE
            RAISE NOTICE 'Test 3: Initialisation consignes spécifiques - ÉCHEC';
        END IF;
    ELSE
        RAISE NOTICE 'Test 3: Aucun examen disponible pour le test';
    END IF;
END $test_init$;

-- 4. Tester le retour aux consignes du secrétariat
DO $test_revert$
DECLARE
    v_examen_id UUID;
    v_success BOOLEAN;
BEGIN
    -- Prendre un examen qui utilise des consignes spécifiques
    SELECT id INTO v_examen_id 
    FROM examens 
    WHERE utiliser_consignes_specifiques = true
    LIMIT 1;
    
    IF v_examen_id IS NOT NULL THEN
        SELECT utiliser_consignes_secretariat(v_examen_id) INTO v_success;
        
        IF v_success THEN
            RAISE NOTICE 'Test 4: Retour aux consignes du secrétariat - OK';
            
            -- Vérifier que l'examen n'utilise plus de consignes spécifiques
            IF EXISTS (SELECT 1 FROM examens WHERE id = v_examen_id AND utiliser_consignes_specifiques = false) THEN
                RAISE NOTICE 'Test 4: Vérification flag utiliser_consignes_specifiques - OK';
            ELSE
                RAISE NOTICE 'Test 4: Vérification flag utiliser_consignes_specifiques - ÉCHEC';
            END IF;
        ELSE
            RAISE NOTICE 'Test 4: Retour aux consignes du secrétariat - ÉCHEC';
        END IF;
    ELSE
        RAISE NOTICE 'Test 4: Aucun examen avec consignes spécifiques pour le test';
    END IF;
END $test_revert$;

-- 5. Vérifier la vue planning_examens_public
SELECT 
    'Test 5: Vue planning_examens_public' as test,
    COUNT(*) as examens_dans_planning,
    COUNT(CASE WHEN consignes_generales IS NOT NULL THEN 1 END) as avec_consignes_generales,
    COUNT(CASE WHEN consignes_generales_personnalisees = true THEN 1 END) as consignes_personnalisees
FROM planning_examens_public
LIMIT 1;

-- 6. Vérifier les statistiques
SELECT 
    'Test 6: Statistiques consignes' as test,
    secretariat,
    total_examens,
    examens_consignes_specifiques,
    pourcentage_personnalises || '%' as pourcentage
FROM stats_consignes_examens
ORDER BY secretariat
LIMIT 5;

-- 7. Test de cohérence des données
SELECT 
    'Test 7: Cohérence des données' as test,
    COUNT(*) as total_examens,
    COUNT(CASE WHEN secretariat IS NOT NULL THEN 1 END) as avec_secretariat,
    COUNT(CASE WHEN utiliser_consignes_specifiques = true THEN 1 END) as avec_consignes_specifiques,
    COUNT(CASE WHEN utiliser_consignes_specifiques = true AND consignes_specifiques_generales IS NOT NULL THEN 1 END) as consignes_specifiques_valides
FROM examens;

-- 8. Vérifier les triggers
SELECT 
    'Test 8: Triggers installés' as test,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_consignes_secretariat';

-- Résumé des tests
SELECT 
    'RÉSUMÉ DES TESTS' as section,
    'Tous les tests ont été exécutés' as status,
    'Vérifiez les messages ci-dessus pour les résultats' as instruction;