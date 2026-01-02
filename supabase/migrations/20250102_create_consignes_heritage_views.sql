-- Migration: Créer les vues pour le système d'héritage des consignes
-- Date: 2025-01-02
-- Description: Crée les vues nécessaires au système d'héritage des consignes

-- Vue principale: examens avec consignes effectives
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

-- Commentaires pour documenter les vues
COMMENT ON VIEW examens_with_consignes IS 'Vue principale combinant examens et consignes effectives (spécifiques ou héritées du secrétariat)';
COMMENT ON VIEW planning_examens_public IS 'Vue pour l''affichage public du planning avec consignes effectives';
COMMENT ON VIEW stats_consignes_examens IS 'Vue des statistiques d''utilisation des consignes par secrétariat';