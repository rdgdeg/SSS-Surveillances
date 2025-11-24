# Test du Système de Connexion

## Étapes de test

### 1. Vérifier les utilisateurs dans la base de données

Exécutez dans Supabase SQL Editor :

```sql
SELECT username, display_name, is_active, created_at 
FROM admin_users 
WHERE is_active = true
ORDER BY username;
```

**Résultat attendu :**
- RaphD (Raphaël D.)
- CelineG (Céline G.)

### 2. Tester la connexion avec RaphD

1. Ouvrez l'application : `http://localhost:5173/login`
2. Entrez :
   - Username : `RaphD`
   - Password : `admin123`
3. Cliquez sur "Accéder à l'administration"

**Résultat attendu :**
- ✅ Message de succès : "Bienvenue Raphaël D.!"
- ✅ Redirection vers `/admin`
- ✅ Accès à toutes les fonctionnalités

### 3. Tester la connexion avec CelineG

1. Déconnectez-vous
2. Retournez sur `/login`
3. Entrez :
   - Username : `CelineG`
   - Password : `admin123`
4. Cliquez sur "Accéder à l'administration"

**Résultat attendu :**
- ✅ Message de succès : "Bienvenue Céline G.!"
- ✅ Redirection vers `/admin`
- ✅ Accès limité (pas d'accès à certaines pages réservées à RaphD)

### 4. Tester un mot de passe incorrect

1. Déconnectez-vous
2. Retournez sur `/login`
3. Entrez :
   - Username : `RaphD`
   - Password : `mauvais_mot_de_passe`
4. Cliquez sur "Accéder à l'administration"

**Résultat attendu :**
- ❌ Message d'erreur : "Nom d'utilisateur ou mot de passe incorrect"
- ❌ Pas de redirection

### 5. Tester un utilisateur inexistant

1. Entrez :
   - Username : `UtilisateurInexistant`
   - Password : `admin123`
2. Cliquez sur "Accéder à l'administration"

**Résultat attendu :**
- ❌ Message d'erreur : "Nom d'utilisateur ou mot de passe incorrect"
- ❌ Pas de redirection

### 6. Tester la persistance de session

1. Connectez-vous avec RaphD
2. Rafraîchissez la page (F5)

**Résultat attendu :**
- ✅ Toujours connecté
- ✅ Pas de redirection vers /login

### 7. Tester la déconnexion

1. Connecté en tant que RaphD
2. Cliquez sur le bouton de déconnexion
3. Essayez d'accéder à `/admin`

**Résultat attendu :**
- ✅ Redirection automatique vers `/login`
- ✅ localStorage vidé

### 8. Vérifier la mise à jour de last_login_at

Après une connexion réussie, exécutez :

```sql
SELECT username, display_name, last_login_at 
FROM admin_users 
WHERE username = 'RaphD';
```

**Résultat attendu :**
- ✅ `last_login_at` mis à jour avec l'heure actuelle

## Checklist de validation

- [ ] Les deux utilisateurs (RaphD et CelineG) existent dans la base
- [ ] Connexion réussie avec RaphD
- [ ] Connexion réussie avec CelineG
- [ ] Rejet des mauvais mots de passe
- [ ] Rejet des utilisateurs inexistants
- [ ] Session persistante après rafraîchissement
- [ ] Déconnexion fonctionnelle
- [ ] Mise à jour de last_login_at
- [ ] Protection des routes admin
- [ ] Pas d'erreurs dans la console

## En cas de problème

### Si les utilisateurs n'existent pas

Exécutez la migration :

```bash
psql -f supabase/migrations/ensure_raphd_user.sql
```

Ou créez-les manuellement :

```sql
INSERT INTO admin_users (username, display_name, password_hash, is_active)
VALUES 
('RaphD', 'Raphaël D.', '$2b$10$vFBLAdauAkRrsZ4h1yt1GeZHD1LzTTH5UCUFfdFea27jAm2CN21.u', true),
('CelineG', 'Céline G.', '$2b$10$vFBLAdauAkRrsZ4h1yt1GeZHD1LzTTH5UCUFfdFea27jAm2CN21.u', true)
ON CONFLICT (username) DO NOTHING;
```

### Si la connexion échoue toujours

1. Vérifiez les logs de la console navigateur
2. Vérifiez les logs Supabase
3. Vérifiez que bcryptjs est installé : `npm list bcryptjs`
4. Vérifiez la configuration Supabase dans `.env.local`

### Si la session n'est pas persistante

1. Vérifiez que localStorage fonctionne
2. Vérifiez AuthContext dans App.tsx
3. Vérifiez qu'il n'y a pas d'erreur de parsing JSON
