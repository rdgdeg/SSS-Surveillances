-- ============================================
-- Script de correction des ETP
-- À exécuter si vous avez déjà inséré les données
-- ============================================

-- Corriger les assistants où ETP total est NULL mais ETP recherche existe
UPDATE surveillants 
SET 
    etp_total = 0.3,
    quota_surveillances = 2
WHERE email = 'florence.pierrard@uclouvain.be';

UPDATE surveillants 
SET 
    etp_total = 0.7,
    quota_surveillances = 4
WHERE email = 'lisa.quertinmont@uclouvain.be';

-- Corriger les PAT où ETP total est NULL mais ETP recherche existe
UPDATE surveillants 
SET etp_total = 0.8
WHERE email = 'hala.affan@uclouvain.be';

-- Vérifier que tous les surveillants ont un ETP total
SELECT 
    type,
    COUNT(*) as total,
    COUNT(etp_total) as avec_etp,
    COUNT(*) - COUNT(etp_total) as sans_etp
FROM surveillants
GROUP BY type;

-- Afficher les surveillants sans ETP total
SELECT nom, prenom, email, type, etp_total, etp_recherche, etp_autre
FROM surveillants
WHERE etp_total IS NULL
ORDER BY type, nom;
