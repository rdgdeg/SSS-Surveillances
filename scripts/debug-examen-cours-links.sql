-- Script pour diagnostiquer les liens entre examens et cours

-- 1. Voir tous les examens avec leurs cours liés (session active)
SELECT 
    e.id as examen_id,
    e.code_examen,
    e.nom_examen,
    e.cours_id,
    c.code_cours,
    c.nom_cours,
    c.enseignants as cours_enseignants,
    e.enseignants as examen_enseignants,
    CASE 
        WHEN e.cours_id IS NULL THEN '❌ Non lié'
        ELSE '✅ Lié'
    END as statut_lien
FROM examens e
LEFT JOIN cours c ON e.cours_id = c.id
WHERE e.session_id = (SELECT id FROM sessions WHERE is_active = true)
ORDER BY e.code_examen;

-- 2. Examens sans cours lié (orphelins)
SELECT 
    e.code_examen,
    e.nom_examen,
    '❌ ORPHELIN' as statut
FROM examens e
WHERE e.session_id = (SELECT id FROM sessions WHERE is_active = true)
  AND e.cours_id IS NULL
ORDER BY e.code_examen;

-- 3. Rechercher un examen spécifique par code (remplacer 'CODE_EXAMEN' par le vrai code)
-- SELECT 
--     e.code_examen,
--     e.nom_examen,
--     e.cours_id,
--     c.code_cours,
--     c.nom_cours,
--     c.enseignants as cours_enseignants,
--     e.enseignants as examen_enseignants
-- FROM examens e
-- LEFT JOIN cours c ON e.cours_id = c.id
-- WHERE e.code_examen = 'CODE_EXAMEN'
--   AND e.session_id = (SELECT id FROM sessions WHERE is_active = true);

-- 4. Cours qui pourraient correspondre à un examen (recherche par similarité de nom)
-- Remplacer 'NOM_EXAMEN' par une partie du nom de l'examen
-- SELECT 
--     c.id as cours_id,
--     c.code_cours,
--     c.nom_cours,
--     c.enseignants,
--     similarity(c.nom_cours, 'NOM_EXAMEN') as similarite
-- FROM cours c
-- WHERE c.session_id = (SELECT id FROM sessions WHERE is_active = true)
--   AND (
--     c.nom_cours ILIKE '%NOM_EXAMEN%' 
--     OR similarity(c.nom_cours, 'NOM_EXAMEN') > 0.3
--   )
-- ORDER BY similarite DESC;

-- 5. Statistiques générales des liens examen-cours
SELECT 
    COUNT(*) as total_examens,
    COUNT(e.cours_id) as examens_lies,
    COUNT(*) - COUNT(e.cours_id) as examens_orphelins,
    ROUND(COUNT(e.cours_id)::numeric / COUNT(*)::numeric * 100, 2) as pourcentage_lies
FROM examens e
WHERE e.session_id = (SELECT id FROM sessions WHERE is_active = true);

-- 6. Examens avec des enseignants différents du cours lié (potentiels problèmes)
SELECT 
    e.code_examen,
    e.nom_examen,
    c.code_cours,
    c.nom_cours,
    e.enseignants as examen_enseignants,
    c.enseignants as cours_enseignants,
    '⚠️ DIFFÉRENCE' as alerte
FROM examens e
JOIN cours c ON e.cours_id = c.id
WHERE e.session_id = (SELECT id FROM sessions WHERE is_active = true)
  AND e.enseignants != c.enseignants
ORDER BY e.code_examen;