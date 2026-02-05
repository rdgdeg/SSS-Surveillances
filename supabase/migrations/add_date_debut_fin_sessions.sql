-- Migration: Ajouter date_debut et date_fin aux sessions
-- Description: Permet de définir la plage de dates d'une session (ex. Hors session février)
-- Les colonnes sont optionnelles pour compatibilité avec les sessions existantes.

ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS date_debut DATE;

ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS date_fin DATE;

COMMENT ON COLUMN sessions.date_debut IS 'Date de début de la session (optionnel)';
COMMENT ON COLUMN sessions.date_fin IS 'Date de fin de la session (optionnel)';
