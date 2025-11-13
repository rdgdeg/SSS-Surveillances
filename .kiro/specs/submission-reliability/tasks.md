# Implementation Plan

## Overview

Ce plan d'implémentation transforme la conception en tâches concrètes de développement. Chaque tâche est incrémentale et testable indépendamment. Les tâches sont organisées par priorité pour permettre un déploiement progressif des fonctionnalités de fiabilité.

---

## Phase 1 : Infrastructure de base et migrations

- [x] 1. Mettre à jour le schéma de base de données
  - Créer un fichier de migration SQL `supabase-add-reliability-features.sql`
  - Ajouter les colonnes `updated_at`, `historique_modifications`, `deleted_at`, `version` à la table `soumissions_disponibilites`
  - Créer la fonction trigger `update_updated_at_column()` pour mettre à jour automatiquement `updated_at` et incrémenter `version`
  - Créer la fonction trigger `add_modification_history()` pour tracker les modifications dans `historique_modifications`
  - Créer les triggers `update_soumissions_updated_at` et `track_soumissions_modifications`
  - Migrer les données existantes : définir `updated_at = submitted_at` pour les enregistrements existants
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 5.1, 5.2_

- [x] 2. Créer la table audit_logs
  - Créer la table `audit_logs` avec les colonnes : id, timestamp, operation, entity, entity_id, user_email, user_id, details, ip_address, user_agent
  - Ajouter les contraintes CHECK pour operation et entity
  - Créer les index sur timestamp, entity, user_email, operation
  - Configurer les politiques RLS pour permettre l'insertion publique et la lecture admin uniquement
  - _Requirements: 3.1, 3.5_

- [x] 3. Créer la table backup_metadata
  - Créer la table `backup_metadata` avec les colonnes : id, backup_date, table_name, record_count, file_path, file_size_bytes, checksum, status, error_message, created_at, completed_at
  - Ajouter la contrainte UNIQUE sur backup_date
  - Créer les index sur backup_date et status
  - _Requirements: 6.1, 6.2_

- [x] 4. Mettre à jour les types TypeScript
  - Ajouter les champs `updated_at`, `historique_modifications`, `deleted_at`, `version` à l'interface `SoumissionDisponibilite` dans `types.ts`
  - Créer l'interface `AuditLog` avec tous les champs nécessaires
  - Créer l'interface `BackupMetadata`
  - Créer les types `ErrorType`, `ErrorContext`, `ErrorResponse`, `ErrorAction`
  - Créer les interfaces `FormProgressData`, `PendingSubmission`, `ProcessResult`, `SubmissionResult`, `SubmissionStatus`
  - _Requirements: 1.5, 2.1, 3.1, 7.1_

---

## Phase 2 : LocalStorage Manager

- [x] 5. Implémenter le LocalStorage Manager
  - Créer le fichier `lib/localStorageManager.ts`
  - Implémenter la fonction `saveFormProgress(data: FormProgressData)` avec debounce de 500ms
  - Implémenter la fonction `loadFormProgress(): FormProgressData | null` avec gestion des erreurs
  - Implémenter la fonction `clearFormProgress()` pour nettoyer après soumission
  - Implémenter la fonction `isAvailable(): boolean` pour vérifier la disponibilité du LocalStorage
  - Ajouter la gestion des erreurs QuotaExceededError avec message utilisateur approprié
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 6. Intégrer le LocalStorage Manager dans AvailabilityForm
  - Importer le LocalStorage Manager dans `components/public/AvailabilityForm.tsx`
  - Remplacer l'utilisation directe de localStorage par les méthodes du manager
  - Ajouter un useEffect pour sauvegarder automatiquement avec debounce lors des changements de formData et availabilities
  - Ajouter un useEffect pour restaurer les données au chargement du composant
  - Appeler `clearFormProgress()` après une soumission réussie
  - Afficher un avertissement visuel si LocalStorage n'est pas disponible
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

---

## Phase 3 : Offline Queue Manager

- [x] 7. Implémenter le Offline Queue Manager avec IndexedDB
  - Créer le fichier `lib/offlineQueueManager.ts`
  - Initialiser IndexedDB avec une base de données `SubmissionQueue` et un object store `pending_submissions`
  - Implémenter la fonction `enqueue(submission: PendingSubmission)` pour ajouter une soumission à la file
  - Implémenter la fonction `getAll(): Promise<PendingSubmission[]>` pour récupérer toutes les soumissions en attente
  - Implémenter la fonction `dequeue(id: string)` pour retirer une soumission après succès
  - Implémenter la fonction `processQueue(): Promise<ProcessResult>` pour traiter toutes les soumissions en attente
  - Implémenter la fonction `hasItems(): Promise<boolean>` pour vérifier si la file contient des éléments
  - Ajouter la gestion des erreurs IndexedDB avec fallback gracieux
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 8. Créer le composant OfflineQueueIndicator
  - Créer le fichier `components/shared/OfflineQueueIndicator.tsx`
  - Afficher le nombre de soumissions en attente dans la file d'attente
  - Afficher un bouton pour traiter manuellement la file d'attente
  - Afficher l'état de chaque soumission en attente (timestamp, nombre de tentatives, dernière erreur)
  - Permettre de télécharger une copie locale d'une soumission en attente
  - Mettre à jour l'affichage en temps réel lors des changements de la file
  - _Requirements: 2.1, 2.4, 2.5_

---

## Phase 4 : Network Manager et Retry Logic

- [x] 9. Implémenter le Network Manager
  - Créer le fichier `lib/networkManager.ts`
  - Implémenter la fonction `isOnline(): boolean` utilisant `navigator.onLine`
  - Implémenter la fonction `onConnectionChange(callback)` pour écouter les événements `online` et `offline`
  - Implémenter la fonction `submitWithRetry(payload, options)` avec retry logic et backoff exponentiel
  - Configurer les options par défaut : maxAttempts=5, initialDelay=1000ms, maxDelay=30000ms, backoffMultiplier=2
  - Calculer le délai avec la formule : `min(initialDelay * (backoffMultiplier ^ attempt), maxDelay)`
  - Retourner un `SubmissionResult` avec success, submissionId, error, et attempts
  - _Requirements: 2.2, 2.3_

- [x] 10. Créer le composant NetworkStatusIndicator
  - Créer le fichier `components/shared/NetworkStatusIndicator.tsx`
  - Afficher un indicateur visuel de l'état de la connexion (online/offline)
  - Utiliser le Network Manager pour détecter les changements de connexion
  - Afficher une notification toast lors du passage offline/online
  - Positionner l'indicateur de manière non-intrusive dans l'interface
  - _Requirements: 7.3_

---

## Phase 5 : Submission Service et orchestration

- [x] 11. Implémenter le Submission Service
  - Créer le fichier `lib/submissionService.ts`
  - Implémenter la fonction `submit(payload)` qui orchestre toute la logique de soumission
  - Étape 1 : Valider le payload côté client avec des règles strictes
  - Étape 2 : Vérifier la connexion avec Network Manager
  - Étape 3 : Si offline, ajouter à la file d'attente et retourner un message approprié
  - Étape 4 : Si online, soumettre avec retry logic via Network Manager
  - Étape 5 : Si succès, nettoyer LocalStorage et retourner le résultat
  - Étape 6 : Si échec après retries, ajouter à la file d'attente
  - Implémenter la fonction `checkStatus(email, sessionId)` pour vérifier l'état d'une soumission
  - Implémenter la fonction `downloadLocalCopy(payload)` pour télécharger un fichier JSON local
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 7.1, 7.2_

- [x] 12. Mettre à jour la fonction submitAvailability dans api.ts
  - Modifier `lib/api.ts` pour utiliser une transaction Supabase explicite si possible
  - Ajouter la validation serveur stricte du payload avant insertion
  - Vérifier que la session existe et est active
  - Vérifier que tous les creneau_id existent et appartiennent à la session
  - Utiliser l'upsert avec `onConflict: 'session_id, email'` pour gérer les mises à jour
  - Retourner l'ID de la soumission et les timestamps dans la réponse
  - Gérer les erreurs de contrainte unique avec un message approprié
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 13. Intégrer le Submission Service dans AvailabilityForm
  - Remplacer l'appel direct à `submitAvailability` par `submissionService.submit()`
  - Gérer les différents types de résultats (succès, offline, échec)
  - Afficher des messages appropriés selon le résultat
  - Désactiver le bouton de soumission pendant le traitement pour éviter les doubles soumissions
  - Afficher un loader avec le nombre de tentatives en cours
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 7.5_

---

## Phase 6 : Audit Logger

- [x] 14. Implémenter le Audit Logger
  - Créer le fichier `lib/auditLogger.ts`
  - Implémenter la fonction `log(entry: AuditEntry)` pour enregistrer une opération dans la table `audit_logs`
  - Capturer automatiquement l'IP et le user agent depuis les headers de requête
  - Implémenter la fonction `getHistory(filters: AuditFilters)` pour récupérer l'historique avec filtres
  - Ajouter la gestion des erreurs avec fallback silencieux (ne pas bloquer l'opération principale)
  - _Requirements: 3.1, 3.5_

- [x] 15. Intégrer l'Audit Logger dans les opérations critiques
  - Ajouter un log lors de chaque création de soumission (operation: 'create')
  - Ajouter un log lors de chaque modification de soumission (operation: 'update')
  - Ajouter un log lors de chaque consultation de soumission (operation: 'view')
  - Ajouter un log lors de chaque suppression de soumission (operation: 'delete')
  - Inclure les détails pertinents dans le champ `details` (nombre de créneaux, modifications, etc.)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

---

## Phase 7 : Confirmations et notifications

- [ ] 16. Améliorer les confirmations visuelles
  - Modifier le composant `SuccessStep` pour afficher l'ID unique de la soumission
  - Afficher le nombre de créneaux sélectionnés dans la confirmation
  - Afficher les timestamps de soumission et de dernière modification
  - Ajouter un bouton pour télécharger un récapitulatif PDF de la soumission
  - Afficher un message clair indiquant qu'un email de confirmation sera envoyé
  - _Requirements: 4.1, 4.2, 4.4, 4.5_

- [ ] 17. Créer le composant SubmissionSummaryPDF
  - Créer le fichier `lib/pdfGenerator.ts` utilisant une bibliothèque comme `jsPDF` ou `react-pdf`
  - Générer un PDF contenant : nom, prénom, email, session, date de soumission, liste des créneaux sélectionnés
  - Inclure un QR code ou un identifiant unique pour vérification
  - Formater le PDF de manière professionnelle avec le logo de l'institution
  - Implémenter la fonction `downloadSubmissionPDF(submission: SoumissionDisponibilite)`
  - _Requirements: 4.5_

- [ ] 18. Implémenter le système d'email de confirmation
  - Créer un Edge Function Supabase `send-confirmation-email` ou utiliser un service tiers (SendGrid, Resend)
  - Déclencher l'envoi d'email après chaque soumission réussie
  - Inclure dans l'email : récapitulatif des disponibilités, lien de modification, contact support
  - Utiliser un template HTML professionnel et responsive
  - Gérer les erreurs d'envoi sans bloquer la soumission principale
  - Logger les tentatives d'envoi dans audit_logs
  - _Requirements: 4.3_

---

## Phase 8 : Gestion des erreurs et UX

- [x] 19. Créer le Error Handler centralisé
  - Créer le fichier `lib/errorHandler.ts`
  - Implémenter la fonction `handle(error: Error, context: ErrorContext): ErrorResponse`
  - Classifier les erreurs par type (NETWORK_ERROR, VALIDATION_ERROR, DATABASE_ERROR, QUOTA_ERROR, UNKNOWN_ERROR)
  - Générer des messages utilisateur clairs et actionnables pour chaque type d'erreur
  - Proposer des actions correctives appropriées (réessayer, télécharger, contacter support)
  - Logger les erreurs dans la console et dans audit_logs si pertinent
  - _Requirements: 7.1, 7.2_

- [x] 20. Créer le composant ErrorDisplay
  - Créer le fichier `components/shared/ErrorDisplay.tsx`
  - Afficher le message d'erreur de manière claire et non-intrusive
  - Afficher les actions correctives sous forme de boutons
  - Utiliser des icônes et des couleurs appropriées selon le type d'erreur
  - Permettre de fermer le message d'erreur
  - Intégrer avec le Error Handler pour afficher les ErrorResponse
  - _Requirements: 7.1, 7.2_

- [x] 21. Ajouter la confirmation avant navigation
  - Ajouter un event listener `beforeunload` dans AvailabilityForm
  - Vérifier si des modifications non sauvegardées existent (comparer avec LocalStorage)
  - Afficher une confirmation native du navigateur si des modifications sont en attente
  - Désactiver la confirmation après une soumission réussie
  - _Requirements: 7.4_

- [x] 22. Améliorer les indicateurs de chargement
  - Ajouter un spinner avec le texte "Soumission en cours..." pendant la soumission
  - Afficher le nombre de tentatives si retry en cours : "Tentative 2/5..."
  - Désactiver tous les boutons et champs pendant la soumission
  - Afficher un indicateur de progression si possible
  - _Requirements: 7.5_

---

## Phase 9 : Vérification et historique

- [x] 23. Améliorer l'affichage de l'historique dans AvailabilityForm
  - Modifier le composant `SubmissionInfoBanner` pour afficher plus de détails
  - Afficher clairement la date de première soumission et de dernière modification
  - Afficher le nombre total de modifications effectuées
  - Ajouter un bouton "Voir l'historique complet" qui ouvre un modal
  - _Requirements: 3.2, 3.3, 3.4, 8.2, 8.3_

- [x] 24. Créer le composant SubmissionHistoryModal
  - Créer le fichier `components/public/SubmissionHistoryModal.tsx`
  - Afficher l'historique complet des modifications depuis `historique_modifications`
  - Pour chaque modification, afficher : date, type (création/modification), nombre de créneaux
  - Afficher une timeline visuelle des modifications
  - Permettre de fermer le modal
  - _Requirements: 3.2, 3.3, 3.4, 8.5_

- [x] 25. Améliorer la vérification de soumission existante
  - Modifier la fonction `handleEmailCheck` dans AvailabilityForm
  - Utiliser `submissionService.checkStatus()` pour vérifier l'existence d'une soumission
  - Afficher un message clair si une soumission existe déjà
  - Charger automatiquement les données de la soumission existante
  - Permettre la modification de la soumission existante
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

---

## Phase 10 : Soft Delete et récupération

- [x] 26. Implémenter le soft delete
  - Modifier la fonction `deleteSoumission` dans `lib/api.ts`
  - Au lieu de supprimer physiquement, définir `deleted_at = now()`
  - Ajouter un log dans audit_logs avec l'utilisateur qui a effectué la suppression
  - Modifier toutes les requêtes SELECT pour exclure les enregistrements avec `deleted_at IS NOT NULL`
  - _Requirements: 6.4, 6.5_

- [x] 27. Créer l'interface admin de récupération
  - Créer le composant `components/admin/DeletedSubmissionsManager.tsx`
  - Afficher la liste des soumissions supprimées (deleted_at IS NOT NULL)
  - Pour chaque soumission, afficher : email, date de soumission, date de suppression, qui a supprimé
  - Ajouter un bouton "Restaurer" qui définit `deleted_at = NULL`
  - Ajouter un bouton "Supprimer définitivement" avec confirmation
  - Logger toutes les opérations de restauration dans audit_logs
  - _Requirements: 6.3, 6.4_

---

## Phase 11 : Sauvegardes automatiques

- [x] 28. Créer le script de sauvegarde quotidienne
  - Créer un script `scripts/backup-submissions.ts` ou une Edge Function Supabase
  - Exporter toutes les soumissions de la table `soumissions_disponibilites` au format JSON
  - Compresser le fichier avec gzip
  - Calculer un checksum MD5 ou SHA256 du fichier
  - Enregistrer les métadonnées dans la table `backup_metadata`
  - Uploader le fichier vers un stockage sécurisé (Supabase Storage, S3, etc.)
  - Configurer un cron job pour exécution quotidienne à 2h du matin
  - _Requirements: 6.1_

- [x] 29. Implémenter la rétention des sauvegardes
  - Créer un script `scripts/cleanup-old-backups.ts`
  - Identifier les sauvegardes de plus de 90 jours
  - Supprimer les fichiers de sauvegarde obsolètes
  - Mettre à jour la table `backup_metadata` avec le statut 'deleted'
  - Logger les opérations de nettoyage
  - Configurer un cron job pour exécution hebdomadaire
  - _Requirements: 6.2_

---

## Phase 12 : Monitoring et tests

- [ ] 30. Implémenter le monitoring des métriques
  - Créer le fichier `lib/metricsCollector.ts`
  - Collecter les métriques : temps de réponse, taux de succès/échec, taille de la file d'attente, nombre de retries
  - Envoyer les métriques vers un service de monitoring (Sentry, DataDog, ou custom)
  - Créer un dashboard admin pour visualiser les métriques en temps réel
  - Configurer des alertes pour : taux d'échec > 5%, temps de réponse > 5s, file d'attente > 10 éléments
  - _Requirements: Monitoring section du design_

- [ ] 31. Écrire les tests unitaires pour LocalStorage Manager
  - Créer le fichier `__tests__/lib/localStorageManager.test.ts`
  - Tester la sauvegarde et restauration des données
  - Tester la gestion du quota dépassé (QuotaExceededError)
  - Tester le nettoyage après soumission
  - Tester la vérification de disponibilité
  - Utiliser des mocks pour localStorage
  - _Requirements: Testing Strategy section du design_

- [ ] 32. Écrire les tests unitaires pour Offline Queue Manager
  - Créer le fichier `__tests__/lib/offlineQueueManager.test.ts`
  - Tester l'ajout et le retrait d'éléments de la file
  - Tester le traitement de la file d'attente
  - Tester la gestion des erreurs IndexedDB
  - Utiliser fake-indexeddb pour les tests
  - _Requirements: Testing Strategy section du design_

- [ ] 33. Écrire les tests unitaires pour Network Manager
  - Créer le fichier `__tests__/lib/networkManager.test.ts`
  - Tester la détection de l'état réseau
  - Tester la retry logic avec différents scénarios
  - Tester le calcul du backoff exponentiel
  - Tester la gestion des timeouts
  - Mocker navigator.onLine et les événements online/offline
  - _Requirements: Testing Strategy section du design_

- [ ] 34. Écrire les tests unitaires pour Submission Service
  - Créer le fichier `__tests__/lib/submissionService.test.ts`
  - Tester la validation des payloads
  - Tester l'orchestration complète du flux de soumission
  - Tester les différents scénarios d'erreur
  - Tester l'intégration avec LocalStorage, OfflineQueue et Network Manager
  - Utiliser des mocks pour toutes les dépendances
  - _Requirements: Testing Strategy section du design_

- [ ] 35. Écrire les tests d'intégration end-to-end
  - Créer le fichier `__tests__/integration/submission-flow.test.ts`
  - Tester le flux complet : saisie → sauvegarde locale → soumission → confirmation
  - Tester le scénario hors-ligne : soumission → file d'attente → retour en ligne → traitement
  - Tester les scénarios d'erreur avec récupération
  - Utiliser Playwright ou Cypress pour les tests E2E
  - Vérifier la persistance dans Supabase après chaque test
  - _Requirements: Testing Strategy section du design_

---

## Phase 13 : Documentation et déploiement

- [ ] 36. Créer la documentation utilisateur
  - Créer le fichier `docs/user-guide-submission.md`
  - Documenter le processus de soumission étape par étape avec captures d'écran
  - Créer une FAQ pour les erreurs courantes et leurs solutions
  - Documenter la procédure de modification d'une soumission existante
  - Documenter la procédure de récupération en cas de problème
  - Traduire en français
  - _Requirements: Deployment Considerations section du design_

- [ ] 37. Créer la documentation technique
  - Créer le fichier `docs/technical-architecture.md`
  - Documenter l'architecture complète du système de fiabilité
  - Créer des diagrammes de flux pour chaque scénario
  - Documenter les API et interfaces de chaque composant
  - Créer un runbook pour les incidents courants
  - Documenter les procédures de maintenance et de monitoring
  - _Requirements: Deployment Considerations section du design_

- [ ] 38. Préparer le plan de migration et de déploiement
  - Créer le fichier `docs/deployment-plan.md`
  - Documenter les étapes de migration de la base de données
  - Créer un script de rollback en cas de problème
  - Définir les feature flags pour activation progressive
  - Planifier le monitoring post-déploiement (24h, 1 semaine)
  - Créer une checklist de validation pré-déploiement
  - Documenter la procédure de rollback
  - _Requirements: Deployment Considerations section du design_
