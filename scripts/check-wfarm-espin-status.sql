-- Vérification rapide de l'état actuel de WFARM1160 et ESPIN2515

SELECT 
    e.code_examen,
    -- Code attendu
    e.code_examen as code_attendu,
    -- Code cours actuel
    COALESCE(c.code, 'AUCUN COURS') as cours_actuel,
    -- Nom du cours actuel
    COALESCE(c.intitule_complet, 'Pas de cours lié') as nom_cours,
    -- Statut
    CASE 
        WHEN e.cours_id IS NULL THEN '❌ ORPHELIN'
        WHEN c.code = e.code_examen THEN '✅ CORRECT'
        ELSE '⚠️ INCORRECT'
    END as statut,
    -- IDs pour correction
    e.id as examen_id,
    e.cours_id as cours_id_actuel
FROM examens e
LEFT JOIN cours c ON e.cours_id = c.id
WHERE e.code_examen IN ('WFARM1160', 'ESPIN2515')
  AND e.session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1)
ORDER BY e.code_examen;