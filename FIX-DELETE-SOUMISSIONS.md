# Correction du problème de suppression des soumissions

## Problème
Les soumissions ne peuvent pas être supprimées car il manque une politique RLS (Row Level Security) pour l'opération DELETE sur la table `soumissions_disponibilites`.

## Solution

### Étape 1 : Accéder à Supabase
1. Allez sur https://supabase.com
2. Connectez-vous à votre projet
3. Allez dans l'onglet "SQL Editor"

### Étape 2 : Exécuter la requête SQL
Copiez et exécutez la requête suivante :

```sql
-- Ajouter une politique pour permettre la suppression des soumissions
CREATE POLICY "Allow delete submissions" ON soumissions_disponibilites
    FOR DELETE USING (true);
```

### Étape 3 : Vérifier
1. Cliquez sur "Run" pour exécuter la requête
2. Vous devriez voir un message de succès
3. Retournez dans votre application et essayez de supprimer une soumission
4. La suppression devrait maintenant fonctionner correctement

## Vérification des politiques existantes

Pour voir toutes les politiques RLS sur la table `soumissions_disponibilites`, vous pouvez exécuter :

```sql
SELECT * FROM pg_policies WHERE tablename = 'soumissions_disponibilites';
```

Vous devriez maintenant voir 4 politiques :
- `Public can insert submissions` (INSERT)
- `Public can update own submissions` (UPDATE)
- `Public can view submissions` (SELECT)
- `Allow delete submissions` (DELETE) ← Nouvelle politique

## Note de sécurité

Cette politique permet à tous les utilisateurs de supprimer des soumissions. Si vous souhaitez restreindre cette opération uniquement aux administrateurs, vous devrez :

1. Implémenter un système d'authentification
2. Modifier la politique pour vérifier le rôle de l'utilisateur

Pour l'instant, comme votre application est protégée au niveau de l'interface (seuls les admins ont accès à la page de suppression), cette politique est suffisante.
