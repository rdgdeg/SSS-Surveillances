# Guide des améliorations - Gestion des examens

## Résumé des modifications

Ce document décrit les améliorations apportées à l'onglet "Gestion des examens" pour améliorer la visibilité et la gestion des données.

## Nouvelles fonctionnalités

### 1. Colonnes supplémentaires dans la liste des examens

Deux nouvelles colonnes ont été ajoutées au tableau des examens :

#### **Enseignants présents**
- Affiche le nombre d'enseignants qui ont déclaré leur présence pour l'examen
- Couleur verte si > 0, grise sinon
- Permet de voir rapidement quels examens ont des enseignants présents

#### **Accompagnants**
- Affiche le nombre de personnes apportées autres que les assistants (surveillants accompagnants)
- Couleur bleue si > 0, grise sinon
- Correspond au champ `nb_surveillants_accompagnants` des déclarations de présence

### 2. Export des données

Un bouton **"Exporter"** a été ajouté en haut de la liste des examens.

**Fonctionnalités :**
- Exporte tous les examens visibles (selon les filtres appliqués) au format CSV
- Inclut toutes les colonnes : Code, Nom, Date, Heures, Durée, Auditoires, Secrétariat, Surveillants requis, Enseignants présents, Accompagnants, Statut
- Nom du fichier : `examens_YYYY-MM-DD.csv`
- Encodage UTF-8 avec BOM pour compatibilité Excel

**Utilisation :**
1. Appliquer les filtres souhaités (faculté, date, statut, etc.)
2. Cliquer sur "Exporter"
3. Le fichier CSV est téléchargé automatiquement

### 3. Recherche dans l'attribution des surveillants

Dans le modal de gestion des auditoires et surveillants, une barre de recherche a été ajoutée pour chaque auditoire.

**Fonctionnalités :**
- Recherche en temps réel dans la liste des surveillants
- Filtre par nom et prénom
- Insensible à la casse
- Facilite la sélection dans de longues listes

**Utilisation :**
1. Ouvrir le modal "Gérer" pour un examen
2. Dans chaque auditoire, utiliser le champ "Rechercher un surveillant..."
3. Cocher/décocher les surveillants filtrés

### 4. Correction des filtres

Les filtres ont été corrigés pour fonctionner correctement :

#### **Filtre par Secrétariat/Faculté**
- Utilise maintenant une recherche partielle insensible à la casse
- Permet de taper "MED" pour trouver tous les examens du secrétariat MED
- Plus de plantage lors du filtrage

#### **Filtre par Statut de réponse**
- Corrigé pour gérer correctement la pagination
- "Déclaré" : examens avec au moins une déclaration de présence
- "En attente" : examens sans déclaration de présence
- Le comptage total est maintenant correct

## Structure des données

### Champs utilisés

```typescript
interface ExamenWithStatus {
  // ... autres champs
  nb_enseignants_presents: number;        // Nombre d'enseignants présents
  nb_surveillants_accompagnants: number;  // Nombre d'accompagnants
  has_presence_declarations: boolean;     // A des déclarations
  nb_presences_declarees: number;        // Nombre de déclarations
}
```

### Source des données

Les données proviennent de la table `presences_enseignants` :
- `est_present` : indique si l'enseignant est présent
- `nb_surveillants_accompagnants` : nombre de personnes apportées

## Prochaines étapes

Pour pousser les modifications dans Git :

```bash
git add .
git commit -m "feat: amélioration gestion examens - colonnes, export, recherche surveillants"
git push
```

## Notes techniques

### Performance
- L'export utilise les données déjà chargées (pas de requête supplémentaire)
- La recherche de surveillants est côté client (instantanée)
- Les filtres optimisés réduisent la charge serveur

### Compatibilité
- Export CSV compatible Excel (UTF-8 BOM)
- Recherche fonctionne sur tous les navigateurs modernes
- Interface responsive (mobile/tablette/desktop)

## Support

Pour toute question ou problème :
1. Vérifier que les données de présence sont bien enregistrées
2. Tester l'export avec différents filtres
3. Vérifier la console navigateur en cas d'erreur
