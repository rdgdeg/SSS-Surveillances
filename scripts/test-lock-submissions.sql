-- Script de test pour le verrouillage des disponibilités
-- À exécuter dans Supabase SQL Editor

-- ============================================
-- 1. Vérifier que les colonnes existent
-- ============================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sessions' 
AND column_name IN ('lock_submissions', 'lock_message')
ORDER BY column_name;

-- ============================================
-- 2. Afficher l'état actuel de toutes les sessions
-- ============================================
SELECT 
    id,
    name,
    year,
    period,
    is_active,
    lock_submissions,
    CASE 
        WHEN lock_submissions THEN '🔒 Verrouillé'
        ELSE '🔓 Ouvert'
    END as statut,
    lock_message,
    created_at
FROM sessions
ORDER BY year DESC, period DESC;

-- ============================================
-- 3. Afficher uniquement la session active
-- ============================================
SELECT 
    id,
    name,
    is_active,
    lock_submissions,
    CASE 
        WHEN lock_submissions THEN '🔒 Verrouillé'
        ELSE '🔓 Ouvert'
    END as statut,
    lock_message
FROM sessions
WHERE is_active = true;

-- ============================================
-- 4. TEST : Verrouiller la session active
-- ============================================
-- Décommenter pour tester :
/*
UPDATE sessions
SET 
    lock_submissions = true,
    lock_message = 'La période de soumission des disponibilités est terminée. Pour toute modification exceptionnelle, contactez le secrétariat au 02/436.16.89.'
WHERE is_active = true;

-- Vérifier le résultat
SELECT 
    name,
    lock_submissions,
    lock_message
FROM sessions
WHERE is_active = true;
*/

-- ============================================
-- 5. TEST : Déverrouiller la session active
-- ============================================
-- Décommenter pour tester :
/*
UPDATE sessions
SET 
    lock_submissions = false,
    lock_message = NULL
WHERE is_active = true;

-- Vérifier le résultat
SELECT 
    name,
    lock_submissions,
    lock_message
FROM sessions
WHERE is_active = true;
*/

-- ============================================
-- 6. TEST : Modifier uniquement le message
-- ============================================
-- Décommenter pour tester :
/*
UPDATE sessions
SET 
    lock_message = 'Les disponibilités sont verrouillées pour la durée de la session d''examens. Pour tout changement de dernière minute, contactez immédiatement le secrétariat au 02/436.16.89.'
WHERE is_active = true;

-- Vérifier le résultat
SELECT 
    name,
    lock_submissions,
    lock_message
FROM sessions
WHERE is_active = true;
*/

-- ============================================
-- 7. Statistiques sur les soumissions
-- ============================================
-- Utile pour décider quand verrouiller
SELECT 
    s.name as session_name,
    s.lock_submissions,
    COUNT(DISTINCT sd.id) as nb_soumissions,
    COUNT(DISTINCT sd.email) as nb_surveillants_uniques,
    MIN(sd.submitted_at) as premiere_soumission,
    MAX(sd.submitted_at) as derniere_soumission,
    COUNT(DISTINCT CASE WHEN sd.updated_at IS NOT NULL AND sd.updated_at != sd.submitted_at THEN sd.id END) as nb_modifications
FROM sessions s
LEFT JOIN soumissions_disponibilites sd ON sd.session_id = s.id AND sd.deleted_at IS NULL
WHERE s.is_active = true
GROUP BY s.id, s.name, s.lock_submissions;

-- ============================================
-- 8. Vérifier les tentatives de soumission récentes
-- ============================================
-- Voir qui a soumis/modifié récemment
SELECT 
    sd.email,
    sd.nom,
    sd.prenom,
    sd.submitted_at,
    sd.updated_at,
    CASE 
        WHEN sd.updated_at IS NOT NULL AND sd.updated_at != sd.submitted_at 
        THEN 'Modifié'
        ELSE 'Soumis'
    END as action,
    COALESCE(
        jsonb_array_length(sd.historique_modifications::jsonb),
        0
    ) as nb_modifications
FROM soumissions_disponibilites sd
JOIN sessions s ON s.id = sd.session_id
WHERE s.is_active = true
AND sd.deleted_at IS NULL
ORDER BY COALESCE(sd.updated_at, sd.submitted_at) DESC
LIMIT 20;

-- ============================================
-- 9. Recommandation : Quand verrouiller ?
-- ============================================
-- Affiche des métriques pour décider
WITH session_stats AS (
    SELECT 
        s.id,
        s.name,
        s.lock_submissions,
        COUNT(DISTINCT sd.id) as nb_soumissions,
        COUNT(DISTINCT c.id) as nb_creneaux,
        COUNT(DISTINCT surv.id) as nb_surveillants_total,
        MAX(sd.submitted_at) as derniere_activite
    FROM sessions s
    LEFT JOIN soumissions_disponibilites sd ON sd.session_id = s.id AND sd.deleted_at IS NULL
    LEFT JOIN creneaux c ON c.session_id = s.id
    LEFT JOIN surveillants surv ON surv.is_active = true
    WHERE s.is_active = true
    GROUP BY s.id, s.name, s.lock_submissions
)
SELECT 
    name as session_name,
    lock_submissions,
    nb_soumissions,
    nb_surveillants_total,
    ROUND((nb_soumissions::numeric / NULLIF(nb_surveillants_total, 0)) * 100, 1) as taux_soumission_pct,
    derniere_activite,
    NOW() - derniere_activite as temps_depuis_derniere_activite,
    CASE 
        WHEN lock_submissions THEN '✅ Déjà verrouillé'
        WHEN (nb_soumissions::numeric / NULLIF(nb_surveillants_total, 0)) >= 0.9 
            AND (NOW() - derniere_activite) > INTERVAL '2 days'
        THEN '🟢 Recommandé : Vous pouvez verrouiller'
        WHEN (nb_soumissions::numeric / NULLIF(nb_surveillants_total, 0)) >= 0.7
        THEN '🟡 Attendre : Relancer les retardataires'
        ELSE '🔴 Trop tôt : Beaucoup de surveillants n''ont pas soumis'
    END as recommandation
FROM session_stats;

-- ============================================
-- 10. Nettoyage (si nécessaire)
-- ============================================
-- Réinitialiser toutes les sessions à "ouvert"
-- ⚠️ ATTENTION : À utiliser uniquement en développement/test
/*
UPDATE sessions
SET 
    lock_submissions = false,
    lock_message = NULL;

SELECT 'Toutes les sessions ont été déverrouillées' as resultat;
*/
