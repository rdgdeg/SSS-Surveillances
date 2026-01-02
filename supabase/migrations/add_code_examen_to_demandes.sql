-- Ajout du champ code_examen à la table demandes_modification
ALTER TABLE demandes_modification 
ADD COLUMN IF NOT EXISTS code_examen TEXT;

-- Créer un index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_demandes_modification_code_examen 
ON demandes_modification(code_examen);

-- Mettre à jour la contrainte de validation si nécessaire
COMMENT ON COLUMN demandes_modification.code_examen IS 'Code de l''examen (ex: WFARM1300, WSBIM1207, etc.)';