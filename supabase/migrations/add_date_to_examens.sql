-- Ajout de la colonne date à la table examens

-- Ajouter la colonne date si elle n'existe pas
ALTER TABLE examens 
ADD COLUMN IF NOT EXISTS date DATE;

-- Créer un index sur la date pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_examens_date ON examens(date);

-- Créer un index composite pour les requêtes de planning
CREATE INDEX IF NOT EXISTS idx_examens_session_date ON examens(session_id, date);

-- Commentaire pour la documentation
COMMENT ON COLUMN examens.date IS 'Date de l''examen (format DATE)';

-- Note : Si vous avez déjà des examens, vous devrez mettre à jour leurs dates manuellement
-- Exemple :
-- UPDATE examens SET date = '2025-12-15' WHERE id = 'votre-examen-id';
