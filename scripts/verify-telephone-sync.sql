-- Script de vérification de la synchronisation des téléphones

-- 1. Vérifier les téléphones dans les soumissions
SELECT 
    'Soumissions avec téléphone' as source,
    COUNT(*) as total,
    COUNT(telephone) as avec_telephone,
    COUNT(*) - COUNT(telephone) as sans_telephone
FROM soumissions_disponibilites;

-- 2. Afficher les dernières soumissions avec téléphone
SELECT 
    email,
    nom,
    prenom,
    telephone,
    submitted_at,
    updated_at
FROM soumissions_disponibilites
WHERE telephone IS NOT NULL AND telephone != ''
ORDER BY submitted_at DESC
LIMIT 10;

-- 3. Vérifier les téléphones dans la table surveillants
SELECT 
    'Surveillants avec téléphone' as source,
    COUNT(*) as total,
    COUNT(telephone) as avec_telephone,
    COUNT(*) - COUNT(telephone) as sans_telephone
FROM surveillants;

-- 4. Comparer soumissions vs surveillants
SELECT 
    s.email,
    s.nom,
    s.prenom,
    soum.telephone as telephone_soumission,
    s.telephone as telephone_surveillant,
    CASE 
        WHEN soum.telephone IS NOT NULL AND s.telephone IS NULL THEN '⚠️ Manquant dans surveillants'
        WHEN soum.telephone IS NOT NULL AND s.telephone IS NOT NULL THEN '✓ Synchronisé'
        WHEN soum.telephone IS NULL THEN '- Pas de téléphone dans soumission'
    END as statut
FROM surveillants s
LEFT JOIN (
    SELECT DISTINCT ON (email) 
        email, 
        telephone,
        submitted_at
    FROM soumissions_disponibilites
    WHERE telephone IS NOT NULL AND telephone != ''
    ORDER BY email, submitted_at DESC
) soum ON s.email = soum.email
ORDER BY 
    CASE 
        WHEN soum.telephone IS NOT NULL AND s.telephone IS NULL THEN 1
        ELSE 2
    END,
    s.nom;

-- 5. Vérifier si le trigger existe
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'soumissions_disponibilites'
AND trigger_name = 'trigger_sync_telephone';

-- 6. Vérifier si la fonction existe
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_name = 'sync_telephone_from_soumission'
AND routine_schema = 'public';
