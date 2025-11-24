-- Script pour ajouter les colonnes manquantes sans supprimer la table

-- 1. Ajouter updated_at si elle n'existe pas
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_users' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE admin_users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✓ Colonne updated_at ajoutée';
    ELSE
        RAISE NOTICE '✓ Colonne updated_at existe déjà';
    END IF;
END $;

-- 2. Ajouter last_login_at si elle n'existe pas
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_users' AND column_name = 'last_login_at'
    ) THEN
        ALTER TABLE admin_users ADD COLUMN last_login_at TIMESTAMPTZ;
        RAISE NOTICE '✓ Colonne last_login_at ajoutée';
    ELSE
        RAISE NOTICE '✓ Colonne last_login_at existe déjà';
    END IF;
END $;

-- 3. Créer les index
CREATE INDEX IF NOT EXISTS idx_admin_users_last_login 
ON admin_users(last_login_at) 
WHERE last_login_at IS NOT NULL;

-- 4. Créer la fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- 5. Créer le trigger
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. S'assurer que RaphD existe
INSERT INTO admin_users (username, display_name, password_hash, is_active)
VALUES ('RaphD', 'Raphaël D.', '$2b$10$vFBLAdauAkRrsZ4h1yt1GeZHD1LzTTH5UCUFfdFea27jAm2CN21.u', true)
ON CONFLICT (username) DO UPDATE SET is_active = true;

-- 7. S'assurer que CelineG existe
INSERT INTO admin_users (username, display_name, password_hash, is_active)
VALUES ('CelineG', 'Céline G.', '$2b$10$vFBLAdauAkRrsZ4h1yt1GeZHD1LzTTH5UCUFfdFea27jAm2CN21.u', true)
ON CONFLICT (username) DO NOTHING;

-- 8. Afficher les utilisateurs
SELECT 
    username,
    display_name,
    is_active,
    created_at,
    updated_at,
    last_login_at,
    CASE 
        WHEN username = 'RaphD' THEN '✓ Admin complet'
        ELSE 'Standard'
    END as role
FROM admin_users
ORDER BY username;

-- 9. Message de confirmation
DO $
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM admin_users;
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ Colonnes ajoutées avec succès';
    RAISE NOTICE '✓ Trigger updated_at créé';
    RAISE NOTICE '✓ % utilisateur(s) dans la base', user_count;
    RAISE NOTICE '========================================';
END $;
