-- Migration: Augmenter la limite de capacité de 20 à 100 surveillants
-- Date: 2025-11-30
-- Description: Permet de définir jusqu'à 100 surveillants requis par créneau

-- Supprimer l'ancienne contrainte
ALTER TABLE creneaux 
DROP CONSTRAINT IF EXISTS check_nb_surveillants_requis;

-- Ajouter la nouvelle contrainte avec limite à 100
ALTER TABLE creneaux 
ADD CONSTRAINT check_nb_surveillants_requis 
CHECK (nb_surveillants_requis IS NULL OR (nb_surveillants_requis >= 1 AND nb_surveillants_requis <= 100));

-- Commentaire pour documenter le changement
COMMENT ON CONSTRAINT check_nb_surveillants_requis ON creneaux IS 
'Limite le nombre de surveillants requis entre 1 et 100 (augmenté de 20 à 100 le 2025-11-30)';
