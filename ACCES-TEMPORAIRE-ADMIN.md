# Accès Temporaire Admin - Solution de Contournement

## ✅ Solution Appliquée

J'ai modifié temporairement le fichier `lib/auth.ts` pour permettre une connexion directe sans passer par la base de données.

## 🔑 Identifiants de Connexion

**Mot de passe unique** : `uclouvain1200`

### Utilisateurs disponibles :

1. **RaphD** (Admin complet)
   - Username : `RaphD`
   - Password : `uclouvain1200`
   - Accès : Toutes les fonctionnalités

2. **CelineG** (Standard)
   - Username : `CelineG`
   - Password : `uclouvain1200`
   - Accès : Fonctionnalités limitées

## 🚀 Comment se connecter

1. Allez sur la page de connexion de votre application
2. Entrez :
   - Username : `RaphD` ou `CelineG`
   - Password : `uclouvain1200`
3. Cliquez sur "Se connecter"

Vous devriez être connecté immédiatement !

## ⚠️ Important

Cette solution est **TEMPORAIRE** et contourne la base de données. Elle a été mise en place pour vous permettre d'accéder rapidement à l'admin pendant que nous corrigeons le problème de base de données.

### Limitations de cette solution temporaire :

- ❌ Les connexions ne sont pas enregistrées dans la base de données
- ❌ Vous ne pouvez pas créer de nouveaux utilisateurs via l'interface
- ❌ Les modifications de mot de passe ne fonctionneront pas
- ✅ Toutes les autres fonctionnalités fonctionnent normalement

## 🔧 Prochaines Étapes

### 1. Diagnostic de la base de données

Exécutez le script `scripts/debug-login.sql` dans Supabase SQL Editor pour voir l'état actuel de la table `admin_users`.

### 2. Correction de la base de données

Une fois le diagnostic fait, nous pourrons :
- Corriger la structure de la table
- Ajouter les colonnes manquantes
- Créer les utilisateurs correctement dans la base

### 3. Retrait du code temporaire

Une fois la base de données corrigée, nous retirerons le code de contournement dans `lib/auth.ts` pour revenir à l'authentification normale.

## 📋 Code Modifié

Le fichier `lib/auth.ts` contient maintenant ce code temporaire :

```typescript
// MODE TEMPORAIRE : Authentification en dur pour déboguer
if (password === 'uclouvain1200') {
  if (username === 'RaphD') {
    return {
      id: 'temp-raphd-id',
      username: 'RaphD',
      display_name: 'Raphaël D.',
      is_active: true,
    };
  }
  if (username === 'CelineG') {
    return {
      id: 'temp-celineg-id',
      username: 'CelineG',
      display_name: 'Céline G.',
      is_active: true,
    };
  }
}
```

Ce code sera supprimé une fois la base de données corrigée.

## 🔍 Diagnostic

Pour comprendre pourquoi l'authentification normale ne fonctionne pas, exécutez :

```sql
-- Dans Supabase SQL Editor
-- Fichier: scripts/debug-login.sql
```

Ce script vous montrera :
- Si la table existe
- Quelles colonnes sont présentes
- Quels utilisateurs existent
- Si les hash de mots de passe sont corrects
- Si les policies RLS sont configurées

## 🛠️ Pour Corriger Définitivement

Une fois que vous aurez exécuté le diagnostic, nous pourrons :

1. **Créer/Corriger la table** avec toutes les colonnes nécessaires
2. **Insérer les utilisateurs** avec les bons hash de mots de passe
3. **Configurer les policies RLS** correctement
4. **Retirer le code temporaire** de `lib/auth.ts`

## 📞 Support

Si vous avez des questions ou si la connexion ne fonctionne toujours pas :
1. Vérifiez que vous utilisez exactement `uclouvain1200` comme mot de passe
2. Vérifiez la casse du username (`RaphD` avec un D majuscule)
3. Essayez de vider le cache du navigateur (Ctrl+Shift+R)
4. Ouvrez la console du navigateur (F12) pour voir les erreurs éventuelles

---

**Note** : Cette solution vous permet de travailler immédiatement pendant que nous résolvons le problème de base de données en arrière-plan.
