-- Script pour lister tous les surveillants actifs et voir leurs noms exacts

SELECT 
    nom,
    prenom,
    email,
    telephone,
    type,
    CASE 
        WHEN telephone IS NOT NULL AND telephone != '' THEN '✓ A un téléphone'
        ELSE '❌ Pas de téléphone'
    END as statut_telephone
FROM surveillants
WHERE is_active = true
ORDER BY nom, prenom;

-- Statistiques
SELECT 
    'STATISTIQUES' as section,
    COUNT(*) as total_surveillants_actifs,
    COUNT(telephone) FILTER (WHERE telephone IS NOT NULL AND telephone != '') as avec_telephone,
    COUNT(*) FILTER (WHERE telephone IS NULL OR telephone = '') as sans_telephone,
    ROUND(
        (COUNT(telephone) FILTER (WHERE telephone IS NOT NULL AND telephone != '') * 100.0) / COUNT(*), 
        1
    ) as pourcentage_avec_telephone
FROM surveillants
WHERE is_active = true;