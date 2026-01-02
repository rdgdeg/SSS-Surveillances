-- Script pour corriger les consignes générales avec les vraies valeurs
-- Description: Récupère les vraies consignes générales depuis la table consignes_secretariat

-- 1. Vérifier les consignes actuelles
SELECT 
    'CONSIGNES ACTUELLES' as section,
    code_secretariat,
    nom_secretariat,
    consignes_generales
FROM consignes_secretariat 
ORDER BY code_secretariat;

-- 2. Mettre à jour avec les vraies consignes générales (si elles existent)
-- Si les consignes générales sont vides, on peut les laisser NULL pour utiliser l'héritage

-- Vérifier s'il y a des consignes générales définies
DO $check_consignes$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count 
    FROM consignes_secretariat 
    WHERE consignes_generales IS NOT NULL AND consignes_generales != '';
    
    IF v_count > 0 THEN
        RAISE NOTICE 'Il y a % secrétariat(s) avec des consignes générales définies', v_count;
    ELSE
        RAISE NOTICE 'Aucune consigne générale définie dans la base de données';
        RAISE NOTICE 'Les examens utiliseront les consignes par défaut ou personnalisées';
    END IF;
END $check_consignes$;

-- 3. Si vous voulez définir des consignes générales par défaut, décommentez ci-dessous :
/*
UPDATE consignes_secretariat 
SET consignes_generales = CASE code_secretariat
    WHEN 'BAC11' THEN 'Consignes générales pour les examens BAC11.'
    WHEN 'DENT' THEN 'Respectez les protocoles d''hygiène et les équipements dentaires.'
    WHEN 'FASB' THEN 'Respectez les protocoles de sécurité des laboratoires.'
    WHEN 'FSP' THEN 'Suivez les consignes spécifiques aux examens de santé publique.'
    WHEN 'MED' THEN 'Respectez les consignes médicales et d''hygiène.'
    ELSE consignes_generales
END
WHERE code_secretariat IN ('BAC11', 'DENT', 'FASB', 'FSP', 'MED');
*/

-- 4. Vérifier le résultat
SELECT 
    'CONSIGNES APRÈS MISE À JOUR' as section,
    code_secretariat,
    nom_secretariat,
    CASE 
        WHEN consignes_generales IS NULL OR consignes_generales = '' 
        THEN '[Aucune consigne générale - héritage par défaut]'
        ELSE consignes_generales
    END as consignes_generales_effectives
FROM consignes_secretariat 
ORDER BY code_secretariat;

-- 5. Tester l'héritage des consignes pour un examen
DO $test_heritage$
DECLARE
    v_examen_id UUID;
    v_consignes RECORD;
BEGIN
    -- Prendre le premier examen disponible
    SELECT id INTO v_examen_id FROM examens LIMIT 1;
    
    IF v_examen_id IS NOT NULL THEN
        -- Tester la fonction d'héritage
        SELECT * INTO v_consignes FROM get_consignes_examen(v_examen_id);
        
        RAISE NOTICE 'Test héritage pour examen %:', v_examen_id;
        RAISE NOTICE 'Consignes générales effectives: %', COALESCE(v_consignes.consignes_generales, '[Aucune]');
        RAISE NOTICE 'Source: %', v_consignes.source_consignes;
    ELSE
        RAISE NOTICE 'Aucun examen disponible pour tester l''héritage';
    END IF;
END $test_heritage$;

-- 6. Résumé
SELECT 
    'RÉSUMÉ' as operation,
    'Vérifiez les consignes générales ci-dessus' as instruction,
    'Si elles sont vides, les examens utiliseront l''héritage par défaut' as note,
    'Vous pouvez les définir via l''interface admin ou décommenter la section UPDATE' as action;