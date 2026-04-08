import { supabase } from './supabaseClient';
import {
  Cours,
  Examen,
  PresenceEnseignant,
  NotificationAdmin,
  CoursWithPresence,
  PresenceFormData
} from '../types';

// ============================================
// Fonctions API pour les présences enseignants (basées sur cours)
// ============================================

/**
 * Recherche de cours par code ou nom
 * @param query Terme de recherche (code ou nom)
 * @returns Liste des cours correspondants
 */
export async function searchCours(query: string): Promise<Cours[]> {
  const searchTerm = `%${query}%`;
  
  const { data, error } = await supabase
    .from('cours')
    .select('*')
    .or(`code.ilike.${searchTerm},intitule_complet.ilike.${searchTerm}`)
    .order('code');
  
  if (error) {
    console.error('Error searching cours:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Récupère un cours par son ID
 * @param id ID du cours
 * @returns Cours ou null si non trouvé
 */
export async function getCoursById(id: string): Promise<Cours | null> {
  const { data, error } = await supabase
    .from('cours')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching cours:', error);
    throw error;
  }
  
  return data;
}

/**
 * Soumet une déclaration de présence pour un cours
 * @param coursId ID du cours
 * @param sessionId ID de la session
 * @param data Données du formulaire
 * @returns Présence créée ou mise à jour
 */
export async function submitPresence(
  coursId: string,
  sessionId: string,
  data: PresenceFormData,
  examenId?: string | null
): Promise<PresenceEnseignant> {
  const presenceData = {
    cours_id: coursId,
    session_id: sessionId,
    examen_id: examenId ?? null,
    enseignant_email: data.enseignant_email.toLowerCase(),
    enseignant_nom: data.enseignant_nom,
    enseignant_prenom: data.enseignant_prenom,
    est_present: data.est_present,
    type_presence: data.type_presence,
    type_examen: data.type_examen,
    type_examen_autre: data.type_examen_autre || null,
    travail_date_depot: data.travail_date_depot || null,
    travail_en_presentiel: data.travail_en_presentiel || null,
    travail_bureau: data.travail_bureau || null,
    duree_examen_moins_2h: (data as any).duree_examen_moins_2h || false,
    duree_examen_minutes: (data as any).duree_examen_minutes || 120,
    nb_surveillants_accompagnants: data.nb_surveillants_accompagnants,
    noms_accompagnants: data.noms_accompagnants || null,
    remarque: data.remarque || null
  };
  
  const emailLower = data.enseignant_email.toLowerCase();

  // Check if presence already exists (priorité à examen_id si fourni)
  let existingQuery = supabase.from('presences_enseignants').select('id');
  if (examenId) {
    existingQuery = existingQuery.eq('examen_id', examenId).eq('enseignant_email', emailLower);
  } else {
    existingQuery = existingQuery
      .eq('cours_id', coursId)
      .eq('session_id', sessionId)
      .eq('enseignant_email', emailLower);
  }
  const { data: existing } = await existingQuery.maybeSingle();

  let presence;
  
  if (existing) {
    // Update existing presence
    const { data: updated, error } = await supabase
      .from('presences_enseignants')
      .update(presenceData)
      .eq('id', existing.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating presence:', error);
      throw error;
    }
    presence = updated;
  } else {
    // Insert new presence
    const { data: inserted, error } = await supabase
      .from('presences_enseignants')
      .insert(presenceData)
      .select()
      .single();
    
    if (error) {
      console.error('Error inserting presence:', error);
      throw error;
    }
    presence = inserted;
  }

  if (!presence) {
    throw new Error('Failed to create or update presence');
  }

  // Si une remarque est fournie, l'ajouter aux consignes du cours
  if (data.remarque && data.remarque.trim()) {
    await addRemarqueToCoursConsignes(coursId, data.remarque, data.enseignant_email, data.enseignant_nom, data.enseignant_prenom);
  }
  
  return presence;
}

/**
 * Ajoute une remarque aux consignes d'un cours
 * @param coursId ID du cours
 * @param remarque Remarque à ajouter
 * @param email Email de l'enseignant
 * @param nom Nom de l'enseignant
 * @param prenom Prénom de l'enseignant
 */
async function addRemarqueToCoursConsignes(
  coursId: string,
  remarque: string,
  email: string,
  nom: string,
  prenom: string
): Promise<void> {
  // Récupérer le cours actuel
  const { data: cours, error: fetchError } = await supabase
    .from('cours')
    .select('code, intitule_complet, consignes')
    .eq('id', coursId)
    .single();

  if (fetchError) {
    console.error('Error fetching cours for remarque:', fetchError);
    return; // Ne pas bloquer la soumission
  }

  // Préparer la nouvelle remarque avec horodatage
  const date = new Date().toLocaleDateString('fr-FR');
  const nouvelleRemarque = `\n\n--- Remarque de ${prenom} ${nom} (${date}) ---\n${remarque}`;
  
  // Ajouter la remarque aux consignes existantes
  const consignesUpdated = (cours.consignes || '') + nouvelleRemarque;

  // Mettre à jour le cours
  const { error: updateError } = await supabase
    .from('cours')
    .update({ consignes: consignesUpdated })
    .eq('id', coursId);

  if (updateError) {
    console.error('Error updating cours consignes:', updateError);
    // Ne pas bloquer la soumission
  }

  // Créer aussi un message pour l'admin
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id')
    .eq('is_active', true)
    .single();

  if (sessions) {
    const newMessage = {
      session_id: sessions.id,
      expediteur_email: email.toLowerCase(),
      expediteur_nom: nom,
      expediteur_prenom: prenom,
      sujet: `Remarque enseignant - ${cours.code}`,
      contenu: `Cours: ${cours.code} - ${cours.intitule_complet}\n\nRemarque:\n${remarque}`,
      lu: false,
      archive: false,
      priorite: 'normale',
    };
    
    await supabase.from('messages').insert(newMessage);
  }
}

/**
 * Récupère la présence existante d'un enseignant pour un cours
 * @param coursId ID du cours
 * @param sessionId ID de la session
 * @param enseignantEmail Email de l'enseignant
 * @returns Présence ou null si non trouvée
 */
export async function getExistingPresence(
  coursId: string,
  sessionId: string,
  enseignantEmail: string,
  examenId?: string | null
): Promise<PresenceEnseignant | null> {
  let q = supabase.from('presences_enseignants').select('*');
  if (examenId) {
    q = q.eq('examen_id', examenId).eq('enseignant_email', enseignantEmail.toLowerCase());
  } else {
    q = q
      .eq('cours_id', coursId)
      .eq('session_id', sessionId)
      .eq('enseignant_email', enseignantEmail.toLowerCase());
  }
  const { data, error } = await q.maybeSingle();
  
  if (error) {
    console.error('Error fetching presence:', error);
    throw error;
  }
  
  return data;
}

/**
 * Récupère tous les cours avec leurs présences pour une session
 * @param sessionId ID de la session
 * @returns Liste des cours avec présences
 */
export async function getCoursWithPresences(
  sessionId: string
): Promise<CoursWithPresence[]> {
  try {
    // Fetch courses with pagination
    let allCours: Cours[] = [];
    let page = 0;
    const pageSize = 25;
    
    while (true) {
      const { data: coursPage, error: coursError } = await supabase
        .from('cours')
        .select('*')
        .order('code')
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (coursError) throw coursError;
      if (!coursPage || coursPage.length === 0) break;
      
      allCours.push(...coursPage);
      if (coursPage.length < pageSize) break;
      page++;
    }
    
    if (allCours.length === 0) return [];
    
    // Fetch presences with pagination (by session only, not by cours_id)
    let allPresences: PresenceEnseignant[] = [];
    page = 0;
    
    while (true) {
      const { data: presencesPage, error: presencesError } = await supabase
        .from('presences_enseignants')
        .select('*')
        .eq('session_id', sessionId)
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (presencesError) throw presencesError;
      if (!presencesPage || presencesPage.length === 0) break;
      
      allPresences.push(...presencesPage);
      if (presencesPage.length < pageSize) break;
      page++;
    }
    
    // Group presences by cours
    const presencesByCours = new Map<string, PresenceEnseignant[]>();
    allPresences.forEach(p => {
      if (!presencesByCours.has(p.cours_id)) {
        presencesByCours.set(p.cours_id, []);
      }
      presencesByCours.get(p.cours_id)!.push(p);
    });
    
    // Build result
    return allCours.map(c => {
      const coursPresences = presencesByCours.get(c.id) || [];
      const nb_enseignants_presents = coursPresences.filter(p => p.est_present).length;
      // Total surveillants = tous les surveillants déclarés (présents ou absents)
      const nb_surveillants_accompagnants_total = coursPresences
        .reduce((sum, p) => sum + (p.nb_surveillants_accompagnants || 0), 0);
      
      return {
        ...c,
        session_id: sessionId,
        presences: coursPresences,
        nb_presences_declarees: coursPresences.length,
        nb_enseignants_presents,
        nb_surveillants_accompagnants_total
      };
    });
  } catch (error) {
    console.error('Error in getCoursWithPresences:', error);
    throw error;
  }
}

// ============================================
// Fonctions API pour les notifications admin
// ============================================

/**
 * Récupère les notifications admin non lues
 * @returns Liste des notifications non lues
 */
export async function getUnreadNotifications(): Promise<NotificationAdmin[]> {
  const { data, error } = await supabase
    .from('notifications_admin')
    .select('*')
    .eq('lu', false)
    .eq('archive', false)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Marque une notification comme lue
 * @param id ID de la notification
 */
export async function markNotificationAsRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications_admin')
    .update({ lu: true })
    .eq('id', id);
  
  if (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Archive une notification
 * @param id ID de la notification
 */
export async function archiveNotification(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications_admin')
    .update({ archive: true })
    .eq('id', id);
  
  if (error) {
    console.error('Error archiving notification:', error);
    throw error;
  }
}

/**
 * Supprime une présence enseignant
 * @param id ID de la présence à supprimer
 */
export async function deletePresence(id: string): Promise<void> {
  const { error } = await supabase
    .from('presences_enseignants')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting presence:', error);
    throw error;
  }
}

/**
 * Examens de la session avec cours (filtres enseignant / secours)
 */
export async function getExamensWithCoursForSession(sessionId: string): Promise<Examen[]> {
  const { data, error } = await supabase
    .from('examens')
    .select('*, cours(*)')
    .eq('session_id', sessionId)
    .order('date_examen', { ascending: true, nullsFirst: false })
    .order('heure_debut', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data || []) as Examen[];
}

/** Libellés uniques issus des colonnes enseignants (Excel) */
export function collectUniqueTeacherLabelsFromExamens(examens: Pick<Examen, 'enseignants'>[]): string[] {
  const set = new Set<string>();
  examens.forEach((e) => {
    (e.enseignants || []).forEach((t) => {
      const s = String(t).trim();
      if (s) set.add(s);
    });
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
}

export function filterExamensByTeacherLabel(examens: Examen[], label: string): Examen[] {
  const L = label.trim().toLowerCase();
  return examens.filter((e) =>
    (e.enseignants || []).some((t) => String(t).trim().toLowerCase() === L)
  );
}

export interface RelanceNonRepondantRow {
  email: string;
  code_examen: string;
  nom_examen: string;
}

/**
 * Enseignants attendus sur l'examen (colonne enseignants) sans ligne de présence liée à cet examen (examen_id).
 * Les filtres suivent la page admin (faculté du cours, secrétariat, examen précis).
 */
export async function getRelanceNonRepondantsEmails(
  sessionId: string,
  opts?: { faculte?: string; secretariat?: string; examenId?: string }
): Promise<RelanceNonRepondantRow[]> {
  let q = supabase
    .from('examens')
    .select('id, code_examen, nom_examen, enseignants, secretariat, cours_id, cours(faculte)')
    .eq('session_id', sessionId);

  if (opts?.examenId) {
    q = q.eq('id', opts.examenId);
  }

  const { data: examens, error: exErr } = await q;
  if (exErr) throw exErr;
  if (!examens?.length) return [];

  let list = examens as Array<{
    id: string;
    code_examen: string;
    nom_examen: string;
    enseignants: string[] | null;
    secretariat: string | null;
    cours_id: string | null;
    cours: { faculte: string | null } | null;
  }>;

  if (opts?.faculte?.trim()) {
    const f = opts.faculte.trim();
    list = list.filter((e) => (e.cours?.faculte || '') === f);
  }

  if (opts?.secretariat) {
    const sec = opts.secretariat;
    if (sec === 'NON_ASSIGNE') {
      list = list.filter((e) => !e.secretariat || String(e.secretariat).trim() === '');
    } else {
      list = list.filter((e) => e.secretariat === sec);
    }
  }

  const examIds = list.map((e) => e.id);
  if (examIds.length === 0) return [];

  const { data: presences, error: pErr } = await supabase
    .from('presences_enseignants')
    .select('examen_id, enseignant_email')
    .eq('session_id', sessionId)
    .in('examen_id', examIds);

  if (pErr) throw pErr;

  const declaredByExamen = new Map<string, Set<string>>();
  (presences || []).forEach((p) => {
    if (!p.examen_id) return;
    if (!declaredByExamen.has(p.examen_id)) {
      declaredByExamen.set(p.examen_id, new Set());
    }
    declaredByExamen.get(p.examen_id)!.add(String(p.enseignant_email).toLowerCase());
  });

  const rows: RelanceNonRepondantRow[] = [];

  for (const ex of list) {
    const expected = (ex.enseignants || [])
      .map((x) => String(x).trim().toLowerCase())
      .filter(Boolean);
    const declared = declaredByExamen.get(ex.id) || new Set<string>();
    for (const email of expected) {
      if (!declared.has(email)) {
        rows.push({
          email,
          code_examen: ex.code_examen,
          nom_examen: ex.nom_examen
        });
      }
    }
  }

  return rows;
}
