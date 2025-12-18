-- Script de test pour la nouvelle fonctionnalité d'attribution flexible

-- 1. Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'examen_auditoires' 
AND column_name = 'mode_attribution';

-- 2. Vérifier les contraintes
SELECT constraint_name, check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%mode_attribution%';

-- 3. Tester l'insertion avec le nouveau champ
-- (Remplacer 'your-exam-id' par un vrai ID d'examen)
/*
INSERT INTO examen_auditoires (
    examen_id, 
    auditoire, 
    nb_surveillants_requis, 
    surveillants, 
    mode_attribution
) VALUES (
    'your-exam-id',
    'Surveillants (auditoires attribués par le secrétariat)',
    3,
    '[]'::jsonb,
    'secretariat'
);
*/

-- 4. Vérifier les données existantes (doivent avoir mode_attribution = 'auditoire' par défaut)
SELECT 
    id,
    auditoire,
    mode_attribution,
    COALESCE(mode_attribution, 'auditoire') as mode_effectif
FROM examen_auditoires 
LIMIT 5;

-- 5. Compter par mode d'attribution
SELECT 
    COALESCE(mode_attribution, 'auditoire') as mode,
    COUNT(*) as nombre
FROM examen_auditoires 
GROUP BY COALESCE(mode_attribution, 'auditoire');