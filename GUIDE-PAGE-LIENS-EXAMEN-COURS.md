# Guide - Page Liens Examen-Cours

## 🎯 Nouvelle fonctionnalité

Une nouvelle page d'administration dédiée à la vérification et gestion des liens entre examens et cours a été ajoutée.

**Accès :** Menu Admin > **Liens Examen-Cours**

## 📊 Fonctionnalités principales

### 1. **Vue d'ensemble avec statistiques**
- **Total** : Nombre total d'examens
- **Parfaits** : Examens avec code cours exactement correspondant
- **Liés** : Examens liés mais avec code différent
- **Incohérents** : Examens liés au mauvais cours
- **Non liés** : Examens orphelins sans cours

### 2. **Filtres avancés**

#### Filtre par statut :
- **Tous** : Afficher tous les examens
- **Parfaits** : Code examen = code cours (ex: WINTR2105 → WINTR2105)
- **Liés** : Lié mais codes différents (ex: WINTR2105A → WINTR2105)
- **Incohérents** : Lié au mauvais cours (ex: WINTR2105 → MATH1001)
- **Non liés** : Aucun cours assigné

#### Recherche textuelle :
- Code d'examen
- Nom d'examen
- Code de cours
- Nom de cours

### 3. **Tableau détaillé**

Pour chaque examen, affichage de :
- **Code et nom de l'examen**
- **Code extrait** (code cours déduit du code examen)
- **Cours lié** (code et nom du cours assigné)
- **Statut** avec badge coloré
- **Enseignants** (comparaison examen vs cours)
- **Actions** (modifier le lien)

### 4. **Modification des liens**

- **Bouton "Modifier"** : Ouvre une liste déroulante
- **Sélection du cours** : Tous les cours de la session
- **Option "Aucun cours"** : Délier l'examen
- **Sauvegarde immédiate** avec confirmation

## 🎨 Interface utilisateur

### Badges de statut :
- 🟢 **Parfait** : Correspondance exacte des codes
- 🔵 **Lié** : Lié mais codes différents  
- 🟠 **Incohérent** : Lié au mauvais cours
- 🔴 **Non lié** : Aucun cours assigné

### Comparaison des enseignants :
- **Examen** : Enseignants déclarés pour l'examen
- **Cours** : Enseignants du cours lié
- Permet d'identifier les incohérences

## 🔧 Utilisation pratique

### 1. **Identifier les problèmes**
1. Aller dans **Admin** > **Liens Examen-Cours**
2. Regarder les statistiques en haut
3. Filtrer par **"Incohérents"** ou **"Non liés"**

### 2. **Corriger un lien incorrect**
1. Trouver l'examen dans la liste
2. Cliquer sur **"Modifier"**
3. Sélectionner le bon cours dans la liste
4. Cliquer sur **"Sauver"**

### 3. **Délier un examen**
1. Cliquer sur **"Modifier"**
2. Sélectionner **"Aucun cours"**
3. Cliquer sur **"Sauver"**

### 4. **Rechercher un examen spécifique**
1. Utiliser la barre de recherche
2. Taper le code d'examen ou une partie du nom
3. Les résultats se filtrent automatiquement

## 🔍 Cas d'usage typiques

### **Examen orphelin**
- **Problème** : Examen WINTR2105 sans cours lié
- **Solution** : Le lier au cours WINTR2105 s'il existe

### **Mauvais lien**
- **Problème** : Examen WINTR2105A lié au cours MATH1001
- **Solution** : Le relier au cours WINTR2105

### **Enseignants différents**
- **Problème** : Examen avec Prof A, cours avec Prof B
- **Action** : Vérifier et corriger si nécessaire

### **Code d'examen complexe**
- **Problème** : WINTR2105-SECT-A ne trouve pas WINTR2105
- **Solution** : Liaison manuelle via l'interface

## 📈 Avantages

1. **Vue centralisée** : Tous les liens en un seul endroit
2. **Filtrage intelligent** : Identifier rapidement les problèmes
3. **Modification rapide** : Correction en quelques clics
4. **Statistiques visuelles** : Suivi de la qualité des données
5. **Recherche efficace** : Trouver un examen spécifique rapidement

## 🔄 Workflow recommandé

### Après import d'examens :
1. **Vérifier les statistiques** sur la page Liens Examen-Cours
2. **Traiter les "Non liés"** en priorité
3. **Vérifier les "Incohérents"** 
4. **Contrôler les enseignants** pour les liens existants

### Maintenance régulière :
1. **Contrôle hebdomadaire** des nouveaux examens
2. **Correction immédiate** des liens incorrects
3. **Documentation** des cas particuliers

## 🎯 Intégration avec l'existant

Cette page complète les outils existants :
- **Gestion des examens** > **Lier aux cours** : Pour les examens orphelins
- **Nouvelle page** : Vue d'ensemble et correction de tous les types de problèmes
- **Scripts SQL** : Pour les diagnostics avancés

La nouvelle page offre une approche plus visuelle et interactive pour la gestion des liens examen-cours.