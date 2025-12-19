# Guide - Rapport des Surveillances

## Vue d'ensemble

Le **Rapport des Surveillances** est une nouvelle fonctionnalité admin qui permet d'extraire et d'analyser la répartition des surveillances entre les surveillants pour une session donnée.

## Accès

**Chemin :** Menu Admin → Rapports → **Rapport Surveillances**

**Permissions :** Réservé aux administrateurs (AdminOnly)

## Fonctionnalités

### 📊 Statistiques globales

Affichage en temps réel de :
- **Total surveillants** : Nombre de personnes ayant des surveillances
- **Total surveillances** : Nombre total de surveillances attribuées
- **Moyenne par surveillant** : Répartition moyenne
- **Maximum** : Nombre maximum de surveillances pour un surveillant
- **Minimum** : Nombre minimum de surveillances pour un surveillant

### 🔍 Filtres et tri

**Recherche :**
- Par nom, prénom ou email du surveillant

**Filtres :**
- **Type de surveillant** : Assistant, Doctorant, Externe, Étudiant, Autre
- **Tri** : Par nom alphabétique ou par nombre de surveillances
- **Ordre** : Croissant ou décroissant

### 📋 Liste détaillée

**Affichage par surveillant :**
- Nom et prénom
- Email et téléphone (si disponible)
- Type de surveillant (badge coloré)
- Nombre de surveillances (badge avec code couleur)

**Détail des surveillances :**
- Cliquer sur un surveillant pour voir le détail
- Pour chaque surveillance : code examen, nom, date, horaire, auditoire

### 📥 Export Excel

**Fonctionnalités d'export :**
- Export de la liste filtrée des surveillants
- Deux feuilles dans le fichier Excel :
  - **Surveillants** : Données détaillées de chaque surveillant
  - **Statistiques** : Résumé des statistiques globales

**Données exportées :**
- Nom, Prénom, Email, Téléphone
- Type de surveillant
- Nombre de surveillances
- Détail complet des examens surveillés

## Utilisation pratique

### 1. Contrôle de la répartition
- Vérifier l'équité de la répartition des surveillances
- Identifier les surveillants surchargés ou sous-utilisés
- Ajuster les attributions si nécessaire

### 2. Suivi administratif
- Générer des rapports pour la hiérarchie
- Documenter la répartition des tâches
- Préparer les données pour la paie/rémunération

### 3. Planification future
- Analyser les patterns de disponibilité
- Optimiser les futures attributions
- Identifier les besoins en recrutement

## Codes couleur

**Badges de surveillances :**
- 🔴 **Rouge** : 0 surveillance (problème)
- 🟠 **Orange** : 1-2 surveillances (faible)
- 🟢 **Vert** : 3+ surveillances (normal)

## Exemples d'utilisation

### Cas 1 : Vérification d'équité
1. Aller dans Rapport Surveillances
2. Trier par "Nombre de surveillances" décroissant
3. Vérifier que la répartition est équitable
4. Identifier les écarts importants

### Cas 2 : Export pour administration
1. Appliquer les filtres souhaités
2. Cliquer sur "Exporter Excel"
3. Utiliser le fichier pour rapports ou paie

### Cas 3 : Recherche spécifique
1. Utiliser la barre de recherche pour un surveillant
2. Voir ses surveillances détaillées
3. Vérifier la cohérence avec ses disponibilités

## Notes techniques

- **Données en temps réel** : Le rapport reflète l'état actuel des attributions
- **Session active** : Seules les données de la session active sont affichées
- **Performance optimisée** : Chargement rapide même avec beaucoup de surveillants
- **Responsive** : Interface adaptée mobile et desktop

## Avantages

1. **Vue d'ensemble complète** de la répartition des surveillances
2. **Export professionnel** pour documentation administrative
3. **Filtrage avancé** pour analyses ciblées
4. **Interface intuitive** et facile à utiliser
5. **Données fiables** basées sur les attributions réelles

Cette fonctionnalité complète parfaitement le système de gestion des surveillances en offrant une vue analytique et des outils d'export professionnels.