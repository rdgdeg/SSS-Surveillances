# Guide : Attribution Flexible des Surveillants

## Vue d'ensemble

Cette fonctionnalité permet deux modes d'attribution des surveillants pour un examen :

1. **Attribution directe** : Assigner les surveillants à des auditoires spécifiques (mode classique)
2. **Attribution par le secrétariat** : Sélectionner les surveillants sans les assigner à un auditoire spécifique

## Cas d'usage

### Mode 1 : Attribution directe aux auditoires

Utilisez ce mode quand vous connaissez la répartition exacte des auditoires et pouvez assigner directement les surveillants.

**Exemple :**
- Auditoire A : Jean Dupont, Marie Martin
- Auditoire B : Pierre Durand, Sophie Bernard
- Salle 101 : Luc Petit

### Mode 2 : Attribution par le secrétariat

Utilisez ce mode quand :
- La répartition des auditoires n'est pas encore définie
- Le secrétariat ou le responsable de l'examen communiquera les auditoires plus tard
- Vous voulez juste sélectionner les surveillants nécessaires

**Exemple :**
Surveillants sélectionnés : Jean Dupont, Marie Martin, Pierre Durand
→ Message affiché : "Auditoires attribués par le secrétariat"

## Comment utiliser

### Accéder à la gestion des surveillants

1. Aller dans **Examens** (menu admin)
2. Cliquer sur **Auditoires** pour un examen
3. Le modal s'ouvre avec les options d'attribution

### Ajouter des surveillants en mode "Attribution par le secrétariat"

1. Dans le modal, sélectionner le mode **"Attribution par le secrétariat"**
2. Cliquer sur **"Activer ce mode pour cet examen"**
3. Une section jaune/ambre apparaît en haut
4. Utiliser la barre de recherche pour trouver et sélectionner les surveillants
5. Les surveillants sont cochés et ajoutés à la liste

### Ajouter des auditoires spécifiques

1. Sélectionner le mode **"Attribution directe"**
2. Saisir le nom de l'auditoire (ex: "Auditoire A", "Salle 101")
3. Indiquer le nombre de surveillants requis
4. Cliquer sur **"Ajouter l'auditoire"**
5. Utiliser la barre de recherche pour assigner les surveillants à cet auditoire

### Combiner les deux modes

Vous pouvez utiliser les deux modes pour le même examen :
- Certains auditoires avec attribution directe
- D'autres surveillants en attente d'attribution par le secrétariat

**Exemple :**
- Auditoire A : Jean Dupont (attribution directe)
- Auditoire B : Marie Martin (attribution directe)
- Surveillants (secrétariat) : Pierre Durand, Sophie Bernard, Luc Petit

## Affichage public

### Pour les surveillants avec auditoires spécifiques

Les surveillants voient leur auditoire assigné :
```
Auditoire A
• Jean Dupont
• Marie Martin
```

### Pour les surveillants en mode secrétariat

Les surveillants voient un message spécial :
```
Auditoires attribués par le secrétariat
• Pierre Durand
• Sophie Bernard
• Luc Petit

La répartition des auditoires sera communiquée séparément
```

## Gestion des remplacements

Les remplacements fonctionnent de la même manière dans les deux modes :
1. Cliquer sur **"Remplacer"** à côté d'un surveillant
2. Sélectionner le nouveau surveillant
3. Optionnel : Ajouter une raison
4. L'historique des remplacements est conservé

## Base de données

### Nouveau champ

La table `examen_auditoires` contient maintenant :
- `mode_attribution` : 'auditoire' (défaut) ou 'secretariat'

### Migration

Pour appliquer cette fonctionnalité :
```sql
-- Exécuter dans Supabase SQL Editor
\i supabase/migrations/add_mode_attribution_auditoires.sql
```

## Avantages

1. **Flexibilité** : Choisir le mode selon les besoins de chaque examen
2. **Clarté** : Message explicite pour les surveillants
3. **Historique** : Traçabilité des remplacements dans tous les modes
4. **Simplicité** : Interface intuitive avec codes couleur
   - Bleu : Auditoires spécifiques
   - Jaune/Ambre : Attribution par le secrétariat

## Notes techniques

- Les deux modes peuvent coexister pour un même examen
- Le tri affiche d'abord les surveillants du secrétariat, puis les auditoires spécifiques
- La vue publique adapte automatiquement l'affichage selon le mode
- Les remplacements sont tracés avec date et raison dans tous les modes
