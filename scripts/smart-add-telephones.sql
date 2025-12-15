-- Script intelligent pour ajouter les téléphones connus avec correspondance flexible

-- Fonction temporaire pour nettoyer les noms (enlever accents, espaces, etc.)
CREATE OR REPLACE FUNCTION clean_name(input_text TEXT) 
RETURNS TEXT AS $$
BEGIN
    RETURN UPPER(
        REPLACE(
            REPLACE(
                REPLACE(
                    REPLACE(
                        REPLACE(
                            REPLACE(
                                REPLACE(
                                    REPLACE(input_text, 'é', 'e'),
                                'è', 'e'),
                            'ê', 'e'),
                        'à', 'a'),
                    'ç', 'c'),
                'ô', 'o'),
            ' ', ''),
        '-', '')
    );
END;
$$ LANGUAGE plpgsql;

-- Table temporaire avec les téléphones connus
CREATE TEMP TABLE telephones_connus (
    nom_recherche TEXT,
    prenom_recherche TEXT,
    telephone TEXT
);

INSERT INTO telephones_connus VALUES
('ASSOIGNON', 'THEO', '+32 471 84 70 75'),
('ATIK', 'HICHAM', '0479 02 15 45'),
('AUQUIERE', 'MARIE', '0491 07 43 31'),
('BARBE', 'ALICE', '0470 32 82 17'),
('BECKERS', 'PAULINE', '0474 08 91 40'),
('BRACONNIER', 'PAULINE', '0470 34 86 93'),
('CAPIAU', 'MADELEINE', '0497 79 28 66'),
('CHARLIER', 'MATHILDE', '0496 77 57 30'),
('CHOME', 'CELINE', '0491 88 15 21'),
('CHOTEAU', 'MATHILDE', '0473 12 07 27'),
('CHRETIEN', 'ANTOINE', '+33 6 27 15 87 17'),
('COLAK', 'RAMAZAN', '0483 54 90 96'),
('COMEIN', 'AUDREY', '0497 41 26 0'),
('DELOOF', 'MARINE', '0498 50 69 12'),
('DEMONTIGNY', 'MANON', '0478 48 23 84'),
('DECHENNE', 'JUHANS', '0472 08 31 10'),
('DECLERCK', 'LOUISE', '0476 48 03 14'),
('DEVIS', 'JULIE', '0476 48 21 23'),
('DJURKIN', 'ANDREJ', '0472 43 42 45'),
('EVRARD', 'PERRINE', '0497 23 91 75'),
('FUCHS', 'VICTORIA', '+33 6 81 47 52 21'),
('GHODSI', 'MARINE', '0472 49 14 58'),
('HAJJHASSAN', 'YARA', '0493 02 76 21'),
('IORDANESCU', 'ANDRA', '0474 34 92 38'),
('LAGHOUATI', 'ADAM', '+33 6 48 14 24 11'),
('LAMOTTE', 'ALVY', '0479 86 77 13'),
('MARCIANO', 'FLORIAN', '0494 37 92 09'),
('PIERRE', 'ELISA', '+32 499 26 49 94'),
('RUIZ', 'LUCIE', '+33 6 22 00 49 47'),
('SCHROEDERCHAIDRON', 'LENA', '0499 11 55 07'),
('TONDEUR', 'VINCIANE', '0485 75 79 64'),
('VANDEVELDE', 'JUSTINE', '0476 78 88 39'),
('VANVARENBERG', 'KEVIN', '0478 48 71 20'),
('VERGAUWEN', 'MARTIAL', '0471 46 18 91'),
('WANGERMEZ', 'CAMILLE', '0472 75 37 73');

-- Afficher les correspondances trouvées
SELECT 
    tc.nom_recherche || ' ' || tc.prenom_recherche as personne_recherchee,
    s.nom || ' ' || s.prenom as personne_trouvee,
    s.email,
    s.telephone as telephone_actuel,
    tc.telephone as nouveau_telephone,
    CASE 
        WHEN s.telephone IS NOT NULL AND s.telephone != '' THEN '⚠️ A déjà un téléphone'
        ELSE '✅ Peut être mis à jour'
    END as statut
FROM telephones_connus tc
JOIN surveillants s ON (
    clean_name(s.nom) = clean_name(tc.nom_recherche) 
    AND clean_name(s.prenom) = clean_name(tc.prenom_recherche)
)
WHERE s.is_active = true
ORDER BY tc.nom_recherche, tc.prenom_recherche;

-- Mise à jour des téléphones (seulement si pas déjà renseigné)
UPDATE surveillants s
SET telephone = tc.telephone
FROM telephones_connus tc
WHERE clean_name(s.nom) = clean_name(tc.nom_recherche) 
    AND clean_name(s.prenom) = clean_name(tc.prenom_recherche)
    AND s.is_active = true
    AND (s.telephone IS NULL OR s.telephone = '');

-- Afficher le résultat final
SELECT 
    'RÉSULTAT FINAL' as etape,
    COUNT(*) as total_mises_a_jour
FROM surveillants s
JOIN telephones_connus tc ON (
    clean_name(s.nom) = clean_name(tc.nom_recherche) 
    AND clean_name(s.prenom) = clean_name(tc.prenom_recherche)
)
WHERE s.is_active = true
    AND s.telephone = tc.telephone;

-- Afficher les personnes mises à jour
SELECT 
    s.nom,
    s.prenom,
    s.email,
    s.telephone,
    'Téléphone ajouté avec succès' as statut
FROM surveillants s
JOIN telephones_connus tc ON (
    clean_name(s.nom) = clean_name(tc.nom_recherche) 
    AND clean_name(s.prenom) = clean_name(tc.prenom_recherche)
)
WHERE s.is_active = true
    AND s.telephone = tc.telephone
ORDER BY s.nom, s.prenom;

-- Nettoyer la fonction temporaire
DROP FUNCTION clean_name(TEXT);