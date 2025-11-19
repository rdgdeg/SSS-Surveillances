-- Mise à jour des types d'examen et ajout des champs pour le type "travail"

-- Étape 1: Convertir temporairement la colonne en TEXT
ALTER TABLE presences_enseignants 
ALTER COLUMN type_examen TYPE TEXT;

-- Étape 2: Supprimer l'ancien type enum
DROP TYPE IF EXISTS exam_type CASCADE;

-- Étape 3: Créer le nouveau type enum avec toutes les valeurs
CREATE TYPE exam_type AS ENUM (
    'qcm',              -- QCM
    'qroc_manuel',      -- QROC (correction manuelle)
    'qcm_qroc',         -- QCM & QROC
    'gradescope',       -- Gradescope
    'oral',             -- Oral
    'travail',          -- Travail
    'autre'             -- Autre (à préciser)
);

-- Étape 4: Migrer les données existantes
UPDATE presences_enseignants
SET type_examen = CASE 
    WHEN type_examen = 'ecrit' THEN 'qroc_manuel'
    WHEN type_examen = 'qcm' THEN 'qcm'
    WHEN type_examen = 'autre' THEN 'autre'
    ELSE type_examen
END
WHERE type_examen IS NOT NULL;

-- Étape 5: Reconvertir la colonne en type enum
ALTER TABLE presences_enseignants 
ALTER COLUMN type_examen TYPE exam_type USING type_examen::exam_type;

-- Ajouter les nouveaux champs pour le type "travail"
ALTER TABLE presences_enseignants 
ADD COLUMN IF NOT EXISTS travail_date_depot DATE,
ADD COLUMN IF NOT EXISTS travail_en_presentiel BOOLEAN,
ADD COLUMN IF NOT EXISTS travail_bureau TEXT;

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_presences_type_examen ON presences_enseignants(type_examen);
CREATE INDEX IF NOT EXISTS idx_presences_travail_date ON presences_enseignants(travail_date_depot) WHERE type_examen = 'travail';

-- Commentaires pour la documentation
COMMENT ON COLUMN presences_enseignants.type_examen IS 'Type d''examen: qcm, qroc_manuel (correction manuelle), qcm_qroc, gradescope, oral, travail, autre';
COMMENT ON COLUMN presences_enseignants.travail_date_depot IS 'Date limite de remise du travail (uniquement si type_examen = travail)';
COMMENT ON COLUMN presences_enseignants.travail_en_presentiel IS 'Indique si le travail se fait en présentiel (uniquement si type_examen = travail)';
COMMENT ON COLUMN presences_enseignants.travail_bureau IS 'Bureau pour le travail en présentiel (uniquement si type_examen = travail et travail_en_presentiel = true)';
