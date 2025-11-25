# Guide - Colonne "Surveillants à attribuer"

## Vue d'ensemble

La colonne "Surveillants à attribuer" affiche automatiquement le nombre de surveillants qu'il reste à attribuer pour chaque examen, en tenant compte des enseignants présents et des accompagnants.

## Formule de calcul

```
Surveillants à attribuer = MAX(0, Surveillants requis - Enseignants présents - Accompagnants)
```

### Explication

- **Surveillants requis** : nombre total de surveillants nécessaires (saisi manuellement)
- **Enseignants présents** : nombre d'enseignants qui seront présents à l'examen
- **Accompagnants** : nombre de personnes apportées par les enseignants (autres que les assistants)
- **MAX(0, ...)** : le résultat ne peut pas être négatif

## Exemples

### Exemple 1 : Examen standard
- Surveillants requis : **6**
- Enseignants présents : **2**
- Accompagnants : **1**
- **Surveillants à attribuer : 3** (6 - 2 - 1 = 3)

### Exemple 2 : Examen avec beaucoup d'enseignants
- Surveillants requis : **4**
- Enseignants présents : **3**
- Accompagnants : **2**
- **Surveillants à attribuer : 0** (4 - 3 - 2 = -1, mais affiché 0)

### Exemple 3 : Examen sans enseignants
- Surveillants requis : **8**
- Enseignants présents : **0**
- Accompagnants : **0**
- **Surveillants à attribuer : 8** (8 - 0 - 0 = 8)

## Affichage dans l'interface

### Codes couleur

La colonne utilise des couleurs pour faciliter la lecture :

| Valeur | Couleur | Signification |
|--------|---------|---------------|
| **0** | 🟢 Vert | Tous les surveillants sont couverts |
| **> 0** | 🟠 Orange | Il reste des surveillants à attribuer |

### Tooltip

En survolant la valeur avec la souris, un tooltip affiche le détail du calcul :
```
6 requis - 2 enseignants - 1 accompagnants = 3
```

## Utilisation

### 1. Saisir les données de base

Pour chaque examen, saisissez :

**a) Surveillants requis** (obligatoire)
- Cliquer sur "Modifier" pour l'examen
- Remplir le champ "Surveillants requis"
- Enregistrer

**b) Enseignants présents et Accompagnants** (optionnel)

Deux méthodes :

**Méthode 1 : Saisie manuelle**
1. Cliquer sur "Modifier" pour l'examen
2. Cocher "Utiliser la saisie manuelle pour les présences"
3. Remplir :
   - "Nombre d'enseignants présents"
   - "Nombre d'accompagnants"
4. Enregistrer

**Méthode 2 : Déclarations automatiques**
- Les enseignants déclarent leur présence via le formulaire
- Les valeurs sont calculées automatiquement depuis les déclarations

### 2. Consulter le nombre à attribuer

Dans la liste des examens, la colonne "Surv. à attribuer" affiche le résultat du calcul.

### 3. Planifier les attributions

Utilisez cette colonne pour :
- Identifier les examens nécessitant des surveillants
- Prioriser les attributions (valeurs les plus élevées)
- Vérifier que tous les examens sont couverts (valeur = 0)

## Export

La colonne "Surveillants à attribuer" est incluse dans les exports Excel et CSV.

### Dans Excel

Vous pouvez :
- **Trier** par cette colonne pour voir les examens prioritaires
- **Filtrer** pour afficher uniquement les examens avec des surveillants à attribuer
- **Créer des graphiques** pour visualiser la répartition
- **Calculer des totaux** : `=SOMME(L:L)` pour le total de surveillants à attribuer

### Exemple de filtre Excel

Pour afficher uniquement les examens nécessitant des surveillants :
1. Sélectionner la colonne "Surveillants à attribuer"
2. Activer le filtre automatique
3. Décocher "0"
4. Seuls les examens avec des surveillants à attribuer sont affichés

## Cas particuliers

### Valeur négative

Si le calcul donne un résultat négatif (plus d'enseignants et accompagnants que de surveillants requis), la valeur affichée est **0**.

**Exemple :**
- Surveillants requis : 3
- Enseignants présents : 2
- Accompagnants : 2
- Calcul : 3 - 2 - 2 = -1
- **Affiché : 0** (pas de surveillants supplémentaires nécessaires)

### Valeurs manquantes

Si certaines valeurs ne sont pas renseignées, elles sont considérées comme **0** :

| Champ manquant | Valeur utilisée |
|----------------|-----------------|
| Surveillants requis | 0 |
| Enseignants présents | 0 |
| Accompagnants | 0 |

### Mode manuel vs automatique

- **Mode manuel activé** : utilise les valeurs saisies manuellement
- **Mode automatique** : utilise les valeurs calculées depuis les déclarations de présence

## Workflow recommandé

### Phase 1 : Planification initiale
1. Importer les examens
2. Saisir le nombre de "Surveillants requis" pour chaque examen
3. Consulter la colonne "Surv. à attribuer" pour voir les besoins totaux

### Phase 2 : Collecte des présences
1. Envoyer le formulaire aux enseignants
2. Les enseignants déclarent leur présence et leurs accompagnants
3. La colonne "Surv. à attribuer" se met à jour automatiquement

### Phase 3 : Attribution finale
1. Exporter la liste en Excel
2. Trier par "Surv. à attribuer" (décroissant)
3. Attribuer les surveillants en priorité aux examens avec les valeurs les plus élevées
4. Vérifier que tous les examens ont une valeur de 0

## Statistiques utiles

### Dans l'interface

La colonne permet de voir rapidement :
- Combien d'examens nécessitent encore des surveillants (valeur > 0)
- Quels examens sont prioritaires (valeurs les plus élevées)
- Si la planification est complète (toutes les valeurs = 0)

### Dans Excel

Formules utiles :

```excel
// Total de surveillants à attribuer
=SOMME(L:L)

// Nombre d'examens nécessitant des surveillants
=NB.SI(L:L;">0")

// Nombre d'examens complets (tous les surveillants attribués)
=NB.SI(L:L;0)

// Moyenne de surveillants à attribuer par examen
=MOYENNE(L:L)

// Maximum de surveillants à attribuer (examen le plus critique)
=MAX(L:L)
```

## Avantages

✅ **Calcul automatique** : pas besoin de calculer manuellement
✅ **Mise à jour en temps réel** : se met à jour quand les données changent
✅ **Visibilité** : identification rapide des besoins
✅ **Priorisation** : facilite la planification des attributions
✅ **Vérification** : permet de s'assurer que tous les examens sont couverts
✅ **Export** : inclus dans les exports pour analyse externe

## Limitations

⚠️ **Ne tient pas compte** :
- Des disponibilités des surveillants
- Des compétences requises
- Des contraintes horaires
- Des préférences d'attribution

Ces aspects doivent être gérés séparément lors de l'attribution effective des surveillants.

## Prochaines améliorations

Fonctionnalités prévues :
- [ ] Alerte visuelle si valeur > seuil critique
- [ ] Graphique de répartition des besoins
- [ ] Export avec suggestions d'attribution
- [ ] Historique des modifications
- [ ] Prévisions basées sur les années précédentes

## Support

Pour toute question sur cette fonctionnalité :
1. Vérifier que les valeurs de base sont correctement saisies
2. Vérifier le mode (manuel ou automatique) pour les présences
3. Consulter le tooltip pour voir le détail du calcul
