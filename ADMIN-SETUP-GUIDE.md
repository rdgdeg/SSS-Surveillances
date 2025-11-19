# Guide de Configuration Administrateur

## Vérification et création de l'utilisateur RaphD

### Méthode 1 : Via l'interface Supabase (Recommandé)

1. **Connectez-vous à votre projet Supabase**
   - Allez sur https://supabase.com
   - Sélectionnez votre projet

2. **Ouvrez l'éditeur SQL**
   - Dans le menu latéral, cliquez sur "SQL Editor"
   - Cliquez sur "New query"

3. **Exécutez le script de vérification**
   - Copiez le contenu de `scripts/verify-raphd-user.sql`
   - Collez-le dans l'éditeur
   - Cliquez sur "Run"

4. **Vérifiez les résultats**
   - Si RaphD existe : ✓ Vous verrez "RaphD existe et est actif"
   - Si RaphD n'existe pas : Décommentez la section INSERT et réexécutez

### Méthode 2 : Via migration SQL

1. **Exécutez la migration**
   ```bash
   # Si vous utilisez Supabase CLI
   supabase db push
   
   # Ou exécutez directement le fichier
   psql -h <your-host> -U <your-user> -d <your-db> -f supabase/migrations/ensure_raphd_user.sql
   ```

2. **Vérifiez dans l'interface**
   - Allez dans "Table Editor" > "admin_users"
   - Cherchez l'utilisateur "RaphD"

### Méthode 3 : Création manuelle via l'interface

1. **Allez dans Table Editor**
   - Cliquez sur "Table Editor" dans le menu
   - Sélectionnez la table "admin_users"

2. **Ajoutez un nouvel utilisateur**
   - Cliquez sur "Insert" > "Insert row"
   - Remplissez les champs :
     - `username`: RaphD
     - `display_name`: Raphaël D.
     - `password_hash`: $2b$10$vFBLAdauAkRrsZ4h1yt1GeZHD1LzTTH5UCUFfdFea27jAm2CN21.u
     - `is_active`: true
   - Cliquez sur "Save"

## Informations de connexion

### Utilisateur RaphD (Administrateur complet)
- **Username**: RaphD
- **Mot de passe par défaut**: admin123
- **Rôle**: Administrateur complet - Accès à toutes les fonctionnalités

### Autres utilisateurs (Standards)
Les autres utilisateurs ont un accès limité aux fonctionnalités suivantes :
- Surveillants : Surveillants, Créneaux, Disponibilités
- Enseignants : Cours, Examens, Présences
- Aide

## Changement du mot de passe

⚠️ **Important** : Le mot de passe par défaut `admin123` doit être changé en production !

### Pour générer un nouveau hash de mot de passe :

1. **Utilisez Node.js avec bcrypt**
   ```javascript
   const bcrypt = require('bcryptjs');
   const password = 'votre_nouveau_mot_de_passe';
   const hash = bcrypt.hashSync(password, 10);
   console.log(hash);
   ```

2. **Mettez à jour dans Supabase**
   ```sql
   UPDATE admin_users 
   SET password_hash = 'votre_nouveau_hash_ici',
       updated_at = NOW()
   WHERE username = 'RaphD';
   ```

## Vérification du système de permissions

### Test 1 : Connexion avec RaphD
1. Allez sur `/login`
2. Connectez-vous avec RaphD / admin123
3. Vérifiez que vous voyez TOUS les menus :
   - Tableau de bord
   - Sessions
   - Surveillants (tous les sous-menus)
   - Enseignants (tous les sous-menus)
   - Rapports
   - Messages
   - Aide

### Test 2 : Connexion avec un utilisateur standard
1. Connectez-vous avec un autre utilisateur
2. Vérifiez que vous voyez UNIQUEMENT :
   - Surveillants : Surveillants, Créneaux, Disponibilités
   - Enseignants : Cours, Examens, Présences
   - Aide

### Test 3 : Tentative d'accès non autorisé
1. Connecté en tant qu'utilisateur standard
2. Essayez d'accéder à `/admin/dashboard` directement
3. Vous devriez être redirigé vers `/admin/aide`

## Création d'autres utilisateurs

Pour créer d'autres utilisateurs administrateurs :

```sql
-- Générez d'abord un hash pour le mot de passe avec bcrypt
-- Puis insérez l'utilisateur

INSERT INTO admin_users (username, display_name, password_hash, is_active)
VALUES ('NouvelUser', 'Nom Complet', 'hash_bcrypt_ici', true);
```

## Sécurité

### Recommandations
1. ✅ Changez le mot de passe par défaut immédiatement
2. ✅ Utilisez des mots de passe forts (min 12 caractères)
3. ✅ Ne partagez jamais les identifiants par email non chiffré
4. ✅ Désactivez les utilisateurs qui ne sont plus nécessaires :
   ```sql
   UPDATE admin_users SET is_active = false WHERE username = 'UserName';
   ```

### Row Level Security (RLS)
Assurez-vous que RLS est activé sur la table admin_users :

```sql
-- Vérifier RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'admin_users';

-- Activer RLS si nécessaire
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Créer la policy de lecture
CREATE POLICY "Allow read access to admin_users" 
ON admin_users FOR SELECT 
USING (true);
```

## Dépannage

### Problème : "Nom d'utilisateur ou mot de passe incorrect"

1. **Vérifiez que l'utilisateur existe**
   ```sql
   SELECT * FROM admin_users WHERE username = 'RaphD';
   ```

2. **Vérifiez que l'utilisateur est actif**
   ```sql
   SELECT username, is_active FROM admin_users WHERE username = 'RaphD';
   ```

3. **Vérifiez le hash du mot de passe**
   - Le hash pour "admin123" doit être : 
   - `$2b$10$vFBLAdauAkRrsZ4h1yt1GeZHD1LzTTH5UCUFfdFea27jAm2CN21.u`

4. **Vérifiez les policies RLS**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'admin_users';
   ```

### Problème : Menu incomplet après connexion

1. **Vérifiez le username exact**
   - Le système vérifie `user?.username === 'RaphD'`
   - Le username est sensible à la casse !

2. **Vérifiez dans la console du navigateur**
   - Ouvrez les DevTools (F12)
   - Console > Tapez : `JSON.parse(localStorage.getItem('admin_user'))`
   - Vérifiez que le username est bien "RaphD"

### Problème : Redirection vers /admin/aide

- C'est normal pour les utilisateurs non-RaphD
- Seul RaphD a accès aux pages admin complètes
- Vérifiez que vous êtes bien connecté avec RaphD

## Support

Pour toute question ou problème :
- Consultez la page d'aide : `/admin/aide`
- Contactez le secrétariat : 02/436.16.89
