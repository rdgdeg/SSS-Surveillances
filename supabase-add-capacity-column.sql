-- Migration: Ajouter la colonne de capacité aux créneaux
-- Cette colonne permet de définir le nombre de surveillants requis par créneau
-- Visible uniquement dans l'interface admin

-- Ajouter la colonne nb_surveillants_requis
ALTER TABLE creneaux 
ADD COLUMN IF NOT EXISTS nb_surveillants_requis INTEGER;

-- Ajouter une contrainte pour valider la valeur (entre 1 et 20)
ALTER TABLE creneaux 
ADD CONSTRAINT check_nb_surveillants_requis 
CHECK (nb_surveillants_requis IS NULL OR (nb_surveillants_requis >= 1 AND nb_surveillants_requis <= 20));

-- Créer un index pour optimiser les requêtes de filtrage
CREATE INDEX IF NOT EXISTS idx_creneaux_nb_surveillants_requis 
ON creneaux(nb_surveillants_requis) 
WHERE nb_surveillants_requis IS NOT NULL;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN creneaux.nb_surveillants_requis IS 
'Nombre de surveillants requis pour ce créneau. Utilisé pour calculer le taux de remplissage. Visible uniquement dans l''interface admin.';
