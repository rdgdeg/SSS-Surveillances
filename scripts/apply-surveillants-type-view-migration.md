# Application de la migration : Affichage du type Jobiste dans le planning

## Migration à appliquer

Fichier : `supabase/migrations/update_view_surveillants_with_type.sql`

## Objectif

Afficher "(Jobiste)" après le nom des jobistes dans le planning des examens pour les identifier facilement.

## Instructions

### Via l'interface Supabase

1. Se connecter à [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionner le projet
3. Aller dans **SQL Editor**
4. Copier-coller le contenu du fichier `supabase/migrations/update_view_surveillants_with_type.sql`
5. Cliquer sur **Run**

### Via la CLI Supabase (si configurée)

```bash
supabase db push
```

## Vérification

Après l'application de la migration, vérifier que la vue a été créée :

```sql
-- Vérifier que la vue existe
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'v_examen_auditoires_with_surveillants';
```

Résultat attendu :
```
table_name                              | table_type
----------------------------------------+-----------
v_examen_auditoires_with_surveillants  | VIEW
```

## Test

Tester avec un examen qui a des jobistes assignés :

```sql
SELECT 
  auditoire,
  surveillants_noms
FROM v_examen_auditoires_with_surveillants
WHERE examen_id = 'ID_EXAMEN_TEST'
  AND array_length(surveillants, 1) > 0;
```

Vous devriez voir des noms comme :
- `Jean Dupont (Jobiste)` pour les jobistes
- `Marie Martin` pour les autres types

## Résultat dans l'interface

Dans le planning public (`/planning`), les surveillants jobistes apparaîtront maintenant avec "(Jobiste)" après leur nom :

**Avant :**
```
Auditoire A
• Jean Dupont
• Marie Martin
```

**Après :**
```
Auditoire A
• Jean Dupont (Jobiste)
• Marie Martin
```

## Rollback (si nécessaire)

Si la migration pose problème, revenir à l'ancienne version :

```sql
-- Supprimer la vue
DROP VIEW IF EXISTS v_examen_auditoires_with_surveillants;

-- Recréer la vue simple sans le type
CREATE OR REPLACE VIEW v_examen_auditoires_with_surveillants AS
SELECT 
  ea.id,
  ea.examen_id,
  ea.auditoire,
  ea.nb_surveillants_requis,
  ea.surveillants,
  ea.surveillants_remplaces,
  ea.remarques,
  ARRAY(
    SELECT s.prenom || ' ' || s.nom
    FROM unnest(ea.surveillants) AS surv_id
    LEFT JOIN surveillants s ON s.id = surv_id::uuid
    WHERE s.id IS NOT NULL
    ORDER BY s.nom, s.prenom
  ) AS surveillants_noms
FROM examen_auditoires ea;
```

## Notes

- La vue est automatiquement mise à jour quand les données changent
- Seuls les jobistes ont l'indication "(Jobiste)"
- Les autres types (Assistant, PAT, Autre) n'ont pas d'indication
- La vue est accessible en lecture seule (SELECT) pour tous les utilisateurs
- Les noms sont triés par ordre alphabétique (nom, puis prénom)
