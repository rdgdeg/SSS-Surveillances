# Application des téléphones connus

Ce script applique les numéros de téléphone connus pour les surveillants identifiés par nom et prénom.

## Utilisation

```bash
# Appliquer les téléphones connus
psql "postgresql://postgres.ixqjqjqjqjqjqjqj:Raphael2024!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" -f scripts/add-known-telephones.sql
```

## Téléphones ajoutés

- ASSOIGNON Théo: +32 471 84 70 75
- ATIK Hicham: 0479 02 15 45
- AUQUIERE Marie: 0491 07 43 31
- BARBÉ Alice: 0470 32 82 17
- BECKERS Pauline: 0474 08 91 40
- BRACONNIER Pauline: 0470 34 86 93
- CAPIAU Madeleine: 0497 79 28 66
- CHARLIER Mathilde: 0496 77 57 30
- CHOME Céline: 0491 88 15 21
- CHOTEAU Mathilde: 0473 12 07 27
- CHRETIEN Antoine: +33 6 27 15 87 17
- COLAK Ramazan: 0483 54 90 96
- COMEIN Audrey: 0497 41 26 0
- DE LOOF Marine: 0498 50 69 12
- DE MONTIGNY Manon: 0478 48 23 84
- DECHENNE Juhans: 0472 08 31 10
- DECLERCK Louise: 0476 48 03 14
- DEVIS Julie: 0476 48 21 23
- DJURKIN Andrej: 0472 43 42 45
- EVRARD Perrine: 0497 23 91 75
- FUCHS Victoria: +33 6 81 47 52 21
- GHODSI Marine: 0472 49 14 58
- HAJJ HASSAN Yara: 0493 02 76 21
- IORDANESCU Andra: 0474 34 92 38
- LAGHOUATI Adam: +33 6 48 14 24 11
- LAMOTTE Alvy: 0479 86 77 13
- MARCIANO Florian: 0494 37 92 09
- PIERRE Elisa: +32 499 26 49 94
- RUIZ Lucie: +33 6 22 00 49 47
- SCHROEDER CHAIDRON Léna: 0499 11 55 07
- TONDEUR Vinciane: 0485 75 79 64
- VAN DE VELDE Justine: 0476 78 88 39
- VANVARENBERG Kevin: 0478 48 71 20
- VERGAUWEN Martial: 0471 46 18 91
- WANGERMEZ Camille: 0472 75 37 73

## Fonctionnalités ajoutées

- ✅ Édition en ligne des téléphones dans la page Contacts
- ✅ Sauvegarde automatique dans la base de données
- ✅ Interface intuitive avec boutons d'édition
- ✅ Validation et gestion d'erreurs