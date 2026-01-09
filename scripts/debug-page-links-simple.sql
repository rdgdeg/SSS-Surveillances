-- Script de diagnostic simple pour la page Liens Examen-Cours

-- 1. Vérifier la session active
SELECT 
    'SESSION ACTIVE' as diagnostic,
    id,
    name,
    year,
    is_active
FROM sessions 
WHERE is_active = true;

-- 2. Compter les examens dans la session active
SELECT 
    'EXAMENS DANS SESSION' as diagnostic,
    COUNT(*) as total_examens
FROM examens 
WHERE session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1);

-- 3. Compter les cours dans la session active
SELECT 
    'COURS DANS SESSION' as diagnostic,
    COUNT(*) as total_cours
FROM cours 
WHERE session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1);

-- 4. Vérifier quelques examens avec leurs cours
SELECT 
    'EXEMPLES EXAMENS-COURS' as diagnostic,
    e.code_examen,
    e.nom_examen,
    e.cours_id,
    c.code as cours_code,
    c.intitule_complet as cours_nom
FROM examens e
LEFT JOIN cours c ON e.cours_id = c.id
WHERE e.session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1)
ORDER BY e.code_examen
LIMIT 5;

-- 5. Vérifier les examens avec cours_id non null
SELECT 
    'EXAMENS AVEC COURS' as diagnostic,
    COUNT(*) as examens_lies,
    COUNT(CASE WHEN e.cours_id IS NULL THEN 1 END) as examens_orphelins
FROM examens e
WHERE e.session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1);