-- Script pour corriger la table admin_users

-- 1. Ajouter la colonne last_login_at si elle n'existe pas
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- 2. Créer un index sur last_login_at
CREATE INDEX IF NOT EXISTS idx_admin_users_last_login 
ON admin_users(last_login_at) 
WHERE last_login_at IS NOT NULL;

-- 3. S'assurer que RaphD existe et est actif
INSERT INTO admin_users (username, display_name, password_hash, is_active)
VALUES ('RaphD', 'Raphaël D.', '$2b$10$vFBLAdauAkRrsZ4h1yt1GeZHD1LzTTH5UCUFfdFea27jAm2CN21.u', true)
ON CONFLICT (username) 
DO UPDATE SET 
    is_active = true,
    updated_at = NOW();

-- 4. Vérifier que RLS est activé
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 5. Créer ou remplacer la policy de lecture
DROP POLICY IF EXISTS "Allow read access to admin_users" ON admin_users;
CREATE POLICY "Allow read access to admin_users" 
ON admin_users 
FOR SELECT 
USING (true);

-- 6. Créer ou remplacer la policy d'écriture (pour les opérations CRUD)
DROP POLICY IF EXISTS "Allow all operations on admin_users" ON admin_users;
CREATE POLICY "Allow all operations on admin_users" 
ON admin_users 
FOR ALL 
USING (true)
WITH CHECK (true);

-- 7. Afficher le résultat
SELECT 
    username,
    display_name,
    is_active,
    created_at,
    last_login_at,
    CASE 
        WHEN username = 'RaphD' THEN '✓ Admin complet'
        ELSE 'Standard'
    END as role
FROM admin_users
ORDER BY username;

-- 8. Afficher un message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✓ Table admin_users corrigée avec succès';
    RAISE NOTICE '✓ Colonne last_login_at ajoutée';
    RAISE NOTICE '✓ Policies RLS configurées';
    RAISE NOTICE '✓ Utilisateur RaphD vérifié';
END $$;
