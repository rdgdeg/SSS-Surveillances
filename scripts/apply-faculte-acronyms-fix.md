# Application de la correction des acronymes de facultés

## Problème

Dans la liste des surveillants, les noms complets de facultés apparaissent (ex: "Faculté de Pharmacie") au lieu des acronymes (ex: "FASB").

## Solution

Exécuter le script SQL qui remplace tous les noms complets par leurs acronymes correspondants.

## Étapes

### 1. Via l'interface Supabase (Recommandé)

1. Se connecter à [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionner votre projet
3. Aller dans **SQL Editor**
4. Créer une nouvelle requête
5. Copier-coller le contenu du fichier `scripts/fix-faculte-acronyms.sql`
6. Cliquer sur **Run** (ou Ctrl+Enter)
7. Vérifier les résultats affichés

### 2. Vérification avant correction

Avant d'exécuter le script complet, vérifiez les valeurs actuelles :

```sql
SELECT DISTINCT affectation_faculte, COUNT(*) as count
FROM surveillants
WHERE affectation_faculte IS NOT NULL
GROUP BY affectation_faculte
ORDER BY affectation_faculte;
```

Vous devriez voir des noms complets comme :
- "Faculté de Pharmacie et Sciences Biomédicales"
- "Faculté de Médecine et Médecine Dentaire"
- etc.

### 3. Exécution de la correction

Le script effectue les remplacements suivants :

| Avant | Après |
|-------|-------|
| Faculté de Pharmacie... | FASB |
| Faculté de Médecine... | MED |
| École Polytechnique... | EPL |
| Faculté des Sciences | SC |
| Faculté de Philosophie... | FIAL |
| Faculté des Sciences Économiques... | ESPO |
| Faculté de Droit... | DRT |
| Faculté de Théologie | THEO |
| Faculté des Sciences de la Motricité | FSM |
| Faculté d'Architecture... | LOCI |
| Louvain School of Management | LSM |
| Faculté des Bioingénieurs | AGRO |

### 4. Vérification après correction

Après l'exécution, vérifiez que les acronymes sont corrects :

```sql
SELECT DISTINCT affectation_faculte, COUNT(*) as count
FROM surveillants
WHERE affectation_faculte IS NOT NULL
GROUP BY affectation_faculte
ORDER BY affectation_faculte;
```

Vous devriez maintenant voir uniquement des acronymes :
- AGRO
- DRT
- EPL
- ESPO
- FASB
- FIAL
- FSM
- LOCI
- LSM
- MED
- SC
- THEO

### 5. Test dans l'interface

1. Aller dans **Gestion des surveillants**
2. Vérifier que la colonne "Affect. fac." affiche les acronymes
3. Tester le filtre par faculté
4. Vérifier l'export CSV

## Cas particuliers

### Si certaines valeurs ne sont pas reconnues

Si après l'exécution, certaines valeurs ne sont pas converties, vous pouvez les corriger manuellement :

```sql
-- Exemple pour une valeur non reconnue
UPDATE surveillants
SET affectation_faculte = 'FASB'
WHERE affectation_faculte = 'Valeur non reconnue';
```

### Pour corriger une seule faculté

Si vous voulez corriger uniquement FASB par exemple :

```sql
UPDATE surveillants
SET affectation_faculte = 'FASB'
WHERE affectation_faculte ILIKE '%pharmacie%'
   OR affectation_faculte ILIKE '%biomédicales%';
```

## Rollback (si nécessaire)

Si vous devez annuler les modifications (peu probable), vous pouvez restaurer les noms complets :

```sql
UPDATE surveillants
SET affectation_faculte = CASE
    WHEN affectation_faculte = 'FASB' THEN 'Faculté de Pharmacie et Sciences Biomédicales'
    WHEN affectation_faculte = 'MED' THEN 'Faculté de Médecine et Médecine Dentaire'
    WHEN affectation_faculte = 'EPL' THEN 'École Polytechnique de Louvain'
    -- etc.
    ELSE affectation_faculte
END;
```

## Impact

✅ **Aucune perte de données** : seul le format change
✅ **Amélioration de la lisibilité** : tableaux plus compacts
✅ **Cohérence** : format uniforme dans toute l'application
✅ **Performance** : moins de données à transférer

## Notes

- Le script est **idempotent** : peut être exécuté plusieurs fois sans problème
- Les valeurs NULL ne sont pas affectées
- Les acronymes déjà corrects ne sont pas modifiés
- La recherche est insensible à la casse (ILIKE)

## Support

Pour plus d'informations sur les acronymes, consultez `FACULTES-ACRONYMES-GUIDE.md`.
