# Guide de Gestion des Utilisateurs

## Vue d'ensemble

La page de gestion des utilisateurs permet à l'administrateur principal (RaphD) de créer, modifier et gérer les comptes administrateurs directement depuis l'interface, sans passer par Supabase.

## Accès

- **Route** : `/admin/users`
- **Accessible uniquement à** : RaphD (administrateur complet)
- **Menu** : "Utilisateurs" (visible uniquement pour RaphD)

## Fonctionnalités

### 1. Créer un nouvel utilisateur

1. Cliquez sur le bouton **"Nouvel utilisateur"**
2. Remplissez le formulaire :
   - **Nom d'utilisateur** : Identifiant de connexion (ex: JeanD, MarieM)
   - **Nom complet** : Nom d'affichage (ex: Jean Dupont, Marie Martin)
3. Cliquez sur **"Créer"**

**Important** :
- Tous les nouveaux utilisateurs sont créés avec le mot de passe par défaut : `admin123`
- Le nom d'utilisateur doit être unique
- Le nom d'utilisateur ne peut pas être modifié après création

### 2. Modifier un utilisateur

1. Cliquez sur l'icône **crayon** (✏️) à côté de l'utilisateur
2. Modifiez le **nom complet**
3. Cliquez sur **"Modifier"**

**Note** : Seul le nom complet peut être modifié. Le nom d'utilisateur est permanent.

### 3. Activer/Désactiver un utilisateur

1. Cliquez sur l'icône **bouclier** (🛡️) à côté de l'utilisateur
2. Le statut bascule entre "Actif" et "Inactif"

**Effet** :
- **Actif** : L'utilisateur peut se connecter
- **Inactif** : L'utilisateur ne peut plus se connecter

**Protection** : RaphD ne peut pas être désactivé

### 4. Supprimer un utilisateur

1. Cliquez sur l'icône **poubelle** (🗑️) à côté de l'utilisateur
2. Confirmez la suppression

**Protection** : RaphD ne peut pas être supprimé

## Informations affichées

Pour chaque utilisateur, vous voyez :
- **Nom d'utilisateur** : Identifiant de connexion
- **Nom complet** : Nom d'affichage
- **Rôle** :
  - "Admin complet" pour RaphD (accès total)
  - "Standard" pour les autres (accès limité)
- **Statut** : Actif ou Inactif
- **Date de création** : Quand le compte a été créé

## Mot de passe par défaut

### Affichage
- Le mot de passe par défaut est affiché dans une bannière en haut de la page
- Cliquez sur l'icône œil (👁️) pour afficher/masquer le mot de passe
- Mot de passe : `admin123`

### Sécurité
⚠️ **Important** : Informez les nouveaux utilisateurs de changer leur mot de passe après la première connexion.

**Note** : Actuellement, il n'y a pas de fonctionnalité de changement de mot de passe dans l'interface. Pour changer un mot de passe, il faut passer par Supabase (voir ADMIN-SETUP-GUIDE.md).

## Permissions des utilisateurs

### RaphD (Admin complet)
- ✅ Accès à toutes les pages
- ✅ Peut gérer les utilisateurs
- ✅ Peut voir les statistiques et rapports
- ✅ Peut gérer les sessions et messages

### Utilisateurs standards
- ✅ Surveillants : Surveillants, Créneaux, Disponibilités
- ✅ Enseignants : Cours, Examens, Présences
- ✅ Aide
- ❌ Pas d'accès aux autres fonctionnalités

## Cas d'usage

### Ajouter un nouveau membre de l'équipe

1. Allez sur `/admin/users`
2. Cliquez sur "Nouvel utilisateur"
3. Créez le compte (ex: username: "SophieL", nom: "Sophie Lemaire")
4. Communiquez les identifiants :
   - Username: SophieL
   - Mot de passe: admin123
5. Demandez à l'utilisateur de se connecter et de changer son mot de passe

### Désactiver temporairement un utilisateur

1. Trouvez l'utilisateur dans la liste
2. Cliquez sur l'icône bouclier pour le désactiver
3. L'utilisateur ne pourra plus se connecter
4. Réactivez-le plus tard en cliquant à nouveau sur l'icône

### Supprimer un ancien utilisateur

1. Trouvez l'utilisateur dans la liste
2. Cliquez sur l'icône poubelle
3. Confirmez la suppression
4. Le compte est définitivement supprimé

## Sécurité

### Protections en place
- ✅ Page accessible uniquement à RaphD
- ✅ RaphD ne peut pas être supprimé
- ✅ RaphD ne peut pas être désactivé
- ✅ Les noms d'utilisateur sont uniques
- ✅ Mot de passe hashé avec bcrypt

### Recommandations
1. Ne créez des comptes que pour les personnes de confiance
2. Désactivez les comptes inutilisés plutôt que de les supprimer
3. Vérifiez régulièrement la liste des utilisateurs actifs
4. Informez les utilisateurs de ne jamais partager leurs identifiants

## Technique

### Base de données
- Table : `admin_users`
- Champs :
  - `id` : UUID unique
  - `username` : Nom d'utilisateur (unique)
  - `display_name` : Nom complet
  - `password_hash` : Hash bcrypt du mot de passe
  - `is_active` : Statut actif/inactif
  - `created_at` : Date de création
  - `updated_at` : Date de dernière modification

### Hash du mot de passe par défaut
```
Mot de passe : admin123
Hash bcrypt : $2b$10$vFBLAdauAkRrsZ4h1yt1GeZHD1LzTTH5UCUFfdFea27jAm2CN21.u
```

### API utilisée
- Supabase Client pour les opérations CRUD
- React Query pour la gestion du cache et des mutations
- bcryptjs pour le hashing (côté client pour affichage uniquement)

## Améliorations futures possibles

1. **Changement de mot de passe dans l'interface**
   - Formulaire de changement de mot de passe
   - Validation de la force du mot de passe
   - Historique des mots de passe

2. **Gestion des rôles avancée**
   - Créer différents niveaux de permissions
   - Permissions granulaires par fonctionnalité
   - Rôles personnalisables

3. **Audit des actions**
   - Logger toutes les actions des utilisateurs
   - Historique des connexions
   - Alertes de sécurité

4. **Notifications**
   - Email de bienvenue aux nouveaux utilisateurs
   - Notification de désactivation
   - Rappel de changement de mot de passe

5. **Authentification renforcée**
   - Authentification à deux facteurs (2FA)
   - Expiration des sessions
   - Politique de mot de passe forte

## Dépannage

### Erreur lors de la création d'un utilisateur

**Problème** : "duplicate key value violates unique constraint"
- **Cause** : Le nom d'utilisateur existe déjà
- **Solution** : Choisissez un nom d'utilisateur différent

### Utilisateur ne peut pas se connecter

1. Vérifiez que l'utilisateur est **actif** (statut vert)
2. Vérifiez que le nom d'utilisateur est correct (sensible à la casse)
3. Vérifiez que le mot de passe est correct (admin123 par défaut)
4. Consultez les logs dans la console du navigateur (F12)

### Impossible de modifier/supprimer RaphD

- C'est normal ! RaphD est protégé pour éviter de bloquer l'accès admin
- Ces protections sont en place pour la sécurité

## Support

Pour toute question :
- Consultez la page d'aide : `/admin/aide`
- Contactez le secrétariat : 02/436.16.89
