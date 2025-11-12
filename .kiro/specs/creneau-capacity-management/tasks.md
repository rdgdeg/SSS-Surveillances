# Implementation Plan - Gestion de la Capacité des Créneaux

## Phase 1 : Modifications de la Base de Données

- [x] 1. Ajouter la colonne de capacité à la table creneaux
  - Créer le fichier de migration SQL `supabase-add-capacity-column.sql`
  - Ajouter la colonne `nb_surveillants_requis` avec contrainte CHECK (1-20)
  - Créer un index sur cette colonne pour optimiser les requêtes
  - Tester la migration sur un environnement de développement
  - _Requirements: 1.1, 1.3_

- [x] 2. Créer la vue SQL pour les statistiques
  - Créer la vue `v_creneaux_with_stats` qui calcule le nombre de disponibles et le taux de remplissage
  - Optimiser la requête pour les performances
  - Tester la vue avec différents scénarios de données
  - _Requirements: 2.1, 2.2_

## Phase 2 : Modifications du Modèle de Données

- [x] 3. Mettre à jour les types TypeScript
  - Ajouter `nb_surveillants_requis?: number` au type `Creneau` dans `types.ts`
  - Créer le nouveau type `CreneauWithStats` avec les champs calculés
  - Créer le type `CapacityStats` pour les statistiques globales
  - Créer les types pour les statuts de remplissage
  - _Requirements: 1.1, 2.2_

## Phase 3 : Fonctions API

- [ ] 4. Implémenter les fonctions API de base
- [x] 4.1 Créer `updateCreneauCapacity` pour mettre à jour un créneau
  - Implémenter la fonction dans `lib/api.ts`
  - Ajouter la validation de la capacité (1-20)
  - Gérer les erreurs de mise à jour
  - _Requirements: 1.4, 1.5_

- [x] 4.2 Créer `getCreneauxWithStats` pour récupérer les créneaux avec statistiques
  - Utiliser la vue SQL créée précédemment
  - Calculer le statut de remplissage côté client
  - Optimiser pour les performances
  - _Requirements: 2.1, 2.2_

- [ ] 5. Implémenter les fonctions API avancées
- [x] 5.1 Créer `bulkUpdateCreneauCapacity` pour la mise à jour en masse
  - Implémenter la mise à jour de plusieurs créneaux en une transaction
  - Gérer les erreurs partielles
  - Retourner un rapport détaillé (succès/erreurs)
  - _Requirements: 5.3, 5.4, 5.5_

- [x] 5.2 Créer `copyCapacitiesFromSession` pour copier depuis une session
  - Identifier les créneaux correspondants (même date et heure)
  - Copier les capacités en masse
  - Générer un rapport de copie
  - _Requirements: 6.3, 6.4, 6.5_

## Phase 4 : Composants Partagés

- [ ] 6. Créer le composant CapacityInput
  - Créer `components/shared/CapacityInput.tsx`
  - Implémenter l'input numérique avec validation (1-20)
  - Ajouter le placeholder "Non défini"
  - Implémenter la sauvegarde avec debouncing (500ms)
  - Ajouter les états de chargement et de succès
  - _Requirements: 1.2, 1.3, 1.4_

- [ ] 7. Créer le composant FillRateIndicator
  - Créer `components/shared/FillRateIndicator.tsx`
  - Implémenter le badge coloré selon le taux (rouge/orange/vert)
  - Afficher le ratio et le pourcentage (ex: "8/10 - 80%")
  - Ajouter un tooltip avec détails
  - Gérer le cas "Non défini"
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [ ] 8. Créer le composant CapacityDashboard
  - Créer `components/admin/CapacityDashboard.tsx`
  - Afficher les cartes de statistiques (total, critiques, alerte, ok)
  - Calculer et afficher le taux de remplissage moyen
  - Ajouter des icônes et couleurs appropriées
  - Rendre le composant responsive
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

## Phase 5 : Page de Gestion des Créneaux

- [ ] 9. Modifier la page CreneauxPage pour la capacité
  - Ajouter une colonne "Surveillants requis" dans le tableau
  - Intégrer le composant CapacityInput pour chaque créneau
  - Ajouter un indicateur visuel pour les créneaux sans capacité
  - Gérer les erreurs de sauvegarde avec des toasts
  - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [ ] 10. Implémenter la mise à jour en masse
- [ ] 10.1 Créer le composant BulkCapacityModal
  - Créer `components/admin/BulkCapacityModal.tsx`
  - Implémenter le dialogue de saisie de capacité
  - Afficher le nombre de créneaux sélectionnés
  - Gérer la validation et la soumission
  - _Requirements: 5.2, 5.3_

- [ ] 10.2 Ajouter la sélection multiple dans CreneauxPage
  - Ajouter des checkboxes pour sélectionner les créneaux
  - Afficher le bouton "Définir capacité pour la sélection"
  - Intégrer le modal BulkCapacityModal
  - Afficher un message de confirmation après mise à jour
  - _Requirements: 5.1, 5.4_

- [ ] 11. Implémenter la copie depuis session précédente
- [ ] 11.1 Créer le composant CopyCapacityModal
  - Créer `components/admin/CopyCapacityModal.tsx`
  - Afficher la liste des sessions disponibles
  - Prévisualiser les créneaux de la session source
  - Afficher un rapport de correspondance
  - _Requirements: 6.2, 6.4_

- [ ] 11.2 Intégrer la copie dans CreneauxPage
  - Ajouter le bouton "Copier depuis session précédente"
  - Intégrer le modal CopyCapacityModal
  - Afficher le rapport de copie (succès/échecs)
  - Rafraîchir les données après copie
  - _Requirements: 6.1, 6.3, 6.5_

## Phase 6 : Page d'Analyse des Disponibilités

- [ ] 12. Ajouter le tableau de bord récapitulatif
  - Intégrer le composant CapacityDashboard en haut de DisponibilitesPage
  - Calculer les statistiques globales à partir des créneaux
  - Mettre à jour les statistiques lors des changements de filtres
  - Ajouter une animation de chargement
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 13. Modifier le tableau des disponibilités
- [ ] 13.1 Ajouter les colonnes de capacité
  - Ajouter une colonne "Requis" affichant `nb_surveillants_requis`
  - Ajouter une colonne "Disponibles" affichant le nombre de disponibilités
  - Ajouter une colonne "Taux" avec le composant FillRateIndicator
  - Gérer l'affichage pour les créneaux sans capacité définie
  - _Requirements: 2.2, 2.4_

- [ ] 13.2 Ajouter les indicateurs visuels
  - Colorer les lignes selon le statut (critique/alerte/ok)
  - Ajouter des icônes d'avertissement pour les créneaux critiques
  - Mettre en évidence les créneaux nécessitant attention
  - _Requirements: 2.3, 2.4, 2.5_

- [ ] 14. Implémenter les filtres et le tri
- [ ] 14.1 Ajouter les filtres de capacité
  - Ajouter un filtre "Créneaux critiques uniquement" (< 100%)
  - Ajouter un filtre "Créneaux avec capacité définie"
  - Ajouter un filtre par statut (critique/alerte/ok)
  - Persister les filtres dans localStorage
  - _Requirements: 3.1, 3.2, 3.4_

- [ ] 14.2 Ajouter le tri par taux de remplissage
  - Rendre la colonne "Taux" triable
  - Implémenter le tri croissant/décroissant
  - Gérer le tri des créneaux sans capacité (les mettre à la fin)
  - _Requirements: 3.3_

- [ ] 15. Mettre à jour l'export des données
  - Inclure les colonnes de capacité dans l'export
  - Inclure le taux de remplissage dans l'export
  - Formater correctement les pourcentages
  - _Requirements: 3.5_

## Phase 7 : Tests et Documentation

- [ ] 16. Tests unitaires
- [ ] 16.1 Tester les fonctions de calcul
  - Tester `calculateFillRate` avec différents scénarios
  - Tester `calculateGlobalStats` avec différentes distributions
  - Tester la validation de capacité
  - _Testing Strategy: Tests Unitaires_

- [ ]* 16.2 Tester les composants
  - Tester CapacityInput avec différentes valeurs
  - Tester FillRateIndicator avec différents taux
  - Tester CapacityDashboard avec différentes données
  - _Testing Strategy: Tests Unitaires_

- [ ]* 17. Tests d'intégration
  - Tester la mise à jour de capacité end-to-end
  - Tester la mise à jour en masse
  - Tester la copie depuis session précédente
  - Tester le recalcul des statistiques
  - _Testing Strategy: Tests d'Intégration_

- [ ]* 18. Tests E2E
  - Scénario complet : définir capacités → voir statistiques → filtrer
  - Scénario de mise à jour en masse
  - Scénario de copie depuis session
  - _Testing Strategy: Tests E2E_

- [ ] 19. Documentation
  - Créer un guide utilisateur pour la gestion des capacités
  - Documenter les nouvelles fonctions API
  - Ajouter des commentaires dans le code
  - Mettre à jour le README avec les nouvelles fonctionnalités
  - _All Requirements_

## Phase 8 : Déploiement

- [ ] 20. Préparation au déploiement
  - Vérifier tous les diagnostics TypeScript
  - Exécuter tous les tests
  - Vérifier les performances avec des données de test
  - Créer un plan de rollback
  - _All Requirements_

- [ ] 21. Migration de production
  - Exécuter les migrations SQL sur Supabase production
  - Vérifier que les vues sont créées correctement
  - Tester les nouvelles fonctionnalités en production
  - Monitorer les erreurs et performances
  - _All Requirements_

- [ ] 22. Formation et communication
  - Former les administrateurs aux nouvelles fonctionnalités
  - Créer des captures d'écran et vidéos de démonstration
  - Communiquer les changements aux utilisateurs
  - _All Requirements_
