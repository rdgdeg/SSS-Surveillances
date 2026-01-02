# Guide - Code d'Examen pour les Permutations

## Amélioration Ajoutée

Lors d'une **permutation entre surveillants**, le formulaire demande maintenant :

### Pour l'examen que vous ne pouvez pas surveiller :
- ✅ Code de l'examen (ex: WFARM1300)
- ✅ Nom de l'examen
- ✅ Date et heure

### Pour la permutation (NOUVEAU) :
- ✅ Nom du surveillant qui reprend votre surveillance
- ✅ **Code de l'examen que vous reprenez** ← NOUVEAU CHAMP
- ✅ Date de la surveillance que vous reprenez
- ✅ Heure de la surveillance que vous reprenez

## Pourquoi Cette Amélioration ?

**Avant :** Identification imprécise des examens dans les permutations
**Maintenant :** Identification précise avec les codes officiels des deux examens

## Application de la Correction

### Étape 1: Migration Base de Données

Exécutez dans Supabase SQL Editor :

```sql
-- Ajouter le nouveau champ
ALTER TABLE demandes_modification 
ADD COLUMN IF NOT EXISTS surveillance_reprise_code_examen TEXT;

-- Vérifier que c'est ajouté
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'demandes_modification' 
AND column_name = 'surveillance_reprise_code_examen';
```

### Étape 2: Redémarrer l'Application

```bash
# Arrêter avec Ctrl+C puis
npm run dev
```

### Étape 3: Vider le Cache

- **Chrome/Firefox** : `Ctrl+Shift+R`
- **Ou** navigation privée pour tester

## Test de la Fonctionnalité

### Scénario de Test

1. **Aller sur la page publique**
2. **Cliquer "Demander une modification"**
3. **Remplir l'examen que vous ne pouvez pas surveiller :**
   - Code : `WFARM1300`
   - Nom : `Chimie générale`
   - Date : `2024-01-15`
   - Heure : `09:00`

4. **Choisir "Permutation avec un autre surveillant"**
5. **Remplir les informations de permutation :**
   - Surveillant remplaçant : `Jean Dupont`
   - **Code examen reprise** : `WSBIM1207` ← NOUVEAU
   - Date reprise : `2024-01-20`
   - Heure reprise : `14:00`

6. **Soumettre** et vérifier dans l'admin

### Résultat Attendu

La demande doit contenir :
- ✅ Code de l'examen à abandonner : `WFARM1300`
- ✅ Code de l'examen à reprendre : `WSBIM1207`
- ✅ Toutes les autres informations

## Validation

### Champs Obligatoires pour Permutation

Le formulaire vérifie maintenant que **tous** ces champs sont remplis :
- Nom du surveillant remplaçant
- **Code de l'examen à reprendre** ← NOUVEAU
- Date de la surveillance à reprendre
- Heure de la surveillance à reprendre

### Message d'Erreur

Si un champ manque :
> "Pour une permutation, veuillez indiquer qui reprend la surveillance, le code de l'examen à reprendre, et quand"

## Avantages

1. **Identification précise** des deux examens impliqués
2. **Moins d'erreurs** dans le traitement des demandes
3. **Meilleure traçabilité** pour l'administration
4. **Cohérence** avec le reste du système

## Structure de Données

La table `demandes_modification` contient maintenant :

```sql
-- Examen à abandonner
code_examen TEXT                    -- Ex: WFARM1300
nom_examen TEXT                     -- Ex: Chimie générale
date_examen DATE                    -- Ex: 2024-01-15
heure_examen TIME                   -- Ex: 09:00

-- Permutation (si applicable)
surveillant_remplacant TEXT         -- Ex: Jean Dupont
surveillance_reprise_code_examen TEXT  -- Ex: WSBIM1207 (NOUVEAU)
surveillance_reprise_date DATE      -- Ex: 2024-01-20
surveillance_reprise_heure TIME     -- Ex: 14:00
```

Cette amélioration rend le système de permutation plus robuste et précis !