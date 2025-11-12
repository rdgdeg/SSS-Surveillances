# Guide du Registre des Consignes de Cours

## Vue d'ensemble

Le registre des consignes de cours permet de gérer et consulter les instructions spécifiques pour chaque examen. Cette fonctionnalité est accessible aux surveillants pour consultation et aux administrateurs pour la gestion.

## Installation et Configuration

### 1. Créer la table dans Supabase

Exécutez le script SQL suivant dans l'éditeur SQL de Supabase :

```bash
# Fichier: supabase-create-cours-table.sql
```

Ce script crée :
- La table `cours` avec tous les champs nécessaires
- Les index pour optimiser les recherches
- Les politiques RLS (Row Level Security)
- Les triggers pour la mise à jour automatique des timestamps

### 2. Importer les cours initiaux

1. Connectez-vous à l'interface admin : `/#/admin/cours`
2. Cliquez sur "Importer des cours"
3. Sélectionnez le fichier CSV fourni (`Examens (1).csv`)
4. Cliquez sur "Importer"

Le système importera automatiquement tous les cours avec leur code et intitulé.

## Utilisation pour les Surveillants

### Accéder aux consignes

1. Depuis la page d'accueil, cliquez sur le bouton "Consignes" dans le menu
2. Vous accédez à la liste complète des cours

### Rechercher un cours

- **Recherche textuelle** : Tapez le code ou l'intitulé du cours dans la barre de recherche
- **Tri** : Triez par code, intitulé ou date de mise à jour
- **Filtre** : Filtrez les cours avec ou sans consignes spécifiques

### Consulter les consignes

1. Cliquez sur un cours dans la liste
2. Une fenêtre modale s'ouvre avec :
   - Le code et l'intitulé du cours
   - Les consignes spécifiques (si définies)
   - Un message par défaut si aucune consigne n'est définie

### Actions disponibles

- **Copier** : Copie les consignes dans le presse-papiers
- **Imprimer** : Imprime les consignes
- **Fermer** : Ferme la fenêtre modale

## Utilisation pour les Administrateurs

### Accéder à la gestion des cours

1. Connectez-vous à l'interface admin
2. Cliquez sur "Cours" dans le menu de navigation

### Tableau de bord

Le tableau de bord affiche :
- **Total des cours** : Nombre total de cours dans le système
- **Avec consignes** : Nombre de cours ayant des consignes définies
- **Sans consignes** : Nombre de cours sans consignes

### Importer des cours

#### Format du fichier CSV

Le fichier doit respecter le format suivant :
```csv
Cours;Intit.Complet
LEDPH1001;Fondements des jeux et des sports collectifs
LEDPH1002;Fondements des activités physiques et sportives
```

**Règles importantes :**
- Séparateur : point-virgule (;)
- Encodage : UTF-8
- Première ligne : en-têtes (Cours;Intit.Complet)
- Taille maximale : 5 MB

#### Processus d'import

1. Cliquez sur "Importer des cours"
2. Sélectionnez votre fichier CSV
3. Cliquez sur "Importer"
4. Le système :
   - Crée les nouveaux cours
   - Met à jour les intitulés des cours existants
   - Préserve les consignes existantes
   - Affiche un rapport d'import avec les erreurs éventuelles

### Ajouter ou modifier des consignes

1. Recherchez le cours dans la liste
2. Cliquez sur "Modifier" à droite de la ligne
3. Dans le formulaire :
   - **Intitulé complet** : Modifiez si nécessaire
   - **Consignes d'examen** : Saisissez les instructions spécifiques
4. Cliquez sur "Enregistrer"

**Conseils :**
- Soyez clair et concis
- Utilisez des listes à puces si nécessaire
- Mentionnez les documents autorisés/interdits
- Indiquez les consignes spécifiques (calculatrice, formulaire, etc.)
- Maximum 10 000 caractères

### Supprimer des consignes

1. Ouvrez le formulaire de modification du cours
2. Cliquez sur "Supprimer les consignes"
3. Confirmez la suppression

Le cours restera dans le système mais affichera le message par défaut aux surveillants.

### Rechercher et filtrer

Utilisez les mêmes outils que les surveillants :
- Recherche par code ou intitulé
- Tri par différents critères
- Filtre par statut des consignes

## Format CSV d'Import

### Structure

```csv
Cours;Intit.Complet
CODE1;Intitulé complet du cours 1
CODE2;Intitulé complet du cours 2
```

### Règles de validation

- **Code du cours** :
  - Obligatoire
  - Maximum 50 caractères
  - Unique dans le système

- **Intitulé complet** :
  - Obligatoire
  - Maximum 500 caractères

### Gestion des doublons

Si un cours avec le même code existe déjà :
- L'intitulé est mis à jour
- Les consignes existantes sont préservées
- Aucune erreur n'est générée

### Exemple de fichier valide

```csv
Cours;Intit.Complet
LEDPH1001;Fondements des jeux et des sports collectifs
LEDPH1002;Fondements des activités physiques et sportives
LKINE1002;Psychologie et handicap
WFARM1004;Chimie appliquée aux médicaments
```

## Messages par Défaut

Lorsqu'aucune consigne spécifique n'est définie pour un cours, le message suivant est affiché :

> "Se référer aux consignes générales et/ou présentes sur la feuille d'examen"

## Bonnes Pratiques

### Pour les administrateurs

1. **Import initial** : Importez tous les cours au début de chaque année académique
2. **Mise à jour progressive** : Ajoutez les consignes au fur et à mesure
3. **Vérification** : Vérifiez régulièrement les cours sans consignes
4. **Communication** : Informez les surveillants des mises à jour importantes

### Pour les surveillants

1. **Consultation préalable** : Consultez les consignes avant l'examen
2. **Impression** : Imprimez les consignes si nécessaire
3. **Vérification** : Vérifiez toujours la feuille d'examen pour les consignes complémentaires

## Dépannage

### Problème : Le fichier CSV ne s'importe pas

**Solutions :**
- Vérifiez que le séparateur est bien un point-virgule (;)
- Vérifiez l'encodage du fichier (doit être UTF-8)
- Vérifiez que la première ligne contient les en-têtes
- Vérifiez la taille du fichier (max 5 MB)

### Problème : Certains cours ne sont pas importés

**Solutions :**
- Consultez le rapport d'erreurs après l'import
- Vérifiez que chaque ligne contient un code et un intitulé
- Vérifiez que les codes ne dépassent pas 50 caractères
- Vérifiez que les intitulés ne dépassent pas 500 caractères

### Problème : Les consignes ne s'affichent pas

**Solutions :**
- Vérifiez que les consignes ont bien été enregistrées
- Actualisez la page
- Vérifiez que vous consultez le bon cours

### Problème : Impossible de modifier les consignes

**Solutions :**
- Vérifiez que vous êtes connecté en tant qu'administrateur
- Vérifiez votre connexion internet
- Actualisez la page et réessayez

## Support

Pour toute question ou problème :
- Email : raphael.degand@uclouvain.be
- Consultez la documentation technique dans le dossier `.kiro/specs/course-instructions-registry/`

## Mises à Jour

### Version 1.0 (Novembre 2024)
- Création initiale du registre des consignes
- Import CSV
- Interface de consultation pour surveillants
- Interface de gestion pour administrateurs
- Recherche et filtres
