-- Correction des noms de facultés en acronymes dans la table surveillants
-- Remplace les noms complets par les acronymes standards

-- 1. Vérifier les valeurs actuelles
SELECT DISTINCT affectation_faculte, COUNT(*) as count
FROM surveillants
WHERE affectation_faculte IS NOT NULL
GROUP BY affectation_faculte
ORDER BY affectation_faculte;

-- 2. Corriger les noms de facultés en acronymes
UPDATE surveillants
SET affectation_faculte = CASE
    -- Faculté de Pharmacie et Sciences Biomédicales
    WHEN affectation_faculte ILIKE '%pharmacie%' OR affectation_faculte ILIKE '%biomédicales%' THEN 'FASB'
    WHEN affectation_faculte ILIKE '%FASB%' THEN 'FASB'
    
    -- Faculté de Médecine et Médecine Dentaire
    WHEN affectation_faculte ILIKE '%médecine%' OR affectation_faculte ILIKE '%dentaire%' THEN 'MED'
    WHEN affectation_faculte ILIKE '%MED%' THEN 'MED'
    
    -- École Polytechnique de Louvain
    WHEN affectation_faculte ILIKE '%polytechnique%' OR affectation_faculte ILIKE '%EPL%' THEN 'EPL'
    
    -- Faculté des Sciences
    WHEN affectation_faculte ILIKE '%sciences%' AND NOT affectation_faculte ILIKE '%biomédicales%' THEN 'SC'
    WHEN affectation_faculte = 'SC' THEN 'SC'
    
    -- Faculté de Philosophie, Arts et Lettres
    WHEN affectation_faculte ILIKE '%philosophie%' OR affectation_faculte ILIKE '%arts%' OR affectation_faculte ILIKE '%lettres%' THEN 'FIAL'
    WHEN affectation_faculte = 'FIAL' THEN 'FIAL'
    
    -- Faculté des Sciences Économiques, Sociales, Politiques et de Communication
    WHEN affectation_faculte ILIKE '%économiques%' OR affectation_faculte ILIKE '%sociales%' OR affectation_faculte ILIKE '%politiques%' OR affectation_faculte ILIKE '%communication%' THEN 'ESPO'
    WHEN affectation_faculte = 'ESPO' THEN 'ESPO'
    
    -- Faculté de Droit et de Criminologie
    WHEN affectation_faculte ILIKE '%droit%' OR affectation_faculte ILIKE '%criminologie%' THEN 'DRT'
    WHEN affectation_faculte = 'DRT' THEN 'DRT'
    
    -- Faculté de Théologie
    WHEN affectation_faculte ILIKE '%théologie%' THEN 'THEO'
    WHEN affectation_faculte = 'THEO' THEN 'THEO'
    
    -- Faculté des Sciences de la Motricité
    WHEN affectation_faculte ILIKE '%motricité%' THEN 'FSM'
    WHEN affectation_faculte = 'FSM' THEN 'FSM'
    
    -- Faculté d'Architecture, d'Ingénierie Architecturale, d'Urbanisme
    WHEN affectation_faculte ILIKE '%architecture%' OR affectation_faculte ILIKE '%urbanisme%' THEN 'LOCI'
    WHEN affectation_faculte = 'LOCI' THEN 'LOCI'
    
    -- Louvain School of Management
    WHEN affectation_faculte ILIKE '%management%' OR affectation_faculte ILIKE '%LSM%' THEN 'LSM'
    
    -- Faculté des Bioingénieurs
    WHEN affectation_faculte ILIKE '%bioingénieur%' OR affectation_faculte ILIKE '%agronomie%' THEN 'AGRO'
    WHEN affectation_faculte = 'AGRO' THEN 'AGRO'
    
    -- Sinon, garder la valeur actuelle si c'est déjà un acronyme court
    ELSE affectation_faculte
END
WHERE affectation_faculte IS NOT NULL;

-- 3. Vérifier le résultat
SELECT DISTINCT affectation_faculte, COUNT(*) as count
FROM surveillants
WHERE affectation_faculte IS NOT NULL
GROUP BY affectation_faculte
ORDER BY affectation_faculte;

-- 4. Afficher quelques exemples de surveillants avec leur faculté
SELECT id, nom, prenom, affectation_faculte
FROM surveillants
WHERE affectation_faculte IS NOT NULL
ORDER BY affectation_faculte, nom
LIMIT 20;
