# Guide : Statut d'Attribution avec Mode Secrétariat

## Logique de Calcul

### Mode Normal (Auditoires Spécifiques)

**Calcul classique :**
```
Requis = Somme des nb_surveillants_requis de tous les auditoires
Attribués = Somme des surveillants assignés à tous les auditoires
```

**Exemple :**
```
Auditoire A: 2 requis, 2 assignés
Auditoire B: 1 requis, 0 assigné
→ Total: 3 requis, 2 attribués = PARTIEL 🟡
```

### Mode Secrétariat

**Nouvelle logique :**
- Si l'auditoire contient "répartition" ou "secrétariat" dans son nom
- ET qu'il a des surveillants assignés
- Alors : `requis = attribués` (attribution considérée comme complète)

**Exemple :**
```
"Répartition à faire par le responsable ou le secrétariat": 3 surveillants assignés
→ Total: 3 requis, 3 attribués = COMPLET ✅
```

## Détection Automatique

### Critères de Détection

Un auditoire est considéré comme "secrétariat" si son nom contient :
- `répartition` (insensible à la casse)
- `secrétariat` (insensible à la casse)

### Exemples de Noms Détectés

✅ **Détectés comme secrétariat :**
- "Répartition à faire par le responsable ou le secrétariat"
- "Auditoires attribués par le secrétariat"
- "Répartition par le responsable"
- "REPARTITION SECRETARIAT"

❌ **Non détectés (auditoires normaux) :**
- "Auditoire A"
- "Salle 101"
- "Grand Amphithéâtre"

## Statuts d'Attribution

### 🟢 COMPLET (Vert)

**Mode normal :** `attribués >= requis`
```
Auditoire A: 2/2 ✅
Auditoire B: 1/1 ✅
→ Total: 3/3 = COMPLET
```

**Mode secrétariat :** `surveillants assignés > 0`
```
Secrétariat: 5 surveillants ✅
→ Total: 5/5 = COMPLET
```

### 🟡 PARTIEL (Orange)

**Mode normal :** `0 < attribués < requis`
```
Auditoire A: 1/2 ⚠️
Auditoire B: 0/1 ❌
→ Total: 1/3 = PARTIEL
```

**Mode secrétariat :** Ne peut pas être partiel (soit 0, soit complet)

### 🔴 NON ATTRIBUÉ (Rouge)

**Tous modes :** `attribués = 0`
```
Aucun surveillant assigné = NON ATTRIBUÉ
```

### ⚪ NON DÉFINI (Gris)

**Tous modes :** `requis = 0`
```
Aucun auditoire créé = NON DÉFINI
```

## Exemples Concrets

### Cas 1 : Examen Normal Complet
```sql
Auditoire A: 2 requis, 2 assignés
Auditoire B: 1 requis, 1 assigné
→ Statut: COMPLET ✅ (3/3)
```

### Cas 2 : Examen Normal Partiel
```sql
Auditoire A: 2 requis, 1 assigné
Auditoire B: 1 requis, 0 assigné
→ Statut: PARTIEL 🟡 (1/3)
```

### Cas 3 : Examen Secrétariat Complet
```sql
"Répartition par le secrétariat": 5 surveillants
→ Statut: COMPLET ✅ (5/5)
```

### Cas 4 : Examen Secrétariat Vide
```sql
"Répartition par le secrétariat": 0 surveillant
→ Statut: NON ATTRIBUÉ ❌ (0/0)
```

### Cas 5 : Examen Mixte (Edge Case)
```sql
Auditoire A: 2 requis, 2 assignés
"Répartition secrétariat": 3 surveillants
→ Statut: COMPLET ✅ (5/5)
```

## Avantages

1. **Cohérence** : Les examens en mode secrétariat apparaissent verts quand configurés
2. **Clarté** : Distinction automatique entre les modes
3. **Simplicité** : Pas de configuration supplémentaire nécessaire
4. **Flexibilité** : Fonctionne même avec des examens mixtes

## Impact sur l'Interface

### Liste des Examens
- Badge vert pour les examens secrétariat avec surveillants
- Compteur adapté (ex: 5/5 au lieu de 5/1)

### Statistiques
- Calculs corrects pour les rapports
- Métriques d'attribution précises

### Workflow
- Validation automatique des examens secrétariat
- Pas d'action supplémentaire requise

## Notes Techniques

- Détection basée sur le nom de l'auditoire (pas de champ dédié)
- Compatible avec l'ancienne structure de données
- Calcul en temps réel dans le hook `useExamenAuditoiresStats`
- Pas d'impact sur les performances (même requête SQL)