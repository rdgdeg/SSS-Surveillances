-- Requête pour vérifier les différences entre code cours et code examen

SELECT 
    e.code_examen,
    e.nom_examen,
    -- Extraction du code cours attendu depuis le code examen
    REGEXP_REPLACE(
        REGEXP_REPLACE(e.code_examen, '[^A-Z0-9]', '', 'g'),
        '([A-Z]+)([0-9]+).*',
        '\1\2'
    ) as code_attendu,
    c.code as cours_actuel,
    c.intitule_complet as nom_cours,
    -- Classification de la différence
    CASE 
        WHEN e.cours_id IS NULL THEN 'ORPHELIN'
        WHEN c.code IS NULL THEN 'COURS_INEXISTANT'
        WHEN c.code = REGEXP_REPLACE(
            REGEXP_REPLACE(e.code_examen, '[^A-Z0-9]', '', 'g'),
            '([A-Z]+)([0-9]+).*',
            '\1\2'
        ) THEN 'PARFAIT'
        WHEN c.code LIKE SUBSTRING(REGEXP_REPLACE(
            REGEXP_REPLACE(e.code_examen, '[^A-Z0-9]', '', 'g'),
            '([A-Z]+)([0-9]+).*',
            '\1\2'
        ) FROM 1 FOR 4) || '%' THEN 'FAMILLE_PROCHE'
        ELSE 'DIFFERENT'
    END as statut,
    -- Détails de la différence
    CASE 
        WHEN e.cours_id IS NULL THEN 'Examen sans cours lié'
        WHEN c.code IS NULL THEN 'Cours inexistant'
        WHEN c.code = REGEXP_REPLACE(
            REGEXP_REPLACE(e.code_examen, '[^A-Z0-9]', '', 'g'),
            '([A-Z]+)([0-9]+).*',
            '\1\2'
        ) THEN 'Codes identiques'
        WHEN c.code LIKE SUBSTRING(REGEXP_REPLACE(
            REGEXP_REPLACE(e.code_examen, '[^A-Z0-9]', '', 'g'),
            '([A-Z]+)([0-9]+).*',
            '\1\2'
        ) FROM 1 FOR 4) || '%' THEN 'Même famille de cours'
        ELSE 'Codes complètement différents'
    END as description,
    e.id as examen_id,
    e.cours_id
FROM examens e
LEFT JOIN cours c ON e.cours_id = c.id
WHERE e.session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1)
ORDER BY 
    CASE 
        WHEN e.cours_id IS NULL THEN 1
        WHEN c.code != REGEXP_REPLACE(
            REGEXP_REPLACE(e.code_examen, '[^A-Z0-9]', '', 'g'),
            '([A-Z]+)([0-9]+).*',
            '\1\2'
        ) THEN 2
        ELSE 3
    END,
    e.code_examen;