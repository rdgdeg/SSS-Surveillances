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
    .is('deleted_at', null)
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
    .is('deleted_at', null)
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
      const creneauLabel = `${formatDateForExport(creneau.date_surveillance)} ${creneau.heure_debut_surveillance?.substring(0, 5) || ''}-${creneau.heure_fin_surveillance?.substring(0, 5) || ''}`;
      const isAvailable = availabilityMap.get(`${id}-${creneau.id}`);
      row[creneauLabel] = isAvailable ? 'OK' : '';
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
 * Export planning complet avec attributions (sécurité)
 */
export async function exportPlanningComplet(sessionId: string, sessionName: string) {
  // Get examens with all related data
  const { data: examens, error: examensError } = await supabase
    .from('examens')
    .select(`
      *,
      cours:cours_id (code, intitule_complet, consignes),
      examen_auditoires (
        auditoire,
        nb_surveillants_requis,
        surveillants,
        surveillants_remplaces,
        remarques,
        mode_attribution
      )
    `)
    .eq('session_id', sessionId)
    .order('date_examen, heure_debut');

  if (examensError) throw examensError;

  // Get consignes secrétariat
  const { data: consignesSecretariat } = await supabase
    .from('consignes_secretariat')
    .select('*');

  // Get session info
  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  const timestamp = new Date();
  const dateStr = timestamp.toLocaleDateString('fr-FR');
  const timeStr = timestamp.toLocaleTimeString('fr-FR');

  // Prepare planning data
  const planningData = examens?.map(examen => {
    const consignes = consignesSecretariat?.find(c => 
      c.code_secretariat === examen.secretariat
    );

    // Compile all auditoires and surveillants
    const auditoires = examen.examen_auditoires?.map((aud: any) => {
      const surveillantsActuels = aud.surveillants || [];
      const remplacements = aud.surveillants_remplaces || [];
      
      // Apply replacements
      let surveillantsFinals = [...surveillantsActuels];
      remplacements.forEach((remplacement: any) => {
        const index = surveillantsFinals.findIndex(s => s === remplacement.ancien_id);
        if (index !== -1) {
          surveillantsFinals[index] = remplacement.nouveau_id;
        }
      });

      return {
        auditoire: aud.auditoire,
        surveillants: surveillantsFinals,
        nb_requis: aud.nb_surveillants_requis,
        mode: aud.mode_attribution || 'auditoire',
        remarques: aud.remarques
      };
    }) || [];

    // Format consignes
    let consignesText = '';
    if (examen.is_mode_secretariat) {
      consignesText = 'Mode secrétariat - Consignes communiquées par le secrétariat';
    } else {
      const consignesParts = [];
      
      if (consignes) {
        if (consignes.consignes_arrivee) {
          consignesParts.push(`Arrivée: ${consignes.consignes_arrivee}`);
        }
        if (consignes.consignes_mise_en_place) {
          consignesParts.push(`Mise en place: ${consignes.consignes_mise_en_place}`);
        }
        if (consignes.consignes_generales) {
          consignesParts.push(`Générales: ${consignes.consignes_generales}`);
        }
      }
      
      if (examen.utiliser_consignes_specifiques) {
        if (examen.consignes_specifiques_arrivee) {
          consignesParts.push(`Arrivée spéc.: ${examen.consignes_specifiques_arrivee}`);
        }
        if (examen.consignes_specifiques_mise_en_place) {
          consignesParts.push(`Mise en place spéc.: ${examen.consignes_specifiques_mise_en_place}`);
        }
        if (examen.consignes_specifiques_generales) {
          consignesParts.push(`Générales spéc.: ${examen.consignes_specifiques_generales}`);
        }
      } else if (examen.cours?.consignes) {
        consignesParts.push(`Cours: ${examen.cours.consignes}`);
      }
      
      consignesText = consignesParts.join(' | ');
    }

    return {
      'Date': formatDateForExport(examen.date_examen),
      'Heure début': examen.heure_debut || '',
      'Heure fin': examen.heure_fin || '',
      'Durée (min)': examen.duree_minutes || '',
      'Code examen': examen.code_examen,
      'Nom examen': examen.nom_examen,
      'Code cours': examen.cours?.code || '',
      'Intitulé cours': examen.cours?.intitule_complet || '',
      'Enseignants': Array.isArray(examen.enseignants) ? examen.enseignants.join(', ') : (examen.enseignants || ''),
      'Secrétariat': examen.secretariat || '',
      'Auditoires': auditoires.map(a => a.auditoire).join(', ') || examen.auditoires || '',
      'Surveillants total': auditoires.reduce((sum, a) => sum + (a.surveillants?.length || 0), 0),
      'Surveillants requis': auditoires.reduce((sum, a) => sum + (a.nb_requis || 0), 0) || examen.nb_surveillants_requis || 0,
      'Détail surveillants': auditoires.map(a => 
        `${a.auditoire}: ${(a.surveillants || []).join(', ')} (${a.surveillants?.length || 0}/${a.nb_requis || 0})`
      ).join(' | '),
      'Mode attribution': auditoires.length > 0 ? auditoires[0].mode : 'non défini',
      'Consignes': consignesText,
      'Remarques auditoires': auditoires.map(a => a.remarques).filter(Boolean).join(' | '),
      'Validé': formatBooleanForExport(examen.valide),
      'Créé par': examen.cree_par_email || '',
      'Saisie manuelle': formatBooleanForExport(examen.saisie_manuelle),
    };
  }) || [];

  // Get surveillants data for reference
  const surveillantsData = await exportSurveillants();

  // Get disponibilités summary
  const disponibilitesData = await exportDisponibilites(sessionId);

  // Get créneaux data
  const creneauxData = await exportCreneaux(sessionId);

  // Create metadata sheet
  const metadataData = [{
    'Session': sessionName,
    'Période': session?.period || '',
    'Année': session?.year || '',
    'Date export': dateStr,
    'Heure export': timeStr,
    'Exporté par': 'Système de gestion des surveillances',
    'Nombre examens': planningData.length,
    'Nombre surveillants': surveillantsData.length,
    'Nombre créneaux': creneauxData.length,
    'Nombre soumissions': disponibilitesData.length,
    'Statut session': session?.is_active ? 'Active' : 'Inactive',
    'Soumissions verrouillées': formatBooleanForExport(session?.lock_submissions),
    'Planning visible': formatBooleanForExport(session?.planning_visible),
  }];

  return {
    filename: `Planning_Complet_${sessionName.replace(/\s+/g, '_')}_${timestamp.toISOString().split('T')[0]}_${timestamp.toTimeString().split(' ')[0].replace(/:/g, 'h')}`,
    sheets: [
      { name: 'Métadonnées', data: metadataData },
      { name: 'Planning Examens', data: planningData },
      { name: 'Surveillants', data: surveillantsData },
      { name: 'Créneaux', data: creneauxData },
      { name: 'Disponibilités', data: disponibilitesData.slice(0, 1000) }, // Limit for Excel
    ]
  };
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
