-- Requête simple pour voir les différences entre codes

SELECT 
    e.code_examen,
    -- Code attendu (extrait du code examen)
    REGEXP_REPLACE(
        REGEXP_REPLACE(e.code_examen, '[^A-Z0-9]', '', 'g'),
        '([A-Z]+)([0-9]+).*',
        '\1\2'
    ) as code_attendu,
    -- Code cours actuel
    COALESCE(c.code, 'AUCUN') as cours_actuel,
    -- Différence
    CASE 
        WHEN e.cours_id IS NULL THEN '❌ PAS DE COURS'
        WHEN c.code = REGEXP_REPLACE(
            REGEXP_REPLACE(e.code_examen, '[^A-Z0-9]', '', 'g'),
            '([A-Z]+)([0-9]+).*',
            '\1\2'
        ) THEN '✅ IDENTIQUE'
        ELSE '⚠️ DIFFÉRENT'
    END as difference
FROM examens e
LEFT JOIN cours c ON e.cours_id = c.id
WHERE e.session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1)
  AND (
    e.cours_id IS NULL OR 
    c.code != REGEXP_REPLACE(
        REGEXP_REPLACE(e.code_examen, '[^A-Z0-9]', '', 'g'),
        '([A-Z]+)([0-9]+).*',
        '\1\2'
    )
  )
ORDER BY e.code_examen;