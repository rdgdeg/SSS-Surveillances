# Guide des Permissions et Page d'Aide

## Vue d'ensemble

Ce document décrit le système de permissions mis en place et la page d'aide complète créée pour les utilisateurs de l'administration.

## Système de Permissions

### Rôles utilisateurs

#### 1. Administrateur complet (RaphD)
- **Accès** : Toutes les fonctionnalités de la plateforme
- **Pages accessibles** :
  - Tableau de bord
  - Sessions
  - **Surveillants** : Surveillants, Créneaux, Disponibilités, Suivi Soumissions, Relances
  - **Enseignants** : Cours, Examens, Analyse Examens, Présences
  - **Rapports** : Statistiques, Rapports
  - Messages
  - Aide

#### 2. Utilisateurs standards (tous les autres)
- **Accès** : Fonctionnalités limitées de gestion
- **Pages accessibles** :
  - **Surveillants** : Surveillants, Créneaux, Disponibilités
  - **Enseignants** : Cours, Examens, Présences
  - Aide

### Implémentation technique

#### Composants de protection

1. **ProtectedRoute** (`components/auth/ProtectedRoute.tsx`)
   - Vérifie l'authentification de base
   - Redirige vers `/login` si non authentifié

2. **AdminOnlyRoute** (`components/auth/AdminOnlyRoute.tsx`)
   - Vérifie que l'utilisateur est RaphD
   - Redirige vers `/admin/aide` si accès non autorisé

#### Filtrage du menu

Le composant `AdminLayout` filtre automatiquement les liens de navigation selon l'utilisateur :

```typescript
const isFullAdmin = user?.username === 'RaphD';

const navLinks = useMemo(() => {
  if (isFullAdmin) {
    return allNavLinks; // RaphD voit tout
  }
  // Les autres utilisateurs ne voient que les liens non-admin
  return allNavLinks.filter(link => !link.adminOnly);
}, [isFullAdmin]);
```

## Page d'Aide

### Localisation
- **Route** : `/admin/aide`
- **Fichier** : `pages/admin/AidePage.tsx`
- **Accessible à** : Tous les utilisateurs authentifiés

### Contenu de la page

La page d'aide est organisée en sections extensibles/réductibles :

#### 1. Introduction
- Présentation de la plateforme
- Indication du rôle de l'utilisateur (admin complet ou standard)
- Explication des permissions

#### 2. Surveillants - Gestion des surveillants
- Vue d'ensemble de la fonctionnalité
- Fonctionnalités principales :
  - Ajouter/Modifier/Supprimer un surveillant
  - Rechercher et filtrer
  - Exporter les données
- Avertissements importants
- Processus recommandé

#### 3. Créneaux - Gestion des créneaux horaires
- Vue d'ensemble
- Fonctionnalités principales :
  - Créer/Modifier/Supprimer un créneau
  - Filtrer par session
  - Vue calendrier
- Structure d'un créneau
- Processus recommandé

#### 4. Disponibilités - Collecte et gestion
- Vue d'ensemble
- Fonctionnalités principales :
  - Visualiser les disponibilités
  - Générer un lien de partage
  - Statistiques et exports
- Explication du lien de partage
- Processus de collecte complet

#### 5. Cours - Gestion des cours
- Vue d'ensemble
- Fonctionnalités principales :
  - Ajouter/Modifier/Supprimer un cours
  - Import en masse
  - Gestion des consignes
- Structure d'un cours
- Détection de doublons
- Processus recommandé

#### 6. Examens - Planification des examens
- Vue d'ensemble
- Fonctionnalités principales :
  - Créer/Modifier/Supprimer un examen
  - Lier à un cours
  - Import en masse
  - Nombre de surveillants requis
- Structure d'un examen
- Format d'import CSV
- Processus recommandé

#### 7. Présences - Déclarations des enseignants
- Vue d'ensemble
- Fonctionnalités principales :
  - Visualiser les déclarations
  - Types de présence
  - Types d'examen
  - Durée d'examen
- Types de présence expliqués :
  - Présent surveillance complète
  - Présent partiellement
  - Absent
- Informations collectées
- Coordination entre enseignants
- Processus de collecte

#### 8. Processus complet de gestion
- Workflow recommandé en 5 phases :
  1. **Phase 1 : Préparation**
     - Créer la session
     - Importer les cours
     - Créer les surveillants
  
  2. **Phase 2 : Planification**
     - Créer les créneaux
     - Créer les examens
     - Lier examens et cours
     - Définir les surveillants requis
  
  3. **Phase 3 : Collecte des disponibilités**
     - Générer le lien de partage
     - Envoyer aux surveillants
     - Suivre les soumissions
     - Relancer
  
  4. **Phase 4 : Collecte des présences enseignants**
     - Partager le lien de déclaration
     - Consulter les déclarations
  
  5. **Phase 5 : Affectation et suivi**
     - Exporter les données
     - Planifier les affectations
     - Communiquer les plannings

### Fonctionnalités de la page

- **Sections extensibles** : Cliquez sur une section pour l'ouvrir/fermer
- **Icônes visuelles** : Chaque section a une icône distinctive
- **Code couleur** : Alertes et informations importantes mises en évidence
- **Exemples pratiques** : Format CSV, structure des données
- **Contact** : Numéro du secrétariat affiché en bas de page

## Modifications des fichiers

### Fichiers créés

1. **pages/admin/AidePage.tsx**
   - Page d'aide complète avec toutes les sections
   - Interface interactive avec sections extensibles

2. **components/auth/AdminOnlyRoute.tsx**
   - Composant de protection pour les routes admin-only
   - Redirige les utilisateurs non-autorisés vers la page d'aide

3. **PERMISSIONS-ET-AIDE-GUIDE.md**
   - Ce document de documentation

### Fichiers modifiés

1. **components/layouts/AdminLayout.tsx**
   - Ajout de la détection du rôle utilisateur
   - Filtrage dynamique des liens de navigation
   - Ajout du lien "Aide" dans le menu
   - Import de l'icône HelpCircle

2. **App.tsx**
   - Ajout de la route `/admin/aide`
   - Import lazy de AidePage
   - Protection des routes admin-only avec AdminOnlyRoute
   - Redirection par défaut vers `/admin/surveillants` au lieu de dashboard

3. **components/auth/ProtectedRoute.tsx**
   - Simplification (retour à la version de base)
   - Export par défaut

## Utilisation

### Pour RaphD (Admin complet)
1. Se connecter avec les identifiants RaphD
2. Accès à toutes les pages du menu
3. Peut consulter la page d'aide pour référence

### Pour les autres utilisateurs
1. Se connecter avec leurs identifiants
2. Menu limité aux pages autorisées :
   - Surveillants, Créneaux, Disponibilités
   - Cours, Examens, Présences
   - Aide
3. Tentative d'accès à une page non autorisée → Redirection vers Aide
4. Consulter la page d'aide pour comprendre les fonctionnalités

## Sécurité

- ✅ Filtrage côté client du menu de navigation
- ✅ Protection des routes avec composants de garde
- ✅ Redirection automatique en cas d'accès non autorisé
- ✅ Vérification basée sur le username (RaphD)
- ⚠️ **Note** : La sécurité côté serveur (RLS Supabase) doit également être configurée

## Améliorations futures possibles

1. **Système de rôles en base de données**
   - Ajouter une colonne `role` dans la table `admin_users`
   - Gérer plusieurs niveaux de permissions

2. **Permissions granulaires**
   - Permissions par fonctionnalité (lecture/écriture/suppression)
   - Permissions par module

3. **Audit des accès**
   - Logger les tentatives d'accès non autorisées
   - Historique des actions par utilisateur

4. **Page d'aide interactive**
   - Vidéos tutorielles
   - Recherche dans l'aide
   - FAQ dynamique

5. **Notifications**
   - Alerter RaphD des tentatives d'accès non autorisées
   - Notifications de nouvelles fonctionnalités

## Contact

Pour toute question sur les permissions ou l'utilisation de la plateforme :
**Secrétariat : 02/436.16.89**
