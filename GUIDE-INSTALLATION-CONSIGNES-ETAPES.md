# Guide d'Installation du Système d'Héritage des Consignes - Étapes

## Problème Actuel

```
ERROR: 42703: column "utiliser_consignes_specifiques" does not exist
```

Cela indique que le système d'héritage des consignes n'est pas encore installé dans la base de données.

## Installation Étape par Étape

### Étape 1 : Diagnostic Initial

Vérifiez l'état actuel du système :

```sql
\i scripts/diagnostic-consignes-heritage.sql
```

**Résultat attendu** : Le script vous dira ce qui manque.

### Étape 2 : Ajouter les Colonnes Manquantes

Si les colonnes n'existent pas, ajoutez-les d'abord :

```sql
\i scripts/add-consignes-columns.sql
```

**Ou via migration Supabase** :
```sql
\i supabase/migrations/add_consignes_heritage_columns.sql
```

### Étape 3 : Installation Complète du Système

Une fois les colonnes ajoutées, installez le système complet :

```sql
\i scripts/install-consignes-heritage-complet.sql
```

### Étape 4 : Vérification Finale

Vérifiez que tout fonctionne :

```sql
\i scripts/diagnostic-consignes-heritage.sql
```

**Résultat attendu** : Toutes les vérifications doivent être ✓ OK.

### Étape 5 : Test des Consignes

Testez le système avec les vraies consignes :

```sql
\i scripts/fix-consignes-generales.sql
```

## Ordre d'Exécution Complet

```bash
# 1. Diagnostic
psql -f scripts/diagnostic-consignes-heritage.sql

# 2. Ajouter les colonnes (si nécessaire)
psql -f scripts/add-consignes-columns.sql

# 3. Installation complète
psql -f scripts/install-consignes-heritage-complet.sql

# 4. Vérification
psql -f scripts/diagnostic-consignes-heritage.sql

# 5. Test des consignes
psql -f scripts/fix-consignes-generales.sql
```

## Vérifications à Chaque Étape

### Après Étape 2 (Colonnes)
```sql
-- Vérifier que les colonnes existent
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'examens' AND column_name LIKE '%consignes%';
```

### Après Étape 3 (Installation)
```sql
-- Vérifier que les fonctions existent
SELECT proname FROM pg_proc WHERE proname LIKE '%consignes%';

-- Vérifier que les vues existent
SELECT table_name FROM information_schema.views WHERE table_name LIKE '%consignes%';
```

### Après Étape 5 (Test)
```sql
-- Tester la fonction principale
SELECT * FROM get_consignes_examen((SELECT id FROM examens LIMIT 1));
```

## Résolution des Problèmes Courants

### Problème : "column does not exist"
**Solution** : Exécutez l'étape 2 (ajout des colonnes)

### Problème : "function does not exist"
**Solution** : Exécutez l'étape 3 (installation complète)

### Problème : "view does not exist"
**Solution** : Exécutez l'étape 3 (installation complète)

### Problème : Consignes vides
**Solution** : Définissez les consignes via l'interface admin ou SQL :
```sql
UPDATE consignes_secretariat 
SET consignes_generales = 'Vos vraies consignes ici'
WHERE code_secretariat = 'FASB';
```

## Scripts Disponibles

| Script | Description | Quand l'utiliser |
|--------|-------------|------------------|
| `diagnostic-consignes-heritage.sql` | Diagnostic complet | Avant et après installation |
| `add-consignes-columns.sql` | Ajoute uniquement les colonnes | Si colonnes manquantes |
| `install-consignes-heritage-complet.sql` | Installation complète | Après ajout des colonnes |
| `fix-consignes-generales.sql` | Test et diagnostic des consignes | Pour tester le système |

## Résultat Final Attendu

Après installation complète :

✅ **Colonnes ajoutées** : 4 nouvelles colonnes dans `examens`  
✅ **Fonctions créées** : 3 fonctions pour la gestion des consignes  
✅ **Vues créées** : 3 vues pour l'affichage et les statistiques  
✅ **Héritage fonctionnel** : Les examens héritent des consignes du secrétariat  
✅ **Personnalisation possible** : Consignes spécifiques par examen  
✅ **Interface utilisateur** : Composants React fonctionnels  

## Support

Si vous rencontrez des problèmes :

1. **Vérifiez les logs** : Les scripts affichent des messages détaillés
2. **Exécutez le diagnostic** : `scripts/diagnostic-consignes-heritage.sql`
3. **Consultez les guides** : `CONSIGNES-HERITAGE-GUIDE.md` pour plus de détails