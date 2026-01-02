# Guide - Gestion Correcte des Consignes Générales

## Problème Identifié

Les consignes générales des examens utilisaient des valeurs fixes au lieu des vraies consignes définies dans la table `consignes_secretariat`.

## Solution Implémentée

### 1. Scripts Corrigés

- ✅ **`scripts/setup-secretariats-complets.sql`** : Ne définit plus de consignes générales fixes
- ✅ **`scripts/setup-secretariats-sans-ecraser-consignes.sql`** : Nouveau script qui préserve les consignes existantes
- ✅ **`scripts/fix-consignes-generales.sql`** : Script de diagnostic et correction

### 2. Fonctionnement Correct

#### Héritage Automatique
```sql
-- Les examens héritent des consignes de leur secrétariat
SELECT * FROM get_consignes_examen('uuid-examen');
```

#### Consignes Effectives
- **Si consignes spécifiques définies** → Utilise les consignes spécifiques
- **Sinon** → Utilise les consignes du secrétariat
- **Si secrétariat sans consignes** → Utilise les valeurs par défaut

### 3. Gestion via Interface

#### Page Admin - Consignes Secrétariat
- Accès : `/admin/consignes-secretariat`
- Permet de définir les vraies consignes générales pour chaque secrétariat
- Les modifications sont automatiquement héritées par les examens

#### Modal Examen - Consignes Spécifiques
- Champ "Consignes générales" dans le modal d'édition d'examen
- Si vide → Hérite du secrétariat
- Si rempli → Utilise les consignes spécifiques

## Vérifications à Effectuer

### 1. Vérifier les Consignes Actuelles
```sql
-- Voir les consignes générales par secrétariat
SELECT 
    code_secretariat,
    nom_secretariat,
    consignes_generales
FROM consignes_secretariat 
ORDER BY code_secretariat;
```

### 2. Tester l'Héritage
```sql
-- Tester pour un examen spécifique
SELECT * FROM get_consignes_examen('uuid-examen');
```

### 3. Voir les Consignes Effectives dans le Planning
```sql
-- Vue planning avec consignes effectives
SELECT 
    code_examen,
    secretariat,
    consignes_generales,
    consignes_generales_personnalisees
FROM planning_examens_public 
LIMIT 10;
```

## Actions Recommandées

### 1. Définir les Vraies Consignes
Via l'interface admin ou SQL :
```sql
UPDATE consignes_secretariat 
SET consignes_generales = 'Vraies consignes pour ce secrétariat'
WHERE code_secretariat = 'FASB';
```

### 2. Nettoyer les Consignes Fixes
Exécuter le script de correction :
```bash
# Exécuter le script de diagnostic
psql -f scripts/fix-consignes-generales.sql

# Ou utiliser le script sans écrasement
psql -f scripts/setup-secretariats-sans-ecraser-consignes.sql
```

### 3. Vérifier le Résultat
- Vérifier dans l'interface admin que les consignes sont correctes
- Tester quelques examens pour s'assurer de l'héritage
- Vérifier l'affichage public du planning

## Exemples de Consignes Générales Appropriées

### FASB (Pharmacie et Sciences Biomédicales)
```
Respectez les protocoles de sécurité des laboratoires. 
Attention aux équipements sensibles et aux produits chimiques.
```

### DENT (Médecine Dentaire)
```
Respectez les protocoles d'hygiène stricts. 
Attention aux équipements dentaires spécialisés.
```

### MED (Médecine)
```
Respectez les consignes médicales et d'hygiène. 
Attention au matériel médical et aux protocoles sanitaires.
```

### FSP (Santé Publique)
```
Suivez les consignes spécifiques aux examens de santé publique. 
Respectez les protocoles d'évaluation en santé communautaire.
```

### BAC11
```
Respectez les consignes générales de surveillance. 
Suivez les instructions du responsable de surveillance.
```

## Avantages de la Solution

1. **Flexibilité** : Chaque secrétariat peut avoir ses propres consignes
2. **Cohérence** : Héritage automatique pour tous les examens
3. **Personnalisation** : Possibilité de consignes spécifiques par examen
4. **Maintenance** : Mise à jour centralisée par secrétariat

## Maintenance Continue

- **Révision périodique** des consignes par secrétariat
- **Formation** des utilisateurs sur l'héritage des consignes
- **Monitoring** des examens avec consignes personnalisées
- **Sauvegarde** des consignes importantes

## Résolution du Problème

✅ **Avant** : Consignes fixes et génériques  
✅ **Après** : Consignes dynamiques héritées du secrétariat  
✅ **Résultat** : Consignes appropriées et personnalisables par examen