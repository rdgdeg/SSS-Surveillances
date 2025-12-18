# Guide : Export des Surveillances pour un Surveillant

## 🎯 Fonctionnalité

Cette fonctionnalité permet à un surveillant d'exporter la liste de toutes ses surveillances avec les informations complètes et les consignes.

## 📋 Contenu de l'Export

### Colonnes Exportées

1. **Date** : Date de l'examen (format DD-MM-YYYY)
2. **Heure début** : Heure de début de l'examen
3. **Heure fin** : Heure de fin de l'examen
4. **Code examen** : Code de l'examen (ex: MATH101)
5. **Nom examen** : Nom complet de l'examen
6. **Auditoires** : Liste des auditoires ou "À définir"
7. **Secrétariat** : Secrétariat responsable
8. **Consignes** : Toutes les consignes applicables
9. **Lien planning** : URL vers le planning en ligne

### Format des Consignes

#### Mode Normal
Les consignes incluent dans l'ordre :
- **Consignes générales du secrétariat** (arrivée, mise en place, générales)
- **Consignes spécifiques de l'examen** (si définies)
- **Consignes du cours** (si pas de consignes spécifiques)

**Exemple :**
```
Arrivée: 30 minutes avant l'examen | Mise en place: Vérifier les documents | Consignes générales: Respecter le silence | Consignes spécifiques: Calculatrices autorisées
```

#### Mode Secrétariat
Pour les examens en mode "répartition par le secrétariat" :
```
Les consignes détaillées (arrivée, mise en place, auditoires) seront communiquées ultérieurement par le pool, le secrétariat ou le responsable de cours.
```

## 🚀 Utilisation

### Étapes

1. **Aller sur le planning** : `/planning`
2. **Filtrer par surveillant** : Taper son nom dans le champ "Surveillant"
3. **Sélectionner son nom** : Choisir dans la liste déroulante
4. **Cliquer sur "Exporter mes surveillances"** : Bouton vert avec icône de téléchargement
5. **Fichier téléchargé** : Excel (.xlsx) avec toutes les surveillances

### Interface

**Bouton d'export :**
- ✅ **Visible** : Quand un surveillant est sélectionné ET qu'il a des surveillances
- 🔄 **Loading** : "Export en cours..." avec spinner pendant l'export
- ✅ **Succès** : Toast de confirmation avec nombre de surveillances exportées

**Conditions d'affichage :**
- Surveillant sélectionné dans le filtre
- Au moins une surveillance trouvée pour ce surveillant

## 📁 Fichier Exporté

### Nom du Fichier
```
Surveillances_[Nom_Surveillant]_[Date].xlsx
```

**Exemple :**
```
Surveillances_Jean_Dupont_2025-01-15.xlsx
```

### Structure
- **Feuille** : "Mes Surveillances"
- **Tri** : Par date et heure (chronologique)
- **Format** : Excel avec colonnes auto-dimensionnées

## 🎨 Exemple d'Export

| Date | Heure début | Heure fin | Code examen | Nom examen | Auditoires | Secrétariat | Consignes | Lien planning |
|------|-------------|-----------|-------------|------------|------------|-------------|-----------|---------------|
| 15-01-2025 | 09:00 | 12:00 | MATH101 | Analyse I | Auditoire A | FASB | Arrivée: 30 min avant \| Mise en place: Vérifier copies | https://app.com/planning |
| 17-01-2025 | 14:00 | 17:00 | PHYS201 | Physique II | À définir | FASB | Les consignes seront communiquées par le secrétariat | https://app.com/planning |

## 🔧 Cas d'Usage

### Scénario 1 : Surveillant avec Plusieurs Examens

**Jean Dupont** filtre sur son nom :
- 5 examens trouvés
- Export de ses 5 surveillances
- Fichier : `Surveillances_Jean_Dupont_2025-01-15.xlsx`
- Toast : "Export réussi : 5 surveillances exportées"

### Scénario 2 : Surveillant sans Surveillance

**Marie Martin** filtre sur son nom :
- 0 examen trouvé
- Bouton d'export non visible
- Message : "0 examen trouvé"

### Scénario 3 : Export avec Consignes Mixtes

**Pierre Durand** a 3 examens :
1. **MATH101** : Consignes normales complètes
2. **PHYS201** : Mode secrétariat → Message spécial
3. **CHEM301** : Consignes du cours uniquement

## ⚡ Performance

### Optimisations
- Export côté client (pas de requête serveur supplémentaire)
- Utilisation des données déjà chargées
- Génération Excel rapide avec XLSX.js

### Limitations
- Maximum ~1000 surveillances par export (limite pratique)
- Dépend des données déjà filtrées sur la page

## 🛠️ Technique

### Fonction d'Export
```typescript
exportSurveillancesSurveillant(
  surveillantName: string,
  examens: Examen[],
  consignesSecretariat: ConsigneSecretariat[]
)
```

### Filtrage
- Recherche insensible à la casse
- Correspondance partielle dans les noms de surveillants
- Inclusion des remplacements

### Gestion d'Erreurs
- Aucun surveillant sélectionné
- Aucune surveillance trouvée
- Erreurs de génération de fichier

## 📱 Responsive

- Bouton adapté sur mobile
- Texte raccourci : "Exporter"
- Icône préservée
- Fonctionnalité identique

## 🔄 Intégration

### Avec Filtres Existants
- Utilise le filtre surveillant existant
- Compatible avec tous les autres filtres
- Exporte uniquement les surveillances du surveillant sélectionné

### Avec Remplacements
- Inclut les surveillances où la personne est remplaçante
- Exclut les surveillances où elle a été remplacée
- Basé sur la liste actuelle des surveillants assignés

## ✅ Avantages

1. **Autonomie** : Le surveillant peut exporter ses données lui-même
2. **Complétude** : Toutes les informations nécessaires incluses
3. **Praticité** : Format Excel facilement utilisable
4. **Actualité** : Données toujours à jour
5. **Accessibilité** : Lien vers le planning en ligne inclus