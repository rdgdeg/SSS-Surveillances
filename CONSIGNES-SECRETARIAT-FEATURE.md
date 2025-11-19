# Fonctionnalité : Consignes Secrétariat et Planning Public Amélioré

## Vue d'ensemble

Cette fonctionnalité ajoute la gestion des consignes par secrétariat et améliore le planning public des examens avec pagination, filtres avancés et affichage contextuel des consignes.

## Composants créés/modifiés

### 1. Migration Base de Données
**Fichier:** `supabase/migrations/create_consignes_secretariat.sql`

Crée la table `consignes_secretariat` avec :
- `code_secretariat` : Code unique (FASB, DENT, MED, BAC11, FSP)
- `nom_secretariat` : Nom complet du secrétariat
- `consignes_arrivee` : Instructions pour l'arrivée
- `consignes_mise_en_place` : Instructions pour la mise en place
- `consignes_generales` : Consignes générales
- `heure_arrivee_suggeree` : Heure d'arrivée recommandée
- `is_active` : Statut actif/inactif

Secrétariats pré-configurés :
- FASB - Faculté des Sciences Agronomiques et de Bioingénierie
- DENT - Faculté de Médecine Dentaire
- MED - Faculté de Médecine
- BAC11 - BAC 11
- FSP - Faculté de Santé Publique

### 2. Page Admin - Gestion des Consignes
**Fichier:** `pages/admin/ConsignesSecretariatPage.tsx`

Interface d'administration pour :
- Visualiser toutes les consignes par secrétariat
- Modifier les consignes (arrivée, mise en place, générales)
- Définir l'heure d'arrivée suggérée
- Activer/désactiver les consignes

**Accès:** Menu Admin > Enseignants > Consignes Secrétariat

### 3. Planning Public Amélioré
**Fichier:** `pages/public/ExamSchedulePage.tsx`

#### Nouvelles fonctionnalités :

**a) Pagination**
- 20 examens par page
- Navigation avec boutons Précédent/Suivant
- Affichage du numéro de page et du total
- Indicateur de position (ex: "Affichage 1 à 20 sur 45")

**b) Filtres avancés**
- **Par date** : Sélection d'une date spécifique
- **Par secrétariat** : Filtrage par FASB, DENT, MED, etc.
- **Par créneau horaire** : Filtrage par heure de début
- Compteur de résultats en temps réel

**c) Recherche étendue**
- Recherche par code de cours
- Recherche par nom de cours
- Recherche par nom de surveillant (via ExamenSurveillants)
- Recherche par auditoire

**d) Affichage des consignes**
- Encadré discret en haut de page
- Affichage automatique selon les secrétariats des examens visibles
- Affiche uniquement les consignes pertinentes
- Informations affichées :
  - Nom du secrétariat
  - Heure d'arrivée suggérée
  - Consignes d'arrivée
  - Consignes de mise en place
  - Consignes générales

## Workflow d'utilisation

### Pour l'administrateur :

1. **Configuration initiale**
   - Aller dans Admin > Enseignants > Consignes Secrétariat
   - Modifier les consignes pour chaque secrétariat
   - Définir les heures d'arrivée suggérées

2. **Liaison des examens**
   - Dans Admin > Examens
   - Le champ `secretariat` existe déjà dans la table examens
   - Assigner le bon secrétariat à chaque examen

### Pour les surveillants (public) :

1. **Accès au planning**
   - Aller sur le planning public des examens
   - Les consignes du/des secrétariat(s) s'affichent automatiquement

2. **Utilisation des filtres**
   - Filtrer par date pour voir les examens d'un jour spécifique
   - Filtrer par secrétariat pour voir les examens d'une faculté
   - Filtrer par créneau horaire
   - Rechercher par nom de cours ou de surveillant

3. **Navigation**
   - Utiliser la pagination pour parcourir tous les examens
   - 20 examens affichés par page

## Avantages

1. **Pour les surveillants**
   - Information claire sur où et quand arriver
   - Consignes spécifiques à chaque faculté
   - Recherche facilitée de leurs surveillances
   - Navigation fluide avec pagination

2. **Pour les administrateurs**
   - Gestion centralisée des consignes
   - Mise à jour facile sans modifier le code
   - Consignes automatiquement affichées selon le contexte

3. **Pour l'organisation**
   - Réduction des questions sur les modalités pratiques
   - Standardisation des consignes par faculté
   - Meilleure communication avec les surveillants

## Prochaines étapes possibles

1. Ajouter la possibilité de créer de nouveaux secrétariats
2. Historique des modifications des consignes
3. Notifications automatiques en cas de changement de consignes
4. Export PDF des consignes pour impression
5. Traductions multilingues des consignes

## Notes techniques

- Les consignes sont chargées via React Query avec cache
- RLS (Row Level Security) activé sur la table
- Les consignes publiques sont en lecture seule
- Seuls les utilisateurs authentifiés peuvent modifier
- La pagination réinitialise à la page 1 lors d'un changement de filtre
