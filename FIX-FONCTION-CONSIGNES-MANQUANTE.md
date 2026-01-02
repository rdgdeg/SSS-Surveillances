# Fix - Fonction get_consignes_examen Manquante

## Problème

```
ERROR: 42883: function get_consignes_examen(uuid) does not exist
HINT: No function matches the given name and argument types.
```

## Cause

Le système d'héritage des consignes n'a pas été complètement installé dans la base de données. Les fonctions et vues nécessaires sont manquantes.

## Solution

### 1. Diagnostic Rapide

Exécutez d'abord le diagnostic pour voir ce qui manque :

```sql
\i scripts/diagnostic-consignes-heritage.sql
```

### 2. Installation Complète

Si le système n'est pas installé, exécutez le script d'installation :

```sql
\i scripts/install-consignes-heritage-complet.sql
```

### 3. Vérification

Après installation, vérifiez que tout fonctionne :

```sql
-- Tester la fonction
SELECT * FROM get_consignes_examen((SELECT id FROM examens LIMIT 1));

-- Vérifier la vue
SELECT COUNT(*) FROM examens_with_consignes;
```

## Éléments Installés

### Colonnes Ajoutées à `examens`
- `consignes_specifiques_arrivee` (TEXT)
- `consignes_specifiques_mise_en_place` (TEXT) 
- `consignes_specifiques_generales` (TEXT)
- `utiliser_consignes_specifiques` (BOOLEAN)

### Fonctions Créées
- `get_consignes_examen(UUID)` - Récupère les consignes effectives
- `initialiser_consignes_specifiques(UUID)` - Initialise les consignes spécifiques
- `utiliser_consignes_secretariat(UUID)` - Revient aux consignes du secrétariat

### Vues Créées
- `examens_with_consignes` - Vue principale avec consignes effectives
- `planning_examens_public` - Vue pour l'affichage public
- `stats_consignes_examens` - Statistiques d'utilisation

## Test Après Installation

```sql
-- 1. Vérifier qu'un examen hérite des consignes
SELECT 
    code_examen,
    secretariat,
    consignes_generales_effectives,
    source_consignes
FROM examens_with_consignes 
LIMIT 5;

-- 2. Tester la fonction directement
DO $test$
DECLARE
    v_examen_id UUID;
    v_consignes RECORD;
BEGIN
    SELECT id INTO v_examen_id FROM examens LIMIT 1;
    SELECT * INTO v_consignes FROM get_consignes_examen(v_examen_id);
    
    RAISE NOTICE 'Consignes générales: %', v_consignes.consignes_generales;
    RAISE NOTICE 'Source: %', v_consignes.source_consignes;
END $test$;
```

## Scripts Disponibles

1. **`scripts/diagnostic-consignes-heritage.sql`** - Diagnostic complet
2. **`scripts/install-consignes-heritage-complet.sql`** - Installation complète
3. **`scripts/setup-consignes-heritage.sql`** - Script original (peut être incomplet)
4. **`scripts/fix-consignes-generales.sql`** - Diagnostic et correction (corrigé)

## Ordre d'Exécution Recommandé

```bash
# 1. Diagnostic
psql -f scripts/diagnostic-consignes-heritage.sql

# 2. Installation si nécessaire
psql -f scripts/install-consignes-heritage-complet.sql

# 3. Vérification des consignes
psql -f scripts/fix-consignes-generales.sql

# 4. Test final
psql -f scripts/test-consignes-heritage.sql
```

## Résolution Définitive

Une fois le script d'installation exécuté :

✅ **Fonction disponible** : `get_consignes_examen()`  
✅ **Héritage fonctionnel** : Les examens héritent des consignes du secrétariat  
✅ **Personnalisation possible** : Consignes spécifiques par examen  
✅ **Interface utilisateur** : Composants React fonctionnels  

## Prévention

Pour éviter ce problème à l'avenir :
- Toujours exécuter les scripts de migration dans l'ordre
- Vérifier l'installation avec les scripts de diagnostic
- Documenter les dépendances entre les scripts