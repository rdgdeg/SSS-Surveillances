# Design Document - Gestion de la Capacité des Créneaux

## Overview

Cette fonctionnalité ajoute la gestion de la capacité des créneaux de surveillance, permettant aux administrateurs de définir le nombre de surveillants nécessaires par créneau et de visualiser le taux de remplissage pour identifier les créneaux problématiques.

## Architecture

### Modifications de la Base de Données

#### Table `creneaux`
Ajout d'une nouvelle colonne :
- `nb_surveillants_requis` (INTEGER, nullable) : Nombre de surveillants nécessaires pour ce créneau

```sql
ALTER TABLE creneaux 
ADD COLUMN nb_surveillants_requis INTEGER CHECK (nb_surveillants_requis > 0 AND nb_surveillants_requis <= 20);
```

### Modifications du Modèle de Données

#### Type `Creneau` (types.ts)
```typescript
export interface Creneau {
  id: string;
  session_id: string;
  examen_id?: string;
  date_surveillance?: string;
  heure_debut_surveillance?: string;
  heure_fin_surveillance?: string;
  type_creneau?: string;
  nb_surveillants_requis?: number; // NOUVEAU
  created_at?: string;
}
```

#### Nouveau Type `CreneauWithStats`
```typescript
export interface CreneauWithStats extends Creneau {
  nb_disponibles: number;
  taux_remplissage?: number; // Pourcentage (0-100+)
  statut_remplissage: 'critique' | 'alerte' | 'ok' | 'non-defini';
}
```

## Components and Interfaces

### 1. Page de Gestion des Créneaux (Existante - à modifier)

**Fichier:** `pages/admin/CreneauxPage.tsx`

**Modifications:**
- Ajouter une colonne "Surveillants requis" dans le tableau
- Permettre l'édition inline du nombre de surveillants requis
- Ajouter une action "Définir capacité en masse"
- Ajouter une action "Copier depuis session précédente"

**Nouveaux composants:**
- `CapacityInput`: Input numérique avec validation pour la capacité
- `BulkCapacityModal`: Modal pour définir la capacité en masse
- `CopyCapacityModal`: Modal pour copier depuis une session précédente

### 2. Page d'Analyse des Disponibilités (Existante - à modifier)

**Fichier:** `pages/admin/DisponibilitesPage.tsx`

**Modifications:**
- Ajouter un tableau de bord récapitulatif en haut de page
- Ajouter des colonnes pour afficher la capacité et le taux de remplissage
- Ajouter des indicateurs visuels colorés selon le taux de remplissage
- Ajouter des filtres pour les créneaux critiques
- Permettre le tri par taux de remplissage

**Nouveaux composants:**
- `CapacityDashboard`: Tableau de bord avec statistiques globales
- `FillRateIndicator`: Badge coloré affichant le taux de remplissage
- `CapacityFilters`: Filtres pour les créneaux critiques

### 3. Nouveaux Composants Partagés

#### `CapacityInput`
```typescript
interface CapacityInputProps {
  value?: number;
  onChange: (value: number | undefined) => void;
  disabled?: boolean;
}
```

Fonctionnalités :
- Input numérique avec validation (1-20)
- Affichage d'un placeholder "Non défini"
- Validation en temps réel
- Sauvegarde automatique ou manuelle

#### `FillRateIndicator`
```typescript
interface FillRateIndicatorProps {
  disponibles: number;
  requis?: number;
  showDetails?: boolean;
}
```

Fonctionnalités :
- Badge coloré selon le taux
- Affichage du ratio (ex: "8/10 - 80%")
- Tooltip avec détails
- Gestion du cas "Non défini"

#### `CapacityDashboard`
```typescript
interface CapacityDashboardProps {
  creneaux: CreneauWithStats[];
}
```

Affiche :
- Nombre total de créneaux avec capacité définie
- Nombre de créneaux critiques (< 100%)
- Nombre de créneaux en alerte (50-99%)
- Nombre de créneaux OK (>= 100%)
- Taux de remplissage moyen global
- Graphique de distribution (optionnel)

## Data Models

### Calcul du Taux de Remplissage

```typescript
function calculateFillRate(creneau: Creneau, nbDisponibles: number): CreneauWithStats {
  if (!creneau.nb_surveillants_requis) {
    return {
      ...creneau,
      nb_disponibles: nbDisponibles,
      taux_remplissage: undefined,
      statut_remplissage: 'non-defini'
    };
  }
  
  const taux = (nbDisponibles / creneau.nb_surveillants_requis) * 100;
  
  let statut: 'critique' | 'alerte' | 'ok';
  if (taux < 50) statut = 'critique';
  else if (taux < 100) statut = 'alerte';
  else statut = 'ok';
  
  return {
    ...creneau,
    nb_disponibles: nbDisponibles,
    taux_remplissage: taux,
    statut_remplissage: statut
  };
}
```

### Statistiques Globales

```typescript
interface CapacityStats {
  total_creneaux_avec_capacite: number;
  creneaux_critiques: number;
  creneaux_alerte: number;
  creneaux_ok: number;
  taux_remplissage_moyen: number;
}

function calculateGlobalStats(creneaux: CreneauWithStats[]): CapacityStats {
  const creneauxAvecCapacite = creneaux.filter(c => c.nb_surveillants_requis);
  
  return {
    total_creneaux_avec_capacite: creneauxAvecCapacite.length,
    creneaux_critiques: creneauxAvecCapacite.filter(c => c.statut_remplissage === 'critique').length,
    creneaux_alerte: creneauxAvecCapacite.filter(c => c.statut_remplissage === 'alerte').length,
    creneaux_ok: creneauxAvecCapacite.filter(c => c.statut_remplissage === 'ok').length,
    taux_remplissage_moyen: creneauxAvecCapacite.reduce((acc, c) => 
      acc + (c.taux_remplissage || 0), 0) / creneauxAvecCapacite.length
  };
}
```

## API Functions

### Nouvelles fonctions dans `lib/api.ts`

```typescript
// Mettre à jour la capacité d'un créneau
export async function updateCreneauCapacity(
  id: string, 
  nb_surveillants_requis: number | null
): Promise<Creneau>

// Mettre à jour la capacité de plusieurs créneaux
export async function bulkUpdateCreneauCapacity(
  creneauIds: string[], 
  nb_surveillants_requis: number
): Promise<{ success: number; errors: string[] }>

// Obtenir les créneaux avec statistiques de remplissage
export async function getCreneauxWithStats(
  sessionId: string
): Promise<CreneauWithStats[]>

// Copier les capacités d'une session à une autre
export async function copyCapacitiesFromSession(
  sourceSessionId: string,
  targetSessionId: string
): Promise<{ copied: number; skipped: number; errors: string[] }>
```

## Error Handling

### Validation des Données

1. **Capacité invalide** : Afficher un message d'erreur si la valeur n'est pas entre 1 et 20
2. **Erreur de sauvegarde** : Afficher un toast d'erreur et permettre de réessayer
3. **Session source introuvable** : Afficher un message explicite lors de la copie
4. **Échec de mise à jour en masse** : Afficher la liste des créneaux en erreur

### Messages d'Erreur

```typescript
const ERROR_MESSAGES = {
  INVALID_CAPACITY: "La capacité doit être un nombre entre 1 et 20",
  UPDATE_FAILED: "Impossible de mettre à jour la capacité du créneau",
  BULK_UPDATE_FAILED: "Certains créneaux n'ont pas pu être mis à jour",
  COPY_FAILED: "Impossible de copier les capacités depuis la session source",
  NO_MATCHING_CRENEAUX: "Aucun créneau correspondant trouvé dans la session source"
};
```

## Testing Strategy

### Tests Unitaires

1. **Calcul du taux de remplissage**
   - Tester avec différentes valeurs (0%, 50%, 100%, >100%)
   - Tester le cas sans capacité définie
   - Tester les cas limites (0 disponibles, 0 requis)

2. **Validation de la capacité**
   - Tester les valeurs valides (1-20)
   - Tester les valeurs invalides (0, -1, 21, null, undefined)
   - Tester les types invalides (string, float)

3. **Statistiques globales**
   - Tester avec différentes distributions de créneaux
   - Tester avec aucun créneau
   - Tester avec tous les créneaux sans capacité

### Tests d'Intégration

1. **Mise à jour de la capacité**
   - Vérifier que la valeur est bien sauvegardée en base
   - Vérifier que l'UI se met à jour correctement
   - Vérifier que les statistiques sont recalculées

2. **Mise à jour en masse**
   - Vérifier que tous les créneaux sélectionnés sont mis à jour
   - Vérifier la gestion des erreurs partielles

3. **Copie depuis session précédente**
   - Vérifier que les créneaux correspondants sont identifiés
   - Vérifier que les capacités sont copiées correctement
   - Vérifier le rapport de copie

### Tests E2E

1. Scénario complet : Définir des capacités, voir les statistiques, filtrer les créneaux critiques
2. Scénario de mise à jour en masse
3. Scénario de copie depuis session précédente

## UI/UX Considerations

### Indicateurs Visuels

**Couleurs pour le taux de remplissage :**
- 🔴 Rouge (critique) : < 50%
- 🟠 Orange (alerte) : 50-99%
- 🟢 Vert (ok) : >= 100%
- ⚪ Gris (non défini) : Pas de capacité définie

### Affichage des Données

**Format du taux de remplissage :**
- "8/10 (80%)" - Affichage complet
- Badge coloré avec tooltip pour les détails
- Icône d'avertissement pour les créneaux critiques

**Tableau de bord :**
- Cartes avec icônes et couleurs
- Graphique en barres ou camembert (optionnel)
- Mise en évidence des créneaux critiques

### Interactions

1. **Édition inline** : Clic sur la capacité pour éditer directement
2. **Sauvegarde automatique** : Après 1 seconde d'inactivité
3. **Feedback visuel** : Spinner pendant la sauvegarde, checkmark en cas de succès
4. **Filtres persistants** : Mémoriser les filtres dans le localStorage

## Performance Considerations

### Optimisations

1. **Calcul côté serveur** : Calculer les statistiques dans une vue SQL pour de meilleures performances
2. **Mise en cache** : Utiliser React Query pour mettre en cache les données
3. **Pagination** : Si > 100 créneaux, paginer les résultats
4. **Debouncing** : Attendre 500ms avant de sauvegarder lors de l'édition inline

### Vue SQL Optimisée

```sql
CREATE OR REPLACE VIEW v_creneaux_with_stats AS
SELECT 
  c.*,
  COUNT(DISTINCT CASE WHEN sd.historique_disponibilites @> 
    jsonb_build_array(jsonb_build_object('creneau_id', c.id, 'est_disponible', true))
    THEN sd.id END) as nb_disponibles,
  CASE 
    WHEN c.nb_surveillants_requis IS NULL THEN NULL
    ELSE (COUNT(DISTINCT CASE WHEN sd.historique_disponibilites @> 
      jsonb_build_array(jsonb_build_object('creneau_id', c.id, 'est_disponible', true))
      THEN sd.id END)::FLOAT / c.nb_surveillants_requis * 100)
  END as taux_remplissage
FROM creneaux c
LEFT JOIN soumissions_disponibilites sd ON sd.session_id = c.session_id
GROUP BY c.id;
```

## Migration Strategy

### Phase 1 : Modification de la Base de Données
1. Ajouter la colonne `nb_surveillants_requis` à la table `creneaux`
2. Créer la vue `v_creneaux_with_stats`
3. Tester sur un environnement de développement

### Phase 2 : Backend
1. Mettre à jour le type `Creneau` dans `types.ts`
2. Ajouter les nouvelles fonctions API
3. Tester les fonctions API

### Phase 3 : Frontend - Gestion des Créneaux
1. Ajouter la colonne "Surveillants requis" dans CreneauxPage
2. Implémenter l'édition inline
3. Implémenter la mise à jour en masse
4. Implémenter la copie depuis session précédente

### Phase 4 : Frontend - Analyse des Disponibilités
1. Ajouter le tableau de bord récapitulatif
2. Ajouter les colonnes de capacité et taux de remplissage
3. Implémenter les indicateurs visuels
4. Implémenter les filtres et le tri

### Phase 5 : Tests et Déploiement
1. Tests unitaires et d'intégration
2. Tests E2E
3. Déploiement en production
4. Documentation utilisateur

## Future Enhancements

1. **Alertes automatiques** : Envoyer des emails pour les créneaux critiques
2. **Suggestions intelligentes** : Suggérer des surveillants pour les créneaux critiques
3. **Historique des capacités** : Suivre l'évolution des capacités dans le temps
4. **Import/Export Excel** : Permettre l'import/export des capacités via Excel
5. **Prévisions** : Prédire les besoins en surveillants basés sur les sessions précédentes
