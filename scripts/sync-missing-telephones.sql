-- Script pour synchroniser manuellement les téléphones manquants

-- 1. Afficher les téléphones qui vont être synchronisés
SELECT 
    s.email,
    s.nom,
    s.prenom,
    s.telephone as ancien_telephone,
    soum.telephone as nouveau_telephone
FROM surveillants s
INNER JOIN (
    SELECT DISTINCT ON (email) 
        email, 
        telephone,
        submitted_at
    FROM soumissions_disponibilites
    WHERE telephone IS NOT NULL AND telephone != ''
    ORDER BY email, submitted_at DESC
) soum ON s.email = soum.email
WHERE s.telephone IS NULL OR s.telephone = '';

-- 2. Effectuer la synchronisation
UPDATE surveillants s
SET telephone = soum.telephone
FROM (
    SELECT DISTINCT ON (email) 
        email, 
        telephone,
        submitted_at
    FROM soumissions_disponibilites
    WHERE telephone IS NOT NULL AND telephone != ''
    ORDER BY email, submitted_at DESC
) soum
WHERE s.email = soum.email
AND (s.telephone IS NULL OR s.telephone = '');

-- 3. Afficher le résultat
SELECT 
    COUNT(*) as surveillants_mis_a_jour
FROM surveillants
WHERE telephone IS NOT NULL AND telephone != '';

-- 4. Afficher les surveillants avec téléphone maintenant
SELECT 
    email,
    nom,
    prenom,
    telephone,
    type
FROM surveillants
WHERE telephone IS NOT NULL AND telephone != ''
ORDER BY nom, prenom;
