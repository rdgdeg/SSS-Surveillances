# Requirements Document

## Introduction

Ce document définit les exigences pour l'optimisation des performances et de la sécurité de l'application de gestion des surveillances d'examens. L'objectif est d'améliorer la vitesse de chargement, la réactivité de l'interface, la sécurité des données, et l'expérience utilisateur globale.

## Glossary

- **Application**: Le système de gestion des surveillances d'examens UCLouvain
- **Supabase**: Le backend-as-a-service utilisé pour la base de données et l'authentification
- **React Query**: Bibliothèque de gestion d'état et de cache pour les requêtes asynchrones
- **Virtualisation**: Technique de rendu optimisé pour les grandes listes
- **Tree-shaking**: Élimination du code non utilisé lors du build
- **Optimistic Update**: Mise à jour de l'interface avant confirmation du serveur
- **Environment Variables**: Variables de configuration stockées en dehors du code source
- **Zod**: Bibliothèque de validation de schémas TypeScript
- **Server-side Pagination**: Pagination effectuée au niveau de la base de données
- **Materialized View**: Vue PostgreSQL pré-calculée pour améliorer les performances

## Requirements

### Requirement 1: Gestion sécurisée des configurations

**User Story:** En tant qu'administrateur système, je veux que les clés API et configurations sensibles soient stockées de manière sécurisée, afin de protéger l'application contre les accès non autorisés.

#### Acceptance Criteria

1. WHEN THE Application déploie en production, THE Application SHALL stocker les clés Supabase dans des variables d'environnement
2. THE Application SHALL charger les variables d'environnement depuis un fichier .env.local en développement
3. THE Application SHALL valider la présence des variables d'environnement requises au démarrage
4. THE Application SHALL fournir un fichier .env.example documentant toutes les variables requises
5. THE Application SHALL exclure les fichiers .env du contrôle de version via .gitignore

### Requirement 2: Mise en cache des données avec React Query

**User Story:** En tant qu'utilisateur admin, je veux que les données se chargent rapidement lors de la navigation, afin de gagner du temps et d'améliorer mon expérience.

#### Acceptance Criteria

1. THE Application SHALL implémenter React Query pour la gestion du cache des requêtes API
2. WHEN un utilisateur navigue entre les pages admin, THE Application SHALL réutiliser les données en cache pendant 5 minutes
3. THE Application SHALL afficher les données en cache immédiatement WHILE effectuant une revalidation en arrière-plan
4. WHEN une mutation réussit, THE Application SHALL invalider automatiquement les caches concernés
5. THE Application SHALL configurer des stratégies de retry pour les requêtes échouées avec un maximum de 3 tentatives

### Requirement 3: Pagination côté serveur pour les surveillants

**User Story:** En tant qu'administrateur, je veux que la liste des surveillants se charge rapidement même avec des milliers d'entrées, afin de maintenir une interface réactive.

#### Acceptance Criteria

1. THE Application SHALL implémenter une pagination côté serveur pour la table surveillants
2. THE Application SHALL charger uniquement 50 surveillants par page depuis Supabase
3. WHEN l'utilisateur change de page, THE Application SHALL charger les données de la nouvelle page depuis le serveur
4. THE Application SHALL maintenir les filtres et le tri lors du changement de page
5. THE Application SHALL afficher le nombre total de résultats et le numéro de page actuel

### Requirement 4: Virtualisation des grandes listes

**User Story:** En tant qu'utilisateur admin, je veux que les tableaux de disponibilités s'affichent rapidement même avec de nombreux créneaux, afin de consulter les données sans ralentissement.

#### Acceptance Criteria

1. WHEN un tableau contient plus de 100 lignes, THE Application SHALL utiliser la virtualisation avec react-window
2. THE Application SHALL rendre uniquement les lignes visibles à l'écran plus un buffer
3. THE Application SHALL maintenir les performances de scroll fluides avec plus de 1000 lignes
4. THE Application SHALL préserver les fonctionnalités de tri et filtrage avec la virtualisation
5. THE Application SHALL adapter automatiquement la hauteur des lignes virtualisées

### Requirement 5: Validation des formulaires avec Zod

**User Story:** En tant qu'utilisateur, je veux recevoir des messages d'erreur clairs et immédiats lors de la saisie de formulaires, afin de corriger rapidement mes erreurs.

#### Acceptance Criteria

1. THE Application SHALL définir des schémas Zod pour tous les formulaires de l'application
2. THE Application SHALL valider les données côté client avant soumission au serveur
3. WHEN une validation échoue, THE Application SHALL afficher des messages d'erreur spécifiques pour chaque champ
4. THE Application SHALL valider les données en temps réel pendant la saisie avec un debounce de 300ms
5. THE Application SHALL garantir la cohérence des types entre validation et TypeScript

### Requirement 6: Optimisation des imports et du bundle

**User Story:** En tant qu'utilisateur, je veux que l'application se charge rapidement au premier accès, afin de commencer à travailler sans attendre.

#### Acceptance Criteria

1. THE Application SHALL utiliser des imports nommés pour lucide-react au lieu d'imports globaux
2. THE Application SHALL configurer le tree-shaking dans Vite pour éliminer le code non utilisé
3. THE Application SHALL lazy-loader les composants lourds comme les tableaux de disponibilités
4. THE Application SHALL analyser la taille du bundle et maintenir un bundle principal sous 500KB
5. THE Application SHALL séparer les dépendances vendor dans un chunk distinct

### Requirement 7: Mises à jour optimistes

**User Story:** En tant qu'utilisateur admin, je veux que mes actions (comme activer/désactiver un surveillant) se reflètent immédiatement dans l'interface, afin d'avoir un retour instantané.

#### Acceptance Criteria

1. WHEN l'utilisateur effectue une action de mise à jour, THE Application SHALL mettre à jour l'interface immédiatement
2. IF la requête serveur échoue, THEN THE Application SHALL annuler la mise à jour optimiste et afficher un message d'erreur
3. THE Application SHALL implémenter des mises à jour optimistes pour les actions fréquentes (toggle dispense, activation)
4. THE Application SHALL afficher un indicateur visuel subtil pendant la confirmation serveur
5. THE Application SHALL gérer les conflits de concurrence avec une stratégie last-write-wins

### Requirement 8: Gestion centralisée des erreurs

**User Story:** En tant qu'utilisateur, je veux comprendre clairement ce qui s'est mal passé quand une erreur survient, afin de savoir comment réagir.

#### Acceptance Criteria

1. THE Application SHALL créer un système centralisé de gestion des erreurs avec des codes d'erreur standardisés
2. WHEN une erreur réseau survient, THE Application SHALL proposer automatiquement de réessayer
3. THE Application SHALL afficher des messages d'erreur contextuels et actionnables pour l'utilisateur
4. THE Application SHALL logger les erreurs critiques pour le monitoring
5. THE Application SHALL différencier les erreurs utilisateur des erreurs système dans l'affichage

### Requirement 9: Optimisation des requêtes Supabase

**User Story:** En tant qu'administrateur système, je veux que les requêtes à la base de données soient optimisées, afin de réduire les coûts et améliorer les performances.

#### Acceptance Criteria

1. THE Application SHALL créer des index sur les colonnes email, session_id, et is_active
2. THE Application SHALL utiliser des requêtes select spécifiques au lieu de select('*') quand possible
3. THE Application SHALL implémenter une vue matérialisée pour les statistiques du dashboard
4. THE Application SHALL utiliser des fonctions PostgreSQL pour les calculs complexes côté serveur
5. THE Application SHALL limiter le nombre de résultats avec .limit() sur toutes les requêtes de liste

### Requirement 10: State management global

**User Story:** En tant qu'utilisateur admin, je veux que les informations de session active et d'utilisateur soient disponibles partout dans l'application, afin d'éviter les rechargements inutiles.

#### Acceptance Criteria

1. THE Application SHALL implémenter Zustand pour gérer l'état global de la session active
2. THE Application SHALL stocker les informations utilisateur dans le state global après authentification
3. WHEN la session active change, THE Application SHALL notifier tous les composants abonnés
4. THE Application SHALL persister l'état global dans localStorage pour survivre aux rechargements
5. THE Application SHALL synchroniser l'état entre les onglets du navigateur
