-- ============================================
-- Script de suppression des créneaux de test
-- Période: 02/01/2026 au 20/01/2026
-- ============================================

-- Option 1: Supprimer TOUS les créneaux de la session active
-- ATTENTION: Ceci supprimera TOUS les créneaux, pas seulement ceux de test!
-- Décommenter la ligne suivante pour l'utiliser:
-- DELETE FROM creneaux WHERE session_id IN (SELECT id FROM sessions WHERE is_active = true);

-- Option 2: Supprimer uniquement les créneaux de la période de test (RECOMMANDÉ)
DELETE FROM creneaux 
WHERE session_id IN (SELECT id FROM sessions WHERE is_active = true)
AND date_surveillance BETWEEN '2026-01-02' AND '2026-01-20';

-- Afficher le résultat
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'Tous les créneaux de test ont été supprimés avec succès!'
        ELSE 'Il reste ' || COUNT(*) || ' créneaux dans la période de test'
    END as resultat
FROM creneaux c
JOIN sessions s ON c.session_id = s.id
WHERE s.is_active = true
AND date_surveillance BETWEEN '2026-01-02' AND '2026-01-20';

-- Afficher le nombre total de créneaux restants
SELECT 
    COUNT(*) as total_creneaux_restants,
    MIN(date_surveillance) as premiere_date,
    MAX(date_surveillance) as derniere_date
FROM creneaux c
JOIN sessions s ON c.session_id = s.id
WHERE s.is_active = true;
