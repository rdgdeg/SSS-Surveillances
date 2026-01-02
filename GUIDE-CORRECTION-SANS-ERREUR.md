# Guide de Correction Sans Erreur

## Étape 1: Diagnostic Initial

Exécutez d'abord ce script pour comprendre votre structure :

```sql
-- Vérifier la structure des tables
SELECT 
    'Structure sessions' as table_info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'sessions'
ORDER BY ordinal_position;

SELECT 
    'Structure examens' as table_info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'examens'
ORDER BY ordinal_position;
```

## Étape 2: Correction Minimale (SÛRE)

Exécutez le script `scripts/minimal-fix.sql` qui ne fait que :
1. Ajouter le champ `code_examen`
2. Diagnostiquer le versioning sans le tester

## Étape 3: Vérification du Champ Code Examen

```sql
-- Vérifier que le champ est ajouté
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'demandes_modification' 
AND column_name = 'code_examen';
```

Résultat attendu :
```
column_name | data_type
code_examen | text
```

## Étape 4: Test de l'Interface

1. Redémarrer l'application : `npm run dev`
2. Aller sur la page publique
3. Cliquer "Demander une modification"
4. Vérifier que le champ "Code de l'examen" apparaît

## Étape 5: Correction du Versioning (Si Nécessaire)

Si le diagnostic montre que le versioning n'est pas installé :

```sql
-- Vérifier l'état du versioning
SELECT COUNT(*) as tables_versioning
FROM information_schema.tables 
WHERE table_name IN ('data_versions', 'version_snapshots', 'versioning_metadata');
```

Si le résultat est 0, exécutez : `VERSIONING-FINAL-INSTALL.sql`

## Étape 6: Test du Versioning

Une fois le versioning installé, testez avec une table qui existe vraiment :

```sql
-- Trouver une table avec une colonne id
SELECT table_name 
FROM information_schema.columns 
WHERE column_name = 'id' 
AND table_name IN ('examens', 'surveillants', 'demandes_modification')
LIMIT 1;
```

Puis testez avec cette table (remplacez `examens` par la table trouvée) :

```sql
-- Test simple
INSERT INTO examens (code, nom) VALUES ('TEST', 'Test') RETURNING id;
-- Vérifier dans data_versions si une entrée est créée
-- Supprimer le test
```

## Résolution des Erreurs Courantes

### Erreur "column does not exist"
- Vérifiez la structure de vos tables avec l'étape 1
- Adaptez les scripts à votre structure réelle

### Erreur "table does not exist"
- Le versioning n'est pas installé
- Exécutez `VERSIONING-FINAL-INSTALL.sql`

### Erreur "function does not exist"
- Les fonctions de versioning ne sont pas créées
- Réinstallez le système complet

## Vérification Finale

Après toutes les corrections :

1. ✅ **Champ code_examen** : Présent dans le formulaire
2. ✅ **Versioning** : Enregistre les modifications avec votre nom
3. ✅ **Traçabilité** : Visible dans la page admin "Versioning"

## En Cas de Problème Persistant

Utilisez le script de diagnostic complet :

```sql
-- Diagnostic complet
SELECT 'Tables principales' as type, table_name 
FROM information_schema.tables 
WHERE table_name IN ('sessions', 'examens', 'surveillants', 'demandes_modification');

SELECT 'Tables versioning' as type, table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%version%';

SELECT 'Triggers' as type, trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE 'trigger_version_%';
```

Envoyez les résultats pour un diagnostic personnalisé.