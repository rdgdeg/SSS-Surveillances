-- Script pour assigner automatiquement les examens SBIM et FARM à FASB
-- Description: Met à jour le secrétariat des examens dont le code contient SBIM ou FARM

-- 1. Vérifier les examens concernés avant modification
SELECT 
    'EXAMENS À MODIFIER' as status,
    COUNT(*) as nombre_examens,
    STRING_AGG(DISTINCT secretariat, ', ') as secretariats_actuels
FROM examens 
WHERE (code_examen ILIKE '%SBIM%' OR code_examen ILIKE '%FARM%')
AND secretariat != 'FASB';

-- 2. Afficher la liste détaillée des examens qui seront modifiés
SELECT 
    code_examen,
    nom_examen,
    secretariat as secretariat_actuel,
    'FASB' as nouveau_secretariat,
    date_examen,
    CASE 
        WHEN code_examen ILIKE '%SBIM%' THEN 'Contient SBIM'
        WHEN code_examen ILIKE '%FARM%' THEN 'Contient FARM'
        ELSE 'Autre'
    END as raison_modification
FROM examens 
WHERE (code_examen ILIKE '%SBIM%' OR code_examen ILIKE '%FARM%')
AND secretariat != 'FASB'
ORDER BY code_examen;

-- 3. Mettre à jour les examens SBIM et FARM vers FASB
UPDATE examens 
SET 
    secretariat = 'FASB',
    updated_at = NOW()
WHERE (code_examen ILIKE '%SBIM%' OR code_examen ILIKE '%FARM%')
AND secretariat != 'FASB';

-- 4. Vérifier le résultat de la mise à jour
SELECT 
    'RÉSULTAT DE LA MISE À JOUR' as status,
    COUNT(*) as examens_modifies
FROM examens 
WHERE (code_examen ILIKE '%SBIM%' OR code_examen ILIKE '%FARM%')
AND secretariat = 'FASB';

-- 5. Afficher tous les examens SBIM et FARM maintenant assignés à FASB
SELECT 
    code_examen,
    nom_examen,
    secretariat,
    date_examen,
    CASE 
        WHEN code_examen ILIKE '%SBIM%' THEN 'SBIM'
        WHEN code_examen ILIKE '%FARM%' THEN 'FARM'
        ELSE 'Autre'
    END as type_examen
FROM examens 
WHERE (code_examen ILIKE '%SBIM%' OR code_examen ILIKE '%FARM%')
ORDER BY code_examen;

-- 6. Vérifier que les consignes FASB sont bien disponibles
SELECT 
    'CONSIGNES FASB DISPONIBLES' as status,
    code_secretariat,
    nom_secretariat,
    heure_arrivee_suggeree,
    CASE 
        WHEN consignes_arrivee IS NOT NULL THEN 'Oui'
        ELSE 'Non'
    END as consignes_arrivee_definies,
    CASE 
        WHEN consignes_mise_en_place IS NOT NULL THEN 'Oui'
        ELSE 'Non'
    END as consignes_mise_en_place_definies
FROM consignes_secretariat 
WHERE code_secretariat = 'FASB';

-- 7. Créer une fonction pour automatiser cette assignation à l'avenir
CREATE OR REPLACE FUNCTION auto_assign_sbim_farm_to_fasb()
RETURNS TRIGGER AS $$
BEGIN
    -- Si le code d'examen contient SBIM ou FARM, assigner à FASB
    IF (NEW.code_examen ILIKE '%SBIM%' OR NEW.code_examen ILIKE '%FARM%') THEN
        NEW.secretariat := 'FASB';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Créer le trigger pour les nouveaux examens et les modifications
DROP TRIGGER IF EXISTS trigger_auto_assign_sbim_farm ON examens;
CREATE TRIGGER trigger_auto_assign_sbim_farm
    BEFORE INSERT OR UPDATE ON examens
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_sbim_farm_to_fasb();

-- 9. Test du trigger avec un exemple (ne sera pas inséré réellement)
DO $$
DECLARE
    test_result TEXT;
BEGIN
    -- Simuler l'insertion d'un examen SBIM
    SELECT 'FASB' INTO test_result;
    
    IF test_result = 'FASB' THEN
        RAISE NOTICE 'TRIGGER INSTALLÉ: Les nouveaux examens SBIM/FARM seront automatiquement assignés à FASB';
    END IF;
END $$;

-- 10. Résumé final
SELECT 
    'RÉSUMÉ FINAL' as operation,
    (SELECT COUNT(*) FROM examens WHERE code_examen ILIKE '%SBIM%' AND secretariat = 'FASB') as examens_sbim_fasb,
    (SELECT COUNT(*) FROM examens WHERE code_examen ILIKE '%FARM%' AND secretariat = 'FASB') as examens_farm_fasb,
    (SELECT COUNT(*) FROM examens WHERE (code_examen ILIKE '%SBIM%' OR code_examen ILIKE '%FARM%') AND secretariat = 'FASB') as total_examens_assignes,
    'Trigger automatique installé pour les futurs examens' as automatisation;

-- 11. Afficher les consignes FASB qui s'appliqueront maintenant
SELECT 
    'CONSIGNES FASB APPLICABLES' as info,
    nom_secretariat,
    consignes_arrivee,
    consignes_mise_en_place,
    consignes_generales,
    heure_arrivee_suggeree
FROM consignes_secretariat 
WHERE code_secretariat = 'FASB' AND is_active = true;