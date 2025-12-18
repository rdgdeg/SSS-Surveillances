-- Ajouter un champ pour gérer le mode d'attribution des surveillants
-- Soit par auditoire spécifique, soit par le secrétariat

ALTER TABLE examen_auditoires 
ADD COLUMN IF NOT EXISTS mode_attribution VARCHAR(20) DEFAULT 'auditoire' 
CHECK (mode_attribution IN ('auditoire', 'secretariat'));

-- Ajouter un commentaire pour expliquer le champ
COMMENT ON COLUMN examen_auditoires.mode_attribution IS 
'Mode d''attribution des surveillants: "auditoire" = attribution directe à un auditoire, "secretariat" = surveillants sélectionnés mais auditoires attribués par le secrétariat';

-- Pour les examens où on veut juste sélectionner des surveillants sans auditoire spécifique,
-- on peut créer une entrée spéciale avec un nom d'auditoire générique
-- et mode_attribution = 'secretariat'