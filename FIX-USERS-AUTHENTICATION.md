## Problème : Les utilisateurs ne peuvent plus se connecter

### Cause du problème

Le code d'authentification dans `lib/auth.ts` essaie de mettre à jour une colonne `last_login_at` qui n'existe pas dans la table `admin_users`, ce qui provoque une erreur lors de la connexion.

### Solution

Exécutez le script SQL suivant dans l'éditeur SQL de Supabase :

```sql
-- Ajouter la colonne last_login_at
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Créer un index
CREATE INDEX IF NOT EXISTS idx_admin_users_last_login 
ON admin_users(last_login_at) 
WHERE last_login_at IS NOT NULL;

-- S'assurer que RaphD est actif
UPDATE admin_users 
SET is_active = true, updated_at = NOW()
WHERE username = 'RaphD';

-- Vérifier le résultat
SELECT username, display_name, is_active, last_login_at
FROM admin_users
ORDER BY username;
```

### Étapes de correction

1. **Allez sur Supabase Dashboard**
   - URL : https://supabase.com/dashboard/project/budffopdzqjfkbgbpbml/sql

2. **Exécutez le script de correction**
   - Copiez le contenu de `scripts/fix-users-simple.sql`
   - Collez-le dans l'éditeur SQL
   - Cliquez sur "Run"

3. **Vérifiez que la correction a fonctionné**
   ```sql
   SELECT * FROM admin_users WHERE username = 'RaphD';
   ```
   
   Vous devriez voir :
   - `is_active` = `true`
   - `last_login_at` = colonne présente (peut être NULL)

4. **Testez la connexion**
   - Allez sur votre application
   - Essayez de vous connecter avec :
     - Username : `RaphD`
     - Password : `admin123`

### Vérification rapide

Si vous voulez juste vérifier l'état actuel sans faire de modifications :

```sql
-- Vérifier la structure de la table
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'admin_users'
ORDER BY ordinal_position;

-- Vérifier les utilisateurs
SELECT username, display_name, is_active 
FROM admin_users;
```

### Si le problème persiste

1. **Vérifiez les erreurs dans la console du navigateur** (F12)
2. **Vérifiez les logs Supabase** dans le dashboard
3. **Essayez de vous déconnecter complètement** :
   ```javascript
   // Dans la console du navigateur
   localStorage.clear();
   location.reload();
   ```

### Migration automatique

La migration `supabase/migrations/add_last_login_to_admin_users.sql` a été créée pour ajouter automatiquement cette colonne lors du prochain déploiement.

### Prévention

Cette colonne est maintenant documentée et sera incluse dans tous les futurs déploiements. Le script `ensure_raphd_user.sql` devrait également être mis à jour pour inclure cette colonne dès la création de la table.
