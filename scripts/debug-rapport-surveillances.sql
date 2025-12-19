-- Script de diagnostic pour le rapport des surveillances
-- Vérifier la structure des données dans examen_auditoires

-- 1. Vérifier s'il y a des données dans examen_auditoires
SELECT 
    'Total auditoires' as info,
    COUNT(*) as count
FROM examen_auditoires;

-- 2. Vérifier la structure du champ surveillants (UUID array)
SELECT 
    'Auditoires avec surveillants' as info,
    COUNT(*) as count
FROM examen_auditoires 
WHERE surveillants IS NOT NULL 
AND array_length(surveillants, 1) > 0;

-- 3. Examiner quelques exemples de données
SELECT 
    id,
    auditoire,
    surveillants,
    array_length(surveillants, 1) as nb_surveillants
FROM examen_auditoires 
WHERE surveillants IS NOT NULL 
AND array_length(surveillants, 1) > 0
LIMIT 5;

-- 4. Vérifier le format des surveillants (UUIDs)
SELECT 
    surveillants,
    unnest(surveillants) as surveillant_uuid
FROM examen_auditoires 
WHERE surveillants IS NOT NULL 
AND array_length(surveillants, 1) > 0
LIMIT 10;

-- 5. Vérifier les sessions actives
SELECT 
    id,
    name,
    is_active
FROM sessions 
WHERE is_active = true;

-- 6. Vérifier les examens de la session active
SELECT 
    COUNT(*) as nb_examens,
    session_id
FROM examens 
WHERE session_id IN (SELECT id FROM sessions WHERE is_active = true)
GROUP BY session_id;

-- 7. Vérifier la jointure examen_auditoires -> examens
SELECT 
    COUNT(*) as nb_auditoires_avec_examens
FROM examen_auditoires ea
INNER JOIN examens e ON e.id = ea.examen_id
WHERE e.session_id IN (SELECT id FROM sessions WHERE is_active = true);

-- 8. Vérifier quelques surveillants dans la table
SELECT 
    COUNT(*) as total_surveillants,
    COUNT(CASE WHEN is_active = true THEN 1 END) as surveillants_actifs
FROM surveillants;

-- 9. Exemple de données complètes
SELECT 
    ea.auditoire,
    ea.surveillants,
    e.code_examen,
    e.nom_examen,
    s.name as session_name
FROM examen_auditoires ea
INNER JOIN examens e ON e.id = ea.examen_id
INNER JOIN sessions s ON s.id = e.session_id
WHERE s.is_active = true
AND ea.surveillants IS NOT NULL 
AND jsonb_array_length(ea.surveillants) > 0
LIMIT 3;