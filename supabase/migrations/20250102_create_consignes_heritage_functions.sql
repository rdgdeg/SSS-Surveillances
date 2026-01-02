-- Migration: Créer les fonctions pour le système d'héritage des consignes
-- Date: 2025-01-02
-- Description: Crée les fonctions nécessaires au système d'héritage des consignes

-- Fonction pour obtenir les consignes effectives d'un examen
CREATE OR REPLACE FUNCTION get_consignes_examen(p_examen_id UUID)
RETURNS TABLE (
    consignes_arrivee TEXT,
    consignes_mise_en_place TEXT,
    consignes_generales TEXT,
    heure_arrivee_suggeree VARCHAR(10),
    source_consignes TEXT -- 'secretariat' ou 'specifique'
) AS $function$
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
        END::TEXT as source_consignes
    FROM examens_with_consignes ewc
    WHERE ewc.id = p_examen_id;
END;
$function$ LANGUAGE plpgsql;

-- Fonction pour initialiser les consignes spécifiques d'un examen
CREATE OR REPLACE FUNCTION initialiser_consignes_specifiques(p_examen_id UUID)
RETURNS BOOLEAN AS $function$
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
$function$ LANGUAGE plpgsql;

-- Fonction pour revenir aux consignes du secrétariat
CREATE OR REPLACE FUNCTION utiliser_consignes_secretariat(p_examen_id UUID)
RETURNS BOOLEAN AS $function$
BEGIN
    UPDATE examens 
    SET 
        utiliser_consignes_specifiques = false,
        updated_at = NOW()
    WHERE id = p_examen_id;
    
    RETURN FOUND;
END;
$function$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour les consignes spécifiques
CREATE OR REPLACE FUNCTION update_consignes_specifiques(
    p_examen_id UUID,
    p_consignes_arrivee TEXT DEFAULT NULL,
    p_consignes_mise_en_place TEXT DEFAULT NULL,
    p_consignes_generales TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $function$
BEGIN
    UPDATE examens 
    SET 
        consignes_specifiques_arrivee = COALESCE(p_consignes_arrivee, consignes_specifiques_arrivee),
        consignes_specifiques_mise_en_place = COALESCE(p_consignes_mise_en_place, consignes_specifiques_mise_en_place),
        consignes_specifiques_generales = COALESCE(p_consignes_generales, consignes_specifiques_generales),
        utiliser_consignes_specifiques = true,
        updated_at = NOW()
    WHERE id = p_examen_id;
    
    RETURN FOUND;
END;
$function$ LANGUAGE plpgsql;

-- Commentaires pour documenter les fonctions
COMMENT ON FUNCTION get_consignes_examen(UUID) IS 'Retourne les consignes effectives d''un examen (spécifiques ou héritées du secrétariat)';
COMMENT ON FUNCTION initialiser_consignes_specifiques(UUID) IS 'Initialise les consignes spécifiques d''un examen avec celles du secrétariat';
COMMENT ON FUNCTION utiliser_consignes_secretariat(UUID) IS 'Configure un examen pour utiliser les consignes du secrétariat';
COMMENT ON FUNCTION update_consignes_specifiques(UUID, TEXT, TEXT, TEXT) IS 'Met à jour les consignes spécifiques d''un examen';