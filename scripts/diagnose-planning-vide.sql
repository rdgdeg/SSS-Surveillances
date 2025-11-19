-- Script de diagnostic pour le planning d'examens vide
-- À exécuter dans l'éditeur SQL de Supabase

-- ============================================
-- 1. VÉRIFIER LES SESSIONS ACTIVES
-- ============================================
SELECT 
    '1. SESSIONS ACTIVES' as diagnostic,
    id,
    name,
    year,
    is_active,
    created_at
FROM sessions
ORDER BY is_active DESC, created_at DESC;

-- Compter les sessions actives
SELECT 
    '1.1 NOMBRE DE SESSIONS ACTIVES' as diagnostic,
    COUNT(*) as nb_sessions_actives
FROM sessions
WHERE is_active = true;

-- ============================================
-- 2. VÉRIFIER LES EXAMENS DANS LA SESSION ACTIVE
-- ============================================
-- Si vous avez une session active, remplacez 'SESSION_ID_ICI' par l'ID réel
-- Ou utilisez cette requête pour voir tous les examens de toutes les sessions actives
SELECT 
    '2. EXAMENS DANS LES SESSIONS ACTIVES' as diagnostic,
    e.id,
    e.date,
    e.heure_debut,
    e.heure_fin,
    e.local,
    e.nb_etudiants,
    e.cours_id,
    e.session_id,
    s.name as session_name,
    s.is_active
FROM examens e
LEFT JOIN sessions s ON e.session_id = s.id
WHERE s.is_active = true
ORDER BY e.date, e.heure_debut
LIMIT 20;

-- Compter les examens par session active
SELECT 
    '2.1 NOMBRE D''EXAMENS PAR SESSION ACTIVE' as diagnostic,
    s.id as session_id,
    s.name as session_name,
    COUNT(e.id) as nb_examens
FROM sessions s
LEFT JOIN examens e ON e.session_id = s.id
WHERE s.is_active = true
GROUP BY s.id, s.name;

-- ============================================
-- 3. VÉRIFIER LES PERMISSIONS RLS SUR LA TABLE EXAMENS
-- ============================================
-- Vérifier si RLS est activé
SELECT 
    '3. RLS SUR TABLE EXAMENS' as diagnostic,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'examens';

-- Lister les policies sur la table examens
SELECT 
    '3.1 POLICIES SUR TABLE EXAMENS' as diagnostic,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check
FROM pg_policies 
WHERE tablename = 'examens';

-- ============================================
-- 4. VÉRIFIER LA RELATION COURS_ID
-- ============================================
-- Vérifier les examens avec cours_id NULL
SELECT 
    '4. EXAMENS SANS COURS (cours_id NULL)' as diagnostic,
    COUNT(*) as nb_examens_sans_cours
FROM examens
WHERE cours_id IS NULL;

-- Vérifier les examens avec cours_id invalide (cours n'existe pas)
SELECT 
    '4.1 EXAMENS AVEC COURS_ID INVALIDE' as diagnostic,
    e.id as examen_id,
    e.cours_id,
    e.date,
    e.local,
    CASE 
        WHEN c.id IS NULL THEN 'COURS N''EXISTE PAS'
        ELSE 'OK'
    END as statut
FROM examens e
LEFT JOIN cours c ON e.cours_id = c.id
WHERE e.cours_id IS NOT NULL AND c.id IS NULL
LIMIT 10;

-- Vérifier les examens avec cours valide
SELECT 
    '4.2 EXAMENS AVEC COURS VALIDE' as diagnostic,
    e.id as examen_id,
    e.date,
    e.local,
    c.code as cours_code,
    c.intitule_complet as cours_nom
FROM examens e
INNER JOIN cours c ON e.cours_id = c.id
INNER JOIN sessions s ON e.session_id = s.id
WHERE s.is_active = true
ORDER BY e.date
LIMIT 10;

-- ============================================
-- 5. TEST DE LA REQUÊTE EXACTE UTILISÉE PAR L'APPLICATION
-- ============================================
-- Remplacez 'SESSION_ID_ICI' par l'ID de votre session active
-- Cette requête est identique à celle utilisée dans ExamSchedulePage.tsx
/*
SELECT 
    '5. TEST REQUÊTE APPLICATION' as diagnostic,
    e.id,
    e.date,
    e.heure_debut,
    e.heure_fin,
    e.local,
    e.nb_etudiants,
    json_build_object(
        'code', c.code,
        'intitule_complet', c.intitule_complet
    ) as cours
FROM examens e
LEFT JOIN cours c ON e.cours_id = c.id
WHERE e.session_id = 'SESSION_ID_ICI'
ORDER BY e.date ASC, e.heure_debut ASC;
*/

-- ============================================
-- 6. RÉSUMÉ GLOBAL
-- ============================================
SELECT 
    '6. RÉSUMÉ GLOBAL' as diagnostic,
    (SELECT COUNT(*) FROM sessions WHERE is_active = true) as sessions_actives,
    (SELECT COUNT(*) FROM examens e JOIN sessions s ON e.session_id = s.id WHERE s.is_active = true) as examens_dans_sessions_actives,
    (SELECT COUNT(*) FROM examens WHERE cours_id IS NULL) as examens_sans_cours,
    (SELECT COUNT(*) FROM cours) as total_cours;

-- ============================================
-- 7. ACTIONS CORRECTIVES SUGGÉRÉES
-- ============================================
-- Si aucune session n'est active, activez-en une :
/*
UPDATE sessions 
SET is_active = true 
WHERE id = 'SESSION_ID_ICI';
*/

-- Si RLS bloque l'accès, créez une policy permissive :
/*
CREATE POLICY "Allow public read access to examens" 
ON examens FOR SELECT 
USING (true);
*/

-- Si vous avez des examens sans cours_id, vous pouvez les lier :
/*
-- Voir les examens orphelins
SELECT id, date, local FROM examens WHERE cours_id IS NULL;

-- Les lier à un cours
UPDATE examens 
SET cours_id = 'COURS_ID_ICI' 
WHERE id = 'EXAMEN_ID_ICI';
*/
