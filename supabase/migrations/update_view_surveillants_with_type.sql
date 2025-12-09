-- Migration: Mise à jour de la vue pour inclure le type de surveillant dans les noms
-- Date: 2024-12-09
-- Description: Ajoute "(Jobiste)" après le nom des jobistes dans le planning

-- Supprimer l'ancienne vue si elle existe
DROP VIEW IF EXISTS v_examen_auditoires_with_surveillants;

-- Créer la vue améliorée avec le type de surveillant
CREATE OR REPLACE VIEW v_examen_auditoires_with_surveillants AS
SELECT 
  ea.id,
  ea.examen_id,
  ea.auditoire,
  ea.nb_surveillants_requis,
  ea.surveillants,
  ea.surveillants_remplaces,
  ea.remarques,
  -- Construire un tableau de noms avec le type pour les jobistes
  ARRAY(
    SELECT 
      CASE 
        WHEN s.type = 'jobiste' THEN s.prenom || ' ' || s.nom || ' (Jobiste)'
        ELSE s.prenom || ' ' || s.nom
      END
    FROM unnest(ea.surveillants) AS surv_id
    LEFT JOIN surveillants s ON s.id = surv_id::uuid
    WHERE s.id IS NOT NULL
    ORDER BY s.nom, s.prenom
  ) AS surveillants_noms
FROM examen_auditoires ea;

-- Ajouter un commentaire
COMMENT ON VIEW v_examen_auditoires_with_surveillants IS 
'Vue qui joint les auditoires d''examen avec les noms des surveillants. Les jobistes sont identifiés par "(Jobiste)" après leur nom.';

-- Accorder les permissions de lecture
GRANT SELECT ON v_examen_auditoires_with_surveillants TO anon, authenticated;
