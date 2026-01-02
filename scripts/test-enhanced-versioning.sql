-- Test du système de versioning enrichi avec détails complets

-- ===== PRÉPARATION =====
-- Nettoyer les anciens tests
DELETE FROM data_versions WHERE record_id LIKE 'test_enhanced_%';
DELETE FROM version_snapshots WHERE record_id LIKE 'test_enhanced_%';

-- ===== TEST COMPLET AVEC DÉTAILS =====
DO $$
DECLARE
    v_exam_id UUID;
    v_demande_id UUID;
    v_surveillant_id UUID;
    v_version_count INTEGER;
    v_detailed_changes TEXT;
BEGIN
    RAISE NOTICE '=== TEST SYSTÈME DE VERSIONING ENRICHI ===';
    
    -- Test 1: Examen avec modifications multiples
    RAISE NOTICE '--- Test 1: Examen avec modifications détaillées ---';
    
    INSERT INTO examens (code, nom, date, heure, duree, type_examen, faculte)
    VALUES ('TEST_ENH_001', 'Test Versioning Enrichi', CURRENT_DATE + 1, '09:00', 120, 'Écrit', 'TEST')
    RETURNING id INTO v_exam_id;
    
    -- Première modification : changer plusieurs champs
    UPDATE examens 
    SET nom = 'Test Versioning Enrichi - Modifié',
        duree = 180,
        heure = '10:00',
        type_examen = 'Oral'
    WHERE id = v_exam_id;
    
    -- Deuxième modification : changer un seul champ
    UPDATE examens 
    SET date = CURRENT_DATE + 2
    WHERE id = v_exam_id;
    
    -- Vérifier les versions créées
    SELECT COUNT(*) INTO v_version_count
    FROM data_versions 
    WHERE table_name = 'examens' AND record_id = v_exam_id::TEXT;
    
    RAISE NOTICE 'Examen: % versions créées', v_version_count;
    
    -- Test 2: Demande de modification avec permutation
    RAISE NOTICE '--- Test 2: Demande avec permutation ---';
    
    INSERT INTO demandes_modification (
        code_examen, nom_examen, date_examen, heure_examen,
        type_demande, nom_demandeur, email_demandeur,
        surveillant_remplacant, surveillance_reprise_code_examen,
        surveillance_reprise_date, surveillance_reprise_heure
    )
    VALUES (
        'TEST_ENH_002', 'Test Demande Enrichie', CURRENT_DATE + 3, '14:00',
        'permutation', 'Test User Enhanced', 'test.enhanced@test.com',
        'Jean Dupont', 'WFARM1300', CURRENT_DATE + 4, '16:00'
    )
    RETURNING id INTO v_demande_id;
    
    -- Modifier le statut
    UPDATE demandes_modification 
    SET statut = 'en_cours', 
        reponse_admin = 'Demande en cours de traitement',
        lu = true
    WHERE id = v_demande_id;
    
    -- Finaliser la demande
    UPDATE demandes_modification 
    SET statut = 'traitee',
        reponse_admin = 'Permutation acceptée et programmée',
        traite_at = NOW()
    WHERE id = v_demande_id;
    
    -- Test 3: Surveillant avec modifications graduelles
    RAISE NOTICE '--- Test 3: Surveillant avec modifications graduelles ---';
    
    INSERT INTO surveillants (nom, prenom, email, telephone, faculte, type_surveillant)
    VALUES ('Test', 'Enhanced', 'test.enhanced@uclouvain.be', '0123456789', 'TEST', 'interne')
    RETURNING id INTO v_surveillant_id;
    
    -- Modifier le téléphone
    UPDATE surveillants 
    SET telephone = '0987654321'
    WHERE id = v_surveillant_id;
    
    -- Modifier l'email et le type
    UPDATE surveillants 
    SET email = 'test.enhanced.new@uclouvain.be',
        type_surveillant = 'externe'
    WHERE id = v_surveillant_id;
    
    -- Ajouter des informations supplémentaires
    UPDATE surveillants 
    SET telephone = '0456789123',
        faculte = 'ENHANCED_TEST'
    WHERE id = v_surveillant_id;
    
    RAISE NOTICE 'Tests de création terminés';
    
END $$;

-- ===== VÉRIFICATION DES RÉSULTATS ENRICHIS =====

-- 1. Vérifier les changements récents détaillés
SELECT 'CHANGEMENTS RÉCENTS DÉTAILLÉS' as section;

SELECT 
    table_name,
    operation_type,
    change_summary,
    record_identifier,
    fields_changed_count,
    username,
    created_at
FROM recent_changes_detailed
WHERE created_at >= NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;

-- 2. Afficher les détails des modifications
SELECT 'DÉTAILS DES MODIFICATIONS' as section;

SELECT 
    table_name,
    operation_type,
    detailed_changes,
    username,
    created_at
FROM recent_changes_detailed
WHERE created_at >= NOW() - INTERVAL '5 minutes'
AND operation_type = 'UPDATE'
ORDER BY created_at DESC;

-- 3. Statistiques détaillées
SELECT 'STATISTIQUES DÉTAILLÉES' as section;

SELECT 
    table_name,
    total_versions,
    unique_records,
    changes_today,
    changes_this_week,
    most_active_user,
    avg_fields_per_update
FROM version_statistics_detailed
WHERE total_versions > 0
ORDER BY total_versions DESC;

-- 4. Analyse des patterns
SELECT 'ANALYSE DES PATTERNS' as section;

SELECT 
    analysis_type,
    metric,
    value,
    details
FROM analyze_modification_patterns(NULL, 1)
ORDER BY analysis_type, metric;

-- 5. Historique détaillé d'un enregistrement spécifique
SELECT 'HISTORIQUE DÉTAILLÉ EXAMEN' as section;

SELECT 
    operation_type,
    change_summary,
    detailed_changes,
    username,
    created_at
FROM get_detailed_version_history('examens', 
    (SELECT id::TEXT FROM examens WHERE code = 'TEST_ENH_001' LIMIT 1), 
    10
)
ORDER BY created_at DESC;

-- ===== TEST DES FONCTIONS D'ANALYSE =====

-- Test de formatage des changements
SELECT 'TEST FORMATAGE CHANGEMENTS' as section;

SELECT 
    table_name,
    record_id,
    format_field_changes(old_values, new_values, changed_fields) as formatted_changes
FROM data_versions 
WHERE created_at >= NOW() - INTERVAL '5 minutes'
AND operation_type = 'UPDATE'
AND changed_fields IS NOT NULL
LIMIT 5;

-- ===== NETTOYAGE =====
-- Supprimer les données de test
DELETE FROM examens WHERE code LIKE 'TEST_ENH_%';
DELETE FROM demandes_modification WHERE code_examen LIKE 'TEST_ENH_%';
DELETE FROM surveillants WHERE nom = 'Test' AND prenom = 'Enhanced';

-- Supprimer les versions de test
DELETE FROM data_versions WHERE created_at >= NOW() - INTERVAL '5 minutes';
DELETE FROM version_snapshots WHERE created_at >= NOW() - INTERVAL '5 minutes';

-- ===== RÉSUMÉ FINAL =====
SELECT 'RÉSUMÉ DU TEST ENRICHI' as section;

SELECT 
    'Fonctionnalités enrichies' as feature,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'recent_changes_detailed') 
        THEN '✅ Vue détaillée installée'
        ELSE '❌ Vue détaillée manquante'
    END as status

UNION ALL

SELECT 
    'Fonction de formatage' as feature,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'format_field_changes') 
        THEN '✅ Fonction de formatage installée'
        ELSE '❌ Fonction de formatage manquante'
    END as status

UNION ALL

SELECT 
    'Analyse des patterns' as feature,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'analyze_modification_patterns') 
        THEN '✅ Analyse des patterns installée'
        ELSE '❌ Analyse des patterns manquante'
    END as status

UNION ALL

SELECT 
    'Statistiques détaillées' as feature,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'version_statistics_detailed') 
        THEN '✅ Statistiques détaillées installées'
        ELSE '❌ Statistiques détaillées manquantes'
    END as status;

SELECT '🎉 TEST DU SYSTÈME DE VERSIONING ENRICHI TERMINÉ' as final_message;