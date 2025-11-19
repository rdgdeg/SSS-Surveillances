-- Ajout des champs pour la durée de l'examen dans presences_enseignants

-- Ajouter les champs de durée d'examen
ALTER TABLE presences_enseignants 
ADD COLUMN IF NOT EXISTS duree_examen_moins_2h BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS duree_examen_minutes INTEGER DEFAULT 120;

-- Ajouter une contrainte pour s'assurer que la durée est raisonnable
ALTER TABLE presences_enseignants
ADD CONSTRAINT check_duree_examen_minutes 
CHECK (duree_examen_minutes >= 15 AND duree_examen_minutes <= 240);

-- Commentaires pour la documentation
COMMENT ON COLUMN presences_enseignants.duree_examen_moins_2h IS 'Indique si l''examen dure moins de 2 heures';
COMMENT ON COLUMN presences_enseignants.duree_examen_minutes IS 'Durée de l''examen en minutes (par défaut 120 = 2h)';
