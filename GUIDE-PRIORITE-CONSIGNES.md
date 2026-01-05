# Guide de Priorité des Consignes d'Examens

## Vue d'ensemble

Le système de consignes d'examens applique une logique de **priorité stricte** pour déterminer quelles consignes afficher aux surveillants. Cette priorité garantit que les consignes les plus spécifiques remplacent toujours les consignes génériques.

## Hiérarchie de Priorité (CORRIGÉE)

### 1. **Consignes Spécifiques de l'Examen** (Priorité Maximale)
- **Condition** : `utiliser_consignes_specifiques = TRUE` ET consignes définies
- **Champs** : `consignes_specifiques_arrivee`, `consignes_specifiques_mise_en_place`, `consignes_specifiques_generales`
- **Affichage** : Encadré orange "Consignes spécifiques pour cet examen"
- **Usage** : Pour les examens nécessitant des instructions particulières

### 2. **Consignes du Cours** (Priorité Élevée - REMPLACE MÊME LE MODE SECRÉTARIAT)
- **Condition** : Pas de consignes spécifiques ET `cours.consignes` défini
- **Champ** : `cours.consignes`
- **Affichage** : Encadré orange "Consignes spécifiques du cours [CODE]"
- **Usage** : Consignes héritées du cours lié à l'examen
- **IMPORTANT** : Prend le dessus sur le mode secrétariat !

### 3. **Mode Secrétariat** (Priorité Intermédiaire)
- **Condition** : Pas de consignes spécifiques ni de cours ET `is_mode_secretariat = TRUE`
- **Affichage** : Encadré orange "Consignes spéciales - Répartition par le secrétariat"
- **Message** : "Les consignes détaillées seront communiquées ultérieurement..."
- **Usage** : Examens sans répartition connue dans les auditoires

### 4. **Consignes du Secrétariat** (Priorité par Défaut)
- **Condition** : Aucune des conditions précédentes
- **Champs** : `consignes_secretariat.consignes` (ou anciens champs séparés)
- **Affichage** : Encadré bleu "Consignes générales - [NOM_SECRETARIAT]"
- **Usage** : Consignes standard par faculté/secrétariat

## Exemple Concret : WMD1105

### Scénario Initial
```
Examen: WMD1105
Secrétariat: FASB
is_mode_secretariat: TRUE
utiliser_consignes_specifiques: FALSE
```
**Résultat** : Affiche le message "Les consignes détaillées seront communiquées ultérieurement..."

### Après Ajout de Consignes Spécifiques
```
Examen: WMD1105
Secrétariat: FASB
is_mode_secretariat: TRUE
utiliser_consignes_specifiques: TRUE
consignes_specifiques_arrivee: "Veuillez vous présenter à 08h00 à l'accueil AGOR"
consignes_specifiques_generales: "Examen avec surveillance renforcée"
```
**Résultat** : Affiche les consignes spécifiques (priorité sur le mode secrétariat)

## Implémentation Technique

### Dans le Planning Public (`ExamSchedulePage.tsx`)

```typescript
// Logique de priorité avec if/else if exclusifs (CORRIGÉE)
{examen.utiliser_consignes_specifiques ? (
  // Consignes spécifiques (PRIORITÉ MAXIMALE)
) : examen.cours?.consignes ? (
  // Consignes du cours (PRIORITÉ ÉLEVÉE - remplace même le mode secrétariat)
) : examen.is_mode_secretariat ? (
  // Mode secrétariat (priorité intermédiaire)
) : consignes && consignes.consignes ? (
  // Consignes du secrétariat (par défaut)
) : null}
```

### Dans l'Export (`exportUtils.ts`)

```typescript
if (examen.utiliser_consignes_specifiques) {
  // Consignes spécifiques (PRIORITÉ MAXIMALE)
} else if (examen.cours?.consignes) {
  // Consignes du cours (PRIORITÉ ÉLEVÉE - remplace même le mode secrétariat)
} else if (examen.is_mode_secretariat) {
  // Mode secrétariat (priorité intermédiaire)
} else if (consignes) {
  // Consignes du cours
} else if (consignes) {
  // Consignes du secrétariat
}
```

## Gestion Administrative

### Activation des Consignes Spécifiques

1. **Via ExamenConsignesModal** :
   - Activer le toggle "Utiliser des consignes spécifiques"
   - Remplir les champs d'arrivée, mise en place, générales
   - Sauvegarder → `utiliser_consignes_specifiques = TRUE`

2. **Via ExamenConsignesEditor** :
   - Cliquer "Personnaliser les consignes"
   - Modifier le texte unifié
   - Sauvegarder → Division automatique en 3 champs

### Retour aux Consignes du Secrétariat

1. **Désactivation** :
   - Décocher le toggle OU cliquer "Utiliser consignes du secrétariat"
   - `utiliser_consignes_specifiques = FALSE`
   - Les consignes spécifiques sont conservées mais ignorées

## Vues SQL avec Priorité

### Vue `examens_with_consignes`
```sql
-- Consignes effectives avec priorité
CASE 
    WHEN e.utiliser_consignes_specifiques = true AND e.consignes_specifiques_arrivee IS NOT NULL 
    THEN e.consignes_specifiques_arrivee
    ELSE cs.consignes_arrivee
END as consignes_arrivee_effectives
```

### Fonctions SQL
- `get_consignes_examen(p_examen_id)` : Retourne les consignes effectives
- `initialiser_consignes_specifiques(p_examen_id)` : Initialise avec celles du secrétariat
- `utiliser_consignes_secretariat(p_examen_id)` : Revient aux consignes du secrétariat

## Tests et Validation

### Script de Test
```bash
# Exécuter le script de test
psql -f scripts/test-consignes-priority.sql
```

### Vérifications Manuelles
1. **Planning Public** : Vérifier qu'un seul type de consignes s'affiche par examen
2. **Export Excel** : Vérifier que les consignes exportées respectent la priorité
3. **Interface Admin** : Vérifier les indicateurs visuels (badges)

## Cas d'Usage Typiques

### 1. Examen Standard
- **Configuration** : Secrétariat défini, pas de consignes spécifiques
- **Résultat** : Consignes du secrétariat (encadré bleu)

### 2. Examen avec Instructions Particulières
- **Configuration** : Consignes spécifiques activées
- **Résultat** : Consignes spécifiques (encadré orange) - REMPLACENT celles du secrétariat

### 3. Examen en Mode Secrétariat
- **Configuration** : `is_mode_secretariat = TRUE`
- **Résultat** : Message "consignes à communiquer ultérieurement"
- **Exception** : Si consignes spécifiques activées, elles ont la priorité

### 4. Examen avec Cours Lié
- **Configuration** : Cours avec consignes, pas de spécifiques
- **Résultat** : Consignes du cours (encadré orange)

## Points Clés à Retenir

1. **Une seule source de consignes** s'affiche par examen (pas de cumul)
2. **Les consignes spécifiques** ont toujours la priorité maximale
3. **Le mode secrétariat** peut être surchargé par des consignes spécifiques
4. **La logique est identique** dans l'affichage public et l'export
5. **Les consignes sont conservées** même quand désactivées (pour réactivation ultérieure)

## Maintenance

### Ajout d'un Nouveau Secrétariat
1. Insérer dans `consignes_secretariat`
2. Définir les consignes par défaut
3. Tester l'affichage et l'export

### Modification de la Logique de Priorité
1. Modifier `ExamSchedulePage.tsx` (affichage)
2. Modifier `exportUtils.ts` (export)
3. Mettre à jour les vues SQL si nécessaire
4. Exécuter les tests de validation