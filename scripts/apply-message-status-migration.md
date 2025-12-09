# Application de la migration : Statut des messages

## Migration à appliquer

Fichier : `supabase/migrations/add_message_status_to_soumissions.sql`

## Instructions

### Via l'interface Supabase

1. Se connecter à [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionner le projet
3. Aller dans **SQL Editor**
4. Copier-coller le contenu du fichier `supabase/migrations/add_message_status_to_soumissions.sql`
5. Cliquer sur **Run**

### Via la CLI Supabase (si configurée)

```bash
supabase db push
```

## Vérification

Après l'application de la migration, vérifier que les colonnes ont été ajoutées :

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'soumissions_disponibilites'
  AND column_name IN ('message_traite', 'message_traite_par', 'message_traite_le')
ORDER BY column_name;
```

Résultat attendu :
```
column_name         | data_type                   | is_nullable | column_default
--------------------+-----------------------------+-------------+---------------
message_traite      | boolean                     | YES         | false
message_traite_le   | timestamp with time zone    | YES         | NULL
message_traite_par  | text                        | YES         | NULL
```

## Test

Tester la fonctionnalité :

1. Aller sur la page **Admin → Surveillants → Messages**
2. Trouver un message avec du contenu
3. Cliquer sur **Marquer fait**
4. Vérifier que le badge devient vert "Traité"
5. Vérifier que les informations "Par [username] le [date]" s'affichent
6. Cliquer à nouveau pour annuler le statut

## Rollback (si nécessaire)

Si la migration pose problème, la supprimer avec :

```sql
-- Supprimer les colonnes ajoutées
ALTER TABLE soumissions_disponibilites
DROP COLUMN IF EXISTS message_traite,
DROP COLUMN IF EXISTS message_traite_par,
DROP COLUMN IF EXISTS message_traite_le;

-- Supprimer l'index
DROP INDEX IF EXISTS idx_soumissions_message_traite;
```

## Notes

- Les valeurs par défaut sont `false` pour `message_traite` et `NULL` pour les autres colonnes
- Un index a été créé sur `message_traite` pour optimiser les requêtes filtrées
- La migration est non-destructive et peut être appliquée sans risque
