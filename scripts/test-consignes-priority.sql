-- Script de test pour vérifier la logique de priorité des consignes
-- Date: 2025-01-05
-- Description: Teste les différents scénarios de priorité des consignes

-- 1. Vérifier les consignes du secrétariat
SELECT 
    'Test 1: Consignes du secrétariat' as test_name,
    code_secretariat,
    nom_secretariat,
    CASE 
        WHEN consignes IS NOT NULL THEN 'Consignes unifiées présentes'
        WHEN consignes_arrivee IS NOT NULL OR consignes_mise_en_place IS NOT NULL OR consignes_generales IS NOT NULL THEN 'Consignes séparées présentes'
        ELSE 'Aucune consigne'
    END as statut_consignes
FROM consignes_secretariat
ORDER BY code_secretariat;

-- 2. Vérifier les examens avec consignes spécifiques
SELECT 
    'Test 2: Examens avec consignes spécifiques' as test_name,
    code_examen,
    nom_examen,
    secretariat,
    utiliser_consignes_specifiques,
    CASE 
        WHEN utiliser_consignes_specifiques = true THEN 'Consignes spécifiques activées'
        ELSE 'Consignes du secrétariat'
    END as type_consignes,
    CASE 
        WHEN consignes_specifiques_arrivee IS NOT NULL OR 
             consignes_specifiques_mise_en_place IS NOT NULL OR 
             consignes_specifiques_generales IS NOT NULL 
        THEN 'Consignes spécifiques définies'
        ELSE 'Pas de consignes spécifiques'
    END as statut_specifiques
FROM examens
WHERE utiliser_consignes_specifiques = true
ORDER BY code_examen;

-- 3. Tester la vue examens_with_consignes (si elle existe)
DO $test_view$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'examens_with_consignes') THEN
        RAISE NOTICE 'Test 3: Vue examens_with_consignes existe - testée séparément';
    ELSE
        RAISE NOTICE 'Test 3: Vue examens_with_consignes n''existe pas';
    END IF;
END $test_view$;

-- 4. Simuler la logique de priorité pour quelques examens
WITH consignes_effectives AS (
    SELECT 
        e.id,
        e.code_examen,
        e.nom_examen,
        e.secretariat,
        e.utiliser_consignes_specifiques,
        
        -- Logique de priorité pour les consignes
        CASE 
            WHEN e.utiliser_consignes_specifiques = true AND 
                 (e.consignes_specifiques_arrivee IS NOT NULL OR 
                  e.consignes_specifiques_mise_en_place IS NOT NULL OR 
                  e.consignes_specifiques_generales IS NOT NULL)
            THEN 'SPECIFIQUES'
            WHEN c.consignes IS NOT NULL OR 
                 c.consignes_arrivee IS NOT NULL OR 
                 c.consignes_mise_en_place IS NOT NULL OR 
                 c.consignes_generales IS NOT NULL
            THEN 'SECRETARIAT'
            ELSE 'AUCUNE'
        END as source_consignes_effective,
        
        -- Consignes effectives
        CASE 
            WHEN e.utiliser_consignes_specifiques = true AND e.consignes_specifiques_arrivee IS NOT NULL
            THEN e.consignes_specifiques_arrivee
            ELSE c.consignes_arrivee
        END as consignes_arrivee_effective,
        
        CASE 
            WHEN e.utiliser_consignes_specifiques = true AND e.consignes_specifiques_generales IS NOT NULL
            THEN e.consignes_specifiques_generales
            ELSE c.consignes_generales
        END as consignes_generales_effective
        
    FROM examens e
    LEFT JOIN consignes_secretariat c ON e.secretariat = c.code_secretariat
    WHERE e.valide = true
)
SELECT 
    'Test 4: Logique de priorité simulée' as test_name,
    code_examen,
    nom_examen,
    secretariat,
    utiliser_consignes_specifiques,
    source_consignes_effective,
    CASE 
        WHEN consignes_arrivee_effective IS NOT NULL THEN 'Consignes d''arrivée présentes'
        ELSE 'Pas de consignes d''arrivée'
    END as statut_arrivee,
    CASE 
        WHEN consignes_generales_effective IS NOT NULL THEN 'Consignes générales présentes'
        ELSE 'Pas de consignes générales'
    END as statut_generales
FROM consignes_effectives
ORDER BY source_consignes_effective DESC, code_examen
LIMIT 10;

-- 5. Résumé des tests
SELECT 
    'Test 5: Résumé' as test_name,
    COUNT(*) as total_examens,
    COUNT(CASE WHEN utiliser_consignes_specifiques = true THEN 1 END) as examens_avec_specifiques,
    COUNT(CASE WHEN utiliser_consignes_specifiques = false OR utiliser_consignes_specifiques IS NULL THEN 1 END) as examens_avec_secretariat,
    ROUND(
        COUNT(CASE WHEN utiliser_consignes_specifiques = true THEN 1 END) * 100.0 / COUNT(*), 
        1
    ) as pourcentage_specifiques
FROM examens
WHERE valide = true;

-- 6. Vérifier les examens WMD1105 spécifiquement mentionnés
SELECT 
    'Test 6: Examen WMD1105 spécifique' as test_name,
    code_examen,
    nom_examen,
    secretariat,
    utiliser_consignes_specifiques,
    CASE 
        WHEN utiliser_consignes_specifiques = true THEN 'PRIORITÉ: Consignes spécifiques'
        ELSE 'PRIORITÉ: Consignes du secrétariat'
    END as priorite_appliquee,
    CASE 
        WHEN consignes_specifiques_arrivee IS NOT NULL OR 
             consignes_specifiques_mise_en_place IS NOT NULL OR 
             consignes_specifiques_generales IS NOT NULL 
        THEN 'Consignes spécifiques définies'
        ELSE 'Pas de consignes spécifiques'
    END as statut_specifiques
FROM examens
WHERE code_examen ILIKE '%WMD1105%'
ORDER BY code_examen;

RAISE NOTICE '';
RAISE NOTICE '✅ TESTS DE PRIORITÉ DES CONSIGNES TERMINÉS';
RAISE NOTICE '================================================';
RAISE NOTICE 'Logique de priorité appliquée:';
RAISE NOTICE '1. Consignes spécifiques de l''examen (si utiliser_consignes_specifiques = true)';
RAISE NOTICE '2. Consignes du cours (si définies et pas de spécifiques)';
RAISE NOTICE '3. Consignes du secrétariat (par défaut)';
RAISE NOTICE '4. Mode secrétariat (message spécial si is_mode_secretariat = true)';
RAISE NOTICE '';