-- Ajouter un contrôle de visibilité du planning par session

ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS planning_visible BOOLEAN DEFAULT false;

-- Ajouter un commentaire pour expliquer le champ
COMMENT ON COLUMN sessions.planning_visible IS 
'Contrôle si le planning public est visible pour cette session. false = planning masqué, true = planning accessible';

-- Par défaut, rendre visible le planning pour la session active actuelle (si elle existe)
UPDATE sessions 
SET planning_visible = true 
WHERE is_active = true;