-- Script pour synchroniser manuellement les téléphones depuis les soumissions vers les surveillants

-- 1. Afficher l'état actuel
SELECT 
    'AVANT SYNCHRONISATION' as etape,
    COUNT(*) as total_surveillants,
    COUNT(telephone) FILTER (WHERE telephone IS NOT NULL AND telephone != '') as avec_telephone
FROM surveillants
WHERE is_active = true;

-- 2. Synchroniser les téléphones depuis les soumissions les plus récentes
UPDATE surveillants s
SET telephone = sub.telephone
FROM (
    SELECT DISTINCT ON (email) 
        email,
        telephone
    FROM soumissions_disponibilites
    WHERE telephone IS NOT NULL 
    AND telephone != ''
    ORDER BY email, submitted_at DESC
) sub
WHERE s.email = sub.email
AND s.is_active = true
AND (s.telephone IS NULL OR s.telephone = '');

-- 3. Afficher le résultat
SELECT 
    'APRÈS SYNCHRONISATION' as etape,
    COUNT(*) as total_surveillants,
    COUNT(telephone) FILTER (WHERE telephone IS NOT NULL AND telephone != '') as avec_telephone
FROM surveillants
WHERE is_active = true;

-- 4. Afficher quelques exemples de surveillants avec téléphone
SELECT 
    nom,
    prenom,
    email,
    telephone,
    'Depuis table surveillants' as source
FROM surveillants
WHERE telephone IS NOT NULL 
AND telephone != ''
AND is_active = true
ORDER BY nom
LIMIT 10;

-- 5. Afficher les téléphones disponibles dans les soumissions mais pas encore synchronisés
SELECT 
    soum.nom,
    soum.prenom,
    soum.email,
    soum.telephone,
    'Disponible dans soumissions' as source
FROM (
    SELECT DISTINCT ON (email) 
        nom, prenom, email, telephone
    FROM soumissions_disponibilites
    WHERE telephone IS NOT NULL 
    AND telephone != ''
    ORDER BY email, submitted_at DESC
) soum
LEFT JOIN surveillants s ON soum.email = s.email
WHERE s.email IS NULL OR s.is_active = false
ORDER BY soum.nom
LIMIT 10;