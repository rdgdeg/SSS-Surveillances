# Guide : Une ligne par auditoire

## Problème résolu

Afficher une ligne séparée pour chaque auditoire d'un examen, permettant de gérer les surveillants individuellement par auditoire.

## Solution

### 1. Migration des données existantes

**Fichier** : `supabase/migrations/populate_examen_auditoires_from_existing.sql`

Ce script :
- Parse le champ `auditoires` existant (ex: "51 B, 51 A - Lacroix, 10 B")
- Sépare par virgules
- Crée une entrée dans `examen_auditoires` pour chaque auditoire
- Nettoie les espaces

**Exécution** :
```sql
-- Dans l'éditeur SQL de Supabase
-- Copier/coller le contenu du fichier
```

**Résultat** :
```
Examen WMDS2223 avec auditoires "51 B, 51 A - Lacroix, 10 B, 51 G, 10 A"
→ Crée 5 lignes dans examen_auditoires :
  - 51 B
  - 51 A - Lacroix
  - 10 B
  - 51 G
  - 10 A
```

### 2. Nouveau composant d'affichage

**Fichier** : `components/admin/ExamListWithAuditoires.tsx`

**Fonctionnalités** :
- Affiche les examens avec bouton expand/collapse
- Montre le nombre d'auditoires par examen
- Affiche une sous-ligne pour chaque auditoire
- Liste les surveillants assignés par auditoire
- Bouton pour gérer les auditoires

**Interface** :
```
📋 Examen WMDS2223 - SECTEUR ONCOLOGIE          [3 auditoires] [👥]
  ↓ (cliquer pour expand)
    📍 51 B                    [Jean Dupont] [Marie Martin]
    📍 51 A - Lacroix          [Pierre Durand]
    📍 10 B                    [Aucun surveillant assigné]
```

### 3. Intégration dans ExamensPage

**Option A : Remplacer ExamList complètement**

Dans `pages/admin/ExamensPage.tsx` :

```tsx
import ExamListWithAuditoires from '../../components/admin/ExamListWithAuditoires';

// Dans le rendu, remplacer :
<ExamList ... />

// Par :
<ExamListWithAuditoires sessionId={activeSession.id} />
```

**Option B : Ajouter un onglet séparé**

```tsx
const tabs = [
  { id: 'list' as TabType, name: 'Liste', icon: '📋' },
  { id: 'auditoires' as TabType, name: 'Par auditoire', icon: '🏛️' },
  // ... autres onglets
];

// Dans le rendu :
{activeTab === 'auditoires' && (
  <ExamListWithAuditoires sessionId={activeSession.id} />
)}
```

## Avantages

✅ **Clarté** : Chaque auditoire est clairement identifié
✅ **Gestion** : Assignation des surveillants par auditoire
✅ **Visibilité** : Vue d'ensemble rapide des affectations
✅ **Flexibilité** : Expand/collapse pour gérer l'espace
✅ **Recherche** : Facile de trouver un surveillant spécifique

## Workflow complet

### 1. Import des examens

```csv
code_examen,nom_examen,date_examen,heure_debut,heure_fin,auditoires
WMDS2223,SECTEUR ONCOLOGIE,2025-12-10,16:30:00,18:30:00,"51 B, 51 A - Lacroix, 10 B"
```

### 2. Migration automatique

Le script parse et crée :
- Ligne 1 : WMDS2223 → 51 B
- Ligne 2 : WMDS2223 → 51 A - Lacroix
- Ligne 3 : WMDS2223 → 10 B

### 3. Assignation des surveillants

1. Cliquer sur l'icône 👥 à côté de l'examen
2. Pour chaque auditoire, cocher les surveillants
3. Sauvegarder automatiquement

### 4. Affichage public

Dans le planning (`/planning`), les surveillants s'affichent par auditoire :

```
SECTEUR ONCOLOGIE
16:30 - 18:30

Auditoires :
📍 51 B
  • Jean Dupont
  • Marie Martin

📍 51 A - Lacroix
  • Pierre Durand

📍 10 B
  • Session en cours d'attribution
```

## Cas d'usage

### Cas 1 : Examen dans un seul auditoire

```
Examen : WMDS2221
Auditoire : "71 - Simonart"
→ 1 ligne d'auditoire
→ Assignation simple
```

### Cas 2 : Examen multi-auditoires

```
Examen : WMDS2223
Auditoires : "51 B, 51 A - Lacroix, 10 B, 51 G, 10 A"
→ 5 lignes d'auditoires
→ Assignation indépendante pour chaque auditoire
```

### Cas 3 : Ajout manuel d'auditoire

1. Ouvrir la gestion des auditoires
2. Ajouter "Auditoire C"
3. Assigner des surveillants
4. Une nouvelle ligne apparaît

## Requêtes SQL utiles

### Voir tous les auditoires d'un examen

```sql
SELECT 
  e.code_examen,
  e.nom_examen,
  ea.auditoire,
  ea.surveillants_noms
FROM examens e
JOIN v_examen_auditoires_with_surveillants ea ON ea.examen_id = e.id
WHERE e.code_examen = 'WMDS2223'
ORDER BY ea.auditoire;
```

### Compter les lignes par examen

```sql
SELECT 
  e.code_examen,
  e.nom_examen,
  COUNT(ea.id) as nb_auditoires,
  SUM(array_length(ea.surveillants, 1)) as nb_surveillants_total
FROM examens e
LEFT JOIN examen_auditoires ea ON ea.examen_id = e.id
GROUP BY e.id, e.code_examen, e.nom_examen
ORDER BY nb_auditoires DESC;
```

### Trouver les auditoires sans surveillants

```sql
SELECT 
  e.code_examen,
  e.nom_examen,
  ea.auditoire
FROM examens e
JOIN examen_auditoires ea ON ea.examen_id = e.id
WHERE array_length(ea.surveillants, 1) IS NULL
   OR array_length(ea.surveillants, 1) = 0
ORDER BY e.date_examen, e.heure_debut;
```

## Personnalisation

### Modifier l'affichage

Dans `ExamListWithAuditoires.tsx`, vous pouvez :

1. **Changer les colonnes affichées** :
```tsx
<div className="grid grid-cols-7 gap-4">
  {/* Ajouter/retirer des colonnes */}
</div>
```

2. **Modifier le style des badges** :
```tsx
<span className="px-2 py-1 bg-green-100 text-green-700 rounded">
  {nom}
</span>
```

3. **Ajouter des actions** :
```tsx
<button onClick={() => handleAction(auditoire.id)}>
  Action
</button>
```

## Export

Pour exporter avec une ligne par auditoire :

```tsx
const exportData = examens.flatMap(examen =>
  examen.auditoires.map(auditoire => ({
    code_examen: examen.code_examen,
    nom_examen: examen.nom_examen,
    date: examen.date_examen,
    heure_debut: examen.heure_debut,
    heure_fin: examen.heure_fin,
    auditoire: auditoire.auditoire,
    surveillants: auditoire.surveillants_noms?.join(', ') || '',
  }))
);
```

## Dépannage

### Les auditoires ne s'affichent pas

1. Vérifiez que la migration a été exécutée
2. Vérifiez les données :
```sql
SELECT * FROM examen_auditoires LIMIT 10;
```

### Les surveillants ne s'affichent pas

1. Vérifiez la vue :
```sql
SELECT * FROM v_examen_auditoires_with_surveillants LIMIT 10;
```

### Problème de parsing

Si les auditoires ne sont pas bien séparés, vérifiez le séparateur :
- Virgule : `,`
- Point-virgule : `;`
- Pipe : `|`

Modifiez le script de migration si nécessaire.

## Support

Pour toute question :
- Consultez ce guide
- Vérifiez les migrations SQL
- Testez les requêtes dans Supabase
- Contactez : 02/436.16.89
