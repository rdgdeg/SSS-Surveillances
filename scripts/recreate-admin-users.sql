-- Script complet pour recréer la table admin_users avec tous les utilisateurs

-- 1. Supprimer la table existante (ATTENTION: cela supprime toutes les données)
DROP TABLE IF EXISTS admin_users CASCADE;

-- 2. Créer la table avec toutes les colonnes nécessaires
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- 3. Créer les index
CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_is_active ON admin_users(is_active);
CREATE INDEX idx_admin_users_last_login ON admin_users(last_login_at) WHERE last_login_at IS NOT NULL;

-- 4. Activer RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 5. Créer les policies
CREATE POLICY "Allow read access to admin_users" 
ON admin_users 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all operations on admin_users" 
ON admin_users 
FOR ALL 
USING (true)
WITH CHECK (true);

-- 6. Insérer les utilisateurs
-- Hash bcrypt pour "admin123": $2b$10$vFBLAdauAkRrsZ4h1yt1GeZHD1LzTTH5UCUFfdFea27jAm2CN21.u

INSERT INTO admin_users (username, display_name, password_hash, is_active) VALUES
('RaphD', 'Raphaël D.', '$2b$10$vFBLAdauAkRrsZ4h1yt1GeZHD1LzTTH5UCUFfdFea27jAm2CN21.u', true),
('CelineG', 'Céline G.', '$2b$10$vFBLAdauAkRrsZ4h1yt1GeZHD1LzTTH5UCUFfdFea27jAm2CN21.u', true);

-- 7. Créer une fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- 8. Créer le trigger
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Afficher les utilisateurs créés
SELECT 
    username,
    display_name,
    is_active,
    created_at,
    CASE 
        WHEN username = 'RaphD' THEN '✓ Admin complet'
        ELSE 'Standard'
    END as role
FROM admin_users
ORDER BY username;

-- 10. Message de confirmation
DO $
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ Table admin_users recréée avec succès';
    RAISE NOTICE '✓ Utilisateurs créés:';
    RAISE NOTICE '  - RaphD (Admin complet) - mot de passe: admin123';
    RAISE NOTICE '  - CelineG (Standard) - mot de passe: admin123';
    RAISE NOTICE '========================================';
END $;
