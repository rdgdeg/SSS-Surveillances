# Guide du Système de Connexion

## Vue d'ensemble

Le système de connexion a été remis en place pour utiliser l'authentification avec les utilisateurs enregistrés dans la base de données Supabase.

## Utilisateurs disponibles

### 1. RaphD (Administrateur complet)
- **Username** : `RaphD`
- **Mot de passe** : `admin123`
- **Rôle** : Accès complet à toutes les fonctionnalités
- **Permissions** : Dashboard, Sessions, Examens, Surveillants, Rapports, etc.

### 2. CelineG (Utilisateur standard)
- **Username** : `CelineG`
- **Mot de passe** : `admin123`
- **Rôle** : Accès limité
- **Permissions** : Fonctionnalités de base

## Comment se connecter

1. Accédez à la page de connexion : `/login`
2. Entrez votre nom d'utilisateur (ex: `RaphD`)
3. Entrez votre mot de passe (ex: `admin123`)
4. Cliquez sur "Accéder à l'administration"

## Architecture technique

### Fichiers principaux

1. **`pages/LoginPage.tsx`** : Page de connexion avec formulaire
2. **`lib/auth.ts`** : Logique d'authentification avec bcrypt
3. **`contexts/AuthContext.tsx`** : Contexte React pour gérer l'état d'authentification
4. **`components/auth/ProtectedRoute.tsx`** : Protection des routes admin

### Flux d'authentification

```
1. Utilisateur entre username + password
   ↓
2. authenticateUser() vérifie dans la base de données
   ↓
3. Comparaison du hash bcrypt
   ↓
4. Si valide : création de la session + redirection
   ↓
5. Stockage dans localStorage pour persistance
```

### Table `admin_users`

```sql
CREATE TABLE admin_users (
    id UUID PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Sécurité

- ✅ Mots de passe hashés avec bcrypt (10 rounds)
- ✅ Vérification de l'état actif de l'utilisateur
- ✅ Protection des routes avec ProtectedRoute
- ✅ Session persistante dans localStorage
- ✅ Mise à jour automatique de `last_login_at`
- ✅ Audit trail des actions admin

## Vérification du système

Pour vérifier que les utilisateurs existent dans la base de données :

```bash
# Exécuter le script de vérification
psql -f scripts/verify-admin-users.sql
```

Ou via Supabase SQL Editor :

```sql
SELECT username, display_name, is_active 
FROM admin_users 
WHERE is_active = true;
```

## Ajouter un nouvel utilisateur

Pour créer un nouvel utilisateur admin :

```sql
-- Générer un hash bcrypt pour le mot de passe
-- Exemple avec "admin123" : $2b$10$vFBLAdauAkRrsZ4h1yt1GeZHD1LzTTH5UCUFfdFea27jAm2CN21.u

INSERT INTO admin_users (username, display_name, password_hash, is_active)
VALUES ('NouvelUser', 'Nom Complet', '$2b$10$...hash...', true);
```

## Réinitialiser un mot de passe

```sql
-- Réinitialiser le mot de passe à "admin123"
UPDATE admin_users 
SET password_hash = '$2b$10$vFBLAdauAkRrsZ4h1yt1GeZHD1LzTTH5UCUFfdFea27jAm2CN21.u',
    updated_at = NOW()
WHERE username = 'RaphD';
```

## Désactiver un utilisateur

```sql
UPDATE admin_users 
SET is_active = false,
    updated_at = NOW()
WHERE username = 'CelineG';
```

## Dépannage

### Problème : "Nom d'utilisateur ou mot de passe incorrect"

1. Vérifiez que l'utilisateur existe et est actif :
   ```sql
   SELECT * FROM admin_users WHERE username = 'RaphD';
   ```

2. Vérifiez que le hash du mot de passe est correct

3. Consultez les logs de la console navigateur pour plus de détails

### Problème : Redirection vers /login après connexion

1. Vérifiez que le localStorage contient `admin_user`
2. Vérifiez que AuthContext est bien wrappé autour de l'application
3. Vérifiez les routes protégées dans App.tsx

### Problème : Session perdue après rafraîchissement

1. Vérifiez que le localStorage n'est pas bloqué
2. Vérifiez que AuthContext charge bien l'utilisateur au démarrage
3. Vérifiez qu'il n'y a pas d'erreur de parsing JSON

## Améliorations futures possibles

- [ ] Système de rôles et permissions granulaires
- [ ] Authentification à deux facteurs (2FA)
- [ ] Expiration automatique des sessions
- [ ] Historique des connexions
- [ ] Politique de mots de passe forts
- [ ] Verrouillage après tentatives échouées
- [ ] Récupération de mot de passe par email
