-- Script de vérification des utilisateurs admin

-- 1. Vérifier que la table admin_users existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'admin_users'
        ) 
        THEN '✓ Table admin_users existe'
        ELSE '✗ Table admin_users n''existe pas'
    END as table_status;

-- 2. Afficher tous les utilisateurs admin
SELECT 
    username,
    display_name,
    is_active,
    created_at,
    last_login_at,
    CASE 
        WHEN password_hash IS NOT NULL THEN '✓ Hash présent'
        ELSE '✗ Hash manquant'
    END as password_status
FROM admin_users
ORDER BY username;

-- 3. Compter les utilisateurs actifs
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE is_active = true) as active_users,
    COUNT(*) FILTER (WHERE is_active = false) as inactive_users
FROM admin_users;

-- 4. Vérifier les utilisateurs spécifiques
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM admin_users WHERE username = 'RaphD' AND is_active = true)
        THEN '✓ RaphD existe et est actif'
        ELSE '✗ RaphD manquant ou inactif'
    END as raphd_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM admin_users WHERE username = 'CelineG' AND is_active = true)
        THEN '✓ CelineG existe et est actif'
        ELSE '✗ CelineG manquant ou inactif'
    END as celineg_status;
