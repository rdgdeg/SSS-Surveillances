-- Migration: Rendre examen_id nullable sur creneaux
-- Description: Permet de créer des créneaux manuels (sans examen lié) pour la collecte des disponibilités.
-- Les créneaux issus d'un import d'examens gardent leur examen_id ; les créneaux ajoutés à la main peuvent avoir examen_id NULL.

ALTER TABLE creneaux
ALTER COLUMN examen_id DROP NOT NULL;

COMMENT ON COLUMN creneaux.examen_id IS 'Référence à l''examen (optionnel). NULL pour les créneaux manuels.';
