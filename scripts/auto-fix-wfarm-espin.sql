-- Correction automatique de WFARM1160 et ESPIN2515
-- ATTENTION: Exécuter seulement après avoir vérifié les cours disponibles

-- Correction WFARM1160
UPDATE examens 
SET cours_id = (
    SELECT id FROM cours 
    WHERE code = 'WFARM1160' 
      AND session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1)
    LIMIT 1
)
WHERE code_examen = 'WFARM1160'
  AND session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1)
  AND EXISTS (
    SELECT 1 FROM cours 
    WHERE code = 'WFARM1160' 
      AND session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1)
  );

-- Correction ESPIN2515
UPDATE examens 
SET cours_id = (
    SELECT id FROM cours 
    WHERE code = 'ESPIN2515' 
      AND session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1)
    LIMIT 1
)
WHERE code_examen = 'ESPIN2515'
  AND session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1)
  AND EXISTS (
    SELECT 1 FROM cours 
    WHERE code = 'ESPIN2515' 
      AND session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1)
  );

-- Vérification des corrections
SELECT 
    'RÉSULTAT CORRECTIONS' as section,
    e.code_examen,
    c.code as cours_lie,
    CASE 
        WHEN c.code = e.code_examen THEN '✅ CORRIGÉ'
        WHEN e.cours_id IS NULL THEN '⚠️ COURS INEXISTANT'
        ELSE '❌ ÉCHEC'
    END as resultat
FROM examens e
LEFT JOIN cours c ON e.cours_id = c.id
WHERE e.code_examen IN ('WFARM1160', 'ESPIN2515')
  AND e.session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1);