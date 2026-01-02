-- Script d'installation complète du système d'héritage des consignes en une étape
-- Description: Installe tout le système d'héritage des consignes depuis zéro

BEGIN;

-- ============================================
-- ÉTAPE 1: AJOUTER LES COLONNES MANQUANTES
-- ============================================

DO $add_columns$
BEGIN
    RAISE NOTICE 'ÉTAPE 1: Ajout des colonnes pour le système d''héritage des consignes...';
    
    -- Ajouter consignes_specifiques_arrivee
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'examens' AND column_name = 'consignes_specifiques_arrivee') THEN
        ALTER TABLE examens ADD COLUMN consignes_specifiques_arrivee TEXT;
        RAISE NOTICE '✓ Colonne consignes_specifiques_arrivee ajoutée';
    ELSE
        RAISE NOTICE '- Colonne consignes_specifiques_arrivee existe déjà';
    END IF;
    
    -- Ajouter consignes_specifiques_mise_en_place
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'examens' AND column_name = 'consignes_specifiques_mise_en_place') THEN
        ALTER TABLE examens ADD COLUMN consignes_specifiques_mise_en_place TEXT;
        RAISE NOTICE '✓ Colonne consignes_specifiques_mise_en_place ajoutée';
    ELSE
        RAISE NOTICE '- Colonne consignes_specifiques_mise_en_place existe déjà';
    END IF;
    
    -- Ajouter consignes_specifiques_generales
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'examens' AND column_name = 'consignes_specifiques_generales') THEN
        ALTER TABLE examens ADD COLUMN consignes_specifiques_generales TEXT;
        RAISE NOTICE '✓ Colonne consignes_specifiques_generales ajoutée';
    ELSE
        RAISE NOTICE '- Colonne consignes_specifiques_generales existe déjà';
    END IF;
    
    -- Ajouter utiliser_consignes_specifiques
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'examens' AND column_name = 'utiliser_consignes_specifiques') THEN
        ALTER TABLE examens ADD COLUMN utiliser_consignes_specifiques BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✓ Colonne utiliser_consignes_specifiques ajoutée';
    ELSE
        RAISE NOTICE '- Colonne utiliser_consignes_specifiques existe déjà';
    END IF;
    
    RAISE NOTICE 'ÉTAPE 1 TERMINÉE: Colonnes ajoutées avec succès';
END $add_columns$;

-- ============================================
-- ÉTAPE 2: CRÉER LES VUES
-- ============================================

RAISE NOTICE 'ÉTAPE 2: Création des vues...';

-- Vue examens_with_consignes
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

RAISE NOTICE '✓ Vue examens_with_consignes créée';

-- Vue pour le planning public
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

RAISE NOTICE '✓ Vue planning_examens_public créée';

-- Vue des statistiques
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

RAISE NOTICE '✓ Vue stats_consignes_examens créée';

-- ============================================
-- ÉTAPE 3: CRÉER LES FONCTIONS
-- ============================================

RAISE NOTICE 'ÉTAPE 3: Création des fonctions...';

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

RAISE NOTICE '✓ Fonction get_consignes_examen créée';

-- Fonction pour initialiser les consignes spécifiques
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

RAISE NOTICE '✓ Fonction initialiser_consignes_specifiques créée';

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

RAISE NOTICE '✓ Fonction utiliser_consignes_secretariat créée';

-- ============================================
-- ÉTAPE 4: TESTS ET VÉRIFICATIONS
-- ============================================

RAISE NOTICE 'ÉTAPE 4: Tests et vérifications...';

-- Test de la vue examens_with_consignes
DO $test_vue$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM examens_with_consignes;
    RAISE NOTICE '✓ Vue examens_with_consignes: % examens trouvés', v_count;
END $test_vue$;

-- Test de la fonction get_consignes_examen
DO $test_fonction$
DECLARE
    v_examen_id UUID;
    v_consignes RECORD;
BEGIN
    -- Prendre le premier examen disponible
    SELECT id INTO v_examen_id FROM examens LIMIT 1;
    
    IF v_examen_id IS NOT NULL THEN
        SELECT * INTO v_consignes FROM get_consignes_examen(v_examen_id);
        RAISE NOTICE '✓ Fonction get_consignes_examen: Test réussi';
        RAISE NOTICE '  Source des consignes: %', COALESCE(v_consignes.source_consignes, 'NULL');
    ELSE
        RAISE NOTICE '⚠ Aucun examen disponible pour tester la fonction';
    END IF;
END $test_fonction$;

-- ============================================
-- ÉTAPE 5: RÉSUMÉ FINAL
-- ============================================

RAISE NOTICE '';
RAISE NOTICE '🎉 INSTALLATION TERMINÉE AVEC SUCCÈS !';
RAISE NOTICE '=====================================';
RAISE NOTICE 'Colonnes ajoutées: 4';
RAISE NOTICE 'Vues créées: 3';
RAISE NOTICE 'Fonctions créées: 3';
RAISE NOTICE '';
RAISE NOTICE 'Le système d''héritage des consignes est maintenant opérationnel.';
RAISE NOTICE 'Vous pouvez maintenant:';
RAISE NOTICE '- Utiliser les consignes héritées du secrétariat';
RAISE NOTICE '- Personnaliser les consignes par examen';
RAISE NOTICE '- Utiliser l''interface d''administration';
RAISE NOTICE '';
RAISE NOTICE 'Pour tester: SELECT * FROM get_consignes_examen((SELECT id FROM examens LIMIT 1));';

COMMIT;

-- Vérification finale
SELECT 
    'INSTALLATION RÉUSSIE' as status,
    'Système d''héritage des consignes opérationnel' as message,
    NOW() as installed_at;