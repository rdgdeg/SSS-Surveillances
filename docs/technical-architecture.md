# Architecture Technique - Système de Fiabilité des Soumissions

Ce document décrit l'architecture complète du système de fiabilité pour les soumissions de disponibilités.

## Vue d'ensemble

Le système est conçu pour garantir qu'aucune soumission ne soit perdue, même en cas de :
- Perte de connexion internet
- Erreurs serveur temporaires
- Fermeture accidentelle du navigateur
- Problèmes de quota de stockage

## Architecture en couches

```
┌─────────────────────────────────────────────────────────┐
│                    Interface Utilisateur                 │
│              (AvailabilityForm, Indicators)              │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  Submission Service                      │
│         (Orchestration et validation client)             │
└─┬──────────┬──────────┬──────────┬──────────┬──────────┘
  │          │          │          │          │
  ▼          ▼          ▼          ▼          ▼
┌───────┐ ┌──────┐ ┌────────┐ ┌────────┐ ┌──────────┐
│Local  │ │Queue │ │Network │ │Audit   │ │Metrics   │
│Storage│ │Manager│ │Manager │ │Logger  │ │Collector │
└───────┘ └──────┘ └────────┘ └────────┘ └──────────┘
     │        │         │          │          │
     └────────┴─────────┴──────────┴──────────┘
                        │
              ┌─────────▼─────────┐
              │   Supabase API    │
              │  (PostgreSQL)     │
              └───────────────────┘
```

## Composants principaux

### 1. LocalStorage Manager (`lib/localStorageManager.ts`)

**Responsabilité** : Sauvegarde automatique des données du formulaire

**Fonctionnalités** :
- Sauvegarde avec debounce (500ms)
- Restauration automatique au chargement
- Gestion du quota dépassé
- Nettoyage après soumission réussie

**Stockage** :
```typescript
{
  email: string;
  nom: string;
  prenom: string;
  type_surveillant: SurveillantType;
  remarque_generale: string;
  availabilities: AvailabilityData;
  foundSurveillantId: string | null;
  lastSaved: string; // ISO timestamp
  sessionId: string;
}
```

**Clé de stockage** : `availability_form_progress`

### 2. Offline Queue Manager (`lib/offlineQueueManager.ts`)

**Responsabilité** : File d'attente persistante pour soumissions hors-ligne

**Technologie** : IndexedDB (plus robuste que LocalStorage)

**Base de données** :
- Nom : `SubmissionQueueDB`
- Version : 1
- Object Store : `pending_submissions`

**Structure des éléments** :
```typescript
{
  id: string; // UUID généré
  payload: SubmissionPayload;
  timestamp: number;
  attempts: number;
  lastAttempt?: number;
  lastError?: string;
}
```

**Opérations** :
- `enqueue()` : Ajouter une soumission
- `getAll()` : Récupérer toutes les soumissions
- `dequeue()` : Retirer après succès
- `processQueue()` : Traiter toutes les soumissions
- `hasItems()` : Vérifier si la file contient des éléments

### 3. Network Manager (`lib/networkManager.ts`)

**Responsabilité** : Gestion de la connectivité et retry logic

**Fonctionnalités** :
- Détection online/offline (`navigator.onLine`)
- Événements de changement de connexion
- Retry avec backoff exponentiel

**Configuration retry** :
```typescript
{
  maxAttempts: 5,
  initialDelay: 1000ms,
  maxDelay: 30000ms,
  backoffMultiplier: 2
}
```

**Formule backoff** :
```
delay = min(initialDelay * (backoffMultiplier ^ attempt), maxDelay)
```

**Exemple** :
- Tentative 1 : 1000ms
- Tentative 2 : 2000ms
- Tentative 3 : 4000ms
- Tentative 4 : 8000ms
- Tentative 5 : 16000ms

### 4. Submission Service (`lib/submissionService.ts`)

**Responsabilité** : Orchestration complète du flux de soumission

**Flux de soumission** :

```
┌─────────────────┐
│  Validation     │
│  côté client    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Vérifier       │
│  connexion      │
└────┬───────┬────┘
     │       │
  Offline  Online
     │       │
     ▼       ▼
┌────────┐ ┌──────────────┐
│Enqueue │ │Submit avec   │
│        │ │retry logic   │
└────────┘ └──┬───────┬───┘
              │       │
           Succès  Échec
              │       │
              ▼       ▼
         ┌────────┐ ┌────────┐
         │Clear   │ │Enqueue │
         │Storage │ │        │
         └────────┘ └────────┘
```

**Validation côté client** :
- Email valide (regex)
- Nom/prénom (min 2 caractères)
- Type surveillant requis
- Session valide
- Au moins une disponibilité

**Validation côté serveur** :
- Session existe et est active
- Tous les créneaux existent
- Créneaux appartiennent à la session
- Pas de doublons

### 5. Audit Logger (`lib/auditLogger.ts`)

**Responsabilité** : Traçabilité de toutes les opérations critiques

**Table** : `audit_logs`

**Opérations loggées** :
- `create` : Création de soumission
- `update` : Modification de soumission
- `view` : Consultation de soumission
- `delete` : Suppression de soumission

**Données capturées** :
```typescript
{
  timestamp: string;
  operation: 'create' | 'update' | 'delete' | 'view';
  entity: 'submission' | 'surveillant' | 'creneau' | 'session';
  entity_id: string;
  user_email: string;
  user_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}
```

**Fallback silencieux** : Les erreurs d'audit ne bloquent jamais l'opération principale

### 6. Metrics Collector (`lib/metricsCollector.ts`)

**Responsabilité** : Collecte et agrégation des métriques de performance

**Métriques collectées** :
- Temps de réponse moyen
- Taux de succès/échec
- Taille de la file d'attente
- Nombre moyen de retries
- Nombre maximum de retries

**Agrégation** :
- Buffer de 1000 événements max
- Flush automatique toutes les 60 secondes
- Calcul des moyennes et pourcentages

**Alertes configurées** :
- Taux d'échec > 5%
- Temps de réponse > 5000ms
- File d'attente > 10 éléments

### 7. Error Handler (`lib/errorHandler.ts`)

**Responsabilité** : Gestion centralisée des erreurs

**Classification des erreurs** :
- `NETWORK_ERROR` : Problèmes de connexion
- `VALIDATION_ERROR` : Données invalides
- `DATABASE_ERROR` : Erreurs Supabase
- `QUOTA_ERROR` : Espace de stockage insuffisant
- `UNKNOWN_ERROR` : Erreurs non classifiées

**Actions correctives** :
- Réessayer
- Télécharger copie locale
- Contacter support

## Schéma de base de données

### Table : soumissions_disponibilites

```sql
CREATE TABLE soumissions_disponibilites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  surveillant_id UUID REFERENCES surveillants(id),
  email TEXT NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  type_surveillant TEXT NOT NULL,
  remarque_generale TEXT,
  historique_disponibilites JSONB NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  historique_modifications JSONB DEFAULT '[]'::jsonb,
  deleted_at TIMESTAMPTZ,
  version INTEGER DEFAULT 1,
  UNIQUE(session_id, email)
);
```

### Table : audit_logs

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete', 'view')),
  entity TEXT NOT NULL CHECK (entity IN ('submission', 'surveillant', 'creneau', 'session')),
  entity_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_email);
```

### Table : backup_metadata

```sql
CREATE TABLE backup_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  backup_date DATE NOT NULL UNIQUE,
  table_name TEXT NOT NULL,
  record_count INTEGER NOT NULL,
  file_path TEXT,
  file_size_bytes BIGINT,
  checksum TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'deleted')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_backup_metadata_date ON backup_metadata(backup_date);
CREATE INDEX idx_backup_metadata_status ON backup_metadata(status);
```

## Scénarios de flux

### Scénario 1 : Soumission normale (online)

1. Utilisateur remplit le formulaire
2. LocalStorage sauvegarde automatiquement (debounce 500ms)
3. Utilisateur clique sur "Soumettre"
4. Validation côté client
5. Vérification connexion (online)
6. Soumission avec retry logic
7. Validation côté serveur
8. Insertion/Update dans Supabase
9. Log dans audit_logs
10. Enregistrement métriques
11. Nettoyage LocalStorage
12. Affichage confirmation

### Scénario 2 : Soumission hors-ligne

1. Utilisateur remplit le formulaire
2. LocalStorage sauvegarde automatiquement
3. Utilisateur clique sur "Soumettre"
4. Validation côté client
5. Vérification connexion (offline)
6. Ajout à la file d'attente IndexedDB
7. Affichage message "Mise en file d'attente"
8. Indicateur de file d'attente visible
9. Retour en ligne détecté
10. Traitement automatique de la file
11. Soumission avec retry logic
12. Succès → Retrait de la file
13. Affichage notification

### Scénario 3 : Échec après retries

1. Soumission avec retry logic
2. Échec tentative 1 → Attente 1s
3. Échec tentative 2 → Attente 2s
4. Échec tentative 3 → Attente 4s
5. Échec tentative 4 → Attente 8s
6. Échec tentative 5 → Abandon
7. Ajout à la file d'attente
8. Proposition téléchargement copie locale
9. Enregistrement métriques (échec)
10. Affichage message d'erreur avec actions

### Scénario 4 : Modification d'une soumission

1. Utilisateur entre son email
2. Vérification soumission existante
3. Chargement des données
4. Affichage historique modifications
5. Utilisateur modifie les créneaux
6. Soumission (upsert)
7. Incrémentation version
8. Ajout entrée historique_modifications
9. Log dans audit_logs (operation: 'update')
10. Affichage confirmation

## Sécurité

### Validation multi-niveaux

1. **Client** : Validation immédiate (UX)
2. **Service** : Validation avant envoi
3. **Serveur** : Validation stricte (sécurité)
4. **Base de données** : Contraintes et checks

### Protection des données

- Pas de données sensibles dans LocalStorage
- IndexedDB accessible uniquement par l'origine
- Audit logs pour traçabilité
- Soft delete pour récupération

### RLS (Row Level Security)

```sql
-- Lecture publique des soumissions (propre email uniquement)
CREATE POLICY "Users can view own submissions"
  ON soumissions_disponibilites FOR SELECT
  USING (auth.email() = email);

-- Insertion publique
CREATE POLICY "Anyone can insert submissions"
  ON soumissions_disponibilites FOR INSERT
  WITH CHECK (true);

-- Audit logs : insertion publique, lecture admin
CREATE POLICY "Anyone can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (auth.role() = 'admin');
```

## Performance

### Optimisations

- Debounce sur sauvegarde LocalStorage (500ms)
- IndexedDB pour file d'attente (plus performant)
- Index sur colonnes fréquemment requêtées
- Batch processing de la file d'attente
- Métriques agrégées en mémoire

### Limites

- LocalStorage : ~5-10 MB
- IndexedDB : ~50 MB (navigateur dépendant)
- File d'attente : 1000 soumissions max
- Métriques : 1000 événements en buffer

## Monitoring

### Métriques clés

- **Disponibilité** : % de soumissions réussies
- **Performance** : Temps de réponse moyen
- **Fiabilité** : Taux d'échec, nombre de retries
- **File d'attente** : Taille, temps de traitement

### Alertes

- Email/SMS si taux d'échec > 5%
- Notification si temps réponse > 5s
- Alerte si file d'attente > 10 éléments
- Rapport quotidien des métriques

## Maintenance

### Sauvegardes

- **Fréquence** : Quotidienne (2h du matin)
- **Rétention** : 90 jours
- **Format** : JSON compressé (gzip)
- **Stockage** : Supabase Storage
- **Vérification** : Checksum MD5

### Nettoyage

- Sauvegardes > 90 jours : Suppression automatique
- Soumissions supprimées > 90 jours : Purge
- Audit logs > 1 an : Archivage

## Déploiement

### Prérequis

- Node.js 18+
- Supabase projet configuré
- Variables d'environnement

### Variables d'environnement

```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx (pour scripts)
BACKUP_DIR=./backups (optionnel)
```

### Scripts de déploiement

```bash
# Migrations base de données
psql -f supabase-add-reliability-features.sql
psql -f supabase-create-audit-logs.sql
psql -f supabase-create-backup-metadata.sql

# Configuration cron jobs
0 2 * * * npx ts-node scripts/backup-submissions.ts
0 3 * * 0 npx ts-node scripts/cleanup-old-backups.ts
```

### Rollback

En cas de problème :
1. Restaurer la dernière sauvegarde
2. Désactiver les nouvelles fonctionnalités (feature flags)
3. Vérifier les logs d'audit
4. Notifier les utilisateurs

## Support et dépannage

### Logs

- Console navigateur : Événements client
- Supabase logs : Erreurs serveur
- Audit logs : Opérations utilisateur
- Métriques : Performance globale

### Outils de diagnostic

- Dashboard métriques : `/admin/metrics`
- Audit logs : `/admin/audit`
- File d'attente : Indicateur visible
- Soumissions supprimées : `/admin/deleted`

### Contacts

- **Développeur** : dev@institution.edu
- **Admin système** : admin@institution.edu
- **Support utilisateur** : support@institution.edu
