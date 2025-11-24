# Correction de l'Acronyme FASB

## Problème

Dans la table **`consignes_secretariat`**, l'intitulé du secrétariat FASB est incorrect :
- ❌ **Actuel** : "Faculté des Sciences Agronomiques et de Bioingénierie"
- ✅ **Correct** : "Faculté de Pharmacie et Sciences Biomédicales"

## Solution

Un script SQL a été créé pour corriger cet intitulé dans la base de données.

## Exécution du Script

### Via Supabase Dashboard

1. Aller dans **Supabase Dashboard** → **SQL Editor**
2. Ouvrir le fichier `scripts/fix-fasb-acronym.sql`
3. Copier-coller le contenu dans l'éditeur SQL
4. Exécuter le script

### Contenu du Script

Le script effectue les opérations suivantes :

1. **Vérification initiale** : Affiche les facultés contenant "FASB" ou "Pharmacie"
2. **Correction** : Remplace "FASB" par "Faculté de Pharmacie et Sciences Biomédicales"
3. **Vérification finale** : Affiche le résultat après correction
4. **Liste complète** : Affiche tous les noms de facultés pour vérification

### Commande SQL Principale

```sql
UPDATE consignes_secretariat 
SET nom_secretariat = 'Faculté de Pharmacie et Sciences Biomédicales'
WHERE code_secretariat = 'FASB';
```

## Vérification

Après exécution, vérifier que :

- ✅ Le code "FASB" reste inchangé (c'est l'acronyme officiel)
- ✅ L'intitulé est bien "Faculté de Pharmacie et Sciences Biomédicales"
- ✅ Les autres secrétariats ne sont pas affectés

## Impact

### Tables Affectées

- **`consignes_secretariat`** : Colonne `nom_secretariat`

### Données Modifiées

- L'enregistrement avec `code_secretariat = 'FASB'`
- Aucune autre donnée n'est modifiée

## Autres Secrétariats

Si d'autres intitulés de secrétariats doivent être corrigés, utiliser le même modèle :

```sql
-- Exemple pour d'autres secrétariats
UPDATE consignes_secretariat 
SET nom_secretariat = 'Nom Complet Correct'
WHERE code_secretariat = 'CODE';
```

### Secrétariats Actuels

Les secrétariats configurés dans la base :

- **FASB** → Faculté de Pharmacie et Sciences Biomédicales
- **DENT** → Faculté de Médecine Dentaire
- **MED** → Faculté de Médecine
- **BAC11** → BAC 11
- **FSP** → Faculté de Santé Publique

## Recommandations

1. **Backup** : Faire une sauvegarde avant d'exécuter le script
2. **Test** : Tester sur un environnement de développement d'abord
3. **Vérification** : Vérifier les résultats après exécution
4. **Documentation** : Documenter les changements effectués

## Fichiers Créés

- `scripts/fix-fasb-acronym.sql` : Script de correction SQL
- `FIX-FASB-ACRONYM.md` : Ce guide de documentation
