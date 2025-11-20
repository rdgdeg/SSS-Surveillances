-- Script de vérification et ajout de la colonne telephone dans soumissions_disponibilites

-- Vérifier si la colonne existe
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'soumissions_disponibilites'
AND column_name = 'telephone';

-- Si la colonne n'existe pas, l'ajouter
ALTER TABLE soumissions_disponibilites 
ADD COLUMN IF NOT EXISTS telephone TEXT;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_soumissions_telephone 
ON soumissions_disponibilites(telephone) 
WHERE telephone IS NOT NULL;

-- Vérifier les données existantes
SELECT 
    COUNT(*) as total_soumissions,
    COUNT(telephone) as avec_telephone,
    COUNT(*) - COUNT(telephone) as sans_telephone
FROM soumissions_disponibilites;

-- Afficher quelques exemples
SELECT 
    id,
    email,
    nom,
    prenom,
    telephone,
    submitted_at
FROM soumissions_disponibilites
ORDER BY submitted_at DESC
LIMIT 10;
