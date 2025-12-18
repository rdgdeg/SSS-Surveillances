# Guide : Remplacements et Consignes Mode Secrétariat

## 🔄 Affichage des Remplacements

### Nouveau Comportement

Quand un surveillant est remplacé, l'affichage public montre maintenant :
- **Nom barré** (en rouge) : L'ancien surveillant
- **Nom en vert** : Le nouveau surveillant (remplaçant)

### Exemple Visuel

**Avant :**
```
Auditoire A
• Jean Dupont
• Marie Martin
```

**Après remplacement :**
```
Auditoire A
• Pierre Durand (barré en rouge)
  Sophie Bernard (en vert)
• Marie Martin
```

### Logique Technique

1. **Récupération des données** : Inclusion du champ `surveillants_remplaces`
2. **Traitement** : Identification des remplacements via l'historique
3. **Affichage** : 
   - Ancien nom avec `line-through` et couleur rouge
   - Nouveau nom en vert avec `font-medium`

## 📋 Consignes Mode Secrétariat

### Détection Automatique

Un examen est considéré en "mode secrétariat" si :
- Il a un auditoire contenant "répartition" ou "secrétariat" dans son nom
- ET cet auditoire a des surveillants assignés

### Affichage Adapté

#### Mode Normal
```
Consignes générales - Secrétariat FASB
• Arrivée : 30 minutes avant l'examen
• Mise en place : Vérifier les documents
• Consignes générales : Respecter le silence
```

#### Mode Secrétariat
```
Consignes spéciales - Répartition par le secrétariat
Les consignes détaillées (arrivée, mise en place, auditoires) 
seront communiquées ultérieurement par le pool, le secrétariat 
ou le responsable de cours.
```

### Suppression des Consignes Spécifiques

En mode secrétariat :
- ❌ **Consignes générales du secrétariat** masquées
- ❌ **Consignes spécifiques de l'examen** masquées  
- ❌ **Consignes du cours** masquées
- ✅ **Message spécial** affiché

## 🎯 Cas d'Usage

### Scénario 1 : Examen Normal avec Remplacement

```
Examen: MATH101 - Analyse I
Auditoire A: 
• Pierre Durand (barré)
  Sophie Bernard (remplaçant)
• Marie Martin

Consignes générales - Secrétariat FASB
• Arrivée: 30 minutes avant
• Mise en place: Vérifier les copies
```

### Scénario 2 : Examen Mode Secrétariat

```
Examen: PHYS201 - Physique II
Surveillants:
• Jean Dupont
• Marie Martin  
• Pierre Durand

Consignes spéciales - Répartition par le secrétariat
Les consignes détaillées seront communiquées ultérieurement 
par le pool, le secrétariat ou le responsable de cours.
```

### Scénario 3 : Examen Mode Secrétariat avec Remplacement

```
Examen: CHEM301 - Chimie Organique
Surveillants:
• Jean Dupont (barré)
  Alice Moreau (remplaçant)
• Marie Martin

Consignes spéciales - Répartition par le secrétariat
Les consignes détaillées seront communiquées ultérieurement 
par le pool, le secrétariat ou le responsable de cours.
```

## 🔧 Implémentation Technique

### Composant ExamenSurveillants

**Nouvelles fonctionnalités :**
- Récupération de `surveillants_remplaces`
- Traitement des remplacements avec historique
- Affichage conditionnel (barré + vert)

**Structure des données :**
```typescript
interface Remplacement {
  nom: string;
  isRemplacement: boolean;
  ancienNom?: string;
}
```

### Page ExamSchedulePage

**Nouvelles fonctionnalités :**
- Détection automatique du mode secrétariat
- Requête supplémentaire pour les auditoires
- Affichage conditionnel des consignes

**Logique de détection :**
```typescript
const isSecretariat = auditoire.toLowerCase().includes('répartition') || 
                     auditoire.toLowerCase().includes('secrétariat');
const hasAssignedSurveillants = surveillants.length > 0;
```

## 🎨 Codes Couleur

### Remplacements
- 🔴 **Rouge + barré** : Ancien surveillant remplacé
- 🟢 **Vert + gras** : Nouveau surveillant (remplaçant)
- ⚫ **Normal** : Surveillant non remplacé

### Consignes
- 🔵 **Bleu** : Consignes générales normales
- 🟡 **Jaune/Ambre** : Message mode secrétariat
- 🟠 **Orange** : Consignes spécifiques (masquées en mode secrétariat)

## ✅ Avantages

1. **Clarté** : Les remplacements sont immédiatement visibles
2. **Traçabilité** : Historique des changements préservé
3. **Cohérence** : Consignes adaptées au mode de gestion
4. **Information** : Message explicite pour le mode secrétariat
5. **Simplicité** : Détection automatique sans configuration

## 📱 Responsive

L'affichage s'adapte sur mobile :
- Noms barrés/remplaçants en colonne
- Messages de consignes adaptés
- Codes couleur préservés

## 🔄 Compatibilité

- ✅ **Examens existants** : Fonctionnent normalement
- ✅ **Anciens remplacements** : Affichés correctement
- ✅ **Migration** : Aucune migration requise
- ✅ **Performance** : Impact minimal (une requête supplémentaire)