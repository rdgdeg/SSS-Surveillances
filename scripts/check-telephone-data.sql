-- Script de vérification rapide des données téléphone

-- 1. Vérifier la structure de la table soumissions_disponibilites
\d soumissions_disponibilites

-- 2. Statistiques sur les téléphones dans les soumissions
SELECT 
    'Soumissions' as table_name,
    COUNT(*) as total,
    COUNT(telephone) as avec_telephone,
    COUNT(*) - COUNT(telephone) as sans_telephone,
    ROUND(COUNT(telephone)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as pourcentage_avec_tel
FROM soumissions_disponibilites;

-- 3. Statistiques sur les téléphones dans les surveillants
SELECT 
    'Surveillants' as table_name,
    COUNT(*) as total,
    COUNT(telephone) as avec_telephone,
    COUNT(*) - COUNT(telephone) as sans_telephone,
    ROUND(COUNT(telephone)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as pourcentage_avec_tel
FROM surveillants;

-- 4. Dernières soumissions avec téléphone
SELECT 
    email,
    nom,
    prenom,
    telephone,
    TO_CHAR(submitted_at, 'DD/MM/YYYY HH24:MI') as date_soumission
FROM soumissions_disponibilites
WHERE telephone IS NOT NULL
ORDER BY submitted_at DESC
LIMIT 10;

-- 5. Vérifier si le trigger de synchronisation existe
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'soumissions_disponibilites'
AND trigger_name = 'trigger_sync_telephone';
