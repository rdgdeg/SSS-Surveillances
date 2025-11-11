# Requirements Document - Système de Notifications Email

## Introduction

Ce document définit les exigences pour le système de notifications email automatiques du système de gestion des surveillances d'examens. L'objectif est d'augmenter le taux de soumission des disponibilités et d'améliorer la communication avec les surveillants.

## Glossary

- **System**: Le système de gestion des surveillances d'examens
- **Surveillant**: Personne pouvant effectuer des surveillances d'examens
- **Session**: Période d'examens (Janvier, Juin, Août)
- **Email Service**: Service d'envoi d'emails (Resend, SendGrid, ou Supabase Edge Functions)
- **Template**: Modèle d'email pré-formaté
- **Scheduler**: Système de planification des envois d'emails
- **Notification**: Email automatique envoyé par le système
- **Rappel**: Email de relance avant une date limite

## Requirements

### Requirement 1: Notification d'ouverture de session

**User Story:** En tant qu'administrateur, je veux que tous les surveillants actifs reçoivent automatiquement un email lorsqu'une nouvelle session est activée, afin qu'ils soient informés immédiatement.

#### Acceptance Criteria

1. WHEN une session est activée (is_active = true), THE System SHALL envoyer un email à tous les surveillants actifs
2. THE System SHALL inclure dans l'email le nom de la session, la date limite de soumission, et un lien direct vers le formulaire
3. THE System SHALL enregistrer l'envoi de chaque email dans une table d'audit
4. IF l'envoi échoue pour un surveillant, THEN THE System SHALL réessayer 3 fois avec un délai exponentiel
5. THE System SHALL permettre à l'administrateur de prévisualiser l'email avant activation de la session

### Requirement 2: Rappels programmés avant date limite

**User Story:** En tant qu'administrateur, je veux que des rappels automatiques soient envoyés aux surveillants n'ayant pas encore soumis leurs disponibilités, afin d'augmenter le taux de soumission.

#### Acceptance Criteria

1. THE System SHALL envoyer un rappel à J-7 avant la date limite aux surveillants n'ayant pas soumis
2. THE System SHALL envoyer un rappel à J-3 avant la date limite aux surveillants n'ayant pas soumis
3. THE System SHALL envoyer un rappel à J-1 avant la date limite aux surveillants n'ayant pas soumis
4. THE System SHALL exclure des rappels les surveillants ayant déjà soumis leurs disponibilités
5. THE System SHALL permettre à l'administrateur de configurer les jours de rappel (J-7, J-3, J-1)

### Requirement 3: Confirmation de soumission

**User Story:** En tant que surveillant, je veux recevoir un email de confirmation après avoir soumis mes disponibilités, afin d'avoir une preuve de ma soumission.

#### Acceptance Criteria

1. WHEN un surveillant soumet ses disponibilités, THE System SHALL envoyer immédiatement un email de confirmation
2. THE System SHALL inclure dans l'email un récapitulatif des créneaux sélectionnés
3. THE System SHALL inclure un lien pour modifier les disponibilités
4. THE System SHALL inclure la date et l'heure de soumission
5. THE System SHALL générer un numéro de confirmation unique

### Requirement 4: Notification de modification de créneaux

**User Story:** En tant que surveillant, je veux être notifié par email si un créneau pour lequel je me suis déclaré disponible est modifié ou supprimé, afin de pouvoir ajuster mes disponibilités.

#### Acceptance Criteria

1. WHEN un créneau est modifié (date, heure), THE System SHALL notifier tous les surveillants disponibles pour ce créneau
2. WHEN un créneau est supprimé, THE System SHALL notifier tous les surveillants disponibles pour ce créneau
3. THE System SHALL inclure dans l'email les anciennes et nouvelles informations du créneau
4. THE System SHALL inclure un lien pour mettre à jour les disponibilités
5. THE System SHALL permettre à l'administrateur de désactiver ces notifications si nécessaire

### Requirement 5: Templates d'emails personnalisables

**User Story:** En tant qu'administrateur, je veux pouvoir personnaliser les templates d'emails, afin d'adapter le ton et le contenu aux besoins de l'université.

#### Acceptance Criteria

1. THE System SHALL fournir des templates par défaut pour chaque type d'email
2. THE System SHALL permettre à l'administrateur de modifier le contenu des templates
3. THE System SHALL supporter les variables dynamiques (nom, prénom, session, date limite, etc.)
4. THE System SHALL prévisualiser le rendu final avec des données de test
5. THE System SHALL valider que les variables obligatoires sont présentes dans le template

### Requirement 6: Gestion des préférences de notification

**User Story:** En tant que surveillant, je veux pouvoir gérer mes préférences de notification, afin de contrôler quels emails je reçois.

#### Acceptance Criteria

1. THE System SHALL permettre aux surveillants de se désabonner des rappels (mais pas des notifications importantes)
2. THE System SHALL inclure un lien de désinscription dans chaque email de rappel
3. THE System SHALL respecter les préférences de notification de chaque surveillant
4. THE System SHALL permettre aux surveillants de réactiver les notifications depuis leur profil
5. THE System SHALL toujours envoyer les notifications critiques (confirmation, modifications) même si désabonné des rappels

### Requirement 7: Suivi et statistiques des emails

**User Story:** En tant qu'administrateur, je veux voir des statistiques sur les emails envoyés, afin de mesurer l'efficacité des notifications.

#### Acceptance Criteria

1. THE System SHALL enregistrer tous les emails envoyés avec leur statut (envoyé, échoué, ouvert, cliqué)
2. THE System SHALL afficher le taux d'ouverture des emails
3. THE System SHALL afficher le taux de clic sur les liens
4. THE System SHALL afficher la corrélation entre rappels et soumissions
5. THE System SHALL permettre d'exporter les statistiques en CSV

### Requirement 8: Gestion des erreurs d'envoi

**User Story:** En tant qu'administrateur, je veux être notifié si des emails n'ont pas pu être envoyés, afin de pouvoir contacter manuellement les surveillants concernés.

#### Acceptance Criteria

1. IF un email échoue après 3 tentatives, THEN THE System SHALL créer une alerte pour l'administrateur
2. THE System SHALL lister tous les emails en échec dans une interface dédiée
3. THE System SHALL permettre de renvoyer manuellement un email en échec
4. THE System SHALL valider les adresses email avant envoi
5. THE System SHALL gérer les bounces (emails invalides) et marquer les adresses comme invalides

### Requirement 9: Emails transactionnels prioritaires

**User Story:** En tant que système, je veux que les emails de confirmation soient envoyés immédiatement, afin de garantir une expérience utilisateur fluide.

#### Acceptance Criteria

1. THE System SHALL envoyer les emails de confirmation dans les 30 secondes suivant la soumission
2. THE System SHALL utiliser une file d'attente prioritaire pour les emails transactionnels
3. THE System SHALL garantir l'ordre d'envoi des emails (FIFO pour chaque priorité)
4. THE System SHALL limiter le débit d'envoi pour respecter les quotas du service d'email
5. THE System SHALL logger tous les délais d'envoi pour monitoring

### Requirement 10: Conformité RGPD

**User Story:** En tant qu'université, je veux que le système respecte le RGPD, afin d'être en conformité avec la législation européenne.

#### Acceptance Criteria

1. THE System SHALL inclure un lien de désinscription dans tous les emails marketing (rappels)
2. THE System SHALL permettre aux surveillants de demander l'export de leurs données
3. THE System SHALL permettre aux surveillants de demander la suppression de leurs données
4. THE System SHALL conserver les logs d'emails pendant maximum 2 ans
5. THE System SHALL obtenir le consentement explicite avant d'envoyer des emails non-transactionnels
