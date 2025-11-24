-- Script d'accès rapide à l'admin
-- Mot de passe: uclouvain1200

-- 1. Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- 2. Ajouter les colonnes manquantes si nécessaire
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- 3. Activer RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 4. Créer les policies
DROP POLICY IF EXISTS "Allow read access to admin_users" ON admin_users;
CREATE POLICY "Allow read access to admin_users" ON admin_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all operations on admin_users" ON admin_users;
CREATE POLICY "Allow all operations on admin_users" ON admin_users FOR ALL USING (true) WITH CHECK (true);

-- 5. Créer/Mettre à jour l'utilisateur admin avec le nouveau mot de passe
-- Hash pour "uclouvain1200": $2b$10$5I1BL67wSMoyAlTC4FhEUOLBSMldfrx50UXQ.48eNQTZO95OuzoiO
INSERT INTO admin_users (username, display_name, password_hash, is_active)
VALUES ('RaphD', 'Raphaël D.', '$2b$10$5I1BL67wSMoyAlTC4FhEUOLBSMldfrx50UXQ.48eNQTZO95OuzoiO', true)
ON CONFLICT (username) 
DO UPDATE SET 
    password_hash = '$2b$10$5I1BL67wSMoyAlTC4FhEUOLBSMldfrx50UXQ.48eNQTZO95OuzoiO',
    is_active = true;

-- 6. Créer CelineG avec le même mot de passe
INSERT INTO admin_users (username, display_name, password_hash, is_active)
VALUES ('CelineG', 'Céline G.', '$2b$10$5I1BL67wSMoyAlTC4FhEUOLBSMldfrx50UXQ.48eNQTZO95OuzoiO', true)
ON CONFLICT (username) 
DO UPDATE SET 
    password_hash = '$2b$10$5I1BL67wSMoyAlTC4FhEUOLBSMldfrx50UXQ.48eNQTZO95OuzoiO',
    is_active = true;

-- 7. Afficher les utilisateurs
SELECT 
    username,
    display_name,
    is_active,
    CASE 
        WHEN username = 'RaphD' THEN '✓ Admin complet'
        ELSE 'Standard'
    END as role,
    '✓ Mot de passe: uclouvain1200' as info
FROM admin_users
ORDER BY username;
