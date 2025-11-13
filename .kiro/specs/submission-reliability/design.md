# Design Document - Submission Reliability System

## Overview

Ce document décrit la conception d'un système robuste pour garantir qu'aucune soumission de disponibilités ne soit perdue. Le système implémente une approche multi-couches avec sauvegarde locale temporaire, gestion des erreurs réseau, traçabilité complète, et mécanismes de récupération.

### Objectifs de conception

1. **Zéro perte de données** : Aucune soumission ne doit être perdue, même en cas de problème technique
2. **Transparence** : L'utilisateur doit toujours savoir l'état de sa soumission
3. **Résilience** : Le système doit fonctionner même avec une connexion instable
4. **Traçabilité** : Toutes les opérations doivent être auditables
5. **Récupérabilité** : Les données doivent pouvoir être restaurées en cas de problème

## Architecture

### Vue d'ensemble du flux de données

```
┌─────────────────┐
│   Utilisateur   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              Interface Formulaire                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Étape 1: Email → Étape 2: Info → Étape 3: Dispo │  │
│  └──────────────────────────────────────────────────┘  │
└────────┬────────────────────────────────────┬──────────┘
         │                                     │
         │ Auto-save (500ms debounce)         │ Submit
         ▼                                     ▼
┌─────────────────┐                  ┌──────────────────┐
│  LocalStorage   │                  │  Submission      │
│  (Temporaire)   │                  │  Handler         │
└─────────────────┘                  └────────┬─────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │  Network Check  │
                                     └────────┬────────┘
                                              │
                        ┌─────────────────────┼─────────────────────┐
                        │ Online              │                     │ Offline
                        ▼                     ▼                     ▼
              ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
              │  Validation      │  │  Retry Logic     │  │  Offline Queue   │
              │  Côté Client     │  │  (5 attempts)    │  │  (IndexedDB)     │
              └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
                       │                     │                     │
                       ▼                     ▼                     │
              ┌──────────────────────────────────────┐            │
              │         Supabase API                 │            │
              │  (Transaction + Upsert)              │◄───────────┘
              └────────┬─────────────────────────────┘
                       │
                       ▼
              ┌──────────────────────────────────────┐
              │  soumissions_disponibilites table    │
              │  + Audit Log + Timestamps            │
              └────────┬─────────────────────────────┘
                       │
                       ▼
              ┌──────────────────────────────────────┐
              │  Confirmation + Email Notification   │
              └──────────────────────────────────────┘
```

### Couches de protection

1. **Couche 1 - Sauvegarde locale** : LocalStorage pour protection contre fermeture navigateur
2. **Couche 2 - File d'attente hors-ligne** : IndexedDB pour soumissions en attente
3. **Couche 3 - Retry automatique** : Tentatives multiples avec backoff exponentiel
4. **Couche 4 - Validation** : Vérification côté client et serveur
5. **Couche 5 - Transaction atomique** : Garantie d'intégrité dans Supabase
6. **Couche 6 - Audit et traçabilité** : Logs complets de toutes les opérations
7. **Couche 7 - Sauvegardes** : Backups quotidiens et soft delete

## Components and Interfaces

### 1. LocalStorage Manager

**Responsabilité** : Gestion de la sauvegarde temporaire pendant la saisie

```typescript
interface LocalStorageManager {
  // Sauvegarde automatique avec debounce
  saveFormProgress(data: FormProgressData): void;
  
  // Restauration au chargement
  loadFormProgress(): FormProgressData | null;
  
  // Nettoyage après soumission réussie
  clearFormProgress(): void;
  
  // Vérification de disponibilité
  isAvailable(): boolean;
}

interface FormProgressData {
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

**Implémentation** :
- Utilise `localStorage.setItem(STORAGE_KEY, JSON.stringify(data))`
- Debounce de 500ms pour éviter trop d'écritures
- Try-catch pour gérer les erreurs (quota dépassé, etc.)
- Affiche un warning si LocalStorage indisponible

### 2. Offline Queue Manager

**Responsabilité** : Gestion des soumissions en attente lors de problèmes réseau

```typescript
interface OfflineQueueManager {
  // Ajouter une soumission à la file
  enqueue(submission: PendingSubmission): Promise<void>;
  
  // Récupérer toutes les soumissions en attente
  getAll(): Promise<PendingSubmission[]>;
  
  // Retirer une soumission après succès
  dequeue(id: string): Promise<void>;
  
  // Traiter la file d'attente
  processQueue(): Promise<ProcessResult>;
  
  // Vérifier si la file contient des éléments
  hasItems(): Promise<boolean>;
}

interface PendingSubmission {
  id: string; // UUID local
  data: SubmissionPayload;
  timestamp: string;
  attempts: number;
  lastAttempt?: string;
  error?: string;
}

interface ProcessResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}
```

**Implémentation** :
- Utilise IndexedDB pour stockage persistant (plus robuste que LocalStorage)
- Détection automatique du retour en ligne avec `window.addEventListener('online')`
- Traitement automatique de la file au retour en ligne
- Interface utilisateur pour voir les soumissions en attente

### 3. Network Manager

**Responsabilité** : Gestion de l'état réseau et retry logic

```typescript
interface NetworkManager {
  // Vérifier la connexion
  isOnline(): boolean;
  
  // Soumettre avec retry automatique
  submitWithRetry(
    payload: SubmissionPayload,
    options?: RetryOptions
  ): Promise<SubmissionResult>;
  
  // Écouter les changements de connexion
  onConnectionChange(callback: (online: boolean) => void): () => void;
}

interface RetryOptions {
  maxAttempts: number; // Default: 5
  initialDelay: number; // Default: 1000ms
  maxDelay: number; // Default: 30000ms
  backoffMultiplier: number; // Default: 2
}

interface SubmissionResult {
  success: boolean;
  submissionId?: string;
  error?: string;
  attempts: number;
}
```

**Implémentation** :
- Utilise `navigator.onLine` pour état initial
- Événements `online` et `offline` pour changements
- Backoff exponentiel : delay = min(initialDelay * (backoffMultiplier ^ attempt), maxDelay)
- Exemple : 1s, 2s, 4s, 8s, 16s (max 30s)

### 4. Submission Service

**Responsabilité** : Orchestration de la soumission avec toutes les couches de protection

```typescript
interface SubmissionService {
  // Soumettre les disponibilités
  submit(payload: SubmissionPayload): Promise<SubmissionResult>;
  
  // Vérifier l'état d'une soumission
  checkStatus(email: string, sessionId: string): Promise<SubmissionStatus>;
  
  // Télécharger une copie locale en cas d'échec
  downloadLocalCopy(payload: SubmissionPayload): void;
}

interface SubmissionStatus {
  exists: boolean;
  submittedAt?: string;
  updatedAt?: string;
  modificationsCount: number;
  creneauxCount: number;
}
```

**Flux de soumission** :

```typescript
async function submit(payload: SubmissionPayload): Promise<SubmissionResult> {
  // 1. Validation côté client
  const validation = validatePayload(payload);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }
  
  // 2. Vérifier la connexion
  if (!networkManager.isOnline()) {
    // Mettre en file d'attente
    await offlineQueue.enqueue({
      id: generateUUID(),
      data: payload,
      timestamp: new Date().toISOString(),
      attempts: 0
    });
    return { 
      success: false, 
      error: 'offline',
      message: 'Soumission mise en file d\'attente'
    };
  }
  
  // 3. Soumettre avec retry
  try {
    const result = await networkManager.submitWithRetry(payload);
    
    if (result.success) {
      // 4. Nettoyer LocalStorage
      localStorageManager.clearFormProgress();
      
      // 5. Retourner succès
      return result;
    } else {
      // 6. Échec après retries → file d'attente
      await offlineQueue.enqueue({
        id: generateUUID(),
        data: payload,
        timestamp: new Date().toISOString(),
        attempts: result.attempts
      });
      return result;
    }
  } catch (error) {
    // 7. Erreur inattendue → file d'attente
    await offlineQueue.enqueue({
      id: generateUUID(),
      data: payload,
      timestamp: new Date().toISOString(),
      attempts: 0,
      error: error.message
    });
    return { 
      success: false, 
      error: error.message 
    };
  }
}
```

### 5. Audit Logger

**Responsabilité** : Traçabilité complète des opérations

```typescript
interface AuditLogger {
  // Logger une opération
  log(entry: AuditEntry): Promise<void>;
  
  // Récupérer l'historique
  getHistory(filters: AuditFilters): Promise<AuditEntry[]>;
}

interface AuditEntry {
  id: string;
  timestamp: string;
  operation: 'create' | 'update' | 'delete' | 'view';
  entity: 'submission' | 'surveillant' | 'creneau';
  entityId: string;
  userId?: string;
  userEmail: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

interface AuditFilters {
  startDate?: string;
  endDate?: string;
  operation?: string;
  entity?: string;
  userEmail?: string;
}
```

**Implémentation** :
- Table dédiée `audit_logs` dans Supabase
- Triggers PostgreSQL pour capturer automatiquement les modifications
- Rétention de 2 ans minimum
- Interface admin pour consulter les logs

## Data Models

### 1. Extension de soumissions_disponibilites

```sql
-- Colonnes existantes
ALTER TABLE soumissions_disponibilites 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE soumissions_disponibilites 
ADD COLUMN IF NOT EXISTS historique_modifications JSONB DEFAULT '[]'::jsonb;

ALTER TABLE soumissions_disponibilites 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE soumissions_disponibilites 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = now();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER update_soumissions_updated_at
    BEFORE UPDATE ON soumissions_disponibilites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour historique_modifications
CREATE OR REPLACE FUNCTION add_modification_history()
RETURNS TRIGGER AS $
DECLARE
    nb_creneaux INTEGER;
BEGIN
    -- Compter le nombre de créneaux disponibles
    SELECT COUNT(*) INTO nb_creneaux
    FROM jsonb_array_elements(NEW.historique_disponibilites) AS disp
    WHERE (disp->>'est_disponible')::boolean = true;
    
    -- Ajouter l'entrée d'historique
    NEW.historique_modifications = COALESCE(OLD.historique_modifications, '[]'::jsonb) || 
        jsonb_build_object(
            'date', now(),
            'type', CASE WHEN OLD.id IS NULL THEN 'creation' ELSE 'modification' END,
            'nb_creneaux', nb_creneaux
        );
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER track_soumissions_modifications
    BEFORE INSERT OR UPDATE ON soumissions_disponibilites
    FOR EACH ROW
    EXECUTE FUNCTION add_modification_history();
```

### 2. Table audit_logs

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT now(),
    operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete', 'view')),
    entity TEXT NOT NULL CHECK (entity IN ('submission', 'surveillant', 'creneau', 'session')),
    entity_id UUID NOT NULL,
    user_email TEXT NOT NULL,
    user_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour recherches rapides
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation ON audit_logs(operation);

-- Politique RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all audit logs" ON audit_logs
    FOR SELECT USING (true);

CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);
```

### 3. Table backup_metadata

```sql
CREATE TABLE IF NOT EXISTS backup_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_date DATE NOT NULL UNIQUE,
    table_name TEXT NOT NULL,
    record_count INTEGER NOT NULL,
    file_path TEXT,
    file_size_bytes BIGINT,
    checksum TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_backup_metadata_date ON backup_metadata(backup_date DESC);
CREATE INDEX IF NOT EXISTS idx_backup_metadata_status ON backup_metadata(status);
```

## Error Handling

### Stratégie de gestion des erreurs

```typescript
enum ErrorType {
  NETWORK_ERROR = 'network_error',
  VALIDATION_ERROR = 'validation_error',
  DATABASE_ERROR = 'database_error',
  QUOTA_ERROR = 'quota_error',
  UNKNOWN_ERROR = 'unknown_error'
}

interface ErrorHandler {
  handle(error: Error, context: ErrorContext): ErrorResponse;
}

interface ErrorContext {
  operation: string;
  payload?: any;
  userId?: string;
  timestamp: string;
}

interface ErrorResponse {
  type: ErrorType;
  message: string;
  userMessage: string;
  actions: ErrorAction[];
  recoverable: boolean;
}

interface ErrorAction {
  label: string;
  action: () => void;
  primary: boolean;
}
```

### Exemples de gestion d'erreurs

**1. Erreur réseau**
```typescript
{
  type: ErrorType.NETWORK_ERROR,
  message: 'Failed to connect to server',
  userMessage: 'Impossible de se connecter au serveur. Votre soumission a été mise en file d\'attente.',
  actions: [
    { label: 'Réessayer maintenant', action: () => retry(), primary: true },
    { label: 'Télécharger une copie locale', action: () => download(), primary: false }
  ],
  recoverable: true
}
```

**2. Erreur de validation**
```typescript
{
  type: ErrorType.VALIDATION_ERROR,
  message: 'Invalid email format',
  userMessage: 'L\'adresse email n\'est pas valide. Veuillez vérifier.',
  actions: [
    { label: 'Corriger', action: () => focusField('email'), primary: true }
  ],
  recoverable: true
}
```

**3. Erreur de base de données**
```typescript
{
  type: ErrorType.DATABASE_ERROR,
  message: 'Unique constraint violation',
  userMessage: 'Une soumission existe déjà pour cette session. Voulez-vous la mettre à jour ?',
  actions: [
    { label: 'Mettre à jour', action: () => update(), primary: true },
    { label: 'Annuler', action: () => cancel(), primary: false }
  ],
  recoverable: true
}
```

## Testing Strategy

### 1. Tests unitaires

**LocalStorage Manager**
- Sauvegarde et restauration des données
- Gestion du quota dépassé
- Nettoyage après soumission

**Offline Queue Manager**
- Ajout/retrait d'éléments
- Traitement de la file
- Gestion des erreurs IndexedDB

**Network Manager**
- Détection de l'état réseau
- Retry logic avec backoff
- Gestion des timeouts

**Submission Service**
- Validation des payloads
- Orchestration complète
- Gestion des erreurs

### 2. Tests d'intégration

**Flux complet de soumission**
- Saisie → Sauvegarde locale → Soumission → Confirmation
- Vérification de la persistance dans Supabase
- Vérification des timestamps et historique

**Scénarios hors-ligne**
- Soumission hors-ligne → File d'attente → Retour en ligne → Traitement
- Multiples soumissions en attente
- Échecs partiels

**Scénarios d'erreur**
- Erreur réseau pendant soumission
- Erreur de validation
- Conflit de version
- Quota LocalStorage dépassé

### 3. Tests de charge

**Performance**
- 100 soumissions simultanées
- Temps de réponse < 2 secondes
- Pas de perte de données

**Résilience**
- Simulation de pannes réseau
- Simulation d'erreurs serveur
- Récupération automatique

### 4. Tests manuels

**Scénarios utilisateur**
- Fermeture accidentelle du navigateur
- Perte de connexion pendant la saisie
- Modification d'une soumission existante
- Consultation de l'historique

**Interface utilisateur**
- Clarté des messages d'erreur
- Indicateurs de progression
- Confirmations visuelles

## Security Considerations

### 1. Validation des données

**Côté client**
- Format email valide
- Champs obligatoires remplis
- Nombre de créneaux cohérent
- Type de surveillant valide

**Côté serveur**
- Validation stricte avec Zod ou Joi
- Vérification de l'existence de la session
- Vérification des IDs de créneaux
- Sanitization des inputs

### 2. Protection contre les abus

**Rate limiting**
- Maximum 10 soumissions par email par heure
- Maximum 3 modifications par soumission par heure
- Blocage temporaire en cas d'abus détecté

**Validation de session**
- Vérifier que la session est active
- Vérifier que les créneaux appartiennent à la session
- Vérifier la cohérence temporelle

### 3. Audit et traçabilité

**Logging sécurisé**
- Pas de données sensibles dans les logs
- Anonymisation des emails dans les logs publics
- Rétention limitée des logs détaillés

**Accès aux données**
- RLS (Row Level Security) activé
- Politiques strictes pour les opérations admin
- Audit de tous les accès aux données sensibles

## Performance Optimization

### 1. Optimisations frontend

**Debouncing**
- Sauvegarde LocalStorage : 500ms
- Validation en temps réel : 300ms

**Lazy loading**
- Charger les créneaux par date
- Virtualisation pour grandes listes

**Memoization**
- Composants React avec React.memo
- Calculs coûteux avec useMemo

### 2. Optimisations backend

**Indexation**
- Index sur (session_id, email) pour upsert rapide
- Index GIN sur historique_disponibilites
- Index sur timestamps pour tri

**Requêtes optimisées**
- Utiliser les vues matérialisées pour statistiques
- Batch updates pour modifications multiples
- Pagination pour grandes listes

**Caching**
- Cache des sessions actives (5 minutes)
- Cache des créneaux par session (2 minutes)
- Invalidation sur modification

### 3. Monitoring

**Métriques clés**
- Temps de réponse des soumissions
- Taux de succès/échec
- Taille de la file d'attente hors-ligne
- Nombre de retries nécessaires

**Alertes**
- Taux d'échec > 5%
- Temps de réponse > 5 secondes
- File d'attente > 10 éléments
- Erreurs de base de données

## Deployment Considerations

### 1. Migration

**Étapes de migration**
1. Ajouter les nouvelles colonnes (updated_at, historique_modifications, deleted_at, version)
2. Créer les triggers
3. Créer la table audit_logs
4. Migrer les données existantes
5. Déployer le nouveau code frontend
6. Activer les nouvelles fonctionnalités progressivement

**Rollback plan**
- Garder l'ancien code actif en parallèle
- Feature flags pour activer/désactiver les nouvelles fonctionnalités
- Backup complet avant migration

### 2. Monitoring post-déploiement

**Premières 24h**
- Surveillance continue des erreurs
- Vérification des soumissions
- Analyse des logs

**Première semaine**
- Analyse des métriques de performance
- Feedback utilisateurs
- Ajustements si nécessaire

### 3. Documentation

**Documentation utilisateur**
- Guide de soumission
- FAQ sur les erreurs courantes
- Procédure de récupération

**Documentation technique**
- Architecture détaillée
- Procédures de maintenance
- Runbook pour incidents

## Future Enhancements

### Phase 2 (optionnel)

1. **Notifications push** : Alertes en temps réel pour les administrateurs
2. **Export automatique** : Génération de rapports quotidiens
3. **Synchronisation multi-onglets** : Coordination entre plusieurs onglets ouverts
4. **Mode hors-ligne complet** : Service Worker pour fonctionnement 100% hors-ligne
5. **Compression des données** : Réduction de la taille des payloads
6. **Chiffrement côté client** : Protection supplémentaire des données sensibles

### Phase 3 (optionnel)

1. **Machine learning** : Détection d'anomalies dans les soumissions
2. **Analytics avancés** : Tableaux de bord prédictifs
3. **API publique** : Intégration avec d'autres systèmes
4. **Mobile app** : Application native iOS/Android
