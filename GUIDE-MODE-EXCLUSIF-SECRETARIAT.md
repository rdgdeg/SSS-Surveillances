# Guide : Mode Exclusif Secrétariat

## Comportement

Quand des surveillants sont assignés au mode "répartition par le secrétariat", l'interface bascule automatiquement en **mode exclusif** :

### 🔒 Mode Exclusif Activé

**Condition :** Des surveillants sont sélectionnés dans la section "Auditoires attribués par le secrétariat"

**Comportement :**
- ✅ **Seule la section secrétariat est visible**
- ❌ **Les auditoires spécifiques sont masqués**
- ❌ **Impossible d'ajouter de nouveaux auditoires spécifiques**
- ℹ️ **Message informatif affiché**

### 🔓 Mode Normal

**Condition :** Aucun surveillant dans la section secrétariat OU section secrétariat inexistante

**Comportement :**
- ✅ **Auditoires spécifiques visibles**
- ✅ **Possibilité d'ajouter des auditoires**
- ✅ **Possibilité de créer la section secrétariat**

## Logique Métier

### Pourquoi ce comportement ?

1. **Éviter la confusion** : Un examen ne peut pas être géré à la fois par auditoires spécifiques ET par le secrétariat
2. **Clarté pour les surveillants** : Ils voient soit leur auditoire précis, soit le message "répartition par le secrétariat"
3. **Simplicité d'usage** : Une seule méthode de gestion par examen

### Cas d'usage

#### Scénario 1 : Examen avec auditoires définis
```
Auditoire A: Jean Dupont, Marie Martin
Auditoire B: Pierre Durand
Salle 101: Sophie Bernard
```
→ **Mode normal** : Chaque surveillant voit son auditoire

#### Scénario 2 : Examen avec répartition différée
```
Surveillants sélectionnés: Jean Dupont, Marie Martin, Pierre Durand, Sophie Bernard
Message: "Auditoires attribués par le secrétariat"
```
→ **Mode exclusif** : Tous les surveillants voient le même message

## Interface Admin

### Indicateurs visuels

**Mode exclusif activé :**
- 🟡 Section secrétariat en jaune/ambre
- 🔵 Message informatif en bleu
- ❌ Auditoires spécifiques masqués
- ❌ Formulaires d'ajout masqués

**Mode normal :**
- 🔵 Auditoires spécifiques en bleu/gris
- ✅ Formulaires d'ajout visibles
- 🟡 Option "Créer section secrétariat" disponible

### Messages

**Message informatif (mode exclusif) :**
```
Mode répartition par le secrétariat activé

Des surveillants sont sélectionnés pour une répartition par le secrétariat. 
Les auditoires spécifiques sont masqués pour éviter la confusion.

Pour revenir au mode auditoires spécifiques, supprimez d'abord tous les 
surveillants de la section ci-dessus.
```

## Interface Publique

### Affichage pour les surveillants

**Mode exclusif :**
```
Surveillants
├── Auditoires attribués par le secrétariat
│   ├── • Jean Dupont
│   ├── • Marie Martin
│   └── • Pierre Durand
└── La répartition des auditoires sera communiquée séparément
```

**Mode normal :**
```
Surveillants
├── Auditoire A
│   ├── • Jean Dupont
│   └── • Marie Martin
└── Auditoire B
    └── • Pierre Durand
```

## Basculement entre modes

### Passer en mode exclusif
1. Créer la section secrétariat (si inexistante)
2. Sélectionner au moins un surveillant
3. ✅ **Mode exclusif automatiquement activé**

### Revenir en mode normal
1. Décocher tous les surveillants de la section secrétariat
2. ✅ **Mode normal automatiquement restauré**
3. Optionnel : Supprimer la section secrétariat vide

## Avantages

1. **Cohérence** : Un seul mode de gestion par examen
2. **Clarté** : Interface adaptée au mode choisi
3. **Prévention d'erreurs** : Impossible de mélanger les modes
4. **Expérience utilisateur** : Affichage simplifié selon le contexte

## Notes techniques

- La détection se base sur `surveillants.length > 0` dans la section secrétariat
- Le basculement est automatique et immédiat
- Les données des auditoires spécifiques sont préservées (juste masquées)
- Compatible avec l'historique des remplacements dans tous les modes