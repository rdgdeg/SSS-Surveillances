-- ============================================
-- Script d'insertion de créneaux de test
-- Période: 02/01/2026 au 20/01/2026 (jours de semaine uniquement)
-- Créneaux: 08:15-11:00, 12:15-15:00, 15:45-18:30
-- ============================================

-- Récupérer l'ID de la session active
DO $$
DECLARE
    v_session_id UUID;
BEGIN
    -- Récupérer la session active
    SELECT id INTO v_session_id FROM sessions WHERE is_active = true LIMIT 1;
    
    IF v_session_id IS NULL THEN
        RAISE EXCEPTION 'Aucune session active trouvée. Veuillez d''abord créer une session active.';
    END IF;
    
    RAISE NOTICE 'Session active trouvée: %', v_session_id;
    
    -- Supprimer les créneaux existants pour cette session (optionnel - décommenter si nécessaire)
    -- DELETE FROM creneaux WHERE session_id = v_session_id;
    -- RAISE NOTICE 'Créneaux existants supprimés';
    
    -- Insérer les créneaux pour chaque jour de semaine
    -- Du 02/01/2026 (jeudi) au 20/01/2026 (mardi)
    
    -- Jeudi 02/01/2026
    INSERT INTO creneaux (session_id, date_surveillance, heure_debut_surveillance, heure_fin_surveillance, type_creneau)
    VALUES 
        (v_session_id, '2026-01-02', '08:15', '11:00', 'PRINCIPAL'),
        (v_session_id, '2026-01-02', '12:15', '15:00', 'PRINCIPAL'),
        (v_session_id, '2026-01-02', '15:45', '18:30', 'PRINCIPAL');
    
    -- Vendredi 03/01/2026
    INSERT INTO creneaux (session_id, date_surveillance, heure_debut_surveillance, heure_fin_surveillance, type_creneau)
    VALUES 
        (v_session_id, '2026-01-03', '08:15', '11:00', 'PRINCIPAL'),
        (v_session_id, '2026-01-03', '12:15', '15:00', 'PRINCIPAL'),
        (v_session_id, '2026-01-03', '15:45', '18:30', 'PRINCIPAL');
    
    -- Lundi 05/01/2026
    INSERT INTO creneaux (session_id, date_surveillance, heure_debut_surveillance, heure_fin_surveillance, type_creneau)
    VALUES 
        (v_session_id, '2026-01-05', '08:15', '11:00', 'PRINCIPAL'),
        (v_session_id, '2026-01-05', '12:15', '15:00', 'PRINCIPAL'),
        (v_session_id, '2026-01-05', '15:45', '18:30', 'PRINCIPAL');
    
    -- Mardi 06/01/2026
    INSERT INTO creneaux (session_id, date_surveillance, heure_debut_surveillance, heure_fin_surveillance, type_creneau)
    VALUES 
        (v_session_id, '2026-01-06', '08:15', '11:00', 'PRINCIPAL'),
        (v_session_id, '2026-01-06', '12:15', '15:00', 'PRINCIPAL'),
        (v_session_id, '2026-01-06', '15:45', '18:30', 'PRINCIPAL');
    
    -- Mercredi 07/01/2026
    INSERT INTO creneaux (session_id, date_surveillance, heure_debut_surveillance, heure_fin_surveillance, type_creneau)
    VALUES 
        (v_session_id, '2026-01-07', '08:15', '11:00', 'PRINCIPAL'),
        (v_session_id, '2026-01-07', '12:15', '15:00', 'PRINCIPAL'),
        (v_session_id, '2026-01-07', '15:45', '18:30', 'PRINCIPAL');
    
    -- Jeudi 08/01/2026
    INSERT INTO creneaux (session_id, date_surveillance, heure_debut_surveillance, heure_fin_surveillance, type_creneau)
    VALUES 
        (v_session_id, '2026-01-08', '08:15', '11:00', 'PRINCIPAL'),
        (v_session_id, '2026-01-08', '12:15', '15:00', 'PRINCIPAL'),
        (v_session_id, '2026-01-08', '15:45', '18:30', 'PRINCIPAL');
    
    -- Vendredi 09/01/2026
    INSERT INTO creneaux (session_id, date_surveillance, heure_debut_surveillance, heure_fin_surveillance, type_creneau)
    VALUES 
        (v_session_id, '2026-01-09', '08:15', '11:00', 'PRINCIPAL'),
        (v_session_id, '2026-01-09', '12:15', '15:00', 'PRINCIPAL'),
        (v_session_id, '2026-01-09', '15:45', '18:30', 'PRINCIPAL');
    
    -- Lundi 12/01/2026
    INSERT INTO creneaux (session_id, date_surveillance, heure_debut_surveillance, heure_fin_surveillance, type_creneau)
    VALUES 
        (v_session_id, '2026-01-12', '08:15', '11:00', 'PRINCIPAL'),
        (v_session_id, '2026-01-12', '12:15', '15:00', 'PRINCIPAL'),
        (v_session_id, '2026-01-12', '15:45', '18:30', 'PRINCIPAL');
    
    -- Mardi 13/01/2026
    INSERT INTO creneaux (session_id, date_surveillance, heure_debut_surveillance, heure_fin_surveillance, type_creneau)
    VALUES 
        (v_session_id, '2026-01-13', '08:15', '11:00', 'PRINCIPAL'),
        (v_session_id, '2026-01-13', '12:15', '15:00', 'PRINCIPAL'),
        (v_session_id, '2026-01-13', '15:45', '18:30', 'PRINCIPAL');
    
    -- Mercredi 14/01/2026
    INSERT INTO creneaux (session_id, date_surveillance, heure_debut_surveillance, heure_fin_surveillance, type_creneau)
    VALUES 
        (v_session_id, '2026-01-14', '08:15', '11:00', 'PRINCIPAL'),
        (v_session_id, '2026-01-14', '12:15', '15:00', 'PRINCIPAL'),
        (v_session_id, '2026-01-14', '15:45', '18:30', 'PRINCIPAL');
    
    -- Jeudi 15/01/2026
    INSERT INTO creneaux (session_id, date_surveillance, heure_debut_surveillance, heure_fin_surveillance, type_creneau)
    VALUES 
        (v_session_id, '2026-01-15', '08:15', '11:00', 'PRINCIPAL'),
        (v_session_id, '2026-01-15', '12:15', '15:00', 'PRINCIPAL'),
        (v_session_id, '2026-01-15', '15:45', '18:30', 'PRINCIPAL');
    
    -- Vendredi 16/01/2026
    INSERT INTO creneaux (session_id, date_surveillance, heure_debut_surveillance, heure_fin_surveillance, type_creneau)
    VALUES 
        (v_session_id, '2026-01-16', '08:15', '11:00', 'PRINCIPAL'),
        (v_session_id, '2026-01-16', '12:15', '15:00', 'PRINCIPAL'),
        (v_session_id, '2026-01-16', '15:45', '18:30', 'PRINCIPAL');
    
    -- Lundi 19/01/2026
    INSERT INTO creneaux (session_id, date_surveillance, heure_debut_surveillance, heure_fin_surveillance, type_creneau)
    VALUES 
        (v_session_id, '2026-01-19', '08:15', '11:00', 'PRINCIPAL'),
        (v_session_id, '2026-01-19', '12:15', '15:00', 'PRINCIPAL'),
        (v_session_id, '2026-01-19', '15:45', '18:30', 'PRINCIPAL');
    
    -- Mardi 20/01/2026
    INSERT INTO creneaux (session_id, date_surveillance, heure_debut_surveillance, heure_fin_surveillance, type_creneau)
    VALUES 
        (v_session_id, '2026-01-20', '08:15', '11:00', 'PRINCIPAL'),
        (v_session_id, '2026-01-20', '12:15', '15:00', 'PRINCIPAL'),
        (v_session_id, '2026-01-20', '15:45', '18:30', 'PRINCIPAL');
    
    RAISE NOTICE 'Créneaux de test insérés avec succès!';
    RAISE NOTICE 'Total: 42 créneaux (14 jours × 3 créneaux par jour)';
    
END $$;

-- Vérifier les créneaux insérés
SELECT 
    date_surveillance,
    heure_debut_surveillance,
    heure_fin_surveillance,
    type_creneau,
    COUNT(*) as nombre
FROM creneaux c
JOIN sessions s ON c.session_id = s.id
WHERE s.is_active = true
AND date_surveillance BETWEEN '2026-01-02' AND '2026-01-20'
GROUP BY date_surveillance, heure_debut_surveillance, heure_fin_surveillance, type_creneau
ORDER BY date_surveillance, heure_debut_surveillance;
