# Guide - Vérification des Liens Examen-Cours

## 🔍 Comment identifier à quel cours est lié un examen

### 1. **Via l'interface utilisateur**

#### Dans la liste des examens :
1. Aller dans **Gestion des examens** > **Liste**
2. Regarder la colonne avec l'icône ⚠️ (triangle jaune)
3. **Icône ⚠️ visible** = Examen non lié à un cours
4. **Pas d'icône** = Examen correctement lié

#### Via l'onglet "Lier aux cours" :
1. Aller dans **Gestion des examens** > **Lier aux cours**
2. Voir tous les examens orphelins (sans cours lié)
3. Suggestions automatiques de cours correspondants
4. Possibilité de lier manuellement

### 2. **Via SQL (diagnostic complet)**

Utiliser le script `scripts/debug-examen-cours-links.sql` :

```sql
-- Voir tous les examens avec leurs cours liés
SELECT 
    e.code_examen,
    e.nom_examen,
    c.code_cours,
    c.nom_cours,
    CASE 
        WHEN e.cours_id IS NULL THEN '❌ Non lié'
        ELSE '✅ Lié'
    END as statut
FROM examens e
LEFT JOIN cours c ON e.cours_id = c.id
WHERE e.session_id = (SELECT id FROM sessions WHERE is_active = true)
ORDER BY e.code_examen;
```

### 3. **Recherche d'un examen spécifique**

```sql
-- Remplacer 'VOTRE_CODE_EXAMEN' par le code réel
SELECT 
    e.code_examen,
    e.nom_examen,
    e.cours_id,
    c.code_cours,
    c.nom_cours,
    c.enseignants as cours_enseignants,
    e.enseignants as examen_enseignants
FROM examens e
LEFT JOIN cours c ON e.cours_id = c.id
WHERE e.code_examen = 'VOTRE_CODE_EXAMEN'
  AND e.session_id = (SELECT id FROM sessions WHERE is_active = true);
```

## 🔧 Comment corriger un lien incorrect

### Méthode 1 : Via l'interface "Lier aux cours"

1. **Aller dans Gestion des examens** > **Lier aux cours**
2. **Trouver l'examen** dans la liste des examens orphelins
3. **Voir les suggestions automatiques** (si disponibles)
4. **Sélectionner le bon cours** dans la liste déroulante
5. **Cliquer sur "Lier"**

### Méthode 2 : Via la modale d'édition

1. **Dans la liste des examens**, cliquer sur l'icône **Modifier** (crayon)
2. **Champ "Cours lié"** : sélectionner le bon cours
3. **Enregistrer** les modifications

### Méthode 3 : Via SQL (pour les administrateurs)

```sql
-- Lier un examen à un cours
UPDATE examens 
SET cours_id = (
    SELECT id FROM cours 
    WHERE code = 'CODE_DU_COURS' 
    LIMIT 1
)
WHERE code_examen = 'CODE_DE_LEXAMEN'
  AND session_id = (SELECT id FROM sessions WHERE is_active = true);
```

## 🔍 Diagnostics avancés

### Examens avec des enseignants différents du cours

```sql
-- Identifier les potentiels problèmes de liaison
SELECT 
    e.code_examen,
    e.nom_examen,
    c.code_cours,
    c.nom_cours,
    e.enseignants as examen_enseignants,
    c.enseignants as cours_enseignants
FROM examens e
JOIN cours c ON e.cours_id = c.id
WHERE e.session_id = (SELECT id FROM sessions WHERE is_active = true)
  AND e.enseignants != c.enseignants;
```

### Recherche de cours par similarité

```sql
-- Trouver des cours similaires à un nom d'examen
SELECT 
    c.code_cours,
    c.nom_cours,
    c.enseignants
FROM cours c
WHERE c.session_id = (SELECT id FROM sessions WHERE is_active = true)
  AND c.nom_cours ILIKE '%PARTIE_DU_NOM%'
ORDER BY c.code_cours;
```

## 📊 Statistiques des liens

### Via l'interface
- **Tableau de bord des examens** : voir le nombre d'examens orphelins
- **Alerte en haut de la liste** : indication du nombre d'examens non liés

### Via SQL
```sql
-- Statistiques complètes
SELECT 
    COUNT(*) as total_examens,
    COUNT(cours_id) as examens_lies,
    COUNT(*) - COUNT(cours_id) as examens_orphelins,
    ROUND(COUNT(cours_id)::numeric / COUNT(*)::numeric * 100, 2) as pourcentage_lies
FROM examens
WHERE session_id = (SELECT id FROM sessions WHERE is_active = true);
```

## ⚠️ Problèmes courants

### 1. **Examen lié au mauvais cours**
- **Symptôme** : Enseignants différents entre examen et cours
- **Solution** : Relier au bon cours via l'interface

### 2. **Cours inexistant**
- **Symptôme** : Aucun cours ne correspond au code d'examen
- **Solution** : Créer le cours manquant ou lier à un cours existant

### 3. **Codes d'examen non standardisés**
- **Symptôme** : Suggestions automatiques ne fonctionnent pas
- **Solution** : Liaison manuelle via l'interface

## 🎯 Bonnes pratiques

1. **Vérifier régulièrement** les examens orphelins
2. **Utiliser l'onglet "Lier aux cours"** pour une vue d'ensemble
3. **Créer les cours manquants** avant d'importer les examens
4. **Standardiser les codes d'examens** pour améliorer les suggestions automatiques
5. **Vérifier la cohérence** des enseignants entre examens et cours

## 🚀 Actions recommandées

1. **Exécuter le script de diagnostic** : `scripts/debug-examen-cours-links.sql`
2. **Identifier les examens orphelins** via l'interface
3. **Corriger les liens** un par un ou en lot
4. **Vérifier la cohérence** des enseignants
5. **Documenter** les corrections apportées