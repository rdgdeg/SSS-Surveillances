-- Script pour configurer les secrétariats SANS écraser les consignes générales existantes
-- Description: Met à jour les secrétariats en préservant les vraies consignes générales

-- 1. Vérifier les consignes générales actuelles
SELECT 
    'CONSIGNES GÉNÉRALES ACTUELLES' as section,
    code_secretariat,
    nom_secretariat,
    CASE 
        WHEN consignes_generales IS NULL OR consignes_generales = '' 
        THEN '[Aucune consigne générale définie]'
        ELSE consignes_generales
    END as consignes_generales_actuelles
FROM consignes_secretariat 
ORDER BY code_secretariat;

-- 2. Insérer ou mettre à jour SANS écraser les consignes générales
INSERT INTO consignes_secretariat (
    code_secretariat, 
    nom_secretariat, 
    consignes_arrivee, 
    consignes_mise_en_place,
    heure_arrivee_suggeree,
    is_active
) VALUES
    ('BAC11', 'BAC 11', 
     'Veuillez vous présenter à l''accueil du BAC 11.', 
     'Suivez les instructions du responsable de surveillance.',
     '08:15', true),
    
    ('DENT', 'Faculté de Médecine Dentaire', 
     'Veuillez vous présenter à l''accueil de la Faculté de Médecine Dentaire.', 
     'Vérifiez l''installation des postes et le matériel spécialisé.',
     '08:15', true),
    
    ('FASB', 'Faculté de Pharmacie et Sciences Biomédicales', 
     'Veuillez vous présenter à l''accueil de la Faculté de Pharmacie et Sciences Biomédicales.', 
     'Contrôlez les équipements de laboratoire et les consignes de sécurité.',
     '08:15', true),
    
    ('FSP', 'Faculté de Santé Publique', 
     'Veuillez vous présenter à l''accueil de la Faculté de Santé Publique.', 
     'Vérifiez la configuration des salles et l''accès aux ressources.',
     '08:15', true),
    
    ('MED', 'Faculté de Médecine', 
     'Veuillez vous présenter à l''accueil de la Faculté de Médecine.', 
     'Contrôlez l''accès aux salles et le matériel médical si nécessaire.',
     '08:15', true)

ON CONFLICT (code_secretariat) DO UPDATE SET
    nom_secretariat = EXCLUDED.nom_secretariat,
    consignes_arrivee = COALESCE(EXCLUDED.consignes_arrivee, consignes_secretariat.consignes_arrivee),
    consignes_mise_en_place = COALESCE(EXCLUDED.consignes_mise_en_place, consignes_secretariat.consignes_mise_en_place),
    -- NE PAS TOUCHER aux consignes_generales existantes
    heure_arrivee_suggeree = COALESCE(EXCLUDED.heure_arrivee_suggeree, consignes_secretariat.heure_arrivee_suggeree),
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- 3. Vérifier les consignes après mise à jour
SELECT 
    'CONSIGNES APRÈS MISE À JOUR' as section,
    code_secretariat,
    nom_secretariat,
    CASE 
        WHEN consignes_generales IS NULL OR consignes_generales = '' 
        THEN '[Aucune consigne générale - héritage par défaut]'
        ELSE consignes_generales
    END as consignes_generales_preservees
FROM consignes_secretariat 
ORDER BY code_secretariat;

-- 4. Tester l'héritage des consignes pour quelques examens
DO $test_heritage$
DECLARE
    v_examen RECORD;
    v_consignes RECORD;
    v_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'TEST D''HÉRITAGE DES CONSIGNES:';
    RAISE NOTICE '=====================================';
    
    FOR v_examen IN 
        SELECT id, code_examen, secretariat 
        FROM examens 
        WHERE secretariat IS NOT NULL 
        LIMIT 5
    LOOP
        v_count := v_count + 1;
        
        -- Tester la fonction d'héritage
        SELECT * INTO v_consignes FROM get_consignes_examen(v_examen.id);
        
        RAISE NOTICE 'Examen %: % (secrétariat: %)', 
            v_count, v_examen.code_examen, COALESCE(v_examen.secretariat, 'Non défini');
        RAISE NOTICE '  Consignes générales: %', 
            COALESCE(v_consignes.consignes_generales, '[Aucune]');
        RAISE NOTICE '  Source: %', v_consignes.source_consignes;
        RAISE NOTICE '';
    END LOOP;
    
    IF v_count = 0 THEN
        RAISE NOTICE 'Aucun examen avec secrétariat trouvé pour tester l''héritage';
    END IF;
END $test_heritage$;

-- 5. Statistiques sur les consignes générales
SELECT 
    'STATISTIQUES CONSIGNES GÉNÉRALES' as section,
    COUNT(*) as total_secretariats,
    COUNT(CASE WHEN consignes_generales IS NOT NULL AND consignes_generales != '' THEN 1 END) as avec_consignes_generales,
    COUNT(CASE WHEN consignes_generales IS NULL OR consignes_generales = '' THEN 1 END) as sans_consignes_generales,
    ROUND(
        COUNT(CASE WHEN consignes_generales IS NOT NULL AND consignes_generales != '' THEN 1 END) * 100.0 / COUNT(*), 
        1
    ) as pourcentage_avec_consignes
FROM consignes_secretariat;

-- 6. Résumé final
SELECT 
    'RÉSUMÉ' as operation,
    'Secrétariats mis à jour sans écraser les consignes générales' as action,
    'Les consignes générales existantes ont été préservées' as resultat,
    'Les examens utiliseront l''héritage automatique' as fonctionnement;