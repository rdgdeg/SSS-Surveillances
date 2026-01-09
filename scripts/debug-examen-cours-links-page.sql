-- Script de diagnostic pour la page Liens Examen-Cours

-- 1. Vérifier la session active
SELECT 
    'SESSION ACTIVE' as section,
    id,
    name,
    year,
    is_active
FROM sessions 
WHERE is_active = true;

-- 2. Compter les examens dans la session active
SELECT 
    'EXAMENS DANS SESSION ACTIVE' as section,
    COUNT(*) as total_examens
FROM examens 
WHERE session_id = (SELECT id FROM sessions WHERE is_active = true);

-- 3. Vérifier quelques examens avec leurs cours (structure attendue par la page)
SELECT 
    'STRUCTURE EXAMENS-COURS' as section,
    e.id,
    e.code_examen,
    e.nom_examen,
    e.enseignants,
    e.cours_id,
    c.id as cours_real_id,
    c.code as cours_code,
    c.intitule_complet as cours_nom,
    c.enseignants as cours_enseignants
FROM examens e
LEFT JOIN cours c ON e.cours_id = c.id
WHERE e.session_id = (SELECT id FROM sessions WHERE is_active = true)
LIMIT 5;

-- 4. Vérifier les cours disponibles dans la session active
SELECT 
    'COURS DANS SESSION ACTIVE' as section,
    COUNT(*) as total_cours
FROM cours 
WHERE session_id = (SELECT id FROM sessions WHERE is_active = true);

-- 5. Vérifier s'il y a des examens avec cours_id non null
SELECT 
    'EXAMENS AVEC COURS LIE' as section,
    COUNT(*) as examens_lies,
    COUNT(CASE WHEN e.cours_id IS NULL THEN 1 END) as examens_orphelins
FROM examens e
WHERE e.session_id = (SELECT id FROM sessions WHERE is_active = true);

-- 6. Vérifier la requête exacte utilisée par la page
SELECT 
    'REQUETE PAGE EXACTE' as section,
    e.id,
    e.code_examen,
    e.nom_examen,
    e.enseignants,
    e.cours_id,
    row_to_json(c.*) as cours_data
FROM examens e
LEFT JOIN cours c ON e.cours_id = c.id
WHERE e.session_id = (SELECT id FROM sessions WHERE is_active = true)
ORDER BY e.code_examen
LIMIT 3;

-- 7. Vérifier les permissions sur les tables
SELECT 
    'PERMISSIONS' as section,
    schemaname,
    tablename,
    hasinsert,
    hasselect,
    hasupdate,
    hasdelete
FROM pg_tables t
JOIN pg_user u ON u.usename = current_user
LEFT JOIN information_schema.table_privileges tp ON tp.table_name = t.tablename
WHERE t.tablename IN ('examens', 'cours')
  AND t.schemaname = 'public';

-- 8. Test de la fonction extractCourseCode (simulation)
SELECT 
    'EXTRACTION CODE COURS' as section,
    code_examen,
    -- Simulation de extractCourseCode
    REGEXP_REPLACE(
        REGEXP_REPLACE(code_examen, '[^A-Z0-9]', '', 'g'),
        '([A-Z]+)([0-9]+).*',
        '\1\2'
    ) as code_extrait
FROM examens 
WHERE session_id = (SELECT id FROM sessions WHERE is_active = true)
LIMIT 5;