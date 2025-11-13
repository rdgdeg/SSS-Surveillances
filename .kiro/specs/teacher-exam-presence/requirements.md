# Requirements Document

## Introduction

Ce document définit les exigences pour la fonctionnalité de gestion de la présence des enseignants aux examens. Cette fonctionnalité permet aux enseignants de déclarer leur présence aux examens et d'indiquer s'ils amènent des surveillants supplémentaires, afin de permettre à l'administration de calculer les besoins en surveillants pour chaque session d'examens.

## Glossary

- **System**: L'application de gestion des examens et surveillants
- **Enseignant**: Professeur responsable d'un ou plusieurs examens
- **Examen**: Épreuve d'évaluation associée à un cours et à une session
- **Session**: Période durant laquelle se déroulent les examens (ex: session d'automne 2025)
- **Surveillant**: Personne qui surveille un examen
- **Admin**: Administrateur de l'application ayant accès au tableau de bord
- **Code d'examen**: Identifiant unique d'un examen (ex: code de cours)
- **Fichier d'import**: Fichier CSV contenant la liste des examens avec leurs enseignants responsables

## Requirements

### Requirement 1

**User Story:** En tant qu'administrateur, je veux importer la liste des examens d'une session avec leurs enseignants responsables, afin de préparer la collecte des informations de présence.

#### Acceptance Criteria

1. WHEN l'Admin sélectionne un fichier CSV d'examens et déclenche l'import, THE System SHALL valider le format du fichier et extraire les données (nom d'examen, code d'examen, enseignants responsables)
2. WHEN l'import démarre, THE System SHALL afficher une barre de progression indiquant le pourcentage de lignes traitées
3. WHEN l'import est en cours, THE System SHALL effectuer des contrôles de validation sur chaque ligne (format des données, champs obligatoires, cohérence des informations)
4. IF le fichier CSV contient des erreurs de format ou des données manquantes, THEN THE System SHALL afficher un message d'erreur détaillé indiquant les lignes problématiques avec le type d'erreur
5. WHEN des erreurs sont détectées, THE System SHALL permettre à l'Admin de choisir entre ignorer les lignes erronées ou annuler l'import complet
6. WHEN l'import est réussi, THE System SHALL créer ou mettre à jour les enregistrements d'examens dans la base de données avec leurs enseignants associés
7. WHEN l'import est terminé, THE System SHALL afficher un résumé détaillé incluant le nombre d'examens importés, le nombre d'enseignants associés, et le nombre de lignes ignorées si applicable
8. WHERE une session est sélectionnée, THE System SHALL associer tous les examens importés à cette session

### Requirement 2

**User Story:** En tant qu'enseignant, je veux rechercher mon examen par code ou nom, afin de déclarer ma présence rapidement.

#### Acceptance Criteria

1. WHEN l'Enseignant accède à l'interface de déclaration de présence, THE System SHALL afficher un champ de recherche pour trouver un examen
2. WHEN l'Enseignant saisit un code d'examen ou un nom d'examen, THE System SHALL afficher les résultats correspondants en temps réel
3. WHEN l'Enseignant sélectionne un examen dans les résultats, THE System SHALL afficher le formulaire de déclaration de présence pour cet examen
4. WHERE l'Enseignant est associé à plusieurs examens, THE System SHALL afficher uniquement les examens de la session en cours
5. IF aucun résultat ne correspond à la recherche, THEN THE System SHALL afficher un message indiquant qu'aucun examen n'a été trouvé et proposer l'option de saisie manuelle

### Requirement 3

**User Story:** En tant qu'enseignant, je veux saisir manuellement le code de mon examen s'il n'existe pas dans le système, afin de pouvoir quand même déclarer ma présence.

#### Acceptance Criteria

1. WHEN l'Enseignant clique sur l'option de saisie manuelle, THE System SHALL afficher un formulaire pour créer un nouvel examen
2. WHEN l'Enseignant soumet le formulaire avec le code d'examen et le nom d'examen, THE System SHALL créer un enregistrement d'examen marqué comme "saisi manuellement"
3. WHEN un examen est créé manuellement, THE System SHALL envoyer une notification à l'Admin pour validation
4. WHEN l'examen manuel est créé, THE System SHALL permettre à l'Enseignant de continuer avec la déclaration de présence
5. THE System SHALL enregistrer l'identité de l'Enseignant qui a créé l'examen manuellement

### Requirement 4

**User Story:** En tant qu'enseignant, je veux déclarer si je serai présent à mon examen et indiquer le nombre de surveillants que j'amène, afin que l'administration puisse planifier les besoins en surveillants.

#### Acceptance Criteria

1. WHEN l'Enseignant accède au formulaire de déclaration pour un examen, THE System SHALL afficher les options "Présent" et "Absent"
2. WHEN l'Enseignant sélectionne "Présent", THE System SHALL afficher un champ numérique pour indiquer le nombre de surveillants accompagnants
3. WHEN l'Enseignant soumet sa déclaration, THE System SHALL enregistrer la présence, le nombre de surveillants, et l'horodatage de la soumission
4. WHEN l'Enseignant a déjà soumis une déclaration, THE System SHALL permettre de modifier sa déclaration jusqu'à une date limite définie par l'Admin
5. THE System SHALL valider que le nombre de surveillants accompagnants est un nombre entier positif ou zéro

### Requirement 5

**User Story:** En tant qu'administrateur, je veux consulter par session la liste des examens avec les informations de présence des enseignants, afin de calculer les besoins en surveillants.

#### Acceptance Criteria

1. WHEN l'Admin sélectionne une session, THE System SHALL afficher la liste de tous les examens de cette session avec leur horaire
2. WHERE un examen a une déclaration de présence, THE System SHALL afficher le statut de présence de l'enseignant et le nombre de surveillants accompagnants
3. WHERE un examen n'a pas de déclaration de présence, THE System SHALL afficher un indicateur visuel "En attente"
4. WHEN l'Admin consulte la liste, THE System SHALL calculer et afficher le total des besoins en surveillants par examen
5. THE System SHALL permettre à l'Admin de filtrer les examens par statut de déclaration (déclaré, en attente, saisi manuellement)

### Requirement 6

**User Story:** En tant qu'administrateur, je veux être notifié des examens saisis manuellement par les enseignants, afin de vérifier et valider ces informations.

#### Acceptance Criteria

1. WHEN un Enseignant crée un examen manuellement, THE System SHALL créer une notification visible dans le tableau de bord Admin
2. WHEN l'Admin consulte les notifications, THE System SHALL afficher les détails de l'examen saisi (code, nom, enseignant, date de saisie)
3. WHEN l'Admin valide un examen saisi manuellement, THE System SHALL retirer le marqueur "saisi manuellement" et archiver la notification
4. THE System SHALL permettre à l'Admin de modifier les informations d'un examen saisi manuellement avant validation
5. WHERE plusieurs examens manuels sont en attente, THE System SHALL afficher un compteur dans l'interface Admin

### Requirement 7

**User Story:** En tant qu'administrateur, je veux calculer automatiquement les besoins en surveillants par examen, afin de planifier efficacement les ressources.

#### Acceptance Criteria

1. WHEN l'Admin consulte un examen, THE System SHALL calculer le besoin en surveillants en fonction de la présence de l'enseignant et des surveillants accompagnants
2. WHERE l'Enseignant est présent avec des surveillants accompagnants, THE System SHALL soustraire ce nombre du besoin total en surveillants
3. WHERE l'Enseignant est absent, THE System SHALL maintenir le besoin total en surveillants sans réduction
4. WHEN les déclarations changent, THE System SHALL recalculer automatiquement les besoins en surveillants
5. THE System SHALL afficher un résumé des besoins totaux en surveillants pour toute la session
