-- Script pour synchroniser manuellement les téléphones depuis les soumissions

-- 1. Voir les téléphones dans les soumissions qui ne sont pas dans surveillants
SELECT 
    s.nom,
    s.prenom,
    s.email,
    s.telephone as telephone_surveillant,
    sub.telephone as telephone_soumission,
    sub.submitted_at
FROM surveillants s
INNER JOIN soumissions_disponibilites sub ON s.id = sub.surveillant_id
WHERE sub.telephone IS NOT NULL 
AND sub.telephone != ''
AND (s.telephone IS NULL OR s.telephone = '' OR s.telephone != sub.telephone)
ORDER BY s.nom, sub.submitted_at DESC;

-- 2. Mettre à jour les téléphones manquants
-- (Prend le téléphone de la soumission la plus récente)
UPDATE surveillants s
SET telephone = sub.telephone
FROM (
    SELECT DISTINCT ON (surveillant_id) 
        surveillant_id,
        telephone,
        submitted_at
    FROM soumissions_disponibilites
    WHERE surveillant_id IS NOT NULL 
    AND telephone IS NOT NULL 
    AND telephone != ''
    ORDER BY surveillant_id, submitted_at DESC
) sub
WHERE s.id = sub.surveillant_id
AND (s.telephone IS NULL OR s.telephone = '');

-- 3. Vérifier le résultat
SELECT 
    nom,
    prenom,
    email,
    telephone,
    CASE 
        WHEN telephone IS NOT NULL AND telephone != '' THEN '✅ OK'
        ELSE '❌ Manquant'
    END as statut
FROM surveillants
ORDER BY nom;
