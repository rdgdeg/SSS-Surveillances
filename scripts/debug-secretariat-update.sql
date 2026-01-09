-- Script de diagnostic pour tester la mise à jour du secrétariat

-- 1. Vérifier la structure de la table examens
\d examens;

-- 2. Voir quelques examens avec leur secrétariat actuel
SELECT id, code_examen, nom_examen, secretariat 
FROM examens 
WHERE session_id = (SELECT id FROM sessions WHERE is_active = true)
LIMIT 5;

-- 3. Tester une mise à jour manuelle (remplacer l'ID par un vrai ID d'examen)
-- UPDATE examens SET secretariat = 'MED' WHERE id = 'REMPLACER_PAR_VRAI_ID';

-- 4. Vérifier les permissions sur la table examens
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'examens';

-- 5. Vérifier s'il y a des triggers ou des contraintes
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'examens';

-- 6. Vérifier les contraintes CHECK sur la colonne secretariat
SELECT constraint_name, check_clause
FROM information_schema.check_constraints cc
JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
WHERE ccu.table_name = 'examens' AND ccu.column_name = 'secretariat';