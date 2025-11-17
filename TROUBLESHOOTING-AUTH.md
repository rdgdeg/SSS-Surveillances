# Dépannage - Authentification

## Problème: "Nom d'utilisateur ou mot de passe incorrect"

### Solution 1: Mettre à jour les hash de mots de passe

Si vous avez déjà exécuté la migration avec les anciens hash, exécutez cette requête SQL:

```sql
-- Mettre à jour tous les utilisateurs avec le bon hash pour "admin123"
UPDATE admin_users 
SET password_hash = '$2b$10$vFBLAdauAkRrsZ4h1yt1GeZHD1LzTTH5UCUFfdFea27jAm2CN21.u'
WHERE username IN ('CelineG', 'CarmenP', 'RomaneV', 'GuillaumeA', 'MaximeD');
```

Ou utilisez le fichier de migration:
```bash
psql -h <host> -U <user> -d <database> -f supabase/migrations/update_admin_passwords.sql
```

### Solution 2: Vérifier que les utilisateurs existent

```sql
SELECT username, display_name, is_active 
FROM admin_users;
```

Si la table est vide, exécutez la migration complète:
```bash
psql -h <host> -U <user> -d <database> -f supabase/migrations/create_admin_users_and_audit.sql
```

### Solution 3: Vérifier les RLS (Row Level Security)

Les policies doivent permettre la lecture de la table `admin_users`:

```sql
-- Vérifier les policies
SELECT * FROM pg_policies WHERE tablename = 'admin_users';

-- Si nécessaire, recréer la policy
DROP POLICY IF EXISTS "Allow read access to admin_users" ON admin_users;
CREATE POLICY "Allow read access to admin_users" ON admin_users
  FOR SELECT USING (true);
```

### Solution 4: Tester manuellement

Testez la connexion directement dans la console du navigateur:

```javascript
// Dans la console du navigateur (F12)
const { data, error } = await supabase
  .from('admin_users')
  .select('*')
  .eq('username', 'CelineG')
  .single();

console.log('User:', data);
console.log('Error:', error);
```

### Solution 5: Vérifier bcrypt

Testez que bcrypt fonctionne correctement:

```bash
node scripts/test-bcrypt.js
```

Devrait afficher:
```
✅ Le hash correspond au mot de passe!
```

### Solution 6: Créer un utilisateur manuellement

Si tout le reste échoue, créez un utilisateur manuellement:

```bash
# Générer un nouveau hash
node scripts/generate-password-hash.js votre_mot_de_passe

# Puis insérer dans la base
INSERT INTO admin_users (username, display_name, password_hash, is_active)
VALUES ('TestUser', 'Test User', '<hash_généré>', true);
```

## Vérifications de base

### 1. La table existe-t-elle?
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'admin_users'
);
```

### 2. Les utilisateurs sont-ils actifs?
```sql
SELECT username, is_active FROM admin_users;
```

### 3. Le RLS est-il activé?
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'admin_users';
```

## Informations de connexion

**Utilisateurs disponibles:**
- CelineG
- CarmenP
- RomaneV
- GuillaumeA
- MaximeD

**Mot de passe par défaut:** `admin123`

**Hash bcrypt correct:** `$2b$10$vFBLAdauAkRrsZ4h1yt1GeZHD1LzTTH5UCUFfdFea27jAm2CN21.u`

## Logs de débogage

Ajoutez des logs dans `lib/auth.ts` pour voir ce qui se passe:

```typescript
export async function authenticateUser(username: string, password: string): Promise<AdminUser | null> {
  try {
    console.log('🔍 Tentative de connexion:', username);
    
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('id, username, display_name, password_hash, is_active')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    console.log('📊 Résultat requête:', { user: user?.username, error });

    if (error || !user) {
      console.log('❌ Utilisateur non trouvé ou erreur');
      return null;
    }

    console.log('🔐 Vérification du mot de passe...');
    const isValid = await bcrypt.compare(password, user.password_hash);
    console.log('✅ Mot de passe valide:', isValid);
    
    if (!isValid) {
      return null;
    }

    // ... reste du code
  } catch (error) {
    console.error('💥 Erreur d\'authentification:', error);
    return null;
  }
}
```

## Contact

Si le problème persiste après avoir essayé toutes ces solutions, vérifiez:
1. Que Supabase est bien configuré
2. Que les variables d'environnement sont correctes
3. Que vous êtes connecté à la bonne base de données
