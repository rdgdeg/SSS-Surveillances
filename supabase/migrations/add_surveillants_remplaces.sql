-- Ajouter un champ pour stocker l'historique des remplacements
-- Structure: [{ "ancien_id": "uuid", "nouveau_id": "uuid", "date": "timestamp", "raison": "string" }]

ALTER TABLE examen_auditoires
ADD COLUMN IF NOT EXISTS surveillants_remplaces JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN examen_auditoires.surveillants_remplaces IS 
'Historique des remplacements de surveillants. Format: [{"ancien_id": "uuid", "nouveau_id": "uuid", "date": "ISO timestamp", "raison": "texte"}]';

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_examen_auditoires_surveillants_remplaces 
ON examen_auditoires USING gin (surveillants_remplaces);
