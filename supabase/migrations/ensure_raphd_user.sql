-- Vérifier et créer l'utilisateur RaphD si nécessaire

-- Vérifier si la table admin_users existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_users') THEN
        -- Créer la table si elle n'existe pas
        CREATE TABLE admin_users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            username TEXT UNIQUE NOT NULL,
            display_name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Activer RLS
        ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

        -- Policy pour permettre la lecture
        CREATE POLICY "Allow read access to admin_users" ON admin_users
            FOR SELECT USING (true);

        -- Index sur username
        CREATE INDEX idx_admin_users_username ON admin_users(username);
    END IF;
END $$;

-- Vérifier si RaphD existe, sinon le créer
-- Hash bcrypt pour "admin123": $2b$10$vFBLAdauAkRrsZ4h1yt1GeZHD1LzTTH5UCUFfdFea27jAm2CN21.u
INSERT INTO admin_users (username, display_name, password_hash, is_active)
VALUES ('RaphD', 'Raphaël D.', '$2b$10$vFBLAdauAkRrsZ4h1yt1GeZHD1LzTTH5UCUFfdFea27jAm2CN21.u', true)
ON CONFLICT (username) DO NOTHING;

-- Vérifier que RaphD existe maintenant
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM admin_users WHERE username = 'RaphD';
    
    IF user_count = 0 THEN
        RAISE EXCEPTION 'Erreur: L''utilisateur RaphD n''a pas pu être créé';
    ELSE
        RAISE NOTICE 'Utilisateur RaphD vérifié/créé avec succès';
    END IF;
END $$;

-- Afficher tous les utilisateurs admin (pour vérification)
SELECT username, display_name, is_active, created_at 
FROM admin_users 
ORDER BY username;
