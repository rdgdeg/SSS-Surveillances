-- Script de diagnostic pour le planning vide
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier la structure de la table examens
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'examens'
ORDER BY ordinal_position;

-- 2. Vérifier s'il y a une session active
SELECT id, name, year, is_active, created_at
FROM sessions
WHERE is_active = true;

-- 3. Compter les examens par session
SELECT 
    s.id as session_id,
    s.name as session_name,
    s.is_active,
    COUNT(e.id) as nb_examens
FROM sessions s
LEFT JOIN examens e ON e.session_id = s.id
GROUP BY s.id, s.name, s.is_active
ORDER BY s.is_active DESC, s.created_at DESC;

-- 4. Afficher quelques examens de la session active (si elle existe)
SELECT 
    e.id,
    e.session_id,
    e.cours_id,
    c.code as cours_code,
    c.intitule_complet as cours_intitule,
    e.local,
    e.heure_debut,
    e.heure_fin,
    e.nb_etudiants
FROM examens e
LEFT JOIN cours c ON c.id = e.cours_id
WHERE e.session_id IN (SELECT id FROM sessions WHERE is_active = true)
LIMIT 10;

-- 5. Vérifier les permissions RLS sur la table examens
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'examens';

-- 6. Lister les policies sur la table examens
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'examens';

-- 7. Vérifier s'il y a des examens sans cours_id
SELECT COUNT(*) as examens_sans_cours
FROM examens
WHERE cours_id IS NULL;

-- 8. Vérifier s'il y a des examens avec cours_id invalide
SELECT COUNT(*) as examens_cours_invalide
FROM examens e
LEFT JOIN cours c ON c.id = e.cours_id
WHERE e.cours_id IS NOT NULL AND c.id IS NULL;
