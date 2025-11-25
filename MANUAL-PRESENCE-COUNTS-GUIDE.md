# Guide - Saisie manuelle des présences dans les examens

## Vue d'ensemble

Cette fonctionnalité permet aux administrateurs de saisir manuellement le nombre d'enseignants présents et d'accompagnants pour un examen, en alternative aux déclarations de présence automatiques.

## Cas d'usage

- Examens où les enseignants n'ont pas fait de déclaration en ligne
- Corrections manuelles de données
- Situations exceptionnelles nécessitant une saisie directe
- Examens passés où les déclarations ne sont plus disponibles

## Fonctionnement

### 1. Activation de la saisie manuelle

Dans le formulaire d'édition d'un examen :
1. Cliquer sur "Modifier" (icône crayon) pour un examen
2. Cocher la case **"Utiliser la saisie manuelle pour les présences"**
3. Deux champs apparaissent :
   - **Nombre d'enseignants présents**
   - **Nombre d'accompagnants** (personnes apportées autres que les assistants)

### 2. Saisie des valeurs

- Entrer le nombre d'enseignants présents (0 ou plus)
- Entrer le nombre d'accompagnants (0 ou plus)
- Cliquer sur "Enregistrer"

### 3. Affichage dans la liste

Les valeurs saisies manuellement s'affichent dans les colonnes :
- **Ens. présents** : affiche le nombre saisi (en vert si > 0)
- **Accompagnants** : affiche le nombre saisi (en bleu si > 0)

### 4. Priorité des données

Quand la saisie manuelle est activée (`use_manual_counts = true`) :
- Les valeurs manuelles sont utilisées en priorité
- Les déclarations de présence automatiques sont ignorées pour l'affichage
- Les déclarations restent en base de données (pas de perte de données)

Quand la saisie manuelle est désactivée :
- Les valeurs sont calculées automatiquement depuis les déclarations de présence
- Les champs manuels sont ignorés

## Structure de la base de données

### Nouvelles colonnes dans `examens`

```sql
-- Nombre d'enseignants présents (saisie manuelle)
nb_enseignants_presents_manuel INTEGER DEFAULT NULL

-- Nombre d'accompagnants (saisie manuelle)
nb_accompagnants_manuel INTEGER DEFAULT NULL

-- Indicateur d'utilisation des valeurs manuelles
use_manual_counts BOOLEAN DEFAULT FALSE
```

### Migration

Fichier : `supabase/migrations/add_manual_presence_fields_to_examens.sql`

Pour appliquer la migration :
```bash
# Via Supabase CLI
supabase db push

# Ou exécuter directement le SQL dans l'interface Supabase
```

## Logique de calcul

Dans `lib/examenManagementApi.ts`, fonction `getExamens` :

```typescript
// Use manual counts if enabled, otherwise use declarations
const nb_enseignants_presents = examen.use_manual_counts 
  ? (examen.nb_enseignants_presents_manuel || 0)
  : examenPresences.filter(p => p.est_present).length;

const nb_surveillants_accompagnants = examen.use_manual_counts
  ? (examen.nb_accompagnants_manuel || 0)
  : examenPresences
      .filter(p => p.est_present)
      .reduce((sum, p) => sum + (p.nb_surveillants_accompagnants || 0), 0);
```

## Export CSV

Les valeurs exportées dans le CSV correspondent aux valeurs affichées :
- Si saisie manuelle activée : valeurs manuelles
- Sinon : valeurs calculées depuis les déclarations

## Interface utilisateur

### Formulaire d'édition

```
┌─────────────────────────────────────────────┐
│ Modifier l'examen                           │
├─────────────────────────────────────────────┤
│ Code: WMDS2221                              │
│ Nom: SECTEUR HÉMATOLOGIE                    │
│ ...                                         │
│                                             │
│ ☑ Utiliser la saisie manuelle pour les     │
│   présences                                 │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Nombre d'enseignants présents:    [  2] │ │
│ │ Nombre d'accompagnants:           [  1] │ │
│ │ (Personnes apportées autres que les     │ │
│ │  assistants)                            │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│           [Annuler]  [Enregistrer]          │
└─────────────────────────────────────────────┘
```

### Liste des examens

Les colonnes affichent les valeurs appropriées selon le mode :
- Vert si > 0
- Gris si = 0
- Tooltip indiquant si c'est une valeur manuelle ou calculée (à implémenter)

## Avantages

✅ Flexibilité pour les cas exceptionnels
✅ Pas de perte de données (les déclarations restent)
✅ Possibilité de revenir au mode automatique
✅ Export cohérent avec l'affichage
✅ Audit trail complet via les logs

## Limitations

⚠️ Les valeurs manuelles ne sont pas synchronisées avec les déclarations
⚠️ Risque d'incohérence si on oublie de désactiver le mode manuel
⚠️ Pas de validation croisée avec les déclarations existantes

## Recommandations

1. **Utiliser en dernier recours** : privilégier les déclarations de présence normales
2. **Documenter** : ajouter une remarque dans l'examen expliquant pourquoi la saisie manuelle est utilisée
3. **Vérifier** : s'assurer que les valeurs saisies sont cohérentes
4. **Désactiver** : revenir au mode automatique dès que possible

## Prochaines améliorations possibles

- [ ] Indicateur visuel dans la liste (icône) pour les examens en mode manuel
- [ ] Historique des modifications des valeurs manuelles
- [ ] Alerte si des déclarations existent mais le mode manuel est activé
- [ ] Comparaison automatique entre valeurs manuelles et calculées
- [ ] Rapport des examens en mode manuel

## Support

En cas de problème :
1. Vérifier que la migration a été appliquée
2. Vérifier les logs de la console navigateur
3. Vérifier que `use_manual_counts` est bien à `true` dans la base
4. Vérifier les valeurs dans les colonnes `nb_enseignants_presents_manuel` et `nb_accompagnants_manuel`
