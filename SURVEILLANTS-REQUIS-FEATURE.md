# Affichage du nombre de surveillants nécessaires

## Modifications apportées

### Formulaire de disponibilités des surveillants

Le formulaire de déclaration de disponibilités affiche maintenant le nombre de surveillants théoriquement nécessaires pour chaque créneau.

## Fonctionnalités

### 1. Badge informatif sur chaque créneau

Chaque créneau affiche maintenant un badge avec :
- **Icône** : Icône "Users" pour représenter les surveillants
- **Nombre** : Le nombre de surveillants requis (si défini par l'admin)
- **Couleur** : 
  - Bleu pour les créneaux normaux (< 5 surveillants)
  - Orange pour les créneaux fortement sollicités (≥ 5 surveillants)

### 2. Information contextuelle

Une section d'information explique clairement :
- Ce que représente le chiffre affiché
- Que c'est une information indicative
- Que la sélection du surveillant n'affecte pas ce nombre
- Que cela aide à identifier les créneaux fortement sollicités

## Comportement

### Affichage du badge
- Le badge n'apparaît que si un nombre de surveillants a été défini par l'administrateur
- Le nombre reste constant, il ne décrémente pas quand un surveillant coche le créneau
- C'est purement informatif pour aider les surveillants à comprendre la demande

### Couleurs et priorités
- **Bleu** (< 5 surveillants) : Créneau avec demande normale
- **Orange** (≥ 5 surveillants) : Créneau avec forte demande, encourage les surveillants à se rendre disponibles

## Exemple visuel

```
┌─────────────────────────────────────────────────────────┐
│ ☐  09h00 - 11h00  👥 8  [Réserve]                      │
│    └─ Badge orange car 8 ≥ 5 (forte demande)           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ☐  13h00 - 15h00  👥 3                                  │
│    └─ Badge bleu car 3 < 5 (demande normale)           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ☐  16h00 - 18h00                                        │
│    └─ Pas de badge (nombre non défini par l'admin)     │
└─────────────────────────────────────────────────────────┘
```

## Avantages

1. **Transparence** : Les surveillants voient la charge de travail attendue
2. **Encouragement** : Les créneaux fortement sollicités sont mis en évidence
3. **Information** : Aide à la prise de décision pour maximiser les disponibilités
4. **Simplicité** : Affichage clair et non intrusif

## Configuration côté admin

L'administrateur peut définir le nombre de surveillants requis :
- Dans la page "Gestion des examens"
- En éditant directement le champ "nb_surveillants_requis" pour chaque créneau
- Via l'import CSV (colonne dédiée si disponible)

## Fichiers modifiés

- `components/public/AvailabilityForm.tsx` : Ajout de l'affichage du badge et de la légende explicative

## Notes techniques

- Le champ `nb_surveillants_requis` est optionnel dans la table `creneaux`
- Si non défini (null), aucun badge n'est affiché
- Le nombre est récupéré directement depuis l'objet `Creneau`
- Aucune logique de décrémentation n'est appliquée
