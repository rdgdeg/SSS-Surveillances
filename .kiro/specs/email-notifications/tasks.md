# Implementation Plan - Système de Notifications Email

## Phase 1: Configuration et Setup

- [ ] 1. Configurer le service Resend
- [ ] 1.1 Créer un compte sur resend.com
  - S'inscrire avec email UCLouvain
  - Vérifier l'email
  - _Requirements: 1.1_

- [ ] 1.2 Configurer le domaine email
  - Ajouter notifications.uclouvain.be (ou sous-domaine)
  - Configurer les enregistrements DNS (SPF, DKIM, DMARC)
  - Vérifier le domaine
  - _Requirements: 1.1_

- [ ] 1.3 Obtenir la clé API Resend
  - Générer une clé API
  - Ajouter à Supabase Vault ou variables d'environnement
  - _Requirements: 1.1_

- [ ] 2. Créer les tables de base de données
- [ ] 2.1 Créer supabase-email-tables.sql
  - Table email_templates
  - Table email_queue
  - Table email_logs
  - Table notification_preferences
  - Indexes appropriés
  - _Requirements: 5.1, 6.1, 7.1_

- [ ] 2.2 Exécuter la migration sur Supabase
  - Tester les tables
  - Vérifier les contraintes
  - _Requirements: 5.1_

- [ ] 2.3 Insérer les templates par défaut
  - Template session_opened
  - Template reminder_j7, reminder_j3, reminder_j1
  - Template confirmation
  - Template creneau_modified
  - _Requirements: 5.1_

## Phase 2: Edge Functions

- [ ] 3. Créer la fonction send-email
- [ ] 3.1 Créer supabase/functions/send-email/index.ts
  - Accepter les paramètres (to, subject, html, etc.)
  - Ajouter à email_queue
  - Gérer la priorité
  - _Requirements: 1.1, 9.1_

- [ ] 3.2 Implémenter le traitement immédiat pour priorité haute
  - Si priority <= 3, envoyer immédiatement
  - Sinon, laisser dans la queue
  - _Requirements: 9.1, 9.2_

- [ ] 3.3 Ajouter la gestion d'erreurs
  - Try/catch avec logging
  - Retry logic
  - _Requirements: 8.1, 8.2_

- [ ] 4. Créer la fonction process-queue
- [ ] 4.1 Créer supabase/functions/process-queue/index.ts
  - Récupérer les emails pending
  - Traiter par batch de 50
  - Respecter les priorités
  - _Requirements: 9.3, 9.4_

- [ ] 4.2 Implémenter l'envoi via Resend
  - Appeler l'API Resend
  - Logger le résultat
  - Mettre à jour le statut
  - _Requirements: 1.1, 7.1_

- [ ] 4.3 Gérer les échecs et retries
  - Incrémenter attempts
  - Calculer délai exponentiel
  - Marquer comme failed après 3 tentatives
  - _Requirements: 1.4, 8.1_

- [ ] 5. Créer la fonction schedule-reminders
- [ ] 5.1 Créer supabase/functions/schedule-reminders/index.ts
  - Récupérer les sessions actives
  - Calculer les jours jusqu'à deadline
  - Identifier le type de rappel (J-7, J-3, J-1)
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 5.2 Filtrer les surveillants non-soumis
  - Récupérer tous les surveillants actifs
  - Exclure ceux qui ont déjà soumis
  - Vérifier les préférences de notification
  - _Requirements: 2.4, 6.3_

- [ ] 5.3 Générer les emails de rappel
  - Récupérer le template approprié
  - Remplacer les variables
  - Ajouter à la queue
  - _Requirements: 2.1, 5.3_

## Phase 3: Templates et Rendu

- [ ] 6. Installer React Email
- [ ] 6.1 Installer les dépendances
  - npm install @react-email/components
  - npm install -D @react-email/render
  - _Requirements: 5.1_

- [ ] 6.2 Créer emails/SessionOpened.tsx
  - Template avec logo UCLouvain
  - Variables: surveillantName, sessionName, deadlineDate, formUrl
  - Bouton CTA
  - _Requirements: 1.2, 5.1_

- [ ] 6.3 Créer emails/Reminder.tsx
  - Template de rappel
  - Urgence visuelle selon J-7, J-3, J-1
  - Lien de désinscription
  - _Requirements: 2.1, 6.1_

- [ ] 6.4 Créer emails/Confirmation.tsx
  - Récapitulatif des créneaux sélectionnés
  - Numéro de confirmation
  - Lien pour modifier
  - _Requirements: 3.1, 3.2, 3.5_

- [ ] 6.5 Créer emails/CreneauModified.tsx
  - Anciennes vs nouvelles informations
  - Lien pour mettre à jour disponibilités
  - _Requirements: 4.1, 4.3_

- [ ] 7. Créer l'utilitaire de rendu
- [ ] 7.1 Créer lib/emailRenderer.ts
  - Fonction pour rendre React Email en HTML
  - Fonction pour remplacer les variables
  - Validation des variables requises
  - _Requirements: 5.3, 5.4_

## Phase 4: Intégration Frontend

- [ ] 8. Intégrer l'envoi de confirmation
- [ ] 8.1 Modifier submitAvailability dans lib/api.ts
  - Après soumission réussie, appeler send-email
  - Passer les données de soumission
  - Gérer les erreurs silencieusement (ne pas bloquer)
  - _Requirements: 3.1_

- [ ] 8.2 Générer le numéro de confirmation
  - UUID ou format personnalisé
  - Stocker dans soumissions_disponibilites
  - _Requirements: 3.5_

- [ ] 9. Intégrer la notification d'ouverture de session
- [ ] 9.1 Créer un hook useSessionActivation
  - Détecter quand is_active passe à true
  - Appeler send-email pour tous les surveillants actifs
  - _Requirements: 1.1_

- [ ] 9.2 Ajouter un bouton "Prévisualiser l'email" dans SessionsPage
  - Afficher le rendu de l'email avant activation
  - Permettre de modifier le template
  - _Requirements: 1.5_

- [ ] 10. Créer l'interface de gestion des préférences
- [ ] 10.1 Créer pages/NotificationPreferences.tsx
  - Toggle pour receive_reminders
  - Toggle pour receive_updates
  - Sauvegarder dans notification_preferences
  - _Requirements: 6.1, 6.4_

- [ ] 10.2 Ajouter le lien de désinscription dans les emails
  - Générer un token unique
  - Page publique pour se désabonner
  - _Requirements: 6.2, 10.1_

## Phase 5: Scheduler et Automation

- [ ] 11. Configurer pg_cron
- [ ] 11.1 Créer supabase-setup-cron.sql
  - Activer l'extension pg_cron
  - Créer le job process-queue (toutes les 5 min)
  - Créer le job schedule-reminders (quotidien à 9h)
  - Créer le job cleanup-logs (hebdomadaire)
  - _Requirements: 2.1, 9.3_

- [ ] 11.2 Exécuter sur Supabase
  - Tester les jobs
  - Vérifier les logs
  - _Requirements: 2.1_

- [ ] 12. Implémenter le webhook Resend
- [ ] 12.1 Créer supabase/functions/resend-webhook/index.ts
  - Recevoir les événements Resend
  - Mettre à jour email_logs (opened, clicked, bounced)
  - Gérer les bounces (marquer email invalide)
  - _Requirements: 7.1, 7.2, 8.5_

- [ ] 12.2 Configurer le webhook dans Resend
  - URL: https://your-project.supabase.co/functions/v1/resend-webhook
  - Événements: delivered, opened, clicked, bounced
  - _Requirements: 7.1_

## Phase 6: Dashboard et Monitoring

- [ ] 13. Créer le dashboard des emails
- [ ] 13.1 Créer pages/admin/EmailDashboard.tsx
  - Statistiques globales (envoyés, ouverts, cliqués)
  - Graphique de progression
  - Liste des emails en échec
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 13.2 Créer les hooks React Query
  - useEmailStats
  - useEmailLogs
  - useFailedEmails
  - _Requirements: 7.1_

- [ ] 13.3 Ajouter les actions admin
  - Renvoyer un email en échec
  - Voir le contenu d'un email
  - Exporter les statistiques en CSV
  - _Requirements: 8.3, 7.5_

- [ ] 14. Créer l'interface de gestion des templates
- [ ] 14.1 Créer pages/admin/EmailTemplates.tsx
  - Liste des templates
  - Édition du contenu HTML
  - Prévisualisation en temps réel
  - _Requirements: 5.2, 5.4_

- [ ] 14.2 Ajouter la validation des templates
  - Vérifier les variables requises
  - Tester le rendu
  - _Requirements: 5.5_

## Phase 7: Tests et Déploiement

- [ ] 15. Tests unitaires
- [ ] 15.1 Tester le rendu des templates
  - Vérifier le HTML généré
  - Tester le remplacement des variables
  - _Requirements: 5.3_

- [ ] 15.2 Tester la logique de queue
  - Priorités
  - Retries
  - _Requirements: 9.3_

- [ ] 16. Tests d'intégration
- [ ] 16.1 Tester le workflow complet
  - Soumission → Confirmation
  - Activation session → Notifications
  - Rappels automatiques
  - _Requirements: 1.1, 2.1, 3.1_

- [ ] 16.2 Tester la gestion des erreurs
  - Email invalide
  - API Resend down
  - Retries
  - _Requirements: 8.1, 8.2_

- [ ] 17. Déploiement progressif
- [ ] 17.1 Déployer en staging
  - Tester avec vraies données
  - Envoyer à quelques testeurs
  - _Requirements: All_

- [ ] 17.2 Monitoring intensif
  - Vérifier les logs
  - Surveiller les taux d'ouverture
  - Ajuster si nécessaire
  - _Requirements: 7.1_

- [ ] 17.3 Déploiement en production
  - Migration progressive
  - Communication aux utilisateurs
  - Support actif
  - _Requirements: All_

## Phase 8: Documentation

- [ ] 18. Documentation utilisateur
- [ ] 18.1 Créer EMAIL-GUIDE.md
  - Comment gérer ses préférences
  - Comment se désabonner
  - FAQ
  - _Requirements: 6.1_

- [ ] 18.2 Créer EMAIL-ADMIN-GUIDE.md
  - Comment modifier les templates
  - Comment voir les statistiques
  - Troubleshooting
  - _Requirements: 5.2, 7.1_

## Notes d'Implémentation

### Priorités des Emails
- 1-3: Transactionnels (confirmation, modifications) - Envoi immédiat
- 4-6: Notifications (ouverture session) - Envoi dans les 5 min
- 7-10: Rappels - Envoi différé

### Limites Resend (Plan Gratuit)
- 3000 emails/mois
- 100 emails/seconde
- Tracking inclus

### Estimation Temps
- Phase 1-2: 3 jours
- Phase 3-4: 4 jours
- Phase 5-6: 3 jours
- Phase 7-8: 2 jours
- **Total: ~2 semaines**
