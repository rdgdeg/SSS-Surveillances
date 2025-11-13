# Migration - Gestion de la présence des enseignants aux examens

## Prérequis

- Accès à votre base de données Supabase
- Les tables `sessions` et `messages` doivent déjà exister

## Étapes d'application de la migration

### 1. Vérifier les prérequis

Connectez-vous à votre dashboard Supabase et vérifiez que les tables suivantes existent :
- `sessions`
- `messages`

### 2. Appliquer le script SQL

1. Ouvrez le fichier `supabase-create-teacher-exam-presence.sql`
2. Connectez-vous à votre dashboard Supabase
3. Allez dans **SQL Editor**
4. Créez une nouvelle query
5. Copiez-collez tout le contenu du fichier SQL
6. Cliquez sur **Run** pour exécuter le script

### 3. Vérifier la création des tables

Après l'exécution, vérifiez que les tables suivantes ont été créées :

#### Table `examens`
```sql
SELECT * FROM examens LIMIT 1;
```

Colonnes attendues :
- `id` (UUID)
- `session_id` (UUID)
- `code_examen` (VARCHAR)
- `nom_examen` (VARCHAR)
- `enseignants` (TEXT[])
- `date_examen` (DATE)
- `heure_debut` (TIME)
- `heure_fin` (TIME)
- `saisie_manuelle` (BOOLEAN)
- `cree_par_email` (VARCHAR)
- `valide` (BOOLEAN)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

#### Table `presences_enseignants`
```sql
SELECT * FROM presences_enseignants LIMIT 1;
```

Colonnes attendues :
- `id` (UUID)
- `examen_id` (UUID)
- `enseignant_email` (VARCHAR)
- `enseignant_nom` (VARCHAR)
- `enseignant_prenom` (VARCHAR)
- `est_present` (BOOLEAN)
- `nb_surveillants_accompagnants` (INTEGER)
- `remarque` (TEXT)
- `submitted_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

#### Table `notifications_admin`
```sql
SELECT * FROM notifications_admin LIMIT 1;
```

Colonnes attendues :
- `id` (UUID)
- `type` (VARCHAR)
- `titre` (VARCHAR)
- `message` (TEXT)
- `reference_id` (UUID)
- `reference_type` (VARCHAR)
- `lu` (BOOLEAN)
- `archive` (BOOLEAN)
- `created_at` (TIMESTAMPTZ)

### 4. Vérifier la vue

```sql
SELECT * FROM v_examens_with_presences LIMIT 1;
```

Cette vue doit retourner les examens avec leurs statistiques de présence.

### 5. Vérifier les indexes

```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('examens', 'presences_enseignants', 'notifications_admin');
```

Vous devriez voir les indexes suivants :
- `idx_examens_session`
- `idx_examens_code`
- `idx_examens_saisie_manuelle`
- `idx_examens_valide`
- `idx_presences_examen`
- `idx_presences_email`
- `idx_notifications_lu`
- `idx_notifications_archive`
- `idx_notifications_type`
- `idx_notifications_reference`

### 6. Vérifier les triggers

```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table IN ('examens', 'presences_enseignants');
```

Vous devriez voir :
- `trigger_examens_updated_at` sur `examens`
- `trigger_presences_updated_at` sur `presences_enseignants`

### 7. Vérifier les politiques RLS

```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('examens', 'presences_enseignants', 'notifications_admin');
```

Chaque table devrait avoir 4 politiques (SELECT, INSERT, UPDATE, DELETE).

## Test de la migration

### 1. Insérer un examen de test

```sql
INSERT INTO examens (session_id, code_examen, nom_examen, enseignants)
VALUES (
  (SELECT id FROM sessions WHERE is_active = true LIMIT 1),
  'TEST101',
  'Examen de test',
  ARRAY['test@univ.be']
);
```

### 2. Insérer une présence de test

```sql
INSERT INTO presences_enseignants (
  examen_id, 
  enseignant_email, 
  enseignant_nom, 
  enseignant_prenom, 
  est_present, 
  nb_surveillants_accompagnants
)
VALUES (
  (SELECT id FROM examens WHERE code_examen = 'TEST101' LIMIT 1),
  'test@univ.be',
  'Test',
  'Enseignant',
  true,
  2
);
```

### 3. Vérifier la vue

```sql
SELECT * FROM v_examens_with_presences WHERE code_examen = 'TEST101';
```

Vous devriez voir :
- `nb_presences_declarees` = 1
- `nb_enseignants_total` = 1
- `nb_enseignants_presents` = 1
- `nb_surveillants_accompagnants_total` = 2

### 4. Nettoyer les données de test

```sql
DELETE FROM examens WHERE code_examen = 'TEST101';
```

## Rollback (en cas de problème)

Si vous devez annuler la migration :

```sql
-- Supprimer les politiques RLS
DROP POLICY IF EXISTS "Examens lisibles par tous" ON examens;
DROP POLICY IF EXISTS "Examens créables par tous" ON examens;
DROP POLICY IF EXISTS "Examens modifiables par tous" ON examens;
DROP POLICY IF EXISTS "Examens supprimables par tous" ON examens;

DROP POLICY IF EXISTS "Presences lisibles par tous" ON presences_enseignants;
DROP POLICY IF EXISTS "Presences créables par tous" ON presences_enseignants;
DROP POLICY IF EXISTS "Presences modifiables par tous" ON presences_enseignants;
DROP POLICY IF EXISTS "Presences supprimables par tous" ON presences_enseignants;

DROP POLICY IF EXISTS "Notifications lisibles par tous" ON notifications_admin;
DROP POLICY IF EXISTS "Notifications créables par tous" ON notifications_admin;
DROP POLICY IF EXISTS "Notifications modifiables par tous" ON notifications_admin;
DROP POLICY IF EXISTS "Notifications supprimables par tous" ON notifications_admin;

-- Supprimer la vue
DROP VIEW IF EXISTS v_examens_with_presences;

-- Supprimer les triggers
DROP TRIGGER IF EXISTS trigger_examens_updated_at ON examens;
DROP TRIGGER IF EXISTS trigger_presences_updated_at ON presences_enseignants;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS update_examens_updated_at();
DROP FUNCTION IF EXISTS update_presences_updated_at();

-- Supprimer les tables (ATTENTION: cela supprime toutes les données)
DROP TABLE IF EXISTS presences_enseignants CASCADE;
DROP TABLE IF EXISTS notifications_admin CASCADE;
DROP TABLE IF EXISTS examens CASCADE;
```

## Prochaines étapes

Après avoir appliqué la migration avec succès :

1. ✅ Testez l'import d'examens avec le fichier `docs/example-examens-import.csv`
2. ✅ Configurez les routes dans votre application
3. ✅ Testez la déclaration de présence côté enseignant
4. ✅ Testez le dashboard admin
5. ✅ Formez les utilisateurs avec `docs/teacher-exam-presence-guide.md`

## Support

En cas de problème lors de la migration :
- Vérifiez les logs d'erreur dans Supabase
- Assurez-vous que les tables `sessions` et `messages` existent
- Contactez l'administrateur système
