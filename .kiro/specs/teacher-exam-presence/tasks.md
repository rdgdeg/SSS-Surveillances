# Implementation Plan - Gestion de la Présence des Enseignants aux Examens

- [x] 1. Créer le schéma de base de données et les migrations
  - Créer le fichier SQL pour les tables `examens`, `presences_enseignants`, et `notifications_admin`
  - Ajouter les indexes pour optimiser les requêtes
  - Configurer les politiques RLS (Row Level Security)
  - Créer une vue pour les examens avec leurs statistiques de présence
  - _Requirements: 1.1, 1.3, 2.4, 3.2, 4.3, 5.1, 6.1_

- [x] 2. Implémenter les types TypeScript et interfaces
  - Ajouter les interfaces `Examen`, `PresenceEnseignant`, `NotificationAdmin` dans `types.ts`
  - Ajouter les interfaces `ExamenWithPresence`, `ExamenImportResult`, `PresenceFormData`, `ManualExamenFormData`
  - Ajouter l'enum `ExamenErrorType` pour la gestion d'erreurs
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1_

- [x] 3. Créer le parser CSV pour les examens
  - Créer le fichier `lib/examenCsvParser.ts`
  - Implémenter la fonction `parseExamenCSV` pour parser le format CSV avec validation
  - Implémenter la fonction `validateExamenCSVFile` pour valider le fichier avant parsing
  - Gérer les erreurs de format et les warnings
  - Supporter le format: Code Examen;Nom Examen;Enseignants;Date;Heure Début;Heure Fin
  - Parser les emails multiples séparés par des virgules dans le champ Enseignants
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 4. Implémenter les fonctions API pour les examens
  - Créer le fichier `lib/examenApi.ts`
  - Implémenter `searchExamens` pour rechercher par code ou nom avec filtrage par session
  - Implémenter `getExamenById` pour récupérer un examen spécifique
  - Implémenter `createManualExamen` pour la saisie manuelle par enseignant
  - Implémenter `importExamens` avec support de la progression et gestion des erreurs
  - Implémenter `getExamensWithPresences` pour récupérer les examens avec leurs présences
  - Implémenter `validateManualExamen` pour valider un examen saisi manuellement
  - Implémenter `deleteExamen` pour supprimer un examen
  - _Requirements: 1.1, 1.3, 1.6, 2.1, 2.2, 3.1, 3.2, 3.3, 5.1, 6.2, 6.4_

- [x] 5. Implémenter les fonctions API pour les présences
  - Dans `lib/examenApi.ts`, ajouter `submitPresence` pour soumettre une déclaration
  - Implémenter `getExistingPresence` pour vérifier si une présence existe déjà
  - Implémenter `updatePresence` pour modifier une déclaration existante
  - Ajouter la validation: nombre de surveillants >= 0
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Implémenter les fonctions API pour les notifications admin
  - Dans `lib/examenApi.ts`, ajouter `getUnreadNotifications` pour récupérer les notifications non lues
  - Implémenter `markNotificationAsRead` pour marquer comme lu
  - Implémenter `archiveNotification` pour archiver une notification
  - Implémenter `createNotification` pour créer une notification lors de saisie manuelle
  - _Requirements: 3.3, 6.1, 6.2, 6.3, 6.5_

- [x] 7. Créer les hooks React Query pour les examens
  - Créer le fichier `src/hooks/useExamens.ts`
  - Implémenter `useExamensQuery` pour récupérer les examens avec cache
  - Implémenter `useExamenDetailQuery` pour un examen spécifique
  - Implémenter `useExamenSearchQuery` pour la recherche avec debounce
  - Implémenter `useExamenMutation` pour les opérations CRUD
  - Implémenter `useExamenImport` pour l'import CSV avec progression
  - Configurer l'invalidation du cache après mutations
  - _Requirements: 1.1, 2.1, 2.2, 3.1, 5.1_

- [x] 8. Créer les hooks React Query pour les présences
  - Dans `src/hooks/useExamens.ts`, ajouter `usePresencesQuery` pour récupérer les présences
  - Implémenter `usePresenceMutation` pour soumettre/modifier une présence
  - Implémenter `useExistingPresenceQuery` pour vérifier l'existence d'une présence
  - Configurer l'invalidation du cache après soumission
  - _Requirements: 4.1, 4.3, 4.4_

- [x] 9. Créer les hooks React Query pour les notifications
  - Dans `src/hooks/useExamens.ts`, ajouter `useNotificationsQuery` pour les notifications
  - Implémenter `useNotificationMutation` pour marquer comme lu/archiver
  - Configurer le polling pour les nouvelles notifications (30 secondes)
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 10. Créer le composant d'import CSV des examens (Admin)
  - Créer `components/admin/ExamImport.tsx`
  - Implémenter la sélection de fichier avec validation
  - Afficher une barre de progression en temps réel pendant l'import
  - Afficher les erreurs de validation avec numéros de ligne
  - Proposer l'option d'ignorer les lignes erronées ou annuler l'import
  - Afficher un résumé détaillé après import (importés, mis à jour, erreurs)
  - Gérer les états de chargement et les erreurs
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [ ] 11. Créer le composant de recherche d'examens (Enseignant)
  - Créer `components/public/TeacherExamSearch.tsx`
  - Implémenter un champ de recherche avec autocomplétion
  - Afficher les résultats en temps réel avec debounce (300ms)
  - Filtrer par session active uniquement
  - Afficher le code et le nom de l'examen dans les résultats
  - Ajouter un bouton "Examen non trouvé ? Saisir manuellement"
  - Gérer les états vides et les erreurs
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 12. Créer le formulaire de saisie manuelle d'examen (Enseignant)
  - Créer `components/public/ManualExamForm.tsx`
  - Implémenter les champs: code, nom, date, heure début, heure fin
  - Ajouter la validation des champs (longueurs, formats)
  - Pré-remplir l'email de l'enseignant si disponible
  - Créer l'examen avec `saisie_manuelle = true` et `valide = false`
  - Créer une notification admin automatiquement
  - Rediriger vers le formulaire de présence après création
  - Afficher un message de confirmation
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 13. Créer le formulaire de déclaration de présence (Enseignant)
  - Créer `components/public/TeacherPresenceForm.tsx`
  - Afficher les informations de l'examen en lecture seule
  - Implémenter les champs: email, nom, prénom, présent/absent
  - Afficher conditionnellement le champ "nombre de surveillants" si présent
  - Ajouter un champ remarque optionnel
  - Valider les données avant soumission (email, nb surveillants >= 0)
  - Gérer la modification d'une présence existante
  - Afficher une confirmation avant soumission
  - Gérer les états de chargement et les erreurs
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 14. Créer le dashboard des présences (Admin)
  - Créer `components/admin/ExamPresencesDashboard.tsx`
  - Afficher la liste des examens de la session sélectionnée
  - Afficher pour chaque examen: code, nom, date, heure, horaire complet
  - Afficher le statut de présence de chaque enseignant avec badges
  - Afficher le nombre de surveillants accompagnants
  - Calculer et afficher les besoins en surveillants par examen
  - Implémenter des filtres: tous / déclarés / en attente / saisis manuellement
  - Ajouter la pagination (50 examens par page)
  - Implémenter le tri par colonne (date, code, statut)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 15. Créer le composant de gestion des notifications (Admin)
  - Créer `components/admin/ManualExamNotifications.tsx`
  - Afficher la liste des examens saisis manuellement en attente
  - Afficher les détails: code, nom, enseignant, date de saisie
  - Implémenter les actions: valider, modifier, supprimer
  - Afficher un compteur de notifications non lues dans le header
  - Permettre l'archivage des notifications traitées
  - Gérer les états de chargement et les confirmations
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 16. Créer le composant Badge de statut d'examen
  - Créer `components/shared/ExamStatusBadge.tsx`
  - Implémenter les variants: declared (vert), pending (orange), manual (bleu)
  - Rendre le composant réutilisable et accessible
  - _Requirements: 5.2, 5.3_

- [ ] 17. Créer la page enseignant pour la déclaration de présence
  - Créer `pages/TeacherPresencePage.tsx`
  - Intégrer `TeacherExamSearch` et `TeacherPresenceForm`
  - Gérer le flow: recherche → sélection → déclaration
  - Gérer le flow alternatif: saisie manuelle → déclaration
  - Afficher les messages de succès/erreur
  - Rendre la page responsive
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 4.1_

- [ ] 18. Intégrer les nouveaux composants dans les pages admin existantes
  - Ajouter `ExamImport` dans une nouvelle section de la page admin appropriée
  - Ajouter `ExamPresencesDashboard` dans une nouvelle page ou onglet admin
  - Intégrer `ManualExamNotifications` dans le header ou sidebar admin
  - Ajouter les routes nécessaires dans `App.tsx`
  - Mettre à jour la navigation admin
  - _Requirements: 1.1, 5.1, 6.1_

- [ ] 19. Ajouter la gestion des erreurs et le feedback utilisateur
  - Implémenter les messages d'erreur spécifiques pour chaque type d'erreur
  - Ajouter des toasts/notifications pour les succès et erreurs
  - Implémenter les confirmations pour les actions destructives
  - Ajouter les états de chargement sur tous les boutons d'action
  - Gérer les erreurs réseau avec retry automatique
  - _Requirements: 1.2, 1.4, 2.5, 3.3, 4.3, 6.2_

- [ ] 20. Optimiser les performances et l'accessibilité
  - Implémenter le debounce sur la recherche d'examens (300ms)
  - Configurer le cache React Query (5 minutes de staleTime)
  - Ajouter la pagination sur toutes les listes longues
  - Ajouter les labels ARIA sur tous les formulaires
  - Tester la navigation au clavier
  - Vérifier le contraste des couleurs
  - Rendre tous les composants responsive (mobile, tablet, desktop)
  - _Requirements: 2.2, 5.1, 5.5_

- [ ] 21. Créer les tests unitaires
  - Tester le parser CSV avec différents formats et cas d'erreur
  - Tester les fonctions de validation
  - Tester les calculs de besoins en surveillants
  - Tester les hooks React Query
  - _Requirements: 1.1, 1.2, 4.5, 7.1_

- [ ] 22. Créer les tests d'intégration
  - Tester le flow complet d'import CSV
  - Tester le flow enseignant: recherche → déclaration
  - Tester le flow de saisie manuelle avec notification
  - Tester la modification d'une présence existante
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 4.4_

- [ ] 23. Créer la documentation utilisateur
  - Documenter le format CSV attendu pour l'import
  - Créer un guide pour les enseignants (recherche et déclaration)
  - Créer un guide pour les admins (import, consultation, validation)
  - Ajouter des exemples de fichiers CSV
  - _Requirements: 1.1, 2.1, 5.1, 6.1_
