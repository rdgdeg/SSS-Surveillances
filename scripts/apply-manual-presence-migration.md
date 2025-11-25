# Application de la migration - Saisie manuelle des présences

## Étapes pour appliquer la migration

### Option 1 : Via l'interface Supabase (Recommandé)

1. Se connecter à [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionner votre projet
3. Aller dans **SQL Editor**
4. Créer une nouvelle requête
5. Copier-coller le contenu du fichier `supabase/migrations/add_manual_presence_fields_to_examens.sql`
6. Cliquer sur **Run** (ou Ctrl+Enter)
7. Vérifier qu'il n'y a pas d'erreur

### Option 2 : Via Supabase CLI

```bash
# Si vous avez Supabase CLI installé
supabase db push

# Ou appliquer une migration spécifique
supabase migration up
```

### Option 3 : Exécution manuelle du SQL

Connectez-vous à votre base de données et exécutez :

```sql
-- Migration: Add manual presence fields to examens table
-- Description: Allow manual entry of teacher presence and accompanying persons count

-- Add columns for manual entry
ALTER TABLE examens
ADD COLUMN IF NOT EXISTS nb_enseignants_presents_manuel INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS nb_accompagnants_manuel INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS use_manual_counts BOOLEAN DEFAULT FALSE;

-- Add comments
COMMENT ON COLUMN examens.nb_enseignants_presents_manuel IS 'Nombre d''enseignants présents (saisie manuelle)';
COMMENT ON COLUMN examens.nb_accompagnants_manuel IS 'Nombre d''accompagnants/personnes apportées (saisie manuelle)';
COMMENT ON COLUMN examens.use_manual_counts IS 'Si true, utilise les valeurs manuelles au lieu des déclarations';

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_examens_use_manual_counts ON examens(use_manual_counts);
```

## Vérification

Après l'application, vérifiez que les colonnes ont été créées :

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'examens'
  AND column_name IN (
    'nb_enseignants_presents_manuel',
    'nb_accompagnants_manuel',
    'use_manual_counts'
  );
```

Résultat attendu :
```
column_name                      | data_type | is_nullable | column_default
---------------------------------+-----------+-------------+---------------
nb_enseignants_presents_manuel   | integer   | YES         | NULL
nb_accompagnants_manuel          | integer   | YES         | NULL
use_manual_counts                | boolean   | YES         | false
```

## Test

Testez la fonctionnalité :

1. Aller dans **Gestion des examens**
2. Cliquer sur **Modifier** pour un examen
3. Cocher **"Utiliser la saisie manuelle pour les présences"**
4. Entrer des valeurs dans les champs
5. Enregistrer
6. Vérifier que les valeurs s'affichent correctement dans la liste

## Rollback (si nécessaire)

Si vous devez annuler la migration :

```sql
-- Supprimer les colonnes
ALTER TABLE examens
DROP COLUMN IF EXISTS nb_enseignants_presents_manuel,
DROP COLUMN IF EXISTS nb_accompagnants_manuel,
DROP COLUMN IF EXISTS use_manual_counts;

-- Supprimer l'index
DROP INDEX IF EXISTS idx_examens_use_manual_counts;
```

## Notes

- La migration est **non-destructive** : elle n'affecte pas les données existantes
- Les colonnes sont **nullables** : pas de valeur par défaut obligatoire
- L'index améliore les performances pour filtrer les examens en mode manuel
- Les déclarations de présence existantes ne sont pas affectées
