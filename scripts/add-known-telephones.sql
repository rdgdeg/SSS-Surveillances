-- Script pour ajouter les téléphones connus basés sur les noms

-- Mise à jour des téléphones connus
UPDATE surveillants 
SET telephone = CASE 
    WHEN nom = 'ASSOIGNON' AND prenom = 'Théo' THEN '+32 471 84 70 75'
    WHEN nom = 'ATIK' AND prenom = 'Hicham' THEN '0479 02 15 45'
    WHEN nom = 'AUQUIERE' AND prenom = 'Marie' THEN '0491 07 43 31'
    WHEN nom = 'BARBÉ' AND prenom = 'Alice' THEN '0470 32 82 17'
    WHEN nom = 'BECKERS' AND prenom = 'Pauline' THEN '0474 08 91 40'
    WHEN nom = 'BRACONNIER' AND prenom = 'Pauline' THEN '0470 34 86 93'
    WHEN nom = 'CAPIAU' AND prenom = 'Madeleine' THEN '0497 79 28 66'
    WHEN nom = 'CHARLIER' AND prenom = 'Mathilde' THEN '0496 77 57 30'
    WHEN nom = 'CHOME' AND prenom = 'Céline' THEN '0491 88 15 21'
    WHEN nom = 'CHOTEAU' AND prenom = 'Mathilde' THEN '0473 12 07 27'
    WHEN nom = 'CHRETIEN' AND prenom = 'Antoine' THEN '+33 6 27 15 87 17'
    WHEN nom = 'COLAK' AND prenom = 'Ramazan' THEN '0483 54 90 96'
    WHEN nom = 'COMEIN' AND prenom = 'Audrey' THEN '0497 41 26 0'
    WHEN nom = 'DE LOOF' AND prenom = 'Marine' THEN '0498 50 69 12'
    WHEN nom = 'DE MONTIGNY' AND prenom = 'Manon' THEN '0478 48 23 84'
    WHEN nom = 'DECHENNE' AND prenom = 'Juhans' THEN '0472 08 31 10'
    WHEN nom = 'DECLERCK' AND prenom = 'Louise' THEN '0476 48 03 14'
    WHEN nom = 'DEVIS' AND prenom = 'Julie' THEN '0476 48 21 23'
    WHEN nom = 'DJURKIN' AND prenom = 'Andrej' THEN '0472 43 42 45'
    WHEN nom = 'EVRARD' AND prenom = 'Perrine' THEN '0497 23 91 75'
    WHEN nom = 'FUCHS' AND prenom = 'Victoria' THEN '+33 6 81 47 52 21'
    WHEN nom = 'GHODSI' AND prenom = 'Marine' THEN '0472 49 14 58'
    WHEN nom = 'HAJJ HASSAN' AND prenom = 'Yara' THEN '0493 02 76 21'
    WHEN nom = 'IORDANESCU' AND prenom = 'Andra' THEN '0474 34 92 38'
    WHEN nom = 'LAGHOUATI' AND prenom = 'Adam' THEN '+33 6 48 14 24 11'
    WHEN nom = 'LAMOTTE' AND prenom = 'Alvy' THEN '0479 86 77 13'
    WHEN nom = 'MARCIANO' AND prenom = 'Florian' THEN '0494 37 92 09'
    WHEN nom = 'PIERRE' AND prenom = 'Elisa' THEN '+32 499 26 49 94'
    WHEN nom = 'RUIZ' AND prenom = 'Lucie' THEN '+33 6 22 00 49 47'
    WHEN nom = 'SCHROEDER CHAIDRON' AND prenom = 'Léna' THEN '0499 11 55 07'
    WHEN nom = 'TONDEUR' AND prenom = 'Vinciane' THEN '0485 75 79 64'
    WHEN nom = 'VAN DE VELDE' AND prenom = 'Justine' THEN '0476 78 88 39'
    WHEN nom = 'VANVARENBERG' AND prenom = 'Kevin' THEN '0478 48 71 20'
    WHEN nom = 'VERGAUWEN' AND prenom = 'Martial' THEN '0471 46 18 91'
    WHEN nom = 'WANGERMEZ' AND prenom = 'Camille' THEN '0472 75 37 73'
    ELSE telephone
END
WHERE (
    (nom = 'ASSOIGNON' AND prenom = 'Théo') OR
    (nom = 'ATIK' AND prenom = 'Hicham') OR
    (nom = 'AUQUIERE' AND prenom = 'Marie') OR
    (nom = 'BARBÉ' AND prenom = 'Alice') OR
    (nom = 'BECKERS' AND prenom = 'Pauline') OR
    (nom = 'BRACONNIER' AND prenom = 'Pauline') OR
    (nom = 'CAPIAU' AND prenom = 'Madeleine') OR
    (nom = 'CHARLIER' AND prenom = 'Mathilde') OR
    (nom = 'CHOME' AND prenom = 'Céline') OR
    (nom = 'CHOTEAU' AND prenom = 'Mathilde') OR
    (nom = 'CHRETIEN' AND prenom = 'Antoine') OR
    (nom = 'COLAK' AND prenom = 'Ramazan') OR
    (nom = 'COMEIN' AND prenom = 'Audrey') OR
    (nom = 'DE LOOF' AND prenom = 'Marine') OR
    (nom = 'DE MONTIGNY' AND prenom = 'Manon') OR
    (nom = 'DECHENNE' AND prenom = 'Juhans') OR
    (nom = 'DECLERCK' AND prenom = 'Louise') OR
    (nom = 'DEVIS' AND prenom = 'Julie') OR
    (nom = 'DJURKIN' AND prenom = 'Andrej') OR
    (nom = 'EVRARD' AND prenom = 'Perrine') OR
    (nom = 'FUCHS' AND prenom = 'Victoria') OR
    (nom = 'GHODSI' AND prenom = 'Marine') OR
    (nom = 'HAJJ HASSAN' AND prenom = 'Yara') OR
    (nom = 'IORDANESCU' AND prenom = 'Andra') OR
    (nom = 'LAGHOUATI' AND prenom = 'Adam') OR
    (nom = 'LAMOTTE' AND prenom = 'Alvy') OR
    (nom = 'MARCIANO' AND prenom = 'Florian') OR
    (nom = 'PIERRE' AND prenom = 'Elisa') OR
    (nom = 'RUIZ' AND prenom = 'Lucie') OR
    (nom = 'SCHROEDER CHAIDRON' AND prenom = 'Léna') OR
    (nom = 'TONDEUR' AND prenom = 'Vinciane') OR
    (nom = 'VAN DE VELDE' AND prenom = 'Justine') OR
    (nom = 'VANVARENBERG' AND prenom = 'Kevin') OR
    (nom = 'VERGAUWEN' AND prenom = 'Martial') OR
    (nom = 'WANGERMEZ' AND prenom = 'Camille')
);

-- Afficher le résultat
SELECT 
    nom,
    prenom,
    email,
    telephone,
    'Téléphone ajouté' as statut
FROM surveillants
WHERE (
    (nom = 'ASSOIGNON' AND prenom = 'Théo') OR
    (nom = 'ATIK' AND prenom = 'Hicham') OR
    (nom = 'AUQUIERE' AND prenom = 'Marie') OR
    (nom = 'BARBÉ' AND prenom = 'Alice') OR
    (nom = 'BECKERS' AND prenom = 'Pauline') OR
    (nom = 'BRACONNIER' AND prenom = 'Pauline') OR
    (nom = 'CAPIAU' AND prenom = 'Madeleine') OR
    (nom = 'CHARLIER' AND prenom = 'Mathilde') OR
    (nom = 'CHOME' AND prenom = 'Céline') OR
    (nom = 'CHOTEAU' AND prenom = 'Mathilde') OR
    (nom = 'CHRETIEN' AND prenom = 'Antoine') OR
    (nom = 'COLAK' AND prenom = 'Ramazan') OR
    (nom = 'COMEIN' AND prenom = 'Audrey') OR
    (nom = 'DE LOOF' AND prenom = 'Marine') OR
    (nom = 'DE MONTIGNY' AND prenom = 'Manon') OR
    (nom = 'DECHENNE' AND prenom = 'Juhans') OR
    (nom = 'DECLERCK' AND prenom = 'Louise') OR
    (nom = 'DEVIS' AND prenom = 'Julie') OR
    (nom = 'DJURKIN' AND prenom = 'Andrej') OR
    (nom = 'EVRARD' AND prenom = 'Perrine') OR
    (nom = 'FUCHS' AND prenom = 'Victoria') OR
    (nom = 'GHODSI' AND prenom = 'Marine') OR
    (nom = 'HAJJ HASSAN' AND prenom = 'Yara') OR
    (nom = 'IORDANESCU' AND prenom = 'Andra') OR
    (nom = 'LAGHOUATI' AND prenom = 'Adam') OR
    (nom = 'LAMOTTE' AND prenom = 'Alvy') OR
    (nom = 'MARCIANO' AND prenom = 'Florian') OR
    (nom = 'PIERRE' AND prenom = 'Elisa') OR
    (nom = 'RUIZ' AND prenom = 'Lucie') OR
    (nom = 'SCHROEDER CHAIDRON' AND prenom = 'Léna') OR
    (nom = 'TONDEUR' AND prenom = 'Vinciane') OR
    (nom = 'VAN DE VELDE' AND prenom = 'Justine') OR
    (nom = 'VANVARENBERG' AND prenom = 'Kevin') OR
    (nom = 'VERGAUWEN' AND prenom = 'Martial') OR
    (nom = 'WANGERMEZ' AND prenom = 'Camille')
)
ORDER BY nom, prenom;