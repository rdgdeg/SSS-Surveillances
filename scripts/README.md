# Scripts de Sauvegarde

Ce dossier contient les scripts de sauvegarde automatique des soumissions.

## Scripts disponibles

### backup-submissions.ts

Effectue une sauvegarde quotidienne de toutes les soumissions.

**Fonctionnalités:**
- Exporte toutes les soumissions au format JSON
- Compresse le fichier avec gzip
- Calcule un checksum MD5
- Upload vers Supabase Storage
- Enregistre les métadonnées dans `backup_metadata`

**Usage:**
```bash
npx ts-node scripts/backup-submissions.ts
```

**Configuration cron (quotidien à 2h du matin):**
```cron
0 2 * * * cd /path/to/project && npx ts-node scripts/backup-submissions.ts >> /var/log/backup-submissions.log 2>&1
```

**Variables d'environnement requises:**
- `SUPABASE_URL`: URL de votre projet Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Clé de service Supabase
- `BACKUP_DIR` (optionnel): Répertoire temporaire pour les backups (défaut: `./backups`)

### cleanup-old-backups.ts

Nettoie les sauvegardes de plus de 90 jours.

**Fonctionnalités:**
- Identifie les sauvegardes obsolètes (> 90 jours)
- Supprime les fichiers du storage
- Met à jour le statut dans `backup_metadata`

**Usage:**
```bash
npx ts-node scripts/cleanup-old-backups.ts
```

**Configuration cron (hebdomadaire le dimanche à 3h):**
```cron
0 3 * * 0 cd /path/to/project && npx ts-node scripts/cleanup-old-backups.ts >> /var/log/cleanup-backups.log 2>&1
```

**Variables d'environnement requises:**
- `SUPABASE_URL`: URL de votre projet Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Clé de service Supabase

## Configuration Supabase Storage

Avant d'utiliser ces scripts, créez un bucket `backups` dans Supabase Storage:

1. Aller dans Supabase Dashboard > Storage
2. Créer un nouveau bucket nommé `backups`
3. Configurer les permissions (privé, accessible uniquement via service role)

## Monitoring

Les métadonnées de chaque sauvegarde sont enregistrées dans la table `backup_metadata`:

```sql
SELECT 
  backup_date,
  status,
  record_count,
  file_size_bytes / 1024 / 1024 as size_mb,
  checksum,
  created_at,
  completed_at
FROM backup_metadata
ORDER BY backup_date DESC
LIMIT 10;
```

## Restauration d'une sauvegarde

Pour restaurer une sauvegarde:

1. Télécharger le fichier depuis Supabase Storage
2. Décompresser: `gunzip submissions_YYYY-MM-DD_timestamp.json.gz`
3. Vérifier le checksum: `md5sum submissions_YYYY-MM-DD_timestamp.json`
4. Importer dans Supabase via l'interface ou un script

## Alertes

Configurez des alertes pour être notifié en cas d'échec:

- Vérifier quotidiennement le statut dans `backup_metadata`
- Alerter si `status = 'failed'`
- Alerter si aucune sauvegarde dans les dernières 24h

## Sécurité

⚠️ **Important:**
- Ne jamais commiter les clés de service dans Git
- Utiliser des variables d'environnement ou un gestionnaire de secrets
- Restreindre l'accès au bucket `backups`
- Chiffrer les sauvegardes si elles contiennent des données sensibles
