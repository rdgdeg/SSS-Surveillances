# Plan de Déploiement - Système de Fiabilité des Soumissions

Ce document décrit la procédure complète de déploiement du système de fiabilité.

## Vue d'ensemble

**Objectif** : Déployer le système de fiabilité des soumissions sans interruption de service

**Durée estimée** : 2-3 heures

**Fenêtre de déploiement recommandée** : Samedi 2h-5h du matin

## Checklist pré-déploiement

### ✅ Préparation

- [ ] Backup complet de la base de données
- [ ] Tests en environnement de staging réussis
- [ ] Code review complété et approuvé
- [ ] Documentation à jour
- [ ] Variables d'environnement configurées
- [ ] Accès admin Supabase vérifié
- [ ] Équipe de support notifiée
- [ ] Plan de rollback préparé

### ✅ Vérifications techniques

- [ ] Migrations SQL testées
- [ ] Compatibilité navigateurs vérifiée (Chrome, Firefox, Safari, Edge)
- [ ] Tests de charge effectués
- [ ] Monitoring configuré
- [ ] Alertes configurées
- [ ] Bucket Supabase Storage créé

## Étapes de déploiement

### Phase 1 : Préparation (30 min)

#### 1.1 Backup de la base de données

```bash
# Backup manuel via Supabase Dashboard
# OU via pg_dump si accès direct
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup_pre_deployment_$(date +%Y%m%d_%H%M%S).sql
```

#### 1.2 Créer le bucket de sauvegarde

1. Aller dans Supabase Dashboard > Storage
2. Créer un nouveau bucket nommé `backups`
3. Configurer comme privé
4. Vérifier les permissions

#### 1.3 Vérifier les variables d'environnement

```bash
# .env.production
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

### Phase 2 : Migrations base de données (30 min)

#### 2.1 Exécuter les migrations

```bash
# Migration 1 : Ajout des colonnes de fiabilité
psql -h db.xxx.supabase.co -U postgres -d postgres -f supabase-add-reliability-features.sql

# Vérification
psql -h db.xxx.supabase.co -U postgres -d postgres -c "\d soumissions_disponibilites"
```

**Vérifier** :
- Colonnes `updated_at`, `historique_modifications`, `deleted_at`, `version` ajoutées
- Triggers créés
- Données existantes migrées

```bash
# Migration 2 : Table audit_logs
psql -h db.xxx.supabase.co -U postgres -d postgres -f supabase-create-audit-logs.sql

# Vérification
psql -h db.xxx.supabase.co -U postgres -d postgres -c "SELECT COUNT(*) FROM audit_logs"
```

```bash
# Migration 3 : Table backup_metadata
psql -h db.xxx.supabase.co -U postgres -d postgres -f supabase-create-backup-metadata.sql

# Vérification
psql -h db.xxx.supabase.co -U postgres -d postgres -c "SELECT COUNT(*) FROM backup_metadata"
```

#### 2.2 Vérifier l'intégrité

```sql
-- Vérifier que toutes les soumissions ont updated_at
SELECT COUNT(*) FROM soumissions_disponibilites WHERE updated_at IS NULL;
-- Résultat attendu : 0

-- Vérifier les triggers
SELECT tgname FROM pg_trigger WHERE tgrelid = 'soumissions_disponibilites'::regclass;
-- Résultat attendu : update_soumissions_updated_at, track_soumissions_modifications
```

### Phase 3 : Déploiement du code (45 min)

#### 3.1 Build de production

```bash
# Installer les dépendances
npm install

# Build
npm run build

# Vérifier le build
ls -lh dist/
```

#### 3.2 Déploiement

```bash
# Via Vercel/Netlify
vercel --prod

# OU via votre méthode de déploiement
npm run deploy
```

#### 3.3 Vérification post-déploiement

1. Accéder à l'application en production
2. Vérifier que la page se charge
3. Tester le formulaire de soumission
4. Vérifier les indicateurs (online/offline, queue)
5. Tester la sauvegarde automatique
6. Vérifier les logs navigateur (pas d'erreurs)

### Phase 4 : Configuration des cron jobs (15 min)

#### 4.1 Script de sauvegarde quotidienne

```bash
# Ajouter au crontab du serveur
crontab -e

# Ajouter cette ligne
0 2 * * * cd /path/to/project && npx ts-node scripts/backup-submissions.ts >> /var/log/backup-submissions.log 2>&1
```

#### 4.2 Script de nettoyage hebdomadaire

```bash
# Ajouter au crontab
0 3 * * 0 cd /path/to/project && npx ts-node scripts/cleanup-old-backups.ts >> /var/log/cleanup-backups.log 2>&1
```

#### 4.3 Tester les scripts manuellement

```bash
# Test backup
npx ts-node scripts/backup-submissions.ts

# Vérifier dans Supabase Storage
# Vérifier dans backup_metadata

# Test cleanup (sans effet si pas de vieilles sauvegardes)
npx ts-node scripts/cleanup-old-backups.ts
```

### Phase 5 : Monitoring et validation (30 min)

#### 5.1 Configurer les alertes

```javascript
// Configuration exemple (à adapter selon votre service)
{
  "alerts": [
    {
      "name": "High Failure Rate",
      "condition": "failure_rate > 5",
      "action": "email:admin@institution.edu"
    },
    {
      "name": "Slow Response Time",
      "condition": "response_time > 5000",
      "action": "email:admin@institution.edu"
    },
    {
      "name": "Large Queue",
      "condition": "queue_size > 10",
      "action": "email:admin@institution.edu"
    }
  ]
}
```

#### 5.2 Tests de validation

**Test 1 : Soumission normale**
1. Remplir le formulaire
2. Soumettre
3. Vérifier la confirmation
4. Vérifier dans Supabase
5. Vérifier audit_logs

**Test 2 : Sauvegarde automatique**
1. Commencer à remplir le formulaire
2. Fermer l'onglet
3. Rouvrir le formulaire
4. Vérifier que les données sont restaurées

**Test 3 : Mode hors-ligne**
1. Ouvrir DevTools > Network
2. Activer "Offline"
3. Remplir et soumettre le formulaire
4. Vérifier le message "Mise en file d'attente"
5. Désactiver "Offline"
6. Vérifier que la soumission est envoyée

**Test 4 : Modification**
1. Soumettre une première fois
2. Retourner avec le même email
3. Modifier les créneaux
4. Soumettre
5. Vérifier l'historique des modifications

**Test 5 : Métriques**
1. Accéder à `/admin/metrics`
2. Vérifier que les métriques s'affichent
3. Effectuer quelques soumissions
4. Rafraîchir et vérifier les mises à jour

#### 5.3 Monitoring 24h

- [ ] Vérifier les métriques toutes les 2h
- [ ] Surveiller les logs d'erreur
- [ ] Vérifier la taille de la file d'attente
- [ ] Contrôler le taux de succès
- [ ] Vérifier les audit logs

## Plan de rollback

### Scénario 1 : Problème critique immédiat

**Si détecté dans les 30 premières minutes :**

1. Rollback du code
```bash
# Revenir à la version précédente
vercel rollback
```

2. Rollback de la base de données
```bash
# Restaurer le backup
psql -h db.xxx.supabase.co -U postgres -d postgres < backup_pre_deployment_YYYYMMDD_HHMMSS.sql
```

3. Notifier les utilisateurs

### Scénario 2 : Problème détecté après quelques heures

**Si des soumissions ont déjà été faites :**

1. Ne PAS rollback la base de données
2. Désactiver les nouvelles fonctionnalités via feature flags
3. Investiguer le problème
4. Corriger et redéployer

### Scénario 3 : Problème mineur

**Si le système fonctionne mais avec des bugs mineurs :**

1. Laisser en production
2. Corriger le bug
3. Déployer un hotfix
4. Communiquer aux utilisateurs si nécessaire

## Communication

### Avant le déploiement

**Email aux utilisateurs (J-2)** :

```
Objet : Amélioration du système de soumission des disponibilités

Chers collègues,

Ce samedi 2h-5h du matin, nous déploierons des améliorations importantes 
du système de soumission des disponibilités :

- Sauvegarde automatique de vos données
- Fonctionnement hors-ligne
- Meilleure fiabilité
- Historique des modifications

Le système sera brièvement indisponible pendant la mise à jour.

Cordialement,
L'équipe technique
```

### Pendant le déploiement

**Message sur le site** :

```
🔧 Maintenance en cours
Le système est temporairement indisponible pour maintenance.
Retour prévu : 5h00
```

### Après le déploiement

**Email de confirmation (J+1)** :

```
Objet : Nouvelles fonctionnalités disponibles

Chers collègues,

Le système de soumission a été mis à jour avec succès !

Nouvelles fonctionnalités :
✅ Sauvegarde automatique de vos données
✅ Fonctionnement même sans connexion internet
✅ Historique de vos modifications
✅ Meilleure fiabilité

Guide utilisateur : [lien]

Pour toute question : support@institution.edu

Cordialement,
L'équipe technique
```

## Monitoring post-déploiement

### Jour 1 (J+0)

- [ ] Vérifier toutes les 2h
- [ ] Surveiller les métriques
- [ ] Répondre aux questions utilisateurs
- [ ] Corriger les bugs critiques immédiatement

### Semaine 1 (J+1 à J+7)

- [ ] Vérifier quotidiennement
- [ ] Analyser les métriques
- [ ] Collecter les retours utilisateurs
- [ ] Planifier les améliorations

### Mois 1 (J+7 à J+30)

- [ ] Vérifier hebdomadairement
- [ ] Rapport mensuel des métriques
- [ ] Optimisations si nécessaire
- [ ] Documentation des leçons apprises

## Métriques de succès

### Objectifs

- ✅ Taux de succès > 95%
- ✅ Temps de réponse < 2s
- ✅ Aucune perte de données
- ✅ File d'attente < 5 éléments en moyenne
- ✅ Satisfaction utilisateurs > 80%

### KPIs à suivre

1. **Fiabilité**
   - Taux de succès des soumissions
   - Nombre de soumissions perdues (objectif : 0)
   - Taux d'utilisation de la file d'attente

2. **Performance**
   - Temps de réponse moyen
   - Temps de traitement de la file
   - Temps de sauvegarde LocalStorage

3. **Utilisation**
   - Nombre de soumissions par jour
   - Nombre de modifications
   - Utilisation du mode hors-ligne

4. **Qualité**
   - Nombre de bugs reportés
   - Temps de résolution
   - Satisfaction utilisateurs

## Contacts d'urgence

- **Chef de projet** : +32 XXX XX XX XX
- **Développeur principal** : +32 XXX XX XX XX
- **Admin système** : +32 XXX XX XX XX
- **Support utilisateurs** : support@institution.edu

## Checklist post-déploiement

- [ ] Tous les tests de validation passés
- [ ] Métriques normales
- [ ] Aucune erreur critique
- [ ] Cron jobs configurés et testés
- [ ] Monitoring actif
- [ ] Alertes configurées
- [ ] Documentation mise à jour
- [ ] Utilisateurs notifiés
- [ ] Équipe de support formée
- [ ] Plan de rollback validé

## Conclusion

Ce déploiement introduit des améliorations majeures de fiabilité. Avec une préparation minutieuse et un monitoring attentif, le risque est minimisé.

**Date de déploiement** : _______________
**Responsable** : _______________
**Statut** : ⬜ Réussi ⬜ Rollback ⬜ Partiel
