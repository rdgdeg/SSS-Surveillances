-- ============================================
-- Script pour synchroniser les surveillants depuis les soumissions
-- ============================================
-- Ce script ajoute automatiquement dans la table surveillants
-- toutes les personnes qui ont soumis des disponibilités
-- mais qui ne sont pas encore dans la liste des surveillants

-- Étape 1: Identifier les soumissions sans surveillant correspondant
SELECT 
    sd.email,
    sd.nom,
    sd.prenom,
    sd.type_surveillant,
    COUNT(*) as nb_soumissions
FROM soumissions_disponibilites sd
LEFT JOIN surveillants s ON s.email = sd.email
WHERE s.id IS NULL
GROUP BY sd.email, sd.nom, sd.prenom, sd.type_surveillant
ORDER BY sd.email;

-- Étape 2: Insérer les surveillants manquants
-- (Décommenter pour exécuter)
/*
INSERT INTO surveillants (
    email,
    nom,
    prenom,
    type,
    is_active
)
SELECT DISTINCT ON (sd.email)
    sd.email,
    sd.nom,
    sd.prenom,
    sd.type_surveillant,
    true
FROM soumissions_disponibilites sd
LEFT JOIN surveillants s ON s.email = sd.email
WHERE s.id IS NULL
ON CONFLICT (email) DO NOTHING;
*/

-- Étape 3: Mettre à jour le lien surveillant_id dans les soumissions
-- (Décommenter pour exécuter)
/*
UPDATE soumissions_disponibilites sd
SET surveillant_id = s.id
FROM surveillants s
WHERE sd.email = s.email
AND sd.surveillant_id IS NULL;
*/

-- Étape 4: Vérifier le résultat
SELECT 
    COUNT(*) as total_soumissions,
    COUNT(surveillant_id) as soumissions_avec_surveillant,
    COUNT(*) - COUNT(surveillant_id) as soumissions_sans_surveillant
FROM soumissions_disponibilites;
