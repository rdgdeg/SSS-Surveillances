# Guide des acronymes des facultés UCLouvain

## Liste des acronymes standards

Ce document liste les acronymes officiels des facultés de l'UCLouvain utilisés dans l'application.

### Facultés

| Acronyme | Nom complet |
|----------|-------------|
| **FASB** | Faculté de Pharmacie et Sciences Biomédicales |
| **MED** | Faculté de Médecine et Médecine Dentaire |
| **EPL** | École Polytechnique de Louvain |
| **SC** | Faculté des Sciences |
| **FIAL** | Faculté de Philosophie, Arts et Lettres |
| **ESPO** | Faculté des Sciences Économiques, Sociales, Politiques et de Communication |
| **DRT** | Faculté de Droit et de Criminologie |
| **THEO** | Faculté de Théologie |
| **FSM** | Faculté des Sciences de la Motricité |
| **LOCI** | Faculté d'Architecture, d'Ingénierie Architecturale, d'Urbanisme |
| **LSM** | Louvain School of Management |
| **AGRO** | Faculté des Bioingénieurs |

## Utilisation dans l'application

### Dans la table `surveillants`

Le champ `affectation_faculte` doit contenir l'acronyme (ex: "FASB", "MED", "EPL").

**Exemple :**
```sql
INSERT INTO surveillants (nom, prenom, email, type, affectation_faculte)
VALUES ('Dupont', 'Jean', 'jean.dupont@uclouvain.be', 'assistant', 'FASB');
```

### Dans la table `examens`

Le champ `secretariat` doit également utiliser les acronymes.

**Exemple :**
```sql
UPDATE examens
SET secretariat = 'FASB'
WHERE secretariat LIKE '%Pharmacie%';
```

## Correction des données existantes

Si des noms complets ont été utilisés au lieu des acronymes, exécutez le script :

```bash
# Via l'interface Supabase
# Copier-coller le contenu de scripts/fix-faculte-acronyms.sql
```

Ou via SQL :

```sql
-- Exemple pour FASB
UPDATE surveillants
SET affectation_faculte = 'FASB'
WHERE affectation_faculte ILIKE '%pharmacie%'
   OR affectation_faculte ILIKE '%biomédicales%';
```

## Avantages des acronymes

✅ **Cohérence** : Format uniforme dans toute l'application
✅ **Lisibilité** : Plus court et plus facile à lire dans les tableaux
✅ **Performance** : Moins de données à transférer et stocker
✅ **Filtrage** : Plus facile à filtrer et rechercher
✅ **Export** : Fichiers CSV plus compacts

## Saisie dans l'interface

### Formulaire d'ajout/modification de surveillant

Le champ "Affect. fac." accepte les acronymes :
- Taper directement l'acronyme (ex: "FASB")
- Le placeholder suggère : "Ex: EPL, FIAL..."

### Import CSV

Lors de l'import de surveillants, utiliser les acronymes dans la colonne `affectation_faculte` :

```csv
nom,prenom,email,type,affectation_faculte
Dupont,Jean,jean.dupont@uclouvain.be,assistant,FASB
Martin,Marie,marie.martin@uclouvain.be,assistant,MED
```

## Vérification

Pour vérifier que toutes les facultés utilisent des acronymes :

```sql
-- Lister toutes les valeurs distinctes
SELECT DISTINCT affectation_faculte, COUNT(*) as count
FROM surveillants
WHERE affectation_faculte IS NOT NULL
GROUP BY affectation_faculte
ORDER BY affectation_faculte;
```

Résultat attendu : uniquement des acronymes courts (2-5 caractères).

## Notes historiques

### Changement FASB

Anciennement, FASB signifiait "Faculté des Sciences Agronomiques et de Bioingénierie".
Depuis la restructuration, FASB désigne "Faculté de Pharmacie et Sciences Biomédicales".
La Faculté des Bioingénieurs utilise maintenant l'acronyme **AGRO**.

## Support

En cas de doute sur un acronyme :
1. Consulter le site officiel UCLouvain
2. Vérifier avec le secrétariat concerné
3. Utiliser le script de correction pour uniformiser
