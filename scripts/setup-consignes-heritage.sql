-- Script pour configurer l'héritage des consignes du secrétariat vers les examens
-- Description: Les examens héritent des consignes du secrétariat avec possibilité de personnalisation

-- 1. Créer une vue pour obtenir les consignes effectives d'un examen
CREATE OR REPLACE VIEW examens_with_consignes AS
SELECT 
    e.*,
    cs.nom_secretariat,
    cs.heure_arrivee_suggeree,
    -- Consignes effectives (spécifiques si définies, sinon celles du secrétariat)
    CASE 
        WHEN e.utiliser_consignes_specifiques = true AND e.consignes_specifiques_arrivee IS NOT NULL 
        THEN e.consignes_specifiques_arrivee
        ELSE cs.consignes_arrivee
    END as consignes_arrivee_effectives,
    
    CASE 
        WHEN e.utiliser_consignes_specifiques = true AND e.consignes_specifiques_mise_en_place IS NOT NULL 
        THEN e.consignes_specifiques_mise_en_place
        ELSE cs.consignes_mise_en_place
    END as consignes_mise_en_place_effectives,
    
    CASE 
        WHEN e.utiliser_consignes_specifiques = true AND e.consignes_specifiques_generales IS NOT NULL 
        THEN e.consignes_specifiques_generales
        ELSE cs.consignes_generales
    END as consignes_generales_effectives,
    
    -- Consignes du secrétariat (pour référence)
    cs.consignes_arrivee as consignes_secretariat_arrivee,
    cs.consignes_mise_en_place as consignes_secretariat_mise_en_place,
    cs.consignes_generales as consignes_secretariat_generales,
    
    -- Indicateurs de personnalisation
    CASE 
        WHEN e.utiliser_consignes_specifiques = true AND e.consignes_specifiques_arrivee IS NOT NULL 
        THEN true ELSE false
    END as consignes_arrivee_personnalisees,
    
    CASE 
        WHEN e.utiliser_consignes_specifiques = true AND e.consignes_specifiques_mise_en_place IS NOT NULL 
        THEN true ELSE false
    END as consignes_mise_en_place_personnalisees,
    
    CASE 
        WHEN e.utiliser_consignes_specifiques = true AND e.consignes_specifiques_generales IS NOT NULL 
        THEN true ELSE false
    END as consignes_generales_personnalisees

FROM examens e
LEFT JOIN consignes_secretariat cs ON e.secretariat = cs.code_secretariat
WHERE cs.is_active = true OR cs.is_active IS NULL;

-- 2. Fonction pour obtenir les consignes effectives d'un examen
CREATE OR REPLACE FUNCTION get_consignes_examen(p_examen_id UUID)
RETURNS TABLE (
    consignes_arrivee TEXT,
    consignes_mise_en_place TEXT,
    consignes_generales TEXT,
    heure_arrivee_suggeree VARCHAR(10),
    source_consignes TEXT -- 'secretariat' ou 'specifique'
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ewc.consignes_arrivee_effectives,
        ewc.consignes_mise_en_place_effectives,
        ewc.consignes_generales_effectives,
        ewc.heure_arrivee_suggeree,
        CASE 
            WHEN ewc.utiliser_consignes_specifiques = true THEN 'specifique'
            ELSE 'secretariat'
        END as source_consignes
    FROM examens_with_consignes ewc
    WHERE ewc.id = p_examen_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Fonction pour initialiser les consignes spécifiques avec celles du secrétariat
CREATE OR REPLACE FUNCTION initialiser_consignes_specifiques(p_examen_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_examen RECORD;
    v_consignes RECORD;
BEGIN
    -- Récupérer l'examen et ses consignes de secrétariat
    SELECT e.*, cs.consignes_arrivee, cs.consignes_mise_en_place, cs.consignes_generales
    INTO v_examen, v_consignes
    FROM examens e
    LEFT JOIN consignes_secretariat cs ON e.secretariat = cs.code_secretariat
    WHERE e.id = p_examen_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Initialiser les consignes spécifiques avec celles du secrétariat
    UPDATE examens 
    SET 
        consignes_specifiques_arrivee = COALESCE(consignes_specifiques_arrivee, v_consignes.consignes_arrivee),
        consignes_specifiques_mise_en_place = COALESCE(consignes_specifiques_mise_en_place, v_consignes.consignes_mise_en_place),
        consignes_specifiques_generales = COALESCE(consignes_specifiques_generales, v_consignes.consignes_generales),
        utiliser_consignes_specifiques = true,
        updated_at = NOW()
    WHERE id = p_examen_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 4. Fonction pour revenir aux consignes du secrétariat
CREATE OR REPLACE FUNCTION utiliser_consignes_secretariat(p_examen_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE examens 
    SET 
        utiliser_consignes_specifiques = false,
        updated_at = NOW()
    WHERE id = p_examen_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger pour mettre à jour automatiquement les consignes lors du changement de secrétariat
CREATE OR REPLACE FUNCTION update_consignes_on_secretariat_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Si le secrétariat change et qu'on n'utilise pas de consignes spécifiques
    IF OLD.secretariat != NEW.secretariat AND NEW.utiliser_consignes_specifiques = false THEN
        -- Les consignes seront automatiquement mises à jour via la vue
        NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_update_consignes_secretariat ON examens;
CREATE TRIGGER trigger_update_consignes_secretariat
    BEFORE UPDATE ON examens
    FOR EACH ROW
    EXECUTE FUNCTION update_consignes_on_secretariat_change();

-- 6. Vue pour le planning public avec consignes effectives
CREATE OR REPLACE VIEW planning_examens_public AS
SELECT 
    ewc.id,
    ewc.session_id,
    ewc.code_examen,
    ewc.nom_examen,
    ewc.date_examen,
    ewc.heure_debut,
    ewc.heure_fin,
    ewc.auditoires,
    ewc.secretariat,
    ewc.nom_secretariat,
    ewc.consignes_arrivee_effectives as consignes_arrivee,
    ewc.consignes_mise_en_place_effectives as consignes_mise_en_place,
    ewc.consignes_generales_effectives as consignes_generales,
    ewc.heure_arrivee_suggeree,
    ewc.consignes_arrivee_personnalisees,
    ewc.consignes_mise_en_place_personnalisees,
    ewc.consignes_generales_personnalisees
FROM examens_with_consignes ewc
WHERE ewc.valide = true
ORDER BY ewc.date_examen, ewc.heure_debut;

-- 7. Statistiques sur l'utilisation des consignes
CREATE OR REPLACE VIEW stats_consignes_examens AS
SELECT 
    secretariat,
    COUNT(*) as total_examens,
    COUNT(CASE WHEN utiliser_consignes_specifiques = true THEN 1 END) as examens_consignes_specifiques,
    COUNT(CASE WHEN utiliser_consignes_specifiques = false OR utiliser_consignes_specifiques IS NULL THEN 1 END) as examens_consignes_secretariat,
    ROUND(
        COUNT(CASE WHEN utiliser_consignes_specifiques = true THEN 1 END) * 100.0 / COUNT(*), 
        1
    ) as pourcentage_personnalises
FROM examens
WHERE secretariat IS NOT NULL
GROUP BY secretariat
ORDER BY secretariat;

-- 8. Tests et vérifications
SELECT 'SYSTÈME DE CONSIGNES CONFIGURÉ' as status;

-- Test de la vue examens_with_consignes
SELECT 
    'Test vue examens_with_consignes' as test,
    COUNT(*) as examens_avec_consignes
FROM examens_with_consignes
LIMIT 1;

-- Test de la fonction get_consignes_examen
DO $$
DECLARE
    v_examen_id UUID;
    v_consignes RECORD;
BEGIN
    -- Prendre le premier examen disponible
    SELECT id INTO v_examen_id FROM examens LIMIT 1;
    
    IF v_examen_id IS NOT NULL THEN
        SELECT * INTO v_consignes FROM get_consignes_examen(v_examen_id);
        RAISE NOTICE 'Test fonction get_consignes_examen: OK';
    END IF;
END $$;

-- Statistiques actuelles
SELECT 
    'STATISTIQUES CONSIGNES' as info,
    secretariat,
    total_examens,
    examens_consignes_secretariat,
    examens_consignes_specifiques,
    pourcentage_personnalises || '%' as pourcentage_personnalises
FROM stats_consignes_examens;

-- 9. Exemples d'utilisation
SELECT 
    'EXEMPLES D''UTILISATION' as section,
    'Voir les consignes effectives d''un examen:' as exemple1,
    'SELECT * FROM examens_with_consignes WHERE id = ''uuid-examen'';' as requete1,
    'Initialiser consignes spécifiques:' as exemple2,
    'SELECT initialiser_consignes_specifiques(''uuid-examen'');' as requete2,
    'Revenir aux consignes du secrétariat:' as exemple3,
    'SELECT utiliser_consignes_secretariat(''uuid-examen'');' as requete3;

-- 10. Résumé final
SELECT 
    'RÉSUMÉ FINAL' as operation,
    'Vue examens_with_consignes créée' as vue_principale,
    'Fonctions d''héritage et personnalisation installées' as fonctions,
    'Trigger de mise à jour automatique activé' as trigger_info,
    'Vue planning_examens_public pour affichage public' as vue_publique,
    'Statistiques disponibles dans stats_consignes_examens' as statistiques;