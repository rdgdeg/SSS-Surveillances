# Application de la mise à jour de la limite de capacité

## Contexte
La limite de surveillants requis par créneau était fixée à 20. Cette migration l'augmente à 100 pour permettre de gérer des examens nécessitant plus de surveillants.

## Étapes d'application

### 1. Via l'interface Supabase (Recommandé)

1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Aller dans **SQL Editor**
4. Copier-coller le contenu du fichier `supabase/migrations/update_capacity_limit_to_100.sql`
5. Cliquer sur **Run**

### 2. Via la CLI Supabase

```bash
# Si vous utilisez Supabase CLI
supabase db push

# Ou appliquer directement la migration
psql $DATABASE_URL -f supabase/migrations/update_capacity_limit_to_100.sql
```

## Vérification

Après l'application, vérifiez que la contrainte a été mise à jour :

```sql
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'check_nb_surveillants_requis';
```

Résultat attendu :
```
constraint_name              | constraint_definition
---------------------------- | ----------------------------------------------------
check_nb_surveillants_requis | CHECK ((nb_surveillants_requis IS NULL) OR 
                             |        ((nb_surveillants_requis >= 1) AND 
                             |         (nb_surveillants_requis <= 100)))
```

## Test

Essayez de définir une capacité de 50 surveillants pour un créneau :

```sql
UPDATE creneaux 
SET nb_surveillants_requis = 50 
WHERE id = 'votre-creneau-id';
```

Cela devrait fonctionner sans erreur.

## Rollback (si nécessaire)

Si vous devez revenir à la limite de 20 :

```sql
ALTER TABLE creneaux 
DROP CONSTRAINT IF EXISTS check_nb_surveillants_requis;

ALTER TABLE creneaux 
ADD CONSTRAINT check_nb_surveillants_requis 
CHECK (nb_surveillants_requis IS NULL OR (nb_surveillants_requis >= 1 AND nb_surveillants_requis <= 20));
```

## Impact

- ✅ Permet de définir jusqu'à 100 surveillants par créneau
- ✅ Les valeurs existantes (≤ 20) restent valides
- ✅ Pas d'impact sur les données existantes
- ✅ Changement rétrocompatible

## Fichiers modifiés

- `supabase/migrations/update_capacity_limit_to_100.sql` - Migration SQL
- `components/shared/CapacityInput.tsx` - Validation frontend (1-100)
- `lib/api.ts` - Validation API (1-100)
- `types.ts` - Documentation TypeScript
