# Guide du Système d'Héritage des Consignes

## Vue d'ensemble

Le système d'héritage des consignes permet aux examens d'hériter automatiquement des consignes de leur secrétariat, avec la possibilité de personnaliser ces consignes examen par examen.

## Fonctionnement

### 1. Héritage Automatique

Par défaut, chaque examen hérite des consignes de son secrétariat :
- **Consignes d'arrivée** : Instructions pour l'arrivée des surveillants
- **Consignes de mise en place** : Instructions pour la préparation de l'examen
- **Consignes générales** : Instructions générales de surveillance
- **Heure d'arrivée suggérée** : Heure recommandée d'arrivée

### 2. Personnalisation par Examen

Les administrateurs peuvent personnaliser les consignes pour un examen spécifique :
- Les consignes personnalisées prévalent sur celles du secrétariat
- Possibilité de revenir aux consignes du secrétariat à tout moment
- Traçabilité des modifications

## Interface Utilisateur

### Dans ExamEditModal

Le modal d'édition d'examen inclut maintenant :
- **Champ "Consignes générales"** : Permet de saisir des consignes spécifiques
- **Indication d'héritage** : Affiche quel secrétariat sera utilisé si le champ est vide
- **Sauvegarde automatique** : Les consignes sont sauvegardées avec l'examen

### Composant ExamenConsignesEditor

Un composant dédié pour la gestion avancée des consignes :
- **Vue d'ensemble** : Affiche les consignes effectives (secrétariat ou spécifiques)
- **Mode édition** : Permet de modifier les consignes spécifiques
- **Indicateurs visuels** : Montre si les consignes sont personnalisées ou héritées
- **Actions rapides** : Initialiser, modifier, ou revenir aux consignes du secrétariat

## Base de Données

### Nouveaux Champs dans `examens`

```sql
-- Consignes spécifiques à l'examen
consignes_specifiques_arrivee TEXT,
consignes_specifiques_mise_en_place TEXT,
consignes_specifiques_generales TEXT,
utiliser_consignes_specifiques BOOLEAN DEFAULT FALSE
```

### Vue `examens_with_consignes`

Fournit les consignes effectives pour chaque examen :
- Consignes spécifiques si définies
- Consignes du secrétariat sinon
- Indicateurs de personnalisation

### Fonctions SQL

#### `get_consignes_examen(p_examen_id UUID)`
Retourne les consignes effectives d'un examen avec la source.

#### `initialiser_consignes_specifiques(p_examen_id UUID)`
Initialise les consignes spécifiques avec celles du secrétariat.

#### `utiliser_consignes_secretariat(p_examen_id UUID)`
Désactive les consignes spécifiques pour revenir au secrétariat.

## API

### Création d'Examen

```typescript
const examenData = {
  // ... autres champs
  consignes_specifiques_generales: data.consignes_generales || null,
  utiliser_consignes_specifiques: data.consignes_generales ? true : false
};
```

### Modification d'Examen

```typescript
if (updates.consignes_generales !== undefined) {
  updateData.consignes_specifiques_generales = updates.consignes_generales;
  updateData.utiliser_consignes_specifiques = updates.consignes_generales ? true : false;
}
```

## Affichage Public

### Vue `planning_examens_public`

Le planning public utilise automatiquement les consignes effectives :
- Consignes personnalisées si définies
- Consignes du secrétariat sinon
- Indicateurs visuels pour les consignes personnalisées

## Cas d'Usage

### 1. Examen Standard
- L'examen utilise les consignes de son secrétariat
- Aucune action requise de l'administrateur
- Mise à jour automatique si les consignes du secrétariat changent

### 2. Examen avec Consignes Spéciales
- L'administrateur saisit des consignes spécifiques dans le modal d'édition
- Les consignes spécifiques sont affichées dans le planning public
- Possibilité de revenir aux consignes du secrétariat

### 3. Changement de Secrétariat
- Si un examen change de secrétariat et n'a pas de consignes spécifiques
- Les nouvelles consignes du secrétariat sont automatiquement appliquées
- Les consignes spécifiques existantes sont préservées

## Statistiques

### Vue `stats_consignes_examens`

Fournit des statistiques sur l'utilisation des consignes :
- Nombre total d'examens par secrétariat
- Nombre d'examens avec consignes spécifiques
- Pourcentage de personnalisation

## Exemples d'Utilisation

### Consulter les Consignes Effectives

```sql
SELECT * FROM examens_with_consignes WHERE id = 'uuid-examen';
```

### Initialiser des Consignes Spécifiques

```sql
SELECT initialiser_consignes_specifiques('uuid-examen');
```

### Revenir aux Consignes du Secrétariat

```sql
SELECT utiliser_consignes_secretariat('uuid-examen');
```

### Statistiques par Secrétariat

```sql
SELECT * FROM stats_consignes_examens;
```

## Avantages

1. **Cohérence** : Les examens héritent automatiquement des consignes standardisées
2. **Flexibilité** : Possibilité de personnaliser pour des cas spéciaux
3. **Maintenance** : Mise à jour centralisée des consignes par secrétariat
4. **Traçabilité** : Historique des modifications et source des consignes
5. **Performance** : Vues optimisées pour l'affichage public

## Installation

Le système est installé via le script `scripts/setup-consignes-heritage.sql` qui :
1. Crée les vues et fonctions nécessaires
2. Configure les triggers de mise à jour
3. Fournit des exemples et tests
4. Génère des statistiques initiales

## Maintenance

- **Sauvegarde** : Les consignes sont incluses dans les sauvegardes standard
- **Migration** : Compatible avec les examens existants
- **Performance** : Indexation automatique sur les champs de recherche
- **Monitoring** : Statistiques disponibles pour le suivi d'utilisation