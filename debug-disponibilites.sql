-- Script de débogage pour vérifier les disponibilités

-- 1. Vérifier toutes les soumissions pour mathilde.akue
SELECT 
    id,
    email,
    nom,
    prenom,
    submitted_at,
    updated_at,
    deleted_at,
    CASE 
        WHEN deleted_at IS NULL THEN '✅ Active'
        ELSE '❌ Supprimée'
    END as statut,
    jsonb_array_length(historique_disponibilites) as nb_disponibilites
FROM soumissions_disponibilites
WHERE email = 'mathilde.akue@uclouvain.be'
ORDER BY submitted_at DESC;

-- 2. Vérifier les disponibilités dans l'historique
SELECT 
    s.email,
    s.deleted_at,
    d.value->>'creneau_id' as creneau_id,
    d.value->>'est_disponible' as est_disponible,
    c.date_surveillance,
    c.heure_debut_surveillance,
    c.heure_fin_surveillance
FROM soumissions_disponibilites s
CROSS JOIN jsonb_array_elements(s.historique_disponibilites) d
LEFT JOIN creneaux c ON c.id = (d.value->>'creneau_id')::uuid
WHERE s.email = 'mathilde.akue@uclouvain.be'
ORDER BY s.submitted_at DESC, c.date_surveillance, c.heure_debut_surveillance;

-- 3. Compter les soumissions actives vs supprimées
SELECT 
    CASE 
        WHEN deleted_at IS NULL THEN 'Active'
        ELSE 'Supprimée'
    END as statut,
    COUNT(*) as nombre
FROM soumissions_disponibilites
WHERE email = 'mathilde.akue@uclouvain.be'
GROUP BY CASE WHEN deleted_at IS NULL THEN 'Active' ELSE 'Supprimée' END;

-- 4. Vérifier la session active
SELECT 
    id,
    name,
    year,
    is_active
FROM sessions
WHERE is_active = true;

-- 5. Test de la requête utilisée par getExistingSubmission
-- Remplacer SESSION_ID par l'ID de la session active
SELECT *
FROM soumissions_disponibilites
WHERE session_id = 'SESSION_ID'  -- À remplacer
  AND email = 'mathilde.akue@uclouvain.be'
  AND deleted_at IS NULL
LIMIT 1;
