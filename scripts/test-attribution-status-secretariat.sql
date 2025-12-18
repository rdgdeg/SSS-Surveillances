-- Test pour vérifier le statut d'attribution avec mode secrétariat

-- 1. Créer un examen de test
INSERT INTO examens (id, code_examen, nom_examen, session_id, date_examen, heure_debut, heure_fin)
VALUES (
    'test-secretariat-exam',
    'TEST-SEC',
    'Test Examen Secrétariat',
    (SELECT id FROM sessions WHERE is_active = true LIMIT 1),
    '2025-01-15',
    '09:00',
    '12:00'
) ON CONFLICT (id) DO UPDATE SET
    nom_examen = EXCLUDED.nom_examen;

-- 2. Créer un auditoire de type secrétariat avec des surveillants
INSERT INTO examen_auditoires (
    examen_id,
    auditoire,
    nb_surveillants_requis,
    surveillants
) VALUES (
    'test-secretariat-exam',
    'Répartition à faire par le responsable ou le secrétariat',
    1,
    (
        SELECT jsonb_agg(id)
        FROM (
            SELECT id FROM surveillants 
            WHERE is_active = true 
            LIMIT 3
        ) s
    )
) ON CONFLICT (examen_id, auditoire) DO UPDATE SET
    surveillants = EXCLUDED.surveillants;

-- 3. Vérifier les données créées
SELECT 
    ea.examen_id,
    ea.auditoire,
    ea.nb_surveillants_requis,
    jsonb_array_length(ea.surveillants) as nb_surveillants_assignes,
    CASE 
        WHEN ea.auditoire ILIKE '%répartition%' OR ea.auditoire ILIKE '%secrétariat%' 
        THEN 'MODE_SECRETARIAT'
        ELSE 'MODE_NORMAL'
    END as mode_detection
FROM examen_auditoires ea
WHERE ea.examen_id = 'test-secretariat-exam';

-- 4. Simuler le calcul des statistiques comme dans le hook
WITH stats AS (
    SELECT 
        ea.examen_id,
        ea.auditoire,
        ea.nb_surveillants_requis,
        jsonb_array_length(COALESCE(ea.surveillants, '[]'::jsonb)) as nb_surveillants,
        CASE 
            WHEN ea.auditoire ILIKE '%répartition%' OR ea.auditoire ILIKE '%secrétariat%' 
            THEN 'secretariat'
            ELSE 'normal'
        END as type_auditoire
    FROM examen_auditoires ea
    WHERE ea.examen_id = 'test-secretariat-exam'
)
SELECT 
    examen_id,
    SUM(
        CASE 
            WHEN type_auditoire = 'secretariat' AND nb_surveillants > 0 
            THEN nb_surveillants  -- Pour secrétariat: requis = assignés si > 0
            ELSE nb_surveillants_requis  -- Pour normal: requis défini
        END
    ) as total_requis,
    SUM(nb_surveillants) as total_attribues,
    CASE 
        WHEN SUM(nb_surveillants) >= SUM(
            CASE 
                WHEN type_auditoire = 'secretariat' AND nb_surveillants > 0 
                THEN nb_surveillants
                ELSE nb_surveillants_requis
            END
        ) THEN 'COMPLET ✅'
        WHEN SUM(nb_surveillants) > 0 THEN 'PARTIEL 🟡'
        ELSE 'NON_ATTRIBUE ❌'
    END as statut_attribution
FROM stats
GROUP BY examen_id;

-- 5. Nettoyer les données de test
-- DELETE FROM examen_auditoires WHERE examen_id = 'test-secretariat-exam';
-- DELETE FROM examens WHERE id = 'test-secretariat-exam';