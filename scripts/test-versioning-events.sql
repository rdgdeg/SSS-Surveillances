-- Test complet des événements de versioning

-- ===== PRÉPARATION =====
-- Nettoyer les anciens tests
DELETE FROM data_versions WHERE record_id LIKE 'test_%';
DELETE FROM version_snapshots WHERE record_id LIKE 'test_%';

-- ===== TEST 1: EXAMENS =====
DO $$
DECLARE
    v_exam_id UUID;
    v_version_count INTEGER;
BEGIN
    RAISE NOTICE '=== TEST EXAMENS ===';
    
    -- Insertion
    INSERT INTO examens (code, nom, date, heure, duree, type_examen)
    VALUES ('TEST001', 'Test Versioning Examen', CURRENT_DATE, '09:00', 120, 'Écrit')
    RETURNING id INTO v_exam_id;
    
    -- Vérifier version INSERT
    SELECT COUNT(*) INTO v_version_count
    FROM data_versions 
    WHERE table_name = 'examens' AND record_id = v_exam_id::TEXT AND operation_type = 'INSERT';
    
    RAISE NOTICE 'INSERT examen: % versions créées', v_version_count;
    
    -- Modification
    UPDATE examens 
    SET nom = 'Test Versioning Examen Modifié', duree = 180
    WHERE id = v_exam_id;
    
    -- Vérifier version UPDATE
    SELECT COUNT(*) INTO v_version_count
    FROM data_versions 
    WHERE table_name = 'examens' AND record_id = v_exam_id::TEXT AND operation_type = 'UPDATE';
    
    RAISE NOTICE 'UPDATE examen: % versions créées', v_version_count;
    
    -- Suppression
    DELETE FROM examens WHERE id = v_exam_id;
    
    -- Vérifier version DELETE
    SELECT COUNT(*) INTO v_version_count
    FROM data_versions 
    WHERE table_name = 'examens' AND record_id = v_exam_id::TEXT AND operation_type = 'DELETE';
    
    RAISE NOTICE 'DELETE examen: % versions créées', v_version_count;
    
    -- Afficher toutes les versions créées
    SELECT COUNT(*) INTO v_version_count
    FROM data_versions 
    WHERE table_name = 'examens' AND record_id = v_exam_id::TEXT;
    
    RAISE NOTICE 'Total versions examen: %', v_version_count;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erreur test examens: %', SQLERRM;
END $$;

-- ===== TEST 2: DEMANDES MODIFICATION =====
DO $$
DECLARE
    v_demande_id UUID;
    v_version_count INTEGER;
BEGIN
    RAISE NOTICE '=== TEST DEMANDES MODIFICATION ===';
    
    -- Insertion
    INSERT INTO demandes_modification (
        code_examen, nom_examen, date_examen, heure_examen, 
        type_demande, nom_demandeur
    )
    VALUES (
        'TEST002', 'Test Demande', CURRENT_DATE, '14:00',
        'modification', 'Test User'
    )
    RETURNING id INTO v_demande_id;
    
    -- Vérifier version INSERT
    SELECT COUNT(*) INTO v_version_count
    FROM data_versions 
    WHERE table_name = 'demandes_modification' AND record_id = v_demande_id::TEXT AND operation_type = 'INSERT';
    
    RAISE NOTICE 'INSERT demande: % versions créées', v_version_count;
    
    -- Modification
    UPDATE demandes_modification 
    SET statut = 'en_cours', reponse_admin = 'En traitement'
    WHERE id = v_demande_id;
    
    -- Vérifier version UPDATE
    SELECT COUNT(*) INTO v_version_count
    FROM data_versions 
    WHERE table_name = 'demandes_modification' AND record_id = v_demande_id::TEXT AND operation_type = 'UPDATE';
    
    RAISE NOTICE 'UPDATE demande: % versions créées', v_version_count;
    
    -- Suppression
    DELETE FROM demandes_modification WHERE id = v_demande_id;
    
    -- Vérifier version DELETE
    SELECT COUNT(*) INTO v_version_count
    FROM data_versions 
    WHERE table_name = 'demandes_modification' AND record_id = v_demande_id::TEXT AND operation_type = 'DELETE';
    
    RAISE NOTICE 'DELETE demande: % versions créées', v_version_count;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erreur test demandes: %', SQLERRM;
END $$;

-- ===== TEST 3: SURVEILLANTS =====
DO $$
DECLARE
    v_surveillant_id UUID;
    v_version_count INTEGER;
BEGIN
    RAISE NOTICE '=== TEST SURVEILLANTS ===';
    
    -- Insertion
    INSERT INTO surveillants (nom, prenom, email, telephone, faculte)
    VALUES ('Test', 'Surveillant', 'test@test.com', '0123456789', 'TEST')
    RETURNING id INTO v_surveillant_id;
    
    -- Vérifier version INSERT
    SELECT COUNT(*) INTO v_version_count
    FROM data_versions 
    WHERE table_name = 'surveillants' AND record_id = v_surveillant_id::TEXT AND operation_type = 'INSERT';
    
    RAISE NOTICE 'INSERT surveillant: % versions créées', v_version_count;
    
    -- Modification
    UPDATE surveillants 
    SET telephone = '0987654321', email = 'test.modifie@test.com'
    WHERE id = v_surveillant_id;
    
    -- Vérifier version UPDATE
    SELECT COUNT(*) INTO v_version_count
    FROM data_versions 
    WHERE table_name = 'surveillants' AND record_id = v_surveillant_id::TEXT AND operation_type = 'UPDATE';
    
    RAISE NOTICE 'UPDATE surveillant: % versions créées', v_version_count;
    
    -- Suppression
    DELETE FROM surveillants WHERE id = v_surveillant_id;
    
    -- Vérifier version DELETE
    SELECT COUNT(*) INTO v_version_count
    FROM data_versions 
    WHERE table_name = 'surveillants' AND record_id = v_surveillant_id::TEXT AND operation_type = 'DELETE';
    
    RAISE NOTICE 'DELETE surveillant: % versions créées', v_version_count;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erreur test surveillants: %', SQLERRM;
END $$;

-- ===== RÉSUMÉ DES TESTS =====
SELECT 'RÉSUMÉ DES TESTS' as section;

-- Compter toutes les versions de test créées
SELECT 
    'Versions de test créées' as test_result,
    table_name,
    operation_type,
    COUNT(*) as count,
    string_agg(DISTINCT username, ', ') as users
FROM data_versions 
WHERE record_id LIKE 'test_%' OR created_at >= NOW() - INTERVAL '5 minutes'
GROUP BY table_name, operation_type
ORDER BY table_name, operation_type;

-- Vérifier les champs capturés
SELECT 
    'Détail des versions récentes' as test_result,
    table_name,
    operation_type,
    username,
    reason,
    array_length(changed_fields, 1) as fields_changed,
    created_at
FROM data_versions 
WHERE created_at >= NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC
LIMIT 10;

-- ===== NETTOYAGE =====
-- Supprimer les données de test
DELETE FROM data_versions WHERE record_id LIKE 'test_%' OR created_at >= NOW() - INTERVAL '5 minutes';
DELETE FROM version_snapshots WHERE record_id LIKE 'test_%' OR created_at >= NOW() - INTERVAL '5 minutes';

SELECT 'Tests terminés et nettoyés' as final_message;