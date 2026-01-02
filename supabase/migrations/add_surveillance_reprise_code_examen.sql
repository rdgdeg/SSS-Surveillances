-- Ajout du champ code_examen pour la surveillance de reprise dans les permutations
ALTER TABLE demandes_modification 
ADD COLUMN IF NOT EXISTS surveillance_reprise_code_examen TEXT;

-- Créer un index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_demandes_modification_surveillance_reprise_code_examen 
ON demandes_modification(surveillance_reprise_code_examen);

-- Commentaire pour documenter le champ
COMMENT ON COLUMN demandes_modification.surveillance_reprise_code_examen IS 'Code de l''examen que le demandeur reprend en échange (pour les permutations)';