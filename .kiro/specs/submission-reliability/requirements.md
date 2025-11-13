# Requirements Document

## Introduction

Ce document définit les exigences pour garantir qu'aucune soumission de disponibilités ne soit perdue dans le système de gestion des surveillances d'examens. Le système doit assurer la persistance, la traçabilité et la récupération des données de disponibilités soumises par les surveillants, même en cas d'erreurs réseau, de problèmes de navigateur ou d'interruptions utilisateur.

## Glossaire

- **System**: Le système de gestion des disponibilités de surveillance d'examens
- **Surveillant**: Personne soumettant ses disponibilités pour surveiller des examens
- **Soumission**: Ensemble des disponibilités déclarées par un surveillant pour une session
- **LocalStorage**: Mécanisme de stockage temporaire local du navigateur utilisé uniquement comme sauvegarde de secours pendant la saisie
- **Supabase**: Base de données backend PostgreSQL servant de source de vérité unique pour toutes les soumissions définitives
- **Session Active**: Session d'examens pour laquelle les disponibilités sont collectées
- **Créneau**: Plage horaire de surveillance d'examen
- **Formulaire Multi-Étapes**: Interface utilisateur en plusieurs étapes pour soumettre les disponibilités
- **Upsert**: Opération de base de données qui insère ou met à jour un enregistrement
- **Retry Logic**: Logique de nouvelle tentative automatique en cas d'échec
- **Offline Queue**: File d'attente locale pour les soumissions en attente
- **Validation Côté Client**: Vérification des données avant envoi au serveur
- **Transaction Database**: Opération atomique garantissant la cohérence des données
- **Audit Log**: Journal de traçabilité des opérations
- **Recovery Mechanism**: Mécanisme de récupération des données perdues

## Requirements

### Requirement 1

**User Story:** En tant que surveillant, je veux que mes données de formulaire soient sauvegardées automatiquement pendant que je remplis le formulaire, afin de ne pas perdre ma progression en cas de fermeture accidentelle du navigateur avant la soumission finale dans Supabase.

#### Acceptance Criteria

1. WHEN THE Surveillant modifie une donnée dans le Formulaire Multi-Étapes, THE System SHALL sauvegarder automatiquement les données dans le LocalStorage dans un délai de 500 millisecondes
2. WHEN THE Surveillant rouvre le formulaire après une fermeture, THE System SHALL restaurer automatiquement les données sauvegardées depuis le LocalStorage
3. WHEN THE Surveillant complète la soumission avec succès dans Supabase, THE System SHALL supprimer les données temporaires du LocalStorage
4. WHERE le LocalStorage est plein ou indisponible, THE System SHALL afficher un avertissement à l'utilisateur et continuer le fonctionnement sans sauvegarde automatique
5. THE System SHALL sauvegarder dans le LocalStorage les champs suivants : email, nom, prenom, type_surveillant, remarque_generale, availabilities, foundSurveillantId
6. THE System SHALL clairement indiquer à l'utilisateur que la soumission définitive nécessite de compléter le formulaire jusqu'à l'étape finale

### Requirement 2

**User Story:** En tant que surveillant, je veux que ma soumission soit enregistrée même si ma connexion internet est instable, afin de ne pas perdre mes disponibilités déclarées.

#### Acceptance Criteria

1. WHEN THE Surveillant soumet le formulaire ET la connexion réseau échoue, THE System SHALL stocker la soumission dans une Offline Queue locale
2. WHEN la connexion réseau est rétablie, THE System SHALL automatiquement tenter d'envoyer les soumissions en attente depuis la Offline Queue
3. THE System SHALL effectuer jusqu'à 5 tentatives de Retry Logic avec un délai exponentiel entre 1 et 30 secondes
4. WHEN toutes les tentatives échouent, THE System SHALL afficher un message d'erreur avec l'option de télécharger les données localement
5. WHEN une soumission de la Offline Queue est envoyée avec succès, THE System SHALL la retirer de la file d'attente et afficher une notification de succès

### Requirement 3

**User Story:** En tant qu'administrateur, je veux avoir une traçabilité complète de toutes les soumissions et modifications, afin de pouvoir identifier et résoudre tout problème de perte de données.

#### Acceptance Criteria

1. WHEN THE Surveillant soumet ou modifie ses disponibilités, THE System SHALL enregistrer un Audit Log avec timestamp, email, type d'opération et nombre de créneaux
2. THE System SHALL stocker dans la colonne historique_modifications un tableau JSON contenant chaque modification avec date, type et nb_creneaux
3. WHEN THE Surveillant modifie une soumission existante, THE System SHALL incrémenter un compteur de modifications
4. THE System SHALL conserver les timestamps submitted_at et updated_at pour chaque soumission
5. THE System SHALL permettre à l'administrateur de consulter l'historique complet des modifications d'une soumission

### Requirement 4

**User Story:** En tant que surveillant, je veux recevoir une confirmation immédiate que ma soumission a été enregistrée, afin d'avoir la certitude que mes disponibilités sont bien prises en compte.

#### Acceptance Criteria

1. WHEN THE System enregistre avec succès une soumission dans Supabase, THE System SHALL afficher un message de confirmation avec le nombre de créneaux sélectionnés
2. WHEN THE System enregistre avec succès une soumission, THE System SHALL afficher l'identifiant unique de la soumission
3. THE System SHALL envoyer un email de confirmation contenant un récapitulatif des disponibilités soumises dans un délai de 2 minutes
4. WHEN THE Surveillant consulte à nouveau le formulaire après soumission, THE System SHALL afficher les timestamps de soumission et de dernière modification
5. THE System SHALL permettre au Surveillant de télécharger un fichier PDF récapitulatif de sa soumission

### Requirement 5

**User Story:** En tant que développeur, je veux que toutes les opérations de base de données soient atomiques et transactionnelles, afin d'éviter les états incohérents qui pourraient causer des pertes de données.

#### Acceptance Criteria

1. WHEN THE System effectue une opération Upsert sur soumissions_disponibilites, THE System SHALL utiliser une Transaction Database garantissant l'atomicité
2. IF une erreur survient pendant l'enregistrement des disponibilités, THEN THE System SHALL effectuer un rollback complet de la transaction
3. THE System SHALL valider l'intégrité des données côté serveur avant de confirmer l'enregistrement
4. THE System SHALL utiliser la contrainte UNIQUE (session_id, email) pour éviter les doublons
5. WHEN THE System détecte un conflit lors de l'Upsert, THE System SHALL mettre à jour l'enregistrement existant plutôt que de créer un doublon

### Requirement 6

**User Story:** En tant qu'administrateur, je veux avoir un mécanisme de récupération pour restaurer les soumissions en cas de problème technique, afin de garantir qu'aucune donnée ne soit définitivement perdue.

#### Acceptance Criteria

1. THE System SHALL créer automatiquement une sauvegarde quotidienne de la table soumissions_disponibilites
2. THE System SHALL conserver les sauvegardes pendant une durée minimale de 90 jours
3. WHEN THE Administrateur détecte une perte de données, THE System SHALL fournir une interface pour restaurer des soumissions depuis les sauvegardes
4. THE System SHALL logger toutes les opérations de suppression avec l'identité de l'utilisateur et le timestamp
5. THE System SHALL implémenter un soft delete avec une colonne deleted_at plutôt qu'une suppression physique immédiate

### Requirement 7

**User Story:** En tant que surveillant, je veux être averti si ma soumission n'a pas pu être enregistrée, afin de pouvoir prendre des mesures correctives immédiatement.

#### Acceptance Criteria

1. WHEN THE System détecte un échec d'enregistrement, THE System SHALL afficher un message d'erreur explicite avec la cause du problème
2. WHEN THE System détecte un échec d'enregistrement, THE System SHALL proposer des actions correctives (réessayer, télécharger localement, contacter le support)
3. THE System SHALL afficher un indicateur visuel de l'état de la connexion réseau dans l'interface
4. WHEN THE Surveillant tente de quitter la page avec des modifications non sauvegardées, THE System SHALL afficher une confirmation avant de permettre la navigation
5. THE System SHALL désactiver le bouton de soumission pendant le traitement pour éviter les doubles soumissions

### Requirement 8

**User Story:** En tant que surveillant, je veux pouvoir vérifier que ma soumission a bien été enregistrée en consultant mes disponibilités, afin d'avoir une preuve de ma déclaration.

#### Acceptance Criteria

1. WHEN THE Surveillant saisit son email dans le formulaire, THE System SHALL charger et afficher sa soumission existante si elle existe
2. THE System SHALL afficher clairement les timestamps de première soumission et de dernière modification
3. THE System SHALL afficher le nombre de modifications effectuées sur la soumission
4. THE System SHALL permettre au Surveillant de modifier sa soumission existante
5. WHEN THE Surveillant modifie sa soumission, THE System SHALL conserver l'historique des versions précédentes dans historique_modifications
