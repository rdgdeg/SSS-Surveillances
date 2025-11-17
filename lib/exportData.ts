import { supabase } from './supabaseClient';
import { 
  formatDateForExport, 
  formatDateTimeForExport, 
  formatBooleanForExport 
} from './exportUtils';

/**
 * Export surveillants data
 */
export async function exportSurveillants() {
  const { data, error } = await supabase
    .from('surveillants')
    .select('*')
    .order('nom, prenom');

  if (error) throw error;

  return data?.map(s => ({
    'Email': s.email,
    'Nom': s.nom,
    'Prénom': s.prenom,
    'Type': s.type,
    'Faculté': s.affectation_faculte || '',
    'Institut': s.affectation_institut || '',
    'Statut salarial': s.statut_salarial || '',
    'ETP Total': s.etp_total || '',
    'ETP Recherche': s.etp_recherche || '',
    'ETP Autre': s.etp_autre || '',
    'Catégorie présence': s.categorie_presence || '',
    'Téléphone': s.telephone || '',
    'Quota surveillances': s.quota_surveillances || '',
    'Actif': formatBooleanForExport(s.is_active),
    'Dispensé': formatBooleanForExport(s.dispense_surveillance),
  })) || [];
}

/**
 * Export examens for a session
 */
export async function exportExamens(sessionId: string) {
  const { data, error } = await supabase
    .from('examens')
    .select(`
      *,
      cours:cours_id (code, intitule_complet)
    `)
    .eq('session_id', sessionId)
    .order('date, heure_debut');

  if (error) throw error;

  return data?.map(e => ({
    'Code examen': e.code_examen,
    'Nom examen': e.nom_examen,
    'Code cours': e.cours?.code || '',
    'Intitulé cours': e.cours?.intitule_complet || '',
    'Date': formatDateForExport(e.date),
    'Heure début': e.heure_debut || '',
    'Heure fin': e.heure_fin || '',
    'Local': e.local || '',
    'Nombre étudiants': e.nombre_etudiants || 0,
    'Surveillants requis': e.surveillants_requis || 0,
    'Type': e.type_examen || '',
    'Remarques': e.remarques || '',
  })) || [];
}

/**
 * Export disponibilités for a session (format liste)
 */
export async function exportDisponibilites(sessionId: string) {
  const { data: soumissions, error } = await supabase
    .from('soumissions_disponibilites')
    .select(`
      *,
      historique_disponibilites
    `)
    .eq('session_id', sessionId)
    .order('nom, prenom');

  if (error) throw error;

  // Get all creneaux for the session
  const { data: creneaux } = await supabase
    .from('creneaux')
    .select('*')
    .eq('session_id', sessionId)
    .order('date_surveillance, heure_debut_surveillance');

  const creneauxMap = new Map(creneaux?.map(c => [c.id, c]) || []);

  const rows: any[] = [];

  soumissions?.forEach(soumission => {
    const baseInfo = {
      'Email': soumission.email,
      'Nom': soumission.nom,
      'Prénom': soumission.prenom,
      'Type': soumission.type_surveillant,
      'Remarque générale': soumission.remarque_generale || '',
      'Date soumission': formatDateTimeForExport(soumission.submitted_at),
    };

    // Add availability for each créneau
    soumission.historique_disponibilites?.forEach((dispo: any) => {
      const creneau = creneauxMap.get(dispo.creneau_id);
      if (creneau) {
        rows.push({
          ...baseInfo,
          'Date créneau': formatDateForExport(creneau.date_surveillance),
          'Heure début': creneau.heure_debut_surveillance || '',
          'Heure fin': creneau.heure_fin_surveillance || '',
          'Type créneau': creneau.type_creneau,
          'Disponible': formatBooleanForExport(dispo.est_disponible),
        });
      }
    });
  });

  return rows;
}

/**
 * Export disponibilités en format matriciel (surveillants x créneaux)
 */
export async function exportDisponibilitesMatriciel(sessionId: string) {
  const { data: soumissions, error } = await supabase
    .from('soumissions_disponibilites')
    .select(`
      *,
      historique_disponibilites
    `)
    .eq('session_id', sessionId)
    .order('nom, prenom');

  if (error) throw error;

  // Get all creneaux for the session
  const { data: creneaux } = await supabase
    .from('creneaux')
    .select('*')
    .eq('session_id', sessionId)
    .order('date_surveillance, heure_debut_surveillance');

  if (!creneaux || creneaux.length === 0) return [];

  // Create availability map
  const availabilityMap = new Map<string, boolean>();
  soumissions?.forEach(soumission => {
    const id = soumission.surveillant_id || soumission.email;
    soumission.historique_disponibilites?.forEach((dispo: any) => {
      availabilityMap.set(`${id}-${dispo.creneau_id}`, dispo.est_disponible);
    });
  });

  // Build rows with surveillant info + one column per créneau
  const rows = soumissions?.map(soumission => {
    const id = soumission.surveillant_id || soumission.email;
    const row: any = {
      'Nom': soumission.nom,
      'Prénom': soumission.prenom,
      'Email': soumission.email,
      'Type': soumission.type_surveillant,
      'Nb créneaux': soumission.historique_disponibilites?.filter((d: any) => d.est_disponible).length || 0,
    };

    // Add one column per créneau
    creneaux.forEach(creneau => {
      const creneauLabel = `${formatDateForExport(creneau.date_surveillance)} ${creneau.heure_debut_surveillance?.substring(0, 5) || ''}`;
      const isAvailable = availabilityMap.get(`${id}-${creneau.id}`);
      row[creneauLabel] = isAvailable ? '✓' : '';
    });

    return row;
  }) || [];

  return rows;
}

/**
 * Export cours
 */
export async function exportCours() {
  const { data, error } = await supabase
    .from('cours')
    .select('*')
    .order('code');

  if (error) throw error;

  return data?.map(c => ({
    'Code': c.code,
    'Intitulé complet': c.intitule_complet,
    'Consignes': c.consignes || '',
    'Date création': formatDateForExport(c.created_at),
  })) || [];
}

/**
 * Export présences enseignants for a session
 */
export async function exportPresencesEnseignants(sessionId: string) {
  const { data, error } = await supabase
    .from('presences_enseignants')
    .select(`
      *,
      cours:cours_id (code, intitule_complet)
    `)
    .eq('session_id', sessionId)
    .order('cours(code)');

  if (error) throw error;

  return data?.map(p => ({
    'Code cours': p.cours?.code || '',
    'Intitulé cours': p.cours?.intitule_complet || '',
    'Email enseignant': p.enseignant_email,
    'Nom': p.enseignant_nom,
    'Prénom': p.enseignant_prenom,
    'Présent': formatBooleanForExport(p.est_present),
    'Nb surveillants accompagnants': p.nb_surveillants_accompagnants || 0,
    'Noms accompagnants': p.noms_accompagnants || '',
    'Remarque': p.remarque || '',
    'Date soumission': formatDateTimeForExport(p.submitted_at),
  })) || [];
}

/**
 * Export créneaux for a session
 */
export async function exportCreneaux(sessionId: string) {
  const { data, error } = await supabase
    .from('creneaux')
    .select('*')
    .eq('session_id', sessionId)
    .order('date_surveillance, heure_debut_surveillance');

  if (error) throw error;

  return data?.map(c => ({
    'Date': formatDateForExport(c.date_surveillance),
    'Heure début': c.heure_debut_surveillance || '',
    'Heure fin': c.heure_fin_surveillance || '',
    'Type': c.type_creneau,
    'Surveillants requis': c.nb_surveillants_requis || 0,
    'Date création': formatDateForExport(c.created_at),
  })) || [];
}

/**
 * Export complete session data (multi-sheet)
 */
export async function exportSessionComplete(sessionId: string, sessionName: string) {
  const [
    examens,
    disponibilites,
    presences,
    creneaux
  ] = await Promise.all([
    exportExamens(sessionId),
    exportDisponibilites(sessionId),
    exportPresencesEnseignants(sessionId),
    exportCreneaux(sessionId)
  ]);

  return {
    filename: `session-${sessionName}-${new Date().toISOString().split('T')[0]}`,
    sheets: [
      { name: 'Examens', data: examens },
      { name: 'Créneaux', data: creneaux },
      { name: 'Disponibilités', data: disponibilites },
      { name: 'Présences enseignants', data: presences },
    ]
  };
}
