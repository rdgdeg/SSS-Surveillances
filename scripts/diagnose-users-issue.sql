-- Script de diagnostic pour les problèmes d'utilisateurs

-- 1. Vérifier la structure de la table admin_users
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'admin_users'
ORDER BY ordinal_position;

-- 2. Lister tous les utilisateurs
SELECT 
    id,
    username, 
    display_name, 
    is_active,
    created_at,
    updated_at,
    CASE 
        WHEN username = 'RaphD' THEN '✓ ADMIN COMPLET'
        ELSE 'Utilisateur standard'
    END as role
FROM admin_users 
ORDER BY username;

-- 3. Vérifier les utilisateurs actifs
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE is_active = true) as active_users,
    COUNT(*) FILTER (WHERE is_active = false) as inactive_users
FROM admin_users;

-- 4. Vérifier si la colonne last_login_at existe
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'admin_users' 
    AND column_name = 'last_login_at'
) as last_login_column_exists;

-- 5. Tester la requête de connexion pour RaphD
SELECT 
    id, 
    username, 
    display_name, 
    is_active,
    password_hash
FROM admin_users
WHERE username = 'RaphD' 
AND is_active = true;

-- 6. Vérifier les policies RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'admin_users';

-- 7. Vérifier si RLS est activé
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'admin_users';
