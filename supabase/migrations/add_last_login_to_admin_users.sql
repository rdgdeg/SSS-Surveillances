-- Migration pour ajouter la colonne last_login_at à la table admin_users

-- Ajouter la colonne last_login_at
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_admin_users_last_login 
ON admin_users(last_login_at) 
WHERE last_login_at IS NOT NULL;

-- Commentaire sur la colonne
COMMENT ON COLUMN admin_users.last_login_at IS 'Date et heure de la dernière connexion de l''utilisateur';

-- Afficher un message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Migration terminée : colonne last_login_at ajoutée à admin_users';
END $$;
