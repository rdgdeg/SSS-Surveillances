# Guide de Configuration des Utilisateurs Admin

## Problème résolu

La table `admin_users` manquait les colonnes `updated_at` et `last_login_at`, ce qui empêchait la connexion des utilisateurs.

## Solution rapide

### Option 1 : Ajouter les colonnes manquantes (RECOMMANDÉ)

Exécutez ce script dans le SQL Editor de Supabase :

```sql
-- Fichier: scripts/add-missing-columns.sql
```

Ce script :
- ✅ Ajoute les colonnes manquantes
- ✅ Crée les index nécessaires
- ✅ Configure le trigger pour updated_at
- ✅ Crée les utilisateurs RaphD et CelineG
- ✅ Préserve les données existantes

### Option 2 : Recréer la table (si Option 1 ne fonctionne pas)

⚠️ **ATTENTION** : Cette option supprime toutes les données existantes !

```sql
-- Fichier: scripts/recreate-admin-users.sql
```

## Utilisateurs créés

### RaphD (Administrateur complet)
- **Username** : `RaphD`
- **Mot de passe** : `admin123`
- **Rôle** : Accès complet à toutes les fonctionnalités
- **Permissions** : Dashboard, Sessions, Rapports, Messages, etc.

### CelineG (Utilisateur standard)
- **Username** : `CelineG`
- **Mot de passe** : `admin123`
- **Rôle** : Accès limité
- **Permissions** : Surveillants, Créneaux, Disponibilités, Cours, Examens, Présences, Aide

## Structure de la table admin_users

```sql
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),      -- ← Colonne ajoutée
    last_login_at TIMESTAMPTZ                  -- ← Colonne ajoutée
);
```

## Vérification

Après avoir exécuté le script, vérifiez que tout fonctionne :

### 1. Vérifier la structure de la table

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'admin_users'
ORDER BY ordinal_position;
```

Vous devriez voir toutes les colonnes, y compris `updated_at` et `last_login_at`.

### 2. Vérifier les utilisateurs

```sql
SELECT 
    username,
    display_name,
    is_active,
    created_at,
    updated_at,
    last_login_at
FROM admin_users
ORDER BY username;
```

Vous devriez voir RaphD et CelineG.

### 3. Tester la connexion

1. Allez sur `/login`
2. Connectez-vous avec :
   - Username : `RaphD`
   - Password : `admin123`
3. Vérifiez que vous voyez tous les menus

4. Déconnectez-vous et reconnectez-vous avec :
   - Username : `CelineG`
   - Password : `admin123`
5. Vérifiez que vous voyez les menus limités

## Ajouter d'autres utilisateurs

### Via l'interface (après connexion avec RaphD)

1. Connectez-vous avec RaphD
2. Allez dans **Gestion des Utilisateurs**
3. Cliquez sur **Nouvel utilisateur**
4. Remplissez le formulaire
5. Le mot de passe par défaut sera `admin123`

### Via SQL

```sql
-- Générer un hash pour un nouveau mot de passe
-- Utilisez bcrypt avec un salt de 10 rounds
-- Hash pour "admin123": $2b$10$vFBLAdauAkRrsZ4h1yt1GeZHD1LzTTH5UCUFfdFea27jAm2CN21.u

INSERT INTO admin_users (username, display_name, password_hash, is_active)
VALUES ('NouveauUser', 'Nom Complet', '$2b$10$vFBLAdauAkRrsZ4h1yt1GeZHD1LzTTH5UCUFfdFea27jAm2CN21.u', true);
```

## Changer un mot de passe

Pour générer un nouveau hash de mot de passe, utilisez Node.js :

```javascript
const bcrypt = require('bcryptjs');
const password = 'nouveau_mot_de_passe';
const hash = bcrypt.hashSync(password, 10);
console.log(hash);
```

Puis mettez à jour dans Supabase :

```sql
UPDATE admin_users 
SET password_hash = 'nouveau_hash_ici'
WHERE username = 'RaphD';
```

## Désactiver un utilisateur

```sql
UPDATE admin_users 
SET is_active = false
WHERE username = 'NomUtilisateur';
```

## Réactiver un utilisateur

```sql
UPDATE admin_users 
SET is_active = true
WHERE username = 'NomUtilisateur';
```

## Dépannage

### Erreur : "column updated_at does not exist"

➡️ Exécutez le script `scripts/add-missing-columns.sql`

### Erreur : "Nom d'utilisateur ou mot de passe incorrect"

1. Vérifiez que l'utilisateur existe :
```sql
SELECT * FROM admin_users WHERE username = 'RaphD';
```

2. Vérifiez que l'utilisateur est actif :
```sql
SELECT username, is_active FROM admin_users WHERE username = 'RaphD';
```

3. Vérifiez le hash du mot de passe :
```sql
SELECT username, password_hash FROM admin_users WHERE username = 'RaphD';
```

Le hash pour "admin123" doit être :
```
$2b$10$vFBLAdauAkRrsZ4h1yt1GeZHD1LzTTH5UCUFfdFea27jAm2CN21.u
```

### L'utilisateur se connecte mais n'a pas les bons menus

- Seul RaphD (avec exactement cette casse) a accès complet
- Les autres utilisateurs ont un accès limité
- Vérifiez dans la console du navigateur (F12) :
  ```javascript
  JSON.parse(localStorage.getItem('admin_user'))
  ```

## Sécurité

### Recommandations importantes

1. ✅ **Changez les mots de passe par défaut** immédiatement en production
2. ✅ Utilisez des mots de passe forts (minimum 12 caractères)
3. ✅ Ne partagez jamais les identifiants par email non chiffré
4. ✅ Désactivez les utilisateurs qui ne sont plus nécessaires
5. ✅ Vérifiez régulièrement les connexions dans `last_login_at`

### Audit des connexions

Pour voir les dernières connexions :

```sql
SELECT 
    username,
    display_name,
    last_login_at,
    CASE 
        WHEN last_login_at IS NULL THEN 'Jamais connecté'
        WHEN last_login_at > NOW() - INTERVAL '1 day' THEN 'Aujourd''hui'
        WHEN last_login_at > NOW() - INTERVAL '7 days' THEN 'Cette semaine'
        WHEN last_login_at > NOW() - INTERVAL '30 days' THEN 'Ce mois'
        ELSE 'Plus de 30 jours'
    END as derniere_connexion
FROM admin_users
ORDER BY last_login_at DESC NULLS LAST;
```

## Support

Pour toute question :
- Consultez la page d'aide : `/admin/aide`
- Contactez le secrétariat : 02/436.16.89
