-- Script de diagnostic pour les problèmes de chargement des auditoires

-- 1. Vérifier si la colonne mode_attribution existe
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'examen_auditoires' 
ORDER BY ordinal_position;

-- 2. Vérifier les données existantes
SELECT 
    id,
    examen_id,
    auditoire,
    nb_surveillants_requis,
    array_length(surveillants, 1) as nb_surveillants,
    mode_attribution,
    created_at
FROM examen_auditoires 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Vérifier s'il y a des erreurs de contraintes
SELECT 
    constraint_name, 
    constraint_type,
    check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'examen_auditoires';

-- 4. Tester une requête simple comme celle du composant
SELECT *
FROM examen_auditoires
WHERE examen_id = (
    SELECT id FROM examens LIMIT 1
)
ORDER BY mode_attribution DESC, auditoire;

-- 5. Vérifier les permissions
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'examen_auditoires';