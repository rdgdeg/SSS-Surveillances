# Guide - Filtre par couleur d'attribution et corrections

## Résumé des modifications

### 1. Ajout du filtre par couleur d'attribution

**Fichiers modifiés :**
- `types.ts` : Ajout du champ `attributionStatus` à l'interface `ExamenFilters`
- `components/admin/ExamList.tsx` : Ajout du filtre dans l'interface utilisateur

**Fonctionnalité :**
- Nouveau filtre dans la liste des examens permettant de filtrer par statut d'attribution
- Options disponibles :
  - **Tous** : Affiche tous les examens
  - **Non défini (gris)** : Examens sans surveillants requis définis
  - **Partiel (orange)** : Examens avec attribution partielle
  - **Complet (vert)** : Examens avec attribution complète

**Implémentation :**
- Filtrage côté client après récupération des données
- Utilise les statistiques d'attribution déjà calculées par `useExamenAuditoiresStats`
- Mise à jour automatique du compteur total après filtrage

### 2. Correction du statut des auditoires secrétariat

**Fichier modifié :**
- `src/hooks/useExamenAuditoiresStats.ts`

**Problème résolu :**
Les examens avec auditoires de type "secrétariat" (contenant "répartition" ou "secrétariat" dans le nom) apparaissaient orange au lieu de vert.

**Solution :**
- **Avec surveillants assignés** : L'attribution est considérée comme complète (vert)
- **Sans surveillants assignés** : L'auditoire est considéré comme "prêt" (vert) car la répartition sera faite ultérieurement par le secrétariat

**Logique appliquée :**
```typescript
if (isSecretariatAuditoire) {
  const surveillantsAssignes = auditoire.surveillants?.length || 0;
  if (surveillantsAssignes > 0) {
    // Attribution complète avec les surveillants assignés
    stats[auditoire.examen_id].total_requis += surveillantsAssignes;
    stats[auditoire.examen_id].total_attribues += surveillantsAssignes;
  } else {
    // Auditoire prêt pour attribution par le secrétariat
    stats[auditoire.examen_id].total_requis += 1;
    stats[auditoire.examen_id].total_attribues += 1;
  }
}
```

## Utilisation

### Filtre par couleur
1. Aller dans la liste des examens (admin)
2. Utiliser le nouveau filtre "Statut d'attribution"
3. Sélectionner la couleur souhaitée
4. La liste se met à jour automatiquement

### Auditoires secrétariat
1. Créer un auditoire avec un nom contenant "répartition" ou "secrétariat"
2. L'examen apparaît automatiquement en vert (complet)
3. Assigner des surveillants si nécessaire
4. Le statut reste vert

## Avantages

1. **Meilleure visibilité** : Filtrage rapide par statut d'attribution
2. **Workflow simplifié** : Les auditoires secrétariat sont immédiatement verts
3. **Cohérence** : Statut correct selon le mode d'attribution choisi
4. **Performance** : Filtrage côté client sans requêtes supplémentaires

## Notes techniques

- Le filtre d'attribution est appliqué côté client pour éviter la complexité des requêtes SQL
- La détection des auditoires secrétariat se base sur le nom (insensible à la casse)
- Compatible avec le système d'attribution flexible existant