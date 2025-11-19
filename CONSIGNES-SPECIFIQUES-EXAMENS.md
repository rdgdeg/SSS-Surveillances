# Fonctionnalité : Consignes Spécifiques par Examen

## Vue d'ensemble

Cette fonctionnalité permet de définir des consignes spécifiques pour un examen particulier, remplaçant les consignes par défaut du secrétariat.

## Cas d'usage

**Scénario :** Vous avez défini des consignes générales pour le secrétariat MED (Médecine), mais un examen spécifique nécessite des instructions particulières (ex: matériel spécial, heure d'arrivée différente, procédure particulière).

**Solution :** Activez les consignes spécifiques pour cet examen uniquement.

## Architecture

### 1. Base de données

**Migration :** `add_consignes_specifiques_examens.sql`

Nouvelles colonnes dans la table `examens` :
- `utiliser_consignes_specifiques` (BOOLEAN) : Active/désactive les consignes spécifiques
- `consignes_specifiques_arrivee` (TEXT) : Consignes d'arrivée spécifiques
- `consignes_specifiques_mise_en_place` (TEXT) : Consignes de mise en place spécifiques
- `consignes_specifiques_generales` (TEXT) : Consignes générales spécifiques

### 2. Interface Admin

**Composant :** `ExamenConsignesModal.tsx`

Modal accessible depuis la liste des examens (Admin > Examens) via un bouton violet avec icône FileText.

**Fonctionnalités :**
- Toggle pour activer/désactiver les consignes spécifiques
- 3 champs de texte pour les différents types de consignes
- Affichage du secrétariat par défaut pour référence
- Sauvegarde automatique dans la base de données

### 3. Affichage Public

**Logique d'affichage :**
1. Si `utiliser_consignes_specifiques = TRUE` → Affiche les consignes spécifiques de l'examen
2. Sinon → Affiche les consignes du secrétariat (comportement par défaut)

**Indicateur visuel :** Mention "Consignes spécifiques pour cet examen" pour distinguer des consignes du secrétariat

## Workflow d'utilisation

### Pour l'administrateur :

1. **Configuration des consignes par défaut**
   - Aller dans Admin > Enseignants > Consignes Secrétariat
   - Définir les consignes pour chaque secrétariat (MED, FASB, DENT, etc.)

2. **Définir des consignes spécifiques pour un examen**
   - Aller dans Admin > Examens
   - Cliquer sur l'icône violette (FileText) dans la colonne Actions
   - Activer le toggle "Utiliser des consignes spécifiques"
   - Remplir les champs nécessaires
   - Enregistrer

3. **Modifier ou désactiver les consignes spécifiques**
   - Rouvrir le modal des consignes
   - Modifier le texte ou désactiver le toggle
   - Enregistrer

### Pour les surveillants (public) :

- Les consignes s'affichent automatiquement dans chaque examen
- Aucune action requise
- Les consignes spécifiques sont clairement identifiées

## Exemples d'utilisation

### Exemple 1 : Heure d'arrivée différente

**Secrétariat MED (par défaut) :**
> "Veuillez vous présenter à 08h15 à l'accueil de la faculté de médecine."

**Examen spécifique (Chirurgie pratique) :**
> "Veuillez vous présenter à 07h45 au bloc opératoire pédagogique (Bâtiment B, 2ème étage). Une tenue adaptée est requise."

### Exemple 2 : Matériel spécial

**Consignes spécifiques :**
> "Cet examen nécessite la distribution de calculatrices. Veuillez récupérer le matériel au secrétariat 30 minutes avant le début de l'examen."

### Exemple 3 : Procédure particulière

**Consignes spécifiques :**
> "Examen oral avec rotation des étudiants. Les surveillants doivent gérer le flux d'entrée/sortie des candidats selon le planning fourni."

## Avantages

1. **Flexibilité maximale**
   - Consignes générales par secrétariat
   - Possibilité de personnaliser pour des cas particuliers

2. **Gestion centralisée**
   - Tout se gère depuis l'interface admin
   - Pas besoin de modifier le code

3. **Clarté pour les surveillants**
   - Indication claire quand les consignes sont spécifiques
   - Toutes les informations au même endroit

4. **Traçabilité**
   - Les consignes sont stockées en base de données
   - Historique des modifications possible

## Hiérarchie des consignes

```
1. Consignes spécifiques de l'examen (si activées)
   ↓ (priorité absolue)
   
2. Consignes du secrétariat
   ↓ (par défaut)
   
3. Aucune consigne
   (si ni l'un ni l'autre n'est défini)
```

## Interface utilisateur

### Dans la liste des examens :

| Date | Heure | Code | Nom | Auditoires | Secrétariat | Surveillants | Statut | Actions |
|------|-------|------|-----|------------|-------------|--------------|--------|---------|
| ... | ... | ... | ... | ... | MED | Gérer | ✓ | ✏️ 📄 🗑️ |

- ✏️ = Modifier l'examen
- 📄 = Consignes spécifiques (nouveau)
- 🗑️ = Supprimer

### Dans le planning public :

```
┌─────────────────────────────────────────────────┐
│ WINTR2105 - Interprétation de l'ECG            │
│ Faculté de Médecine                             │
│                                                 │
│ 📅 Jeudi 4 décembre 2025                       │
│ 🕐 18:00 - 19:00                               │
│ 📍 71 - Simonart, 51 A - Lacroix              │
│                                                 │
│ ℹ️ Consignes pour les surveillants             │
│ Consignes spécifiques pour cet examen          │
│ Veuillez vous présenter à 17h30 au local 71.   │
│ Matériel ECG à distribuer avant le début.      │
└─────────────────────────────────────────────────┘
```

## Notes techniques

- Les consignes spécifiques sont optionnelles (NULL par défaut)
- Le toggle `utiliser_consignes_specifiques` contrôle l'affichage
- Les consignes du secrétariat restent accessibles même si non affichées
- Possibilité de revenir aux consignes du secrétariat en désactivant le toggle

## Évolutions futures possibles

1. Templates de consignes spécifiques réutilisables
2. Copier les consignes d'un examen à un autre
3. Historique des modifications des consignes
4. Notifications aux surveillants en cas de changement
5. Prévisualisation avant publication
