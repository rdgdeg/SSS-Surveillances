-- Correction de l'intitulé FASB dans la table consignes_secretariat
-- L'intitulé incorrect "Faculté des Sciences Agronomiques et de Bioingénierie"
-- doit être remplacé par "Faculté de Pharmacie et Sciences Biomédicales"

-- 1. Vérifier les données actuelles
SELECT code_secretariat, nom_secretariat 
FROM consignes_secretariat 
WHERE code_secretariat = 'FASB';

-- 2. Corriger l'intitulé FASB
UPDATE consignes_secretariat 
SET nom_secretariat = 'Faculté de Pharmacie et Sciences Biomédicales'
WHERE code_secretariat = 'FASB';

-- 3. Vérifier le résultat
SELECT code_secretariat, nom_secretariat 
FROM consignes_secretariat 
WHERE code_secretariat = 'FASB';

-- 4. Afficher tous les secrétariats pour vérification
SELECT code_secretariat, nom_secretariat 
FROM consignes_secretariat 
ORDER BY code_secretariat;
