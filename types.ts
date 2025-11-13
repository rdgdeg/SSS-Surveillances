
export interface Session {
  id: string;
  name: string;
  year: number;
  period: 1 | 2 | 3; // 1=Jan, 2=Jun, 3=Aug
  is_active: boolean;
  created_at?: string;
}

export interface Creneau {
  id: string;
  session_id: string;
  examen_id: string; // This might need to be nullable or handled differently if not always present
  date_surveillance: string | null; // YYYY-MM-DD
  heure_debut_surveillance: string | null; // HH:MM
  heure_fin_surveillance: string | null; // HH:MM
  type_creneau: 'PRINCIPAL' | 'RESERVE' | string;
  nb_surveillants_requis?: number; // Nombre de surveillants nécessaires (1-20) - Admin only
  created_at?: string;
}

// Based on `surveillants.type` column CHECK constraint
export enum SurveillantType {
  ASSISTANT = 'assistant',
  PAT = 'pat',
  JOBISTE = 'jobiste',
  AUTRE = 'autre',
}

export const SurveillantTypeLabels: { [key in SurveillantType]: string } = {
  [SurveillantType.ASSISTANT]: 'Assistant',
  [SurveillantType.PAT]: 'Personnel (PAT)',
  [SurveillantType.JOBISTE]: 'Jobiste',
  [SurveillantType.AUTRE]: 'Autre',
};


export interface Surveillant {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  type: SurveillantType;
  affectation_faculte?: string;
  affectation_institut?: string;
  statut_salarial?: string;
  etp_total?: number;
  etp_recherche?: number;
  etp_autre?: number;
  categorie_presence?: string;
  fin_absence?: string;
  fin_repos_postnatal?: string;
  type_occupation?: string;
  telephone?: string;
  quota_surveillances?: number;
  is_active: boolean;
  dispense_surveillance?: boolean;
}

export interface SoumissionDisponibilite {
  id: string;
  session_id: string;
  surveillant_id: string | null;
  email: string;
  nom: string;
  prenom: string;
  type_surveillant: string;
  remarque_generale?: string;
  historique_disponibilites: HistoriqueDisponibilite[];
  submitted_at: string;
  updated_at?: string;
  historique_modifications?: ModificationHistoryEntry[];
  deleted_at?: string | null;
  version?: number;
}

export interface ModificationHistoryEntry {
  date: string;
  type: 'modification' | 'creation';
  nb_creneaux: number;
}

export interface HistoriqueDisponibilite {
  creneau_id: string;
  est_disponible: boolean;
}

export interface AvailabilityData {
    [creneauId: string]: {
        available: boolean;
    };
}

export interface Message {
    id: string;
    session_id: string | null;
    expediteur_email: string;
    expediteur_nom: string | null;
    expediteur_prenom: string | null;
    sujet: string;
    contenu: string;
    lu: boolean;
    archive: boolean;
    created_at: string;
    priorite: 'basse' | 'normale' | 'haute' | 'urgente' | string;
}

// Types pour la gestion de la capacité des créneaux (Admin only)

export type StatutRemplissage = 'critique' | 'alerte' | 'ok' | 'non-defini';

export interface CreneauWithStats extends Creneau {
  nb_disponibles: number;
  taux_remplissage?: number; // Pourcentage (0-100+), undefined si pas de capacité définie
  statut_remplissage: StatutRemplissage;
}

export interface CapacityStats {
  total_creneaux_avec_capacite: number;
  creneaux_critiques: number; // < 50%
  creneaux_alerte: number; // 50-99%
  creneaux_ok: number; // >= 100%
  taux_remplissage_moyen: number;
}

export interface BulkUpdateResult {
  success: number;
  errors: string[];
}

export interface CopyCapacityResult {
  copied: number;
  skipped: number;
  errors: string[];
}

// Types pour le registre des consignes de cours

export interface Cours {
  id: string;
  code: string;
  intitule_complet: string;
  consignes: string | null;
  updated_at: string;
  created_at: string;
}

export interface CoursListItem {
  id: string;
  code: string;
  intitule_complet: string;
  has_consignes: boolean;
  updated_at: string;
}

export interface CoursFormData {
  code: string;
  intitule_complet: string;
  consignes?: string;
}

export interface CoursSearchParams {
  search?: string;
  sortBy?: 'code' | 'intitule_complet' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
  hasInstructions?: boolean;
}

export interface CoursImportResult {
  imported: number;
  updated: number;
  errors: string[];
}

// ============================================
// Types pour le système de fiabilité des soumissions
// ============================================

// Types pour LocalStorage Manager
export interface FormProgressData {
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

// Types pour Offline Queue Manager
export interface PendingSubmission {
  id: string; // UUID local
  payload: SubmissionPayload;
  timestamp: number;
  attempts: number;
  lastAttempt?: number;
  lastError?: string;
}

export interface ProcessResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

// Types pour Network Manager
export interface RetryOptions {
  maxAttempts: number; // Default: 5
  initialDelay: number; // Default: 1000ms
  maxDelay: number; // Default: 30000ms
  backoffMultiplier: number; // Default: 2
}

export interface SubmissionResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
}

// Types pour Submission Service
export interface SubmissionPayload {
  session_id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone: string;
  creneau_ids: string[];
  commentaire?: string;
}

export interface SubmissionStatus {
  success: boolean;
  message: string;
  submissionId?: string;
  data?: SoumissionDisponibilite;
  queued?: boolean;
  errors?: string[];
}

// Types pour Error Handler
export enum ErrorType {
  NETWORK_ERROR = 'network_error',
  VALIDATION_ERROR = 'validation_error',
  DATABASE_ERROR = 'database_error',
  QUOTA_ERROR = 'quota_error',
  UNKNOWN_ERROR = 'unknown_error'
}

export interface ErrorContext {
  operation: string;
  payload?: any;
  userId?: string;
  timestamp: string;
}

export interface ErrorResponse {
  type: ErrorType;
  message: string;
  userMessage: string;
  actions: ErrorAction[];
  recoverable: boolean;
}

export interface ErrorAction {
  label: string;
  action: () => void;
  primary: boolean;
}

// Types pour Audit Logger
export interface AuditLog {
  id: string;
  timestamp: string;
  operation: 'create' | 'update' | 'delete' | 'view';
  entity: 'submission' | 'surveillant' | 'creneau' | 'session';
  entity_id: string;
  user_email: string;
  user_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AuditFilters {
  startDate?: string;
  endDate?: string;
  operation?: string;
  entity?: string;
  userEmail?: string;
}

// Types pour Backup Metadata
export interface BackupMetadata {
  id: string;
  backup_date: string; // Date format YYYY-MM-DD
  table_name: string;
  record_count: number;
  file_path?: string;
  file_size_bytes?: number;
  checksum?: string;
  status: 'pending' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface BackupStats {
  total_backups: number;
  successful_backups: number;
  failed_backups: number;
  pending_backups: number;
  total_size_mb: number;
  avg_duration_seconds: number;
  success_rate: number;
}