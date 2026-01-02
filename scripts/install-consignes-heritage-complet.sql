-- Script d'installation complète du système d'héritage des consignes
-- Description: Installe toutes les fonctions et vues nécessaires pour l'héritage des consignes

-- 1. Vérifier si les colonnes existent dans la table examens
DO $check_columns$
BEGIN
    -- Ajouter les colonnes si elles n'existent pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'examens' AND column_name = 'consignes_specifiques_arrivee') THEN
        ALTER TABLE examens ADD COLUMN consignes_specifiques_arrivee TEXT;
        RAISE NOTICE 'Colonne consignes_specifiques_arrivee ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'examens' AND column_name = 'consignes_specifiques_mise_en_place') THEN
        ALTER TABLE examens ADD COLUMN consignes_specifiques_mise_en_place TEXT;
        RAISE NOTICE 'Colonne consignes_specifiques_mise_en_place ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'examens' AND column_name = 'consignes_specifiques_generales') THEN
        ALTER TABLE examens ADD COLUMN consignes_specifiques_generales TEXT;
        RAISE NOTICE 'Colonne consignes_specifiques_generales ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'examens' AND column_name = 'utiliser_consignes_specifiques') THEN
        ALTER TABLE examens ADD COLUMN utiliser_consignes_specifiques BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Colonne utiliser_consignes_specifiques ajoutée';
    END IF;
END $check_columns$;

-- 2. Créer la vue examens_with_consignes
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

-- 3. Créer la fonction get_consignes_examen
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

-- 4. Créer la fonction pour initialiser les consignes spécifiques
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

-- 5. Créer la fonction pour revenir aux consignes du secrétariat
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

-- 6. Créer la vue pour le planning public
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

-- 7. Créer la vue des statistiques
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

-- 8. Vérifier l'installation
SELECT 'INSTALLATION TERMINÉE' as status;

-- Test de la vue examens_with_consignes
SELECT 
    'Test vue examens_with_consignes' as test,
    COUNT(*) as examens_avec_consignes
FROM examens_with_consignes
LIMIT 1;

-- Test de la fonction get_consignes_examen
DO $test$
DECLARE
    v_examen_id UUID;
    v_consignes RECORD;
BEGIN
    -- Prendre le premier examen disponible
    SELECT id INTO v_examen_id FROM examens LIMIT 1;
    
    IF v_examen_id IS NOT NULL THEN
        SELECT * INTO v_consignes FROM get_consignes_examen(v_examen_id);
        RAISE NOTICE 'Test fonction get_consignes_examen: OK';
        RAISE NOTICE 'Source des consignes: %', COALESCE(v_consignes.source_consignes, 'NULL');
    ELSE
        RAISE NOTICE 'Aucun examen disponible pour le test';
    END IF;
END $test$;

-- 9. Résumé final
SELECT 
    'SYSTÈME D''HÉRITAGE INSTALLÉ' as operation,
    'Vue examens_with_consignes créée' as vue_principale,
    'Fonction get_consignes_examen créée' as fonction_principale,
    'Fonctions d''initialisation et gestion créées' as fonctions_utilitaires,
    'Vues planning et statistiques créées' as vues_supplementaires;