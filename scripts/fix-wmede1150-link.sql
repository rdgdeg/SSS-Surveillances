-- Script pour diagnostiquer et corriger l'examen WMEDE1150

-- 1. Vérifier l'état actuel de l'examen WMEDE1150
SELECT 
    'ETAT ACTUEL WMEDE1150' as section,
    e.id as examen_id,
    e.code_examen,
    e.nom_examen,
    e.cours_id,
    c.code as cours_code_actuel,
    c.intitule_complet as cours_nom_actuel
FROM examens e
LEFT JOIN cours c ON e.cours_id = c.id
WHERE e.code_examen = 'WMEDE1150'
  AND e.session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1);

-- 2. Chercher des cours qui pourraient correspondre à WMEDE1150
SELECT 
    'COURS POSSIBLES POUR WMEDE1150' as section,
    id as cours_id,
    code as cours_code,
    intitule_complet as cours_nom,
    CASE 
        WHEN code = 'WMEDE1150' THEN 'PARFAIT - Code exact'
        WHEN code LIKE 'WMEDE%' THEN 'BON - Même famille'
        WHEN code LIKE 'WMED%' THEN 'POSSIBLE - Famille proche'
        ELSE 'AUTRE'
    END as correspondance
FROM cours 
WHERE session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1)
  AND (
    code = 'WMEDE1150' OR 
    code LIKE 'WMEDE%' OR 
    code LIKE 'WMED%'
  )
ORDER BY 
    CASE 
        WHEN code = 'WMEDE1150' THEN 1
        WHEN code LIKE 'WMEDE%' THEN 2
        WHEN code LIKE 'WMED%' THEN 3
        ELSE 4
    END;

-- 3. Vérifier si le cours WMED1260 existe et ses détails
SELECT 
    'DETAILS COURS WMED1260' as section,
    id,
    code,
    intitule_complet,
    enseignants
FROM cours 
WHERE code = 'WMED1260'
  AND session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1);

-- =====================================================
-- SCRIPTS DE CORRECTION (décommenter selon le choix)
-- =====================================================

-- Option A: Lier au cours WMEDE1150 s'il existe (RECOMMANDÉ)
/*
UPDATE examens 
SET cours_id = (
    SELECT id FROM cours 
    WHERE code = 'WMEDE1150' 
      AND session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1)
    LIMIT 1
)
WHERE code_examen = 'WMEDE1150'
  AND session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1);
*/

-- Option B: Délier l'examen (le rendre orphelin)
/*
UPDATE examens 
SET cours_id = NULL
WHERE code_examen = 'WMEDE1150'
  AND session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1);
*/

-- Option C: Lier à un autre cours spécifique (remplacer 'NOUVEAU_CODE' par le bon code)
/*
UPDATE examens 
SET cours_id = (
    SELECT id FROM cours 
    WHERE code = 'NOUVEAU_CODE' 
      AND session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1)
    LIMIT 1
)
WHERE code_examen = 'WMEDE1150'
  AND session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1);
*/

-- =====================================================
-- VÉRIFICATION APRÈS MODIFICATION
-- =====================================================
/*
SELECT 
    'VERIFICATION APRES MODIFICATION' as section,
    e.code_examen,
    e.cours_id,
    c.code as nouveau_cours_code,
    c.intitule_complet as nouveau_cours_nom
FROM examens e
LEFT JOIN cours c ON e.cours_id = c.id
WHERE e.code_examen = 'WMEDE1150'
  AND e.session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1);
*/