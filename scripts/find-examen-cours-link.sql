-- Script rapide pour identifier le cours lié à un examen spécifique
-- Remplacer 'VOTRE_CODE_EXAMEN' par le code de l'examen à vérifier

-- 1. Informations complètes sur l'examen et son cours lié
SELECT 
    '=== INFORMATIONS EXAMEN ===' as section,
    e.id as examen_id,
    e.code_examen,
    e.nom_examen,
    e.date_examen,
    e.heure_debut,
    e.heure_fin,
    e.auditoires,
    e.secretariat,
    e.enseignants as examen_enseignants,
    e.cours_id
FROM examens e
WHERE e.code_examen = 'VOTRE_CODE_EXAMEN'
  AND e.session_id = (SELECT id FROM sessions WHERE is_active = true);

-- 2. Informations sur le cours lié (si il y en a un)
SELECT 
    '=== COURS LIÉ ===' as section,
    c.id as cours_id,
    c.code as code_cours,
    c.intitule_complet as nom_cours,
    c.enseignants as cours_enseignants,
    c.consignes as consignes_cours
FROM examens e
JOIN cours c ON e.cours_id = c.id
WHERE e.code_examen = 'VOTRE_CODE_EXAMEN'
  AND e.session_id = (SELECT id FROM sessions WHERE is_active = true);

-- 3. Si pas de cours lié, chercher des cours similaires
SELECT 
    '=== COURS SIMILAIRES POSSIBLES ===' as section,
    c.id as cours_id,
    c.code as code_cours,
    c.intitule_complet as nom_cours,
    c.enseignants,
    'Correspondance possible' as suggestion
FROM cours c
WHERE c.session_id = (SELECT id FROM sessions WHERE is_active = true)
  AND (
    -- Recherche par code similaire
    c.code ILIKE '%' || (
      SELECT SUBSTRING(code_examen FROM '^[A-Z]+[0-9]+') 
      FROM examens 
      WHERE code_examen = 'VOTRE_CODE_EXAMEN'
    ) || '%'
    OR
    -- Recherche par nom similaire
    c.intitule_complet ILIKE '%' || (
      SELECT SPLIT_PART(nom_examen, ' ', 1)
      FROM examens 
      WHERE code_examen = 'VOTRE_CODE_EXAMEN'
    ) || '%'
  )
ORDER BY c.code;

-- 4. Vérifier si l'examen existe
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ EXAMEN NON TROUVÉ'
        WHEN COUNT(*) = 1 AND cours_id IS NOT NULL THEN '✅ EXAMEN TROUVÉ ET LIÉ'
        WHEN COUNT(*) = 1 AND cours_id IS NULL THEN '⚠️ EXAMEN TROUVÉ MAIS NON LIÉ'
        ELSE '⚠️ PLUSIEURS EXAMENS TROUVÉS'
    END as statut,
    COUNT(*) as nombre_examens_trouves
FROM examens e
WHERE e.code_examen = 'VOTRE_CODE_EXAMEN'
  AND e.session_id = (SELECT id FROM sessions WHERE is_active = true);

-- INSTRUCTIONS D'UTILISATION :
-- 1. Remplacer 'VOTRE_CODE_EXAMEN' par le vrai code (ex: 'WINTR2105')
-- 2. Exécuter le script
-- 3. Analyser les résultats pour identifier le problème