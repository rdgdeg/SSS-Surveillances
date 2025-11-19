# Suivi des Attributions de Surveillances

## Vue d'ensemble

Cette fonctionnalité permet de visualiser en temps réel le nombre de surveillances attribuées à chaque surveillant dans la liste des surveillants, facilitant ainsi la gestion des quotas et évitant les surcharges.

## Fonctionnalités

### Colonne "Attrib." dans la liste des surveillants

Une nouvelle colonne affiche pour chaque surveillant :
- **Nombre d'attributions** : Le nombre total de surveillances auxquelles le surveillant est assigné
- **Quota restant** : Calcul automatique du quota restant (quota - attributions)

### Indicateurs visuels

Le système utilise des codes couleur pour identifier rapidement les situations :

- **🔴 Rouge** : Surveillant en surcharge (attributions > quota)
  - Affiche "+X" pour indiquer le dépassement
  
- **🟡 Ambre** : Surveillant proche du quota (reste 0 ou 1 surveillance)
  - Affiche "reste X" pour indiquer la marge restante
  
- **⚪ Gris** : Surveillant dans les limites normales
  - Affiche "reste X" pour indiquer la marge restante

### Exemple d'affichage

```
Quota | Attrib.
------|--------
  6   |   4
      | reste 2    (normal - gris)

  6   |   6
      | reste 0    (proche - ambre)

  6   |   8
      | +2         (surcharge - rouge)
```

## Utilisation

### Lors de l'attribution de surveillances

1. Ouvrez la page **Gestion des Surveillants**
2. Consultez la colonne **Attrib.** pour voir les attributions actuelles
3. Identifiez les surveillants disponibles (en gris) ou proches du quota (en ambre)
4. Évitez d'attribuer des surveillances aux surveillants en rouge (surcharge)

### Filtrage et tri

Vous pouvez combiner cette information avec les filtres existants :
- Filtrer par type de surveillant
- Filtrer par faculté
- Trier par quota pour voir qui a le plus de marge

## Détails techniques

### Calcul des attributions

Les attributions sont comptées à partir de la table `examen_auditoires` :
- Chaque auditoire peut avoir plusieurs surveillants assignés
- Un surveillant peut être assigné à plusieurs auditoires
- Le comptage est fait en temps réel à chaque chargement de la page

### Mise à jour

Les données d'attribution sont chargées automatiquement :
- Au chargement initial de la page
- Après toute modification dans la gestion des examens/auditoires

Pour forcer un rafraîchissement, rechargez simplement la page.

## Cas d'usage

### Scénario 1 : Attribution équilibrée
Vous devez attribuer 3 surveillants à un nouvel examen. Consultez la liste et sélectionnez les surveillants avec le plus de marge restante.

### Scénario 2 : Identification des surcharges
Un surveillant apparaît en rouge avec "+2". Vérifiez ses attributions dans la gestion des examens et redistribuez si nécessaire.

### Scénario 3 : Planification de session
Avant d'importer une nouvelle session d'examens, vérifiez la répartition actuelle pour anticiper les besoins en surveillants.

## Améliorations futures possibles

1. **Filtre par statut d'attribution** : Filtrer uniquement les surveillants en surcharge ou disponibles
2. **Tri par attributions** : Trier la liste par nombre d'attributions
3. **Export avec attributions** : Inclure les attributions dans l'export Excel
4. **Détail des attributions** : Cliquer sur le nombre pour voir la liste des examens assignés
5. **Alertes automatiques** : Notification lors d'une tentative d'attribution à un surveillant en surcharge

## Support

Pour toute question ou suggestion d'amélioration, contactez l'équipe de développement.
