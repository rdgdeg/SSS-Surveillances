-- Requête pour identifier les examens avec des codes différents du cours assigné

-- =====================================================
-- EXAMENS AVEC INCOHÉRENCES DE CODES - VERSION CORRIGÉE
-- =====================================================

-- 1. RÉSUMÉ STATISTIQUE
SELECT 
  'STATISTIQUES GÉNÉRALES' as section,
  COUNT(*) as total_examens,
  COUNT(CASE WHEN e.cours_id IS NULL THEN 1 END) as orphelins,
  COUNT(CASE WHEN c.code = REGEXP_REPLACE(
    REGEXP_REPLACE(e.code_examen, '[^A-Z0-9]', '', 'g'),
    '([A-Z]+)([0-9]+).*',
    '\1\2'
  ) THEN 1 END) as parfaits,
  COUNT(CASE WHEN c.code LIKE SUBSTRING(REGEXP_REPLACE(
    REGEXP_REPLACE(e.code_examen, '[^A-Z0-9]', '', 'g'),
    '([A-Z]+)([0-9]+).*',
    '\1\2'
  ) FROM 1 FOR 4) || '%' AND c.code != REGEXP_REPLACE(
    REGEXP_REPLACE(e.code_examen, '[^A-Z0-9]', '', 'g'),
    '([A-Z]+)([0-9]+).*',
    '\1\2'
  ) THEN 1 END) as famille_proche,
  COUNT(CASE WHEN e.cours_id IS NOT NULL AND c.code IS NOT NULL AND 
    c.code != REGEXP_REPLACE(
      REGEXP_REPLACE(e.code_examen, '[^A-Z0-9]', '', 'g'),
      '([A-Z]+)([0-9]+).*',
      '\1\2'
    ) AND NOT (c.code LIKE SUBSTRING(REGEXP_REPLACE(
      REGEXP_REPLACE(e.code_examen, '[^A-Z0-9]', '', 'g'),
      '([A-Z]+)([0-9]+).*',
      '\1\2'
    ) FROM 1 FOR 4) || '%') THEN 1 END) as incoherents,
  ROUND(
    COUNT(CASE WHEN c.code = REGEXP_REPLACE(
      REGEXP_REPLACE(e.code_examen, '[^A-Z0-9]', '', 'g'),
      '([A-Z]+)([0-9]+).*',
      '\1\2'
    ) THEN 1 END)::numeric / 
    NULLIF(COUNT(*), 0)::numeric * 100, 2
  ) as pourcentage_parfaits
FROM examens e
LEFT JOIN cours c ON e.cours_id = c.id
WHERE e.session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1);

-- =====================================================
-- 2. EXAMENS INCOHÉRENTS (PRIORITÉ HAUTE)
-- =====================================================
SELECT 
  '=== EXAMENS INCOHÉRENTS - PRIORITÉ HAUTE ===' as diagnostic,
  e.code_examen,
  REGEXP_REPLACE(
    REGEXP_REPLACE(e.code_examen, '[^A-Z0-9]', '', 'g'),
    '([A-Z]+)([0-9]+).*',
    '\1\2'
  ) as code_attendu,
  c.code as cours_actuel,
  CASE 
    WHEN LENGTH(e.nom_examen) > 40 THEN SUBSTRING(e.nom_examen FROM 1 FOR 37) || '...'
    ELSE e.nom_examen
  END as nom_examen,
  'INCOHERENT' as statut,
  '⚠️ CORRECTION REQUISE' as action
FROM examens e
LEFT JOIN cours c ON e.cours_id = c.id
WHERE e.session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1)
  AND e.cours_id IS NOT NULL 
  AND c.code IS NOT NULL
  AND c.code != REGEXP_REPLACE(
    REGEXP_REPLACE(e.code_examen, '[^A-Z0-9]', '', 'g'),
    '([A-Z]+)([0-9]+).*',
    '\1\2'
  )
  AND NOT (c.code LIKE SUBSTRING(REGEXP_REPLACE(
    REGEXP_REPLACE(e.code_examen, '[^A-Z0-9]', '', 'g'),
    '([A-Z]+)([0-9]+).*',
    '\1\2'
  ) FROM 1 FOR 4) || '%')
ORDER BY e.code_examen;

-- =====================================================
-- 3. EXAMENS ORPHELINS (PRIORITÉ MOYENNE)
-- =====================================================
SELECT 
  '=== EXAMENS ORPHELINS - PRIORITÉ MOYENNE ===' as diagnostic,
  e.code_examen,
  REGEXP_REPLACE(
    REGEXP_REPLACE(e.code_examen, '[^A-Z0-9]', '', 'g'),
    '([A-Z]+)([0-9]+).*',
    '\1\2'
  ) as code_attendu,
  'AUCUN COURS' as cours_actuel,
  CASE 
    WHEN LENGTH(e.nom_examen) > 40 THEN SUBSTRING(e.nom_examen FROM 1 FOR 37) || '...'
    ELSE e.nom_examen
  END as nom_examen,
  'ORPHELIN' as statut,
  '🔗 LIEN À CRÉER' as action
FROM examens e
WHERE e.session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1)
  AND e.cours_id IS NULL
ORDER BY e.code_examen;

-- =====================================================
-- 4. FAMILLE PROCHE (PRIORITÉ BASSE)
-- =====================================================
SELECT 
  '=== FAMILLE PROCHE - PRIORITÉ BASSE ===' as diagnostic,
  e.code_examen,
  REGEXP_REPLACE(
    REGEXP_REPLACE(e.code_examen, '[^A-Z0-9]', '', 'g'),
    '([A-Z]+)([0-9]+).*',
    '\1\2'
  ) as code_attendu,
  c.code as cours_actuel,
  CASE 
    WHEN LENGTH(e.nom_examen) > 40 THEN SUBSTRING(e.nom_examen FROM 1 FOR 37) || '...'
    ELSE e.nom_examen
  END as nom_examen,
  'FAMILLE_PROCHE' as statut,
  '✓ ACCEPTABLE' as action
FROM examens e
LEFT JOIN cours c ON e.cours_id = c.id
WHERE e.session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1)
  AND e.cours_id IS NOT NULL 
  AND c.code IS NOT NULL
  AND c.code LIKE SUBSTRING(REGEXP_REPLACE(
    REGEXP_REPLACE(e.code_examen, '[^A-Z0-9]', '', 'g'),
    '([A-Z]+)([0-9]+).*',
    '\1\2'
  ) FROM 1 FOR 4) || '%'
  AND c.code != REGEXP_REPLACE(
    REGEXP_REPLACE(e.code_examen, '[^A-Z0-9]', '', 'g'),
    '([A-Z]+)([0-9]+).*',
    '\1\2'
  )
ORDER BY e.code_examen;

-- =====================================================
-- 5. EXAMENS PARFAITS (POUR VÉRIFICATION)
-- =====================================================
SELECT 
  '=== EXAMENS PARFAITS - VÉRIFICATION ===' as diagnostic,
  e.code_examen,
  REGEXP_REPLACE(
    REGEXP_REPLACE(e.code_examen, '[^A-Z0-9]', '', 'g'),
    '([A-Z]+)([0-9]+).*',
    '\1\2'
  ) as code_attendu,
  c.code as cours_actuel,
  CASE 
    WHEN LENGTH(e.nom_examen) > 40 THEN SUBSTRING(e.nom_examen FROM 1 FOR 37) || '...'
    ELSE e.nom_examen
  END as nom_examen,
  'PARFAIT' as statut,
  '✅ CORRECT' as action
FROM examens e
LEFT JOIN cours c ON e.cours_id = c.id
WHERE e.session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1)
  AND e.cours_id IS NOT NULL 
  AND c.code IS NOT NULL
  AND c.code = REGEXP_REPLACE(
    REGEXP_REPLACE(e.code_examen, '[^A-Z0-9]', '', 'g'),
    '([A-Z]+)([0-9]+).*',
    '\1\2'
  )
ORDER BY e.code_examen
LIMIT 10;

-- =====================================================
-- 6. SUGGESTIONS DE CORRECTION POUR WMEDE1150
-- =====================================================
SELECT 
  '=== SUGGESTIONS POUR WMEDE1150 ===' as diagnostic,
  c.code as cours_disponible,
  c.intitule_complet as nom_cours,
  CASE 
    WHEN c.code = 'WMEDE1150' THEN 'PARFAIT - Code exact'
    WHEN c.code LIKE 'WMEDE%' THEN 'BON - Même famille'
    WHEN c.code LIKE 'WMED%' THEN 'POSSIBLE - Famille proche'
    ELSE 'AUTRE'
  END as correspondance,
  c.id as cours_id,
  '' as nom_examen,
  '' as statut,
  CASE 
    WHEN c.code = 'WMEDE1150' THEN '🎯 RECOMMANDÉ'
    WHEN c.code LIKE 'WMEDE%' THEN '👍 ACCEPTABLE'
    WHEN c.code LIKE 'WMED%' THEN '🤔 À VÉRIFIER'
    ELSE '❓ AUTRE'
  END as action
FROM cours c
WHERE c.session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1)
  AND (
    c.code = 'WMEDE1150' OR 
    c.code LIKE 'WMEDE%' OR 
    c.code LIKE 'WMED%'
  )
ORDER BY 
  CASE 
    WHEN c.code = 'WMEDE1150' THEN 1
    WHEN c.code LIKE 'WMEDE%' THEN 2
    WHEN c.code LIKE 'WMED%' THEN 3
    ELSE 4
  END,
  c.code;