
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