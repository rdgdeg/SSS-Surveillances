-- Script de vérification de l'utilisateur RaphD
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier si la table admin_users existe
SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'admin_users'
) AS table_exists;

-- 2. Lister tous les utilisateurs admin
SELECT 
    username, 
    display_name, 
    is_active, 
    created_at,
    CASE 
        WHEN username = 'RaphD' THEN '✓ ADMIN COMPLET'
        ELSE 'Utilisateur standard'
    END as role
FROM admin_users 
ORDER BY 
    CASE WHEN username = 'RaphD' THEN 0 ELSE 1 END,
    username;

-- 3. Vérifier spécifiquement RaphD
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM admin_users WHERE username = 'RaphD' AND is_active = true)
        THEN '✓ RaphD existe et est actif'
        WHEN EXISTS (SELECT 1 FROM admin_users WHERE username = 'RaphD' AND is_active = false)
        THEN '⚠ RaphD existe mais est inactif'
        ELSE '✗ RaphD n''existe pas'
    END as status;

-- 4. Si RaphD n'existe pas, le créer
-- Décommentez les lignes suivantes pour créer RaphD :

/*
INSERT INTO admin_users (username, display_name, password_hash, is_active)
VALUES ('RaphD', 'Raphaël D.', '$2b$10$vFBLAdauAkRrsZ4h1yt1GeZHD1LzTTH5UCUFfdFea27jAm2CN21.u', true)
ON CONFLICT (username) DO UPDATE 
SET 
    is_active = true,
    updated_at = NOW();
*/

-- 5. Vérifier les permissions RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'admin_users';

-- 6. Lister les policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'admin_users';
