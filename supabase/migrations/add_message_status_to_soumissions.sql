-- Migration: Ajout du statut de traitement des messages dans soumissions_disponibilites
-- Date: 2024-12-09
-- Description: Permet de marquer les messages comme traités par l'admin

-- Ajouter la colonne message_traite (boolean, par défaut false)
ALTER TABLE soumissions_disponibilites
ADD COLUMN IF NOT EXISTS message_traite BOOLEAN DEFAULT false;

-- Ajouter la colonne message_traite_par (email de l'admin qui a traité)
ALTER TABLE soumissions_disponibilites
ADD COLUMN IF NOT EXISTS message_traite_par TEXT;

-- Ajouter la colonne message_traite_le (date de traitement)
ALTER TABLE soumissions_disponibilites
ADD COLUMN IF NOT EXISTS message_traite_le TIMESTAMPTZ;

-- Créer un index pour améliorer les performances des requêtes filtrées
CREATE INDEX IF NOT EXISTS idx_soumissions_message_traite 
ON soumissions_disponibilites(message_traite) 
WHERE deleted_at IS NULL;

-- Commentaires
COMMENT ON COLUMN soumissions_disponibilites.message_traite IS 'Indique si le message (remarque_generale) a été traité par un admin';
COMMENT ON COLUMN soumissions_disponibilites.message_traite_par IS 'Email de l''admin qui a marqué le message comme traité';
COMMENT ON COLUMN soumissions_disponibilites.message_traite_le IS 'Date et heure du traitement du message';
