-- Script pour configurer tous les secrétariats avec leurs consignes complètes
-- Description: S'assurer que tous les secrétariats (BAC11, DENT, FASB, FSP, MED) sont configurés

-- 1. Vérifier les secrétariats existants
SELECT 
    'SECRÉTARIATS EXISTANTS' as status,
    code_secretariat,
    nom_secretariat,
    is_active
FROM consignes_secretariat 
ORDER BY code_secretariat;

-- 2. Insérer ou mettre à jour tous les secrétariats requis (SANS consignes générales fixes)
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
    -- NE PAS écraser les consignes_generales existantes
    heure_arrivee_suggeree = COALESCE(EXCLUDED.heure_arrivee_suggeree, consignes_secretariat.heure_arrivee_suggeree),
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- 3. Vérifier que tous les secrétariats sont maintenant présents
SELECT 
    'SECRÉTARIATS CONFIGURÉS' as status,
    code_secretariat,
    nom_secretariat,
    heure_arrivee_suggeree,
    CASE 
        WHEN consignes_arrivee IS NOT NULL THEN 'Oui'
        ELSE 'Non'
    END as consignes_arrivee_definies,
    is_active
FROM consignes_secretariat 
WHERE code_secretariat IN ('BAC11', 'DENT', 'FASB', 'FSP', 'MED')
ORDER BY code_secretariat;

-- 4. Créer une fonction pour obtenir la liste des secrétariats actifs
CREATE OR REPLACE FUNCTION get_secretariats_actifs()
RETURNS TABLE (
    code_secretariat VARCHAR(50),
    nom_secretariat VARCHAR(200)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.code_secretariat,
        cs.nom_secretariat
    FROM consignes_secretariat cs
    WHERE cs.is_active = true
    ORDER BY cs.code_secretariat;
END;
$$ LANGUAGE plpgsql;

-- 5. Tester la fonction
SELECT 
    'FONCTION SECRÉTARIATS ACTIFS' as test,
    code_secretariat,
    nom_secretariat
FROM get_secretariats_actifs();

-- 6. Mettre à jour le trigger pour une assignation intelligente
CREATE OR REPLACE FUNCTION auto_assign_secretariat_by_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Priorité 1: Si le code d'examen contient SBIM ou FARM, assigner à FASB
    IF (NEW.code_examen ILIKE '%SBIM%' OR NEW.code_examen ILIKE '%FARM%') THEN
        NEW.secretariat := 'FASB';
        RETURN NEW;
    END IF;
    
    -- Priorité 2: Si le secrétariat est déjà défini et valide, le conserver
    IF NEW.secretariat IS NOT NULL AND NEW.secretariat != '' AND 
       NEW.secretariat IN ('BAC11', 'DENT', 'FASB', 'FSP', 'MED') THEN
        RETURN NEW;
    END IF;
    
    -- Priorité 3: Assignation automatique basée sur le code d'examen
    IF NEW.code_examen ILIKE '%MED%' OR NEW.code_examen ILIKE '%MEDE%' THEN
        NEW.secretariat := 'MED';
    ELSIF NEW.code_examen ILIKE '%DENT%' THEN
        NEW.secretariat := 'DENT';
    ELSIF NEW.code_examen ILIKE '%FSP%' THEN
        NEW.secretariat := 'FSP';
    ELSIF NEW.code_examen ILIKE 'W%' AND LENGTH(NEW.code_examen) >= 8 THEN
        -- Pour les codes commençant par W (ex: WBAC1234), assigner à BAC11 par défaut
        IF NEW.secretariat IS NULL OR NEW.secretariat = '' THEN
            NEW.secretariat := 'BAC11';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Créer/recréer le trigger
DROP TRIGGER IF EXISTS trigger_auto_assign_secretariat ON examens;
CREATE TRIGGER trigger_auto_assign_secretariat
    BEFORE INSERT OR UPDATE ON examens
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_secretariat_by_code();

-- 8. Statistiques des examens par secrétariat
SELECT 
    'RÉPARTITION ACTUELLE DES EXAMENS' as info,
    COALESCE(secretariat, 'Non défini') as secretariat,
    COUNT(*) as nombre_examens,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as pourcentage
FROM examens
GROUP BY secretariat
ORDER BY COUNT(*) DESC;

-- 9. Examens sans secrétariat défini
SELECT 
    'EXAMENS SANS SECRÉTARIAT' as info,
    COUNT(*) as nombre,
    STRING_AGG(code_examen, ', ' ORDER BY code_examen) as codes_exemples
FROM examens 
WHERE secretariat IS NULL OR secretariat = '';

-- 10. Résumé final
SELECT 
    'CONFIGURATION TERMINÉE' as status,
    (SELECT COUNT(*) FROM consignes_secretariat WHERE is_active = true) as secretariats_actifs,
    (SELECT COUNT(*) FROM examens WHERE secretariat IN ('BAC11', 'DENT', 'FASB', 'FSP', 'MED')) as examens_avec_secretariat_valide,
    'Trigger automatique installé pour SBIM/FARM → FASB' as automatisation;