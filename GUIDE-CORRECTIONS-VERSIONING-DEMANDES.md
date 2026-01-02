# Guide des Corrections - Versioning et Demandes de Modification

## Problèmes Identifiés et Solutions

### 1. Champ Code Examen Manquant dans les Demandes de Modification

**Problème :** Les demandes de modification ne capturent pas le code de l'examen, rendant l'identification difficile.

**Solution :** Ajout du champ `code_examen` obligatoire dans le formulaire et la base de données.

### 2. Système de Versioning Non Fonctionnel

**Problème :** Les triggers de versioning ne capturent pas correctement l'utilisateur, résultant en un historique vide.

**Solution :** Amélioration du système de capture d'utilisateur avec fallback automatique.

## Étapes d'Application

### Étape 1: Appliquer les Corrections Base de Données

```bash
# Exécuter le script de correction
psql -h your-supabase-host -U postgres -d your-database -f scripts/apply-versioning-fixes.sql
```

Ou via l'interface Supabase :
1. Aller dans SQL Editor
2. Copier le contenu de `scripts/apply-versioning-fixes.sql`
3. Exécuter le script

### Étape 2: Vérifier les Corrections

Le script inclut des tests automatiques qui afficheront :
- ✅ **SUCCESS** : La correction fonctionne
- ⚠️ **WARNING** : Attention requise
- ❌ **FAILED** : Problème à résoudre

### Étape 3: Redémarrer l'Application

```bash
# Redémarrer le serveur de développement
npm run dev
```

## Fonctionnalités Ajoutées

### 1. Champ Code Examen

- **Nouveau champ obligatoire** dans le formulaire de demande
- **Validation** : Le code doit être renseigné
- **Index de recherche** pour améliorer les performances
- **Aide contextuelle** pour guider l'utilisateur

### 2. Système de Versioning Amélioré

- **Capture automatique** de l'utilisateur connecté
- **Fallback intelligent** si l'utilisateur n'est pas détecté
- **Traçabilité complète** de toutes les modifications
- **Fonctions de diagnostic** pour vérifier le bon fonctionnement

## Utilisation

### Demandes de Modification

Désormais, lors d'une demande de modification ou permutation :

1. **Code de l'examen** : Obligatoire (ex: WFARM1300)
2. **Nom de l'examen** : Descriptif (ex: Chimie générale)
3. **Date et heure** : Comme avant
4. **Type de demande** : Modification, permutation ou message

### Versioning

Le système enregistre automatiquement :
- **Qui** a fait la modification (nom complet de l'utilisateur)
- **Quand** la modification a été faite
- **Quoi** a été modifié (champs changés)
- **Pourquoi** (raison de la modification)

## Vérification du Bon Fonctionnement

### Test des Demandes de Modification

1. Aller sur la page publique
2. Cliquer sur "Demander une modification"
3. Vérifier que le champ "Code de l'examen" est présent et obligatoire
4. Soumettre une demande test
5. Vérifier dans l'admin que le code est bien enregistré

### Test du Versioning

1. Se connecter en tant qu'admin
2. Modifier un examen, une session ou un surveillant
3. Aller dans "Versioning" dans le menu admin
4. Vérifier que la modification apparaît avec votre nom

## Diagnostic en Cas de Problème

### Commandes de Diagnostic

```sql
-- Vérifier l'état du système
SELECT * FROM diagnose_versioning();

-- Tester le versioning
SELECT * FROM test_versioning_system();

-- Voir les versions récentes
SELECT 
    table_name,
    operation_type,
    username,
    created_at
FROM data_versions 
WHERE created_at >= NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;
```

### Problèmes Courants

1. **Pas de versions enregistrées**
   - Vérifier que les triggers sont installés
   - Vérifier que l'utilisateur est bien connecté
   - Exécuter `SELECT * FROM diagnose_versioning();`

2. **Utilisateur "Système" au lieu du nom réel**
   - Vérifier que le contexte d'authentification fonctionne
   - Redémarrer l'application
   - Vérifier les logs de la console

3. **Erreur lors de la soumission de demande**
   - Vérifier que la migration du champ `code_examen` a été appliquée
   - Vérifier les permissions de la table

## Support

En cas de problème persistant :

1. Exécuter les diagnostics SQL
2. Vérifier les logs de l'application
3. Vérifier les logs Supabase
4. Contacter le support technique avec les résultats des diagnostics

## Maintenance

### Nettoyage Périodique

Le système de versioning inclut une rétention automatique :
- **Sessions** : 2 ans (730 jours)
- **Examens** : 2 ans (730 jours)
- **Autres tables** : 1 an (365 jours)

### Surveillance

Surveiller régulièrement :
- La taille de la table `data_versions`
- Les performances des requêtes
- L'espace disque utilisé

Le système est maintenant opérationnel et fournira une traçabilité complète de toutes vos modifications !