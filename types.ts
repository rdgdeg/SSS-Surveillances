
export interface Session {
  id: string;
  name: string;
  year: number;
  period: 1 | 2 | 3 | 4 | 5; // 1=Jan, 2=Jun, 3=Aug, 4=Hors-Session Jan, 5=Hors-Session Jun
  is_active: boolean;
  lock_submissions?: boolean; // Si true, empêche les modifications de disponibilités
  lock_message?: string; // Message personnalisé affiché quand verrouillé
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
  telephone?: string;
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
  page?: number;
  pageSize?: number;
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
  telephone: string;
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
  surveillant_id: string | null;
  email: string;
  nom: string;
  prenom: string;
  type_surveillant: string;
  telephone?: string;
  remarque_generale?: string;
  availabilities: Array<{ creneau_id: string; est_disponible: boolean }>;
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

// ============================================
// Types pour la gestion de la présence des enseignants aux examens
// ============================================

export interface Examen {
  id: string;
  session_id: string;
  cours_id: string | null;
  code_examen: string;
  nom_examen: string;
  date_examen: string | null; // YYYY-MM-DD
  heure_debut: string | null; // HH:MM
  heure_fin: string | null; // HH:MM
  duree_minutes: number | null;
  auditoires: string | null;
  enseignants: string[]; // Array d'emails/noms des enseignants
  secretariat: string | null;
  nb_surveillants_requis: number | null;
  saisie_manuelle: boolean;
  cree_par_email: string | null;
  valide: boolean;
  created_at: string;
  updated_at: string;
}

export type PresenceType = 'present_full' | 'present_partial' | 'absent';
export type ExamType = 'qcm' | 'qroc_manuel' | 'qcm_qroc' | 'gradescope' | 'oral' | 'travail' | 'autre';

export interface PresenceEnseignant {
  id: string;
  cours_id: string;
  session_id: string;
  examen_id: string | null; // Link to exam (new field)
  enseignant_email: string;
  enseignant_nom: string;
  enseignant_prenom: string;
  est_present: boolean; // Deprecated, use type_presence instead
  type_presence: PresenceType;
  type_examen: ExamType | null;
  type_examen_autre: string | null;
  // Champs spécifiques pour le type "travail"
  travail_date_depot?: string | null; // Date limite de dépôt
  travail_en_presentiel?: boolean | null; // Si le travail est en présentiel
  travail_bureau?: string | null; // Bureau si en présentiel
  nb_surveillants_accompagnants: number;
  noms_accompagnants: string | null;
  remarque: string | null;
  historique_remarques: Array<{
    date: string;
    enseignant_email: string;
    enseignant_nom: string;
    remarque: string;
  }> | null;
  submitted_at: string;
  updated_at: string;
}

export interface NotificationAdmin {
  id: string;
  type: 'examen_manuel' | string;
  titre: string;
  message: string;
  reference_id: string | null;
  reference_type: 'examen' | string | null;
  lu: boolean;
  archive: boolean;
  created_at: string;
}

export interface CoursWithPresence extends Cours {
  session_id: string;
  presences: PresenceEnseignant[];
  nb_presences_declarees: number;
  nb_enseignants_presents: number;
  nb_surveillants_accompagnants_total: number;
}

export interface ExamenWithPresence extends Examen {
  presences: PresenceEnseignant[];
  nb_presences_declarees: number;
  nb_enseignants_presents: number;
  nb_enseignants_total: number;
  nb_surveillants_accompagnants_total: number;
}

export interface ExamenImportResult {
  imported: number;
  updated: number;
  errors: string[];
  warnings: string[];
}

export interface PresenceFormData {
  enseignant_email: string;
  enseignant_nom: string;
  enseignant_prenom: string;
  est_present: boolean;
  type_presence: 'present_full' | 'present_partial';
  type_examen: 'qcm' | 'qroc_manuel' | 'qcm_qroc' | 'gradescope' | 'oral' | 'travail' | 'autre' | null;
  type_examen_autre?: string;
  // Champs spécifiques pour le type "travail"
  travail_date_depot?: string;
  travail_en_presentiel?: boolean;
  travail_bureau?: string;
  nb_surveillants_accompagnants: number;
  noms_accompagnants?: string;
  remarque?: string;
}

export interface ManualExamenFormData {
  code_examen: string;
  nom_examen: string;
  date_examen?: string;
  heure_debut?: string;
  heure_fin?: string;
}

export enum ExamenErrorType {
  IMPORT_ERROR = 'import_error',
  VALIDATION_ERROR = 'validation_error',
  DUPLICATE_ERROR = 'duplicate_error',
  NOT_FOUND_ERROR = 'not_found_error',
  PERMISSION_ERROR = 'permission_error'
}

export interface ParsedExamen {
  code_examen: string;
  nom_examen: string;
  enseignants: string[]; // Array d'emails
  date_examen?: string;
  heure_debut?: string;
  heure_fin?: string;
}

export interface ExamenCSVParseResult {
  examens: ParsedExamen[];
  errors: string[];
  warnings: string[];
}

export type ExamenStatusFilter = 'all' | 'declared' | 'pending' | 'manual';
export type ExamenStatusBadgeVariant = 'declared' | 'pending' | 'manual';

// ============================================
// Types pour le système de gestion des examens
// ============================================

export interface ExamenWithStatus extends Examen {
  cours?: Cours; // Joined course data
  has_presence_declarations: boolean;
  nb_presences_declarees: number;
  nb_enseignants_presents: number;
  nb_surveillants_accompagnants: number;
}

export interface ExamenFormData {
  cours_id: string | null;
  code_examen: string;
  nom_examen: string;
  date_examen: string;
  heure_debut: string;
  heure_fin: string;
  duree_minutes: number | null;
  auditoires: string;
  enseignants: string[];
  secretariat: string;
  nb_surveillants_requis: number | null;
}

export interface ExamenFilters {
  search?: string; // Search in code or name
  dateFrom?: string;
  dateTo?: string;
  secretariat?: string;
  responseStatus?: 'all' | 'declared' | 'pending';
  hasCoursLinked?: boolean;
  hasSupervisorRequirement?: boolean;
}

export interface ExamenDashboardStats {
  total_examens: number;
  examens_with_declarations: number;
  examens_pending_declarations: number;
  total_supervisors_required: number;
  examens_without_course: number;
  examens_without_supervisor_requirement: number;
  completion_percentage: number;
  examens_by_secretariat: Array<{ secretariat: string; count: number }>;
  examens_by_date: Array<{ date: string; count: number }>;
}

export interface ParsedCSVExamen {
  date: string; // DD-MM-YY
  jour: string;
  duree: string; // "02h00"
  debut: string; // "09h00"
  fin: string; // "11h00"
  activite: string; // "WMDS2221=E"
  code: string; // "SECTEUR HÉMATOLOGIE"
  auditoires: string;
  enseignants: string;
  secretariat: string;
}

export interface ExamenImportResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
  warnings: string[];
}
