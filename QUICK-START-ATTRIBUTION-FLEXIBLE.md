# Démarrage Rapide : Attribution Flexible des Surveillants

## 🚀 Déploiement

### 1. Appliquer la migration

Dans Supabase SQL Editor :
```sql
\i supabase/migrations/add_mode_attribution_auditoires.sql
```

### 2. Vérifier l'installation

```sql
\i scripts/test-attribution-flexible.sql
```

### 3. Redémarrer l'application

Les modifications TypeScript sont automatiquement prises en compte.

## 🎯 Utilisation Immédiate

### Cas 1 : Sélectionner des surveillants sans auditoire

1. **Examens** → Cliquer sur **Auditoires** pour un examen
2. Sélectionner **"Attribution par le secrétariat"**
3. Cliquer **"Activer ce mode pour cet examen"**
4. Rechercher et cocher les surveillants nécessaires
5. ✅ Les surveillants voient : *"Auditoires attribués par le secrétariat"*

### Cas 2 : Attribution classique (inchangée)

1. **Examens** → Cliquer sur **Auditoires** pour un examen  
2. Sélectionner **"Attribution directe"**
3. Saisir le nom de l'auditoire
4. Assigner les surveillants
5. ✅ Les surveillants voient leur auditoire spécifique

### Cas 3 : Mode mixte

Vous pouvez combiner les deux pour le même examen :
- Quelques auditoires avec attribution directe
- D'autres surveillants en attente d'attribution

## 🎨 Interface

### Codes couleur
- **Bleu** : Auditoires spécifiques
- **Jaune/Ambre** : Attribution par le secrétariat
- **Vert** : Surveillants assignés

### Messages automatiques
- Mode secrétariat : *"La répartition des auditoires sera communiquée séparément"*
- Auditoires vides : *"Aucun surveillant assigné"*

## ✅ Vérification

### Côté admin
- Les deux modes apparaissent dans le modal
- Possibilité de basculer entre les modes
- Historique des remplacements conservé

### Côté public
- Affichage adapté selon le mode
- Message explicite pour le mode secrétariat
- Auditoires spécifiques affichés normalement

## 🔧 Dépannage

### La colonne mode_attribution n'existe pas
```sql
-- Vérifier la structure
\d examen_auditoires
```

### Erreur de contrainte
```sql
-- Vérifier les valeurs autorisées
SELECT constraint_name, check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%mode_attribution%';
```

### Interface ne se met pas à jour
1. Vider le cache du navigateur
2. Redémarrer le serveur de développement
3. Vérifier la console pour les erreurs TypeScript

## 📋 Checklist de déploiement

- [ ] Migration SQL appliquée
- [ ] Tests SQL passés
- [ ] Interface admin testée (les deux modes)
- [ ] Interface publique testée
- [ ] Remplacements testés
- [ ] Documentation mise à jour

## 🎯 Prochaines étapes

Cette fonctionnalité est maintenant prête. Vous pouvez :
1. Tester avec quelques examens
2. Former les utilisateurs sur les deux modes
3. Adapter selon les retours d'usage