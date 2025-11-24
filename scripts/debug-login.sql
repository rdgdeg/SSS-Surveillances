-- Script de diagnostic pour comprendre le problème de connexion

-- 1. Vérifier si la table existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM pg_tables WHERE tablename = 'admin_users')
        THEN '✓ Table admin_users existe'
        ELSE '✗ Table admin_users n''existe pas'
    END as table_status;

-- 2. Vérifier la structure de la table
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'admin_users'
ORDER BY ordinal_position;

-- 3. Lister tous les utilisateurs
SELECT 
    id,
    username,
    display_name,
    is_active,
    created_at,
    updated_at,
    last_login_at,
    LEFT(password_hash, 20) || '...' as password_hash_preview
FROM admin_users
ORDER BY username;

-- 4. Vérifier spécifiquement RaphD
SELECT 
    username,
    display_name,
    is_active,
    password_hash,
    CASE 
        WHEN password_hash = '$2b$10$5I1BL67wSMoyAlTC4FhEUOLBSMldfrx50UXQ.48eNQTZO95OuzoiO' 
        THEN '✓ Hash correct pour uclouvain1200'
        WHEN password_hash = '$2b$10$vFBLAdauAkRrsZ4h1yt1GeZHD1LzTTH5UCUFfdFea27jAm2CN21.u'
        THEN '✓ Hash correct pour admin123'
        ELSE '✗ Hash inconnu'
    END as password_check
FROM admin_users
WHERE username = 'RaphD';

-- 5. Vérifier les policies RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'admin_users';

-- 6. Vérifier si RLS est activé
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'admin_users';

-- 7. Compter les utilisateurs actifs
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE is_active = true) as active_users,
    COUNT(*) FILTER (WHERE username = 'RaphD') as raphd_count
FROM admin_users;
