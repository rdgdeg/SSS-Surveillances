# Guide de Vérification du Système de Versioning

## Objectif
Vérifier que tous les événements (INSERT, UPDATE, DELETE) s'enregistrent et s'affichent correctement dans le système de versioning.

## Étape 1: Diagnostic Complet

Exécutez le script de diagnostic dans Supabase SQL Editor :

```sql
-- Copier/coller le contenu de scripts/diagnostic-versioning-complet.sql
```

### Résultats Attendus

**Tables système :**
- ✅ `data_versions` : PRÉSENT
- ✅ `version_snapshots` : PRÉSENT  
- ✅ `versioning_metadata` : PRÉSENT

**Triggers installés :**
- ✅ Au moins 5 triggers `trigger_version_%`
- ✅ Sur les tables : examens, surveillants, demandes_modification, etc.

**Fonctions système :**
- ✅ `trigger_record_version` : PRÉSENT
- ✅ `record_version` : PRÉSENT
- ✅ `get_version_history` : PRÉSENT

## Étape 2: Test des Événements

Exécutez le script de test :

```sql
-- Copier/coller le contenu de scripts/test-versioning-events.sql
```

### Résultats Attendus

Pour chaque table testée (examens, demandes_modification, surveillants) :
- ✅ **INSERT** : 1 version créée
- ✅ **UPDATE** : 1 version créée  
- ✅ **DELETE** : 1 version créée
- ✅ **Total** : 3 versions par enregistrement

## Étape 3: Vérification Interface

1. **Aller dans l'admin** → Menu "Versioning"
2. **Vérifier les sections :**
   - Résumé par table avec statistiques
   - Changements récents avec détails
   - Possibilité de voir l'historique détaillé

3. **Faire un test manuel :**
   - Modifier un examen
   - Vérifier qu'il apparaît dans "Changements récents"
   - Cliquer "Voir l'historique" pour voir les détails

## Problèmes Courants et Solutions

### 1. Aucune Version Enregistrée

**Symptômes :**
- Résumé des tables vide
- Aucun changement récent
- Test d'événements échoue

**Causes possibles :**
- Triggers non installés
- Fonctions manquantes
- Configuration désactivée

**Solutions :**
```sql
-- Réinstaller le système complet
-- Exécuter VERSIONING-FINAL-INSTALL.sql

-- Ou réinstaller juste les triggers
-- Exécuter scripts/fix-versioning-triggers-only.sql
```

### 2. Utilisateur "Système" au lieu du Nom Réel

**Symptômes :**
- Toutes les modifications attribuées à "Système"
- Pas de nom d'utilisateur réel

**Causes possibles :**
- Contexte d'authentification non configuré
- Variables de session non définies

**Solutions :**
1. Vérifier que l'application a été redémarrée après les corrections
2. Vérifier la console pour les erreurs d'authentification
3. Tester en navigation privée

### 3. Certaines Tables Non Versionnées

**Symptômes :**
- Certaines tables n'apparaissent pas dans le résumé
- Pas de versions pour certaines opérations

**Causes possibles :**
- Triggers manquants sur certaines tables
- Configuration désactivée pour certaines tables

**Solutions :**
```sql
-- Vérifier la configuration
SELECT table_name, is_enabled 
FROM versioning_metadata 
WHERE is_enabled = false;

-- Réactiver si nécessaire
UPDATE versioning_metadata 
SET is_enabled = true 
WHERE table_name = 'nom_table';
```

### 4. Interface Versioning Vide

**Symptômes :**
- Page versioning charge mais affiche "Aucun changement"
- Erreurs dans la console

**Causes possibles :**
- Vues système manquantes
- Permissions insuffisantes
- Erreurs dans les requêtes

**Solutions :**
```sql
-- Vérifier les vues
SELECT table_name FROM information_schema.views 
WHERE table_name IN ('version_summary', 'recent_changes');

-- Recréer si manquantes (dans VERSIONING-FINAL-INSTALL.sql)
```

## Étape 4: Test de Performance

Si le système fonctionne mais semble lent :

```sql
-- Vérifier la taille des tables
SELECT 
    table_name,
    pg_size_pretty(pg_total_relation_size(table_name::regclass)) as size
FROM information_schema.tables 
WHERE table_name IN ('data_versions', 'version_snapshots')
AND table_schema = 'public';

-- Nettoyer si nécessaire
SELECT COUNT(*) FROM data_versions WHERE created_at < NOW() - INTERVAL '90 days';
```

## Étape 5: Validation Finale

### Checklist de Fonctionnement

- [ ] **Tables système** : Toutes présentes
- [ ] **Triggers** : Au moins 5 installés
- [ ] **Fonctions** : Toutes présentes
- [ ] **Test événements** : INSERT/UPDATE/DELETE fonctionnent
- [ ] **Interface admin** : Affiche les données
- [ ] **Utilisateurs** : Noms réels capturés
- [ ] **Performance** : Réponse rapide

### Test Final Complet

1. **Se connecter en admin**
2. **Modifier un examen** (changer le nom)
3. **Aller dans Versioning**
4. **Vérifier que la modification apparaît** avec votre nom
5. **Cliquer "Voir l'historique"** pour voir les détails
6. **Vérifier les champs modifiés** sont listés

## En Cas de Problème Persistant

1. **Exécuter le diagnostic complet** et noter les erreurs
2. **Vérifier les logs Supabase** pour les erreurs SQL
3. **Vérifier la console navigateur** pour les erreurs JavaScript
4. **Envoyer les résultats** du diagnostic pour assistance

## Maintenance Recommandée

- **Nettoyage mensuel** : Supprimer les versions > 90 jours
- **Surveillance taille** : Vérifier l'espace disque utilisé
- **Test périodique** : Exécuter le test d'événements mensuellement

Le système de versioning devrait maintenant capturer et afficher tous vos changements avec une traçabilité complète !