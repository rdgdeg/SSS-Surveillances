-- Migration: Créer une vue pour les statistiques de capacité des créneaux
-- Cette vue calcule automatiquement le nombre de surveillants disponibles par créneau
-- Optimisée pour les performances avec les requêtes admin

-- Supprimer la vue si elle existe déjà
DROP VIEW IF EXISTS v_creneaux_with_stats;

-- Créer la vue avec les statistiques de capacité
CREATE OR REPLACE VIEW v_creneaux_with_stats AS
SELECT 
  c.id,
  c.session_id,
  c.examen_id,
  c.date_surveillance,
  c.heure_debut_surveillance,
  c.heure_fin_surveillance,
  c.type_creneau,
  c.nb_surveillants_requis,
  c.created_at,
  -- Compter le nombre de surveillants disponibles pour ce créneau
  COUNT(DISTINCT CASE 
    WHEN jsonb_typeof(sd.historique_disponibilites) = 'array' THEN
      CASE 
        WHEN EXISTS (
          SELECT 1 
          FROM jsonb_array_elements(sd.historique_disponibilites) AS disp
          WHERE (disp->>'creneau_id')::text = c.id::text 
            AND (disp->>'est_disponible')::boolean = true
        ) THEN sd.id
        ELSE NULL
      END
    ELSE NULL
  END) as nb_disponibles,
  -- Calculer le taux de remplissage (pourcentage)
  CASE 
    WHEN c.nb_surveillants_requis IS NULL OR c.nb_surveillants_requis = 0 THEN NULL
    ELSE ROUND(
      (COUNT(DISTINCT CASE 
        WHEN jsonb_typeof(sd.historique_disponibilites) = 'array' THEN
          CASE 
            WHEN EXISTS (
              SELECT 1 
              FROM jsonb_array_elements(sd.historique_disponibilites) AS disp
              WHERE (disp->>'creneau_id')::text = c.id::text 
                AND (disp->>'est_disponible')::boolean = true
            ) THEN sd.id
            ELSE NULL
          END
        ELSE NULL
      END)::NUMERIC / c.nb_surveillants_requis::NUMERIC * 100), 
      1
    )
  END as taux_remplissage
FROM creneaux c
LEFT JOIN soumissions_disponibilites sd ON sd.session_id = c.session_id
GROUP BY 
  c.id, 
  c.session_id, 
  c.examen_id, 
  c.date_surveillance, 
  c.heure_debut_surveillance, 
  c.heure_fin_surveillance, 
  c.type_creneau, 
  c.nb_surveillants_requis, 
  c.created_at;

-- Ajouter un commentaire pour documenter la vue
COMMENT ON VIEW v_creneaux_with_stats IS 
'Vue optimisée pour l''interface admin affichant les créneaux avec leurs statistiques de capacité : nombre de disponibles et taux de remplissage.';

-- Créer un index sur la table soumissions_disponibilites pour optimiser les jointures
-- (si pas déjà existant)
CREATE INDEX IF NOT EXISTS idx_soumissions_session_id 
ON soumissions_disponibilites(session_id);
