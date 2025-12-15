-- Script pour trouver les correspondances de noms avec les téléphones connus

-- 1. Afficher tous les surveillants actifs pour voir les noms exacts
SELECT 
    nom,
    prenom,
    email,
    telephone,
    CASE 
        WHEN telephone IS NOT NULL AND telephone != '' THEN '✓ A déjà un téléphone'
        ELSE '❌ Pas de téléphone'
    END as statut_telephone
FROM surveillants
WHERE is_active = true
ORDER BY nom, prenom;

-- 2. Recherche par similarité pour les noms connus
-- Utilisation de ILIKE pour une recherche insensible à la casse et aux accents

-- ASSOIGNON Théo
SELECT 'ASSOIGNON Théo' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%ASSOIGNON%' OR nom ILIKE '%THEO%' OR prenom ILIKE '%THEO%')
UNION ALL

-- ATIK Hicham
SELECT 'ATIK Hicham' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%ATIK%' OR prenom ILIKE '%HICHAM%')
UNION ALL

-- AUQUIERE Marie
SELECT 'AUQUIERE Marie' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%AUQUIERE%' OR (nom ILIKE '%MARIE%' OR prenom ILIKE '%MARIE%'))
UNION ALL

-- BARBÉ Alice
SELECT 'BARBÉ Alice' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%BARB%' OR prenom ILIKE '%ALICE%')
UNION ALL

-- BECKERS Pauline
SELECT 'BECKERS Pauline' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%BECKER%' OR prenom ILIKE '%PAULINE%')
UNION ALL

-- BRACONNIER Pauline
SELECT 'BRACONNIER Pauline' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%BRACONNIER%' OR (nom ILIKE '%PAULINE%' OR prenom ILIKE '%PAULINE%'))
UNION ALL

-- CAPIAU Madeleine
SELECT 'CAPIAU Madeleine' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%CAPIAU%' OR prenom ILIKE '%MADELEINE%')
UNION ALL

-- CHARLIER Mathilde
SELECT 'CHARLIER Mathilde' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%CHARLIER%' OR prenom ILIKE '%MATHILDE%')
UNION ALL

-- CHOME Céline
SELECT 'CHOME Céline' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%CHOME%' OR prenom ILIKE '%CELINE%')
UNION ALL

-- CHOTEAU Mathilde
SELECT 'CHOTEAU Mathilde' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%CHOTEAU%' OR (nom ILIKE '%MATHILDE%' OR prenom ILIKE '%MATHILDE%'))
UNION ALL

-- CHRETIEN Antoine
SELECT 'CHRETIEN Antoine' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%CHRETIEN%' OR nom ILIKE '%CHRETIEN%' OR prenom ILIKE '%ANTOINE%')
UNION ALL

-- COLAK Ramazan
SELECT 'COLAK Ramazan' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%COLAK%' OR prenom ILIKE '%RAMAZAN%')
UNION ALL

-- COMEIN Audrey
SELECT 'COMEIN Audrey' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%COMEIN%' OR prenom ILIKE '%AUDREY%')
UNION ALL

-- DE LOOF Marine
SELECT 'DE LOOF Marine' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%LOOF%' OR nom ILIKE '%DE LOOF%' OR prenom ILIKE '%MARINE%')
UNION ALL

-- DE MONTIGNY Manon
SELECT 'DE MONTIGNY Manon' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%MONTIGNY%' OR nom ILIKE '%DE MONTIGNY%' OR prenom ILIKE '%MANON%')
UNION ALL

-- DECHENNE Juhans
SELECT 'DECHENNE Juhans' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%DECHENNE%' OR prenom ILIKE '%JUHANS%')
UNION ALL

-- DECLERCK Louise
SELECT 'DECLERCK Louise' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%DECLERCK%' OR prenom ILIKE '%LOUISE%')
UNION ALL

-- DEVIS Julie
SELECT 'DEVIS Julie' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%DEVIS%' OR prenom ILIKE '%JULIE%')
UNION ALL

-- DJURKIN Andrej
SELECT 'DJURKIN Andrej' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%DJURKIN%' OR prenom ILIKE '%ANDREJ%')
UNION ALL

-- EVRARD Perrine
SELECT 'EVRARD Perrine' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%EVRARD%' OR prenom ILIKE '%PERRINE%')
UNION ALL

-- FUCHS Victoria
SELECT 'FUCHS Victoria' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%FUCHS%' OR prenom ILIKE '%VICTORIA%')
UNION ALL

-- GHODSI Marine
SELECT 'GHODSI Marine' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%GHODSI%' OR (nom ILIKE '%MARINE%' OR prenom ILIKE '%MARINE%'))
UNION ALL

-- HAJJ HASSAN Yara
SELECT 'HAJJ HASSAN Yara' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%HAJJ%' OR nom ILIKE '%HASSAN%' OR prenom ILIKE '%YARA%')
UNION ALL

-- IORDANESCU Andra
SELECT 'IORDANESCU Andra' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%IORDANESCU%' OR prenom ILIKE '%ANDRA%')
UNION ALL

-- LAGHOUATI Adam
SELECT 'LAGHOUATI Adam' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%LAGHOUATI%' OR prenom ILIKE '%ADAM%')
UNION ALL

-- LAMOTTE Alvy
SELECT 'LAMOTTE Alvy' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%LAMOTTE%' OR prenom ILIKE '%ALVY%')
UNION ALL

-- MARCIANO Florian
SELECT 'MARCIANO Florian' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%MARCIANO%' OR prenom ILIKE '%FLORIAN%')
UNION ALL

-- PIERRE Elisa
SELECT 'PIERRE Elisa' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%PIERRE%' OR prenom ILIKE '%ELISA%')
UNION ALL

-- RUIZ Lucie
SELECT 'RUIZ Lucie' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%RUIZ%' OR prenom ILIKE '%LUCIE%')
UNION ALL

-- SCHROEDER CHAIDRON Léna
SELECT 'SCHROEDER CHAIDRON Léna' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%SCHROEDER%' OR nom ILIKE '%CHAIDRON%' OR prenom ILIKE '%LENA%')
UNION ALL

-- TONDEUR Vinciane
SELECT 'TONDEUR Vinciane' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%TONDEUR%' OR prenom ILIKE '%VINCIANE%')
UNION ALL

-- VAN DE VELDE Justine
SELECT 'VAN DE VELDE Justine' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%VAN DE VELDE%' OR nom ILIKE '%VELDE%' OR prenom ILIKE '%JUSTINE%')
UNION ALL

-- VANVARENBERG Kevin
SELECT 'VANVARENBERG Kevin' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%VANVARENBERG%' OR prenom ILIKE '%KEVIN%')
UNION ALL

-- VERGAUWEN Martial
SELECT 'VERGAUWEN Martial' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%VERGAUWEN%' OR prenom ILIKE '%MARTIAL%')
UNION ALL

-- WANGERMEZ Camille
SELECT 'WANGERMEZ Camille' as recherche, nom, prenom, email, telephone
FROM surveillants 
WHERE is_active = true 
AND (nom ILIKE '%WANGERMEZ%' OR prenom ILIKE '%CAMILLE%')

ORDER BY recherche, nom, prenom;