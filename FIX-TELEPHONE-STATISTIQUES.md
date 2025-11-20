# Corrections : Téléphone et Tri des Statistiques

## Problèmes corrigés

### 1. Tri des surveillants dans les statistiques par nom de famille

**Problème** : Les surveillants n'étaient pas triés par nom de famille dans la page des statistiques.

**Solution** : Modification du tri pour utiliser `nom` puis `prenom` au lieu de juste `nom`.

**Fichier modifié** : `pages/admin/StatistiquesPage.tsx`

### 2. Numéros de téléphone non visibles dans l'admin

**Problème** : Les numéros de téléphone saisis par les surveillants dans le formulaire n'étaient pas sauvegardés ni affichés dans l'interface admin.

**Solution** : 
- Ajout du champ `telephone` dans le type `SubmissionPayload`
- Modification du service de soumission pour inclure le téléphone
- La colonne existe déjà dans la base de données (migration `sync_telephone_from_soumissions.sql`)

**Fichiers modifiés** :
- `types.ts` : Ajout de `telephone?: string` dans `SubmissionPayload`
- `lib/submissionService.ts` : Inclusion du téléphone dans les données de soumission
- `pages/admin/SurveillantsPage.tsx` : Affichage déjà présent (colonne "Téléphone")

## Vérification de la base de données

Pour vérifier que la colonne `telephone` existe bien dans la table `soumissions_disponibilites`, exécutez le script :

```bash
# Depuis Supabase SQL Editor ou votre client PostgreSQL
psql -f scripts/verify-telephone-column.sql
```

Ou dans le SQL Editor de Supabase :

```sql
-- Vérifier la structure de la table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'soumissions_disponibilites'
ORDER BY ordinal_position;
```

## Migration à appliquer (si nécessaire)

Si la colonne `telephone` n'existe pas encore dans votre base de données, appliquez la migration :

```sql
-- Ajouter la colonne telephone
ALTER TABLE soumissions_disponibilites 
ADD COLUMN IF NOT EXISTS telephone TEXT;

-- Créer un index
CREATE INDEX IF NOT EXISTS idx_soumissions_telephone 
ON soumissions_disponibilites(telephone) 
WHERE telephone IS NOT NULL;
```

La migration complète se trouve dans : `supabase/migrations/sync_telephone_from_soumissions.sql`

## Test des corrections

### 1. Tester le tri dans les statistiques

1. Aller sur la page **Admin > Statistiques**
2. Sélectionner le tri "Nom (A-Z)"
3. Vérifier que les surveillants sont bien triés par nom de famille, puis prénom

### 2. Tester la sauvegarde du téléphone

1. Aller sur le formulaire public de disponibilités
2. Remplir le formulaire avec un numéro de téléphone
3. Soumettre le formulaire
4. Aller dans **Admin > Surveillants**
5. Vérifier que le numéro de téléphone apparaît dans la colonne "Téléphone"

### 3. Vérifier les données existantes

Pour voir les téléphones dans les soumissions existantes :

```sql
SELECT 
    email,
    nom,
    prenom,
    telephone,
    submitted_at
FROM soumissions_disponibilites
WHERE telephone IS NOT NULL
ORDER BY submitted_at DESC
LIMIT 20;
```

## Synchronisation automatique

La migration inclut un trigger qui synchronise automatiquement le téléphone depuis les soumissions vers la table `surveillants` :

- Quand un surveillant soumet ses disponibilités avec un téléphone
- Si le surveillant existe dans la table `surveillants`
- Et si son téléphone n'est pas déjà renseigné
- Alors le téléphone est automatiquement copié

## Notes importantes

1. **Téléphone obligatoire** : Le formulaire exige maintenant un numéro de téléphone lors de la soumission
2. **Affichage dans l'admin** : Le téléphone est visible dans la page "Surveillants" (colonne déjà présente)
3. **Export** : Le téléphone est inclus dans l'export Excel/CSV des surveillants
4. **Confidentialité** : Le téléphone n'est visible que par les administrateurs, pas dans les vues publiques

## Prochaines soumissions

À partir de maintenant, toutes les nouvelles soumissions de disponibilités incluront automatiquement le numéro de téléphone saisi par le surveillant.
