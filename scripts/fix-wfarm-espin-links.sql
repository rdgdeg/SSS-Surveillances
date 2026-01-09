-- Script pour diagnostiquer et corriger WFARM1160 et ESPIN2515

-- =====================================================
-- 1. DIAGNOSTIC WFARM1160
-- =====================================================
SELECT 
    '=== DIAGNOSTIC WFARM1160 ===' as section,
    e.code_examen,
    e.nom_examen,
    'WFARM1160' as code_attendu,
    c.code as cours_actuel,
    c.intitule_complet as nom_cours_actuel,
    e.id as examen_id,
    e.cours_id as cours_id_actuel
FROM examens e
LEFT JOIN cours c ON e.cours_id = c.id
WHERE e.code_examen = 'WFARM1160'
  AND e.session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1);

-- Chercher les cours possibles pour WFARM1160
SELECT 
    '=== COURS POSSIBLES POUR WFARM1160 ===' as section,
    id as cours_id,
    code as cours_code,
    intitule_complet as cours_nom,
    CASE 
        WHEN code = 'WFARM1160' THEN '🎯 PARFAIT'
        WHEN code LIKE 'WFARM%' THEN '👍 FAMILLE WFARM'
        WHEN code LIKE 'FARM%' THEN '🤔 FAMILLE FARM'
        ELSE '❓ AUTRE'
    END as correspondance
FROM cours 
WHERE session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1)
  AND (
    code = 'WFARM1160' OR 
    code LIKE 'WFARM%' OR 
    code LIKE 'FARM%'
  )
ORDER BY 
    CASE 
        WHEN code = 'WFARM1160' THEN 1
        WHEN code LIKE 'WFARM%' THEN 2
        WHEN code LIKE 'FARM%' THEN 3
        ELSE 4
    END;

-- =====================================================
-- 2. DIAGNOSTIC ESPIN2515
-- =====================================================
SELECT 
    '=== DIAGNOSTIC ESPIN2515 ===' as section,
    e.code_examen,
    e.nom_examen,
    'ESPIN2515' as code_attendu,
    c.code as cours_actuel,
    c.intitule_complet as nom_cours_actuel,
    e.id as examen_id,
    e.cours_id as cours_id_actuel
FROM examens e
LEFT JOIN cours c ON e.cours_id = c.id
WHERE e.code_examen = 'ESPIN2515'
  AND e.session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1);

-- Chercher les cours possibles pour ESPIN2515
SELECT 
    '=== COURS POSSIBLES POUR ESPIN2515 ===' as section,
    id as cours_id,
    code as cours_code,
    intitule_complet as cours_nom,
    CASE 
        WHEN code = 'ESPIN2515' THEN '🎯 PARFAIT'
        WHEN code LIKE 'ESPIN%' THEN '👍 FAMILLE ESPIN'
        WHEN code LIKE 'SPIN%' THEN '🤔 FAMILLE SPIN'
        ELSE '❓ AUTRE'
    END as correspondance
FROM cours 
WHERE session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1)
  AND (
    code = 'ESPIN2515' OR 
    code LIKE 'ESPIN%' OR 
    code LIKE 'SPIN%'
  )
ORDER BY 
    CASE 
        WHEN code = 'ESPIN2515' THEN 1
        WHEN code LIKE 'ESPIN%' THEN 2
        WHEN code LIKE 'SPIN%' THEN 3
        ELSE 4
    END;

-- =====================================================
-- 3. SCRIPTS DE CORRECTION (décommenter selon le choix)
-- =====================================================

-- CORRECTION WFARM1160 - Lier au cours WFARM1160 s'il existe
/*
UPDATE examens 
SET cours_id = (
    SELECT id FROM cours 
    WHERE code = 'WFARM1160' 
      AND session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1)
    LIMIT 1
)
WHERE code_examen = 'WFARM1160'
  AND session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1);
*/

-- CORRECTION ESPIN2515 - Lier au cours ESPIN2515 s'il existe
/*
UPDATE examens 
SET cours_id = (
    SELECT id FROM cours 
    WHERE code = 'ESPIN2515' 
      AND session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1)
    LIMIT 1
)
WHERE code_examen = 'ESPIN2515'
  AND session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1);
*/

-- Alternative: Délier les examens (les rendre orphelins) si pas de cours correspondant
/*
UPDATE examens 
SET cours_id = NULL
WHERE code_examen IN ('WFARM1160', 'ESPIN2515')
  AND session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1);
*/

-- =====================================================
-- 4. VÉRIFICATION APRÈS CORRECTION
-- =====================================================
/*
SELECT 
    '=== VÉRIFICATION APRÈS CORRECTION ===' as section,
    e.code_examen,
    e.cours_id,
    c.code as nouveau_cours_code,
    c.intitule_complet as nouveau_cours_nom,
    CASE 
        WHEN e.cours_id IS NULL THEN '⚠️ ORPHELIN'
        WHEN c.code = e.code_examen THEN '✅ PARFAIT'
        ELSE '🔄 VÉRIFIÉ'
    END as statut
FROM examens e
LEFT JOIN cours c ON e.cours_id = c.id
WHERE e.code_examen IN ('WFARM1160', 'ESPIN2515')
  AND e.session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1);
*/