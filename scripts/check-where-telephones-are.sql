-- Script pour vérifier où sont les téléphones

-- 1. Vérifier les téléphones dans soumissions_disponibilites
SELECT 
    'Dans soumissions_disponibilites' as localisation,
    COUNT(*) as total_soumissions,
    COUNT(telephone) FILTER (WHERE telephone IS NOT NULL AND telephone != '') as avec_telephone_rempli,
    COUNT(*) FILTER (WHERE telephone IS NULL OR telephone = '') as sans_telephone
FROM soumissions_disponibilites;

-- 2. Afficher quelques exemples de soumissions avec téléphone
SELECT 
    email,
    nom,
    prenom,
    telephone,
    submitted_at
FROM soumissions_disponibilites
WHERE telephone IS NOT NULL AND telephone != ''
ORDER BY submitted_at DESC
LIMIT 10;

-- 3. Vérifier les téléphones dans surveillants
SELECT 
    'Dans surveillants' as localisation,
    COUNT(*) as total_surveillants,
    COUNT(telephone) FILTER (WHERE telephone IS NOT NULL AND telephone != '') as avec_telephone_rempli,
    COUNT(*) FILTER (WHERE telephone IS NULL OR telephone = '') as sans_telephone
FROM surveillants;

-- 4. Afficher quelques exemples de surveillants avec téléphone
SELECT 
    email,
    nom,
    prenom,
    telephone
FROM surveillants
WHERE telephone IS NOT NULL AND telephone != ''
ORDER BY nom
LIMIT 10;

-- 5. Comparer : qui a un téléphone dans soumissions mais pas dans surveillants
SELECT 
    soum.email,
    soum.nom,
    soum.prenom,
    soum.telephone as tel_soumission,
    s.telephone as tel_surveillant,
    s.id as surveillant_id,
    CASE 
        WHEN s.id IS NULL THEN '❌ Pas dans table surveillants'
        WHEN s.telephone IS NULL OR s.telephone = '' THEN '⚠️ Téléphone manquant'
        ELSE '✓ OK'
    END as statut
FROM soumissions_disponibilites soum
LEFT JOIN surveillants s ON soum.email = s.email
WHERE soum.telephone IS NOT NULL AND soum.telephone != ''
ORDER BY statut, soum.nom;
