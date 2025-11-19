# Guide : Gestion des Surveillants par Auditoire

## Vue d'ensemble

Cette fonctionnalité permet de gérer les examens qui se déroulent dans plusieurs auditoires simultanément, avec des surveillants différents pour chaque auditoire.

## Architecture

### Base de données

**Table `examen_auditoires`** :
- `id` : UUID unique
- `examen_id` : Référence à l'examen
- `auditoire` : Nom de l'auditoire (ex: "Auditoire A", "Salle 101")
- `nb_surveillants_requis` : Nombre de surveillants nécessaires
- `surveillants` : Array d'UUIDs des surveillants assignés
- `remarques` : Remarques spécifiques
- `created_at`, `updated_at` : Timestamps

**Vue `v_examen_auditoires_with_surveillants`** :
- Jointure avec la table surveillants
- Affiche les noms complets des surveillants
- Facilite l'affichage dans l'interface

### Relations

```
examens (1) ----< examen_auditoires (N) >---- surveillants (N)
```

Un examen peut avoir plusieurs auditoires.
Chaque auditoire peut avoir plusieurs surveillants.

## Fonctionnalités

### 1. Dans l'admin (`/admin/examens`)

**Composant `ExamenAuditoiresManager`** :
- Liste des auditoires pour un examen
- Ajout d'un nouvel auditoire
- Sélection multiple de surveillants par auditoire
- Suppression d'un auditoire
- Affichage du nombre de surveillants requis vs assignés

**Interface** :
- Vue expandable par examen
- Sous-section "Auditoires et Surveillants"
- Checkboxes pour sélectionner les surveillants
- Formulaire d'ajout d'auditoire

### 2. Dans le planning public (`/planning`)

**Affichage** :
- Liste des auditoires par examen
- Noms des surveillants par auditoire
- Recherche par nom de surveillant
- Filtrage des examens où un surveillant est assigné

## Installation

### Étape 1 : Exécuter la migration SQL

```sql
-- Dans l'éditeur SQL de Supabase
-- Copier/coller le contenu de supabase/migrations/create_examen_auditoires.sql
```

Cette migration crée :
- La table `examen_auditoires`
- Les index pour les performances
- Les triggers pour `updated_at`
- Les policies RLS
- La vue avec les noms des surveillants

### Étape 2 : Intégrer le composant

Le composant `ExamenAuditoiresManager` doit être intégré dans la page des examens.

**À faire** :
1. Importer le composant dans `pages/admin/ExamensPage.tsx`
2. L'afficher dans une section expandable pour chaque examen
3. Passer l'`examenId` en prop

### Étape 3 : Mettre à jour le planning public

Modifier `pages/public/ExamSchedulePage.tsx` pour :
1. Charger les auditoires avec les surveillants
2. Afficher les auditoires au lieu du placeholder
3. Permettre la recherche par nom de surveillant

## Utilisation

### Scénario 1 : Examen dans un seul auditoire

1. Créer l'examen normalement
2. Ajouter un auditoire (ex: "Auditoire A")
3. Sélectionner les surveillants pour cet auditoire
4. Sauvegarder

### Scénario 2 : Examen dans plusieurs auditoires

1. Créer l'examen
2. Ajouter le premier auditoire (ex: "Auditoire A")
3. Sélectionner les surveillants pour l'Auditoire A
4. Ajouter le deuxième auditoire (ex: "Auditoire B")
5. Sélectionner les surveillants pour l'Auditoire B
6. Répéter pour chaque auditoire

### Scénario 3 : Modifier les surveillants

1. Ouvrir l'examen dans l'admin
2. Cocher/décocher les surveillants dans chaque auditoire
3. Les modifications sont sauvegardées automatiquement

## Exemples de requêtes

### Récupérer les auditoires d'un examen avec les noms des surveillants

```sql
SELECT * 
FROM v_examen_auditoires_with_surveillants
WHERE examen_id = 'votre-examen-id';
```

### Trouver tous les examens où un surveillant est assigné

```sql
SELECT DISTINCT e.*
FROM examens e
JOIN examen_auditoires ea ON ea.examen_id = e.id
WHERE 'surveillant-id' = ANY(ea.surveillants);
```

### Compter les surveillants par examen

```sql
SELECT 
    e.id,
    e.local,
    COUNT(DISTINCT ea.id) as nb_auditoires,
    SUM(array_length(ea.surveillants, 1)) as nb_surveillants_total
FROM examens e
LEFT JOIN examen_auditoires ea ON ea.examen_id = e.id
GROUP BY e.id, e.local;
```

## Avantages de cette approche

✅ **Flexible** : Gère facilement les examens multi-auditoires
✅ **Évolutif** : Facile d'ajouter des fonctionnalités (horaires différents, etc.)
✅ **Performant** : Index optimisés pour les requêtes
✅ **Sécurisé** : RLS activé avec policies appropriées
✅ **Maintenable** : Structure claire et bien documentée

## Améliorations futures possibles

1. **Horaires différents par auditoire** : Ajouter `heure_debut` et `heure_fin` dans `examen_auditoires`
2. **Capacité par auditoire** : Ajouter `nb_etudiants` pour répartir les étudiants
3. **Statut de confirmation** : Ajouter un champ pour confirmer la présence des surveillants
4. **Notifications** : Envoyer des emails aux surveillants assignés
5. **Planning individuel** : Page pour chaque surveillant avec ses affectations
6. **Conflits** : Détecter si un surveillant est assigné à deux examens simultanés
7. **Historique** : Logger les changements d'affectation

## Support

Pour toute question sur cette fonctionnalité :
- Consultez ce guide
- Vérifiez la migration SQL
- Testez avec des données de test
- Contactez le support : 02/436.16.89
