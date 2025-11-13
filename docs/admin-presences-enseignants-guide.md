# Guide Admin - Suivi des Présences Enseignants

## Vue d'ensemble

La page **Présences Enseignants** permet aux administrateurs de suivre et gérer les déclarations de présence des enseignants pour les examens. Cette interface offre une vue complète des cours, des enseignants présents et des surveillants accompagnants.

## Accès

1. Connectez-vous à l'interface d'administration
2. Dans le menu de navigation, section **Enseignants**, cliquez sur **Présences**
3. La page affiche automatiquement les données de la session active

## Fonctionnalités

### 1. Tableau de bord statistique

En haut de la page, vous trouverez 5 cartes statistiques :

- **Total Cours** : Nombre total de cours dans la session
- **Déclarés** : Nombre de cours avec au moins une déclaration de présence
- **En attente** : Nombre de cours sans déclaration
- **Enseignants** : Nombre total d'enseignants qui seront présents
- **Surveillants** : Nombre total de surveillants accompagnants

### 2. Filtres et recherche

#### Barre de recherche
- Recherchez un cours par son code ou son intitulé
- La recherche est instantanée et insensible à la casse

#### Filtres de statut
- **Tous** : Affiche tous les cours
- **Déclarés** : Affiche uniquement les cours avec des déclarations
- **En attente** : Affiche uniquement les cours sans déclaration

### 3. Liste des cours

Le tableau principal affiche pour chaque cours :

- **Code et intitulé** du cours
- **Nombre de déclarations** reçues
- **Nombre d'enseignants présents** (en vert)
- **Nombre de surveillants accompagnants** (en violet)
- **Statut** : Badge indiquant si le cours est déclaré ou en attente
- **Bouton Détails** : Ouvre la vue détaillée du cours

### 4. Vue détaillée d'un cours

En cliquant sur "Détails", une modale s'ouvre avec :

#### Résumé
- Nombre total de déclarations
- Nombre d'enseignants présents
- Nombre de surveillants accompagnants

#### Liste des déclarations
Pour chaque déclaration, vous verrez :
- **Nom et email** de l'enseignant
- **Statut de présence** (Présent/Absent)
- **Nombre de surveillants** amenés (si applicable)
- **Noms des surveillants** (si fournis)
- **Remarques** éventuelles
- **Date et heure** de soumission

### 5. Export des données

Le bouton **Exporter CSV** en haut à droite permet de télécharger un fichier CSV contenant :
- Code du cours
- Intitulé complet
- Nombre de déclarations
- Nombre d'enseignants présents
- Nombre de surveillants accompagnants

Le fichier est nommé automatiquement avec la date : `presences-enseignants-YYYY-MM-DD.csv`

## Cas d'usage

### Vérifier les cours sans déclaration

1. Cliquez sur le filtre **En attente**
2. La liste affiche uniquement les cours sans déclaration
3. Vous pouvez contacter les enseignants concernés

### Calculer les besoins en surveillance

1. Consultez les statistiques en haut de page
2. Le nombre total de surveillants accompagnants vous donne une estimation
3. Exportez les données pour une analyse plus détaillée

### Vérifier une déclaration spécifique

1. Recherchez le cours dans la barre de recherche
2. Cliquez sur **Détails**
3. Consultez toutes les déclarations avec leurs détails

## Organisation du menu admin

Le menu de navigation est organisé en catégories :

### Section Générale
- Tableau de bord
- Sessions

### Section Surveillants
- Surveillants
- Créneaux
- Disponibilités
- Suivi Soumissions
- Relances

### Section Enseignants
- Cours
- Présences

### Section Transversale
- Statistiques
- Messages

## Notes importantes

- Les données affichées correspondent toujours à la **session active**
- Si aucune session n'est active, un message d'avertissement s'affiche
- Les déclarations peuvent être modifiées par les enseignants à tout moment
- Les remarques des enseignants sont automatiquement ajoutées aux consignes du cours

## Support

Pour toute question ou problème, utilisez le bouton "Nous contacter" dans le footer de l'application.
