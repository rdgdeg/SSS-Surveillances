import { supabase } from '../lib/supabaseClient';
import { Session, Creneau, Surveillant, SoumissionDisponibilite, Message } from '../types';
import * as auditLogger from './auditLogger';

// --- Public API Functions ---

interface SessionWithCreneaux extends Session {
    creneaux_surveillance: Creneau[];
}

export async function getActiveSessionWithCreneaux(): Promise<SessionWithCreneaux | null> {
    const { data: activeSession, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();

    if (sessionError || !activeSession) {
        if (sessionError && sessionError.code !== 'PGRST116') console.error('Error fetching active session:', sessionError);
        return null;
    }

    const { data: creneaux, error: creneauxError } = await supabase
        .from('creneaux')
        .select('*')
        .eq('session_id', activeSession.id);

    if (creneauxError) {
        console.error('Error fetching creneaux:', creneauxError);
        throw creneauxError;
    }

    return {
        ...activeSession,
        creneaux_surveillance: creneaux || [],
    };
}

export async function findSurveillantByEmail(email: string): Promise<Surveillant | null> {
    const { data, error } = await supabase
        .from('surveillants')
        .select('*')
        .eq('email', email.toLowerCase())
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error finding surveillant:', error);
        throw error;
    }
    return data;
}

export async function getExistingSubmission(sessionId: string, email: string): Promise<SoumissionDisponibilite | null> {
    const { data, error } = await supabase
        .from('soumissions_disponibilites')
        .select('*')
        .eq('session_id', sessionId)
        .eq('email', email.toLowerCase())
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error finding existing submission:', error);
        throw error;
    }
    return data;
}

interface SubmissionPayload {
    session_id: string;
    surveillant_id: string | null;
    email: string;
    nom: string;
    prenom: string;
    type_surveillant: string;
    remarque_generale?: string;
    availabilities: { creneau_id: string, est_disponible: boolean }[];
}

export async function submitAvailability(payload: SubmissionPayload): Promise<any> {
    const { availabilities, ...submissionData } = payload;
    
    const submissionToUpsert = {
        session_id: submissionData.session_id,
        surveillant_id: submissionData.surveillant_id,
        email: submissionData.email,
        nom: submissionData.nom,
        prenom: submissionData.prenom,
        type_surveillant: submissionData.type_surveillant,
        remarque_generale: submissionData.remarque_generale,
        historique_disponibilites: availabilities,
        submitted_at: new Date().toISOString(),
    };
    
    const { data, error: upsertError } = await supabase
        .from('soumissions_disponibilites')
        .upsert(submissionToUpsert, { onConflict: 'session_id, email' })
        .select()
        .single();

    if (upsertError) {
        console.error("Error submitting availability:", upsertError);
        throw upsertError;
    }
    
    if (payload.remarque_generale) {
        const newMessage = {
            session_id: payload.session_id,
            expediteur_email: payload.email,
            expediteur_nom: payload.nom,
            expediteur_prenom: payload.prenom,
            sujet: `Remarque de ${payload.prenom} ${payload.nom}`,
            contenu: payload.remarque_generale,
            lu: false,
            archive: false,
            priorite: 'normale',
        };
        const { error: messageError } = await supabase.from('messages').insert(newMessage);
        if (messageError) console.error("Error creating message from remark:", messageError);
    }

    return { success: true, id: data.id };
}


// --- Admin API Functions ---

export async function getDashboardStats() {
    const { data: activeSession, error: sessionError } = await supabase
        .from('sessions')
        .select('id')
        .eq('is_active', true)
        .single();
        
    const { count: totalSurveillants, error: surveillantsError } = await supabase
        .from('surveillants')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
        
    if (sessionError || surveillantsError) {
        console.error(sessionError || surveillantsError);
    }
        
    if (!activeSession) {
        return { totalSurveillants: totalSurveillants ?? 0, totalSubmissions: 0, submissionRate: 0, availableCount: 0, availabilityRate: 0 };
    }

    const { count: totalSubmissions, error: submissionsError } = await supabase
        .from('soumissions_disponibilites')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', activeSession.id);
        
    const { data: submissionsForSession, error: submissionsDataError } = await supabase
        .from('soumissions_disponibilites')
        .select('historique_disponibilites')
        .eq('session_id', activeSession.id);

    const { count: totalCreneaux, error: creneauxError } = await supabase
        .from('creneaux')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', activeSession.id);

    const tSurveillants = totalSurveillants ?? 0;
    const tSubmissions = totalSubmissions ?? 0;

    const submissionRate = tSurveillants > 0 ? (tSubmissions / tSurveillants) * 100 : 0;

    const availableCount = (submissionsForSession || []).reduce((acc, sub) => {
        return acc + (sub.historique_disponibilites || []).filter((h: any) => h.est_disponible).length;
    }, 0);
    
    const totalPossibleAvailabilities = (totalCreneaux ?? 0) * tSubmissions;
    const availabilityRate = totalPossibleAvailabilities > 0 ? (availableCount / totalPossibleAvailabilities) * 100 : 0;

    return { totalSurveillants: tSurveillants, totalSubmissions: tSubmissions, submissionRate, availableCount, availabilityRate };
}

// Surveillants
export async function getSurveillants(): Promise<Surveillant[]> {
    const { data, error } = await supabase.from('surveillants').select('*').order('nom', { ascending: true });
    if (error) throw error;
    return data;
}

export async function createSurveillant(surveillant: Partial<Surveillant>): Promise<Surveillant> {
    const { data, error } = await supabase.from('surveillants').insert(surveillant).select().single();
    if (error) throw error;
    return data;
}

export async function updateSurveillant(id: string, updates: Partial<Surveillant>): Promise<Surveillant> {
    const { data, error } = await supabase.from('surveillants').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
}

export async function deleteSurveillant(id: string): Promise<void> {
    const { error } = await supabase.from('surveillants').delete().eq('id', id);
    if (error) throw error;
}

// Sessions
export async function getSessions(): Promise<Session[]> {
    const { data, error } = await supabase.from('sessions').select('*').order('year', { ascending: false }).order('period', { ascending: true });
    if (error) throw error;
    return data;
}

export async function createSession(session: Partial<Session>): Promise<Session> {
    if (session.is_active) {
        const { error: updateError } = await supabase.from('sessions').update({ is_active: false }).eq('is_active', true);
        if (updateError) throw updateError;
    }
    const { data, error } = await supabase.from('sessions').insert(session).select().single();
    if (error) throw error;
    return data;
}

export async function updateSession(id: string, updates: Partial<Session>): Promise<Session> {
    if (updates.is_active) {
        const { error: updateError } = await supabase.from('sessions').update({ is_active: false }).eq('is_active', true).neq('id', id);
        if (updateError) throw updateError;
    }
    const { data, error } = await supabase.from('sessions').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
}

export async function duplicateSession(session: Session): Promise<Session> {
    const newSessionData: Partial<Session> = {
        ...session,
        name: `[COPIE] ${session.name}`,
        is_active: false,
    };
    delete newSessionData.id;
    delete newSessionData.created_at;
    return await createSession(newSessionData);
}

// Creneaux
export async function getCreneauxBySession(sessionId: string): Promise<Creneau[]> {
    const { data, error } = await supabase.from('creneaux').select('*').eq('session_id', sessionId).order('date_surveillance').order('heure_debut_surveillance');
    if (error) throw error;
    return data;
}

export async function createCreneau(creneau: Partial<Creneau>): Promise<Creneau> {
    const { data, error } = await supabase.from('creneaux').insert(creneau).select().single();
    if (error) throw error;
    return data;
}

export async function updateCreneau(id: string, updates: Partial<Creneau>): Promise<Creneau> {
    const { data, error } = await supabase.from('creneaux').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
}

export async function deleteCreneau(id: string): Promise<void> {
    const { error } = await supabase.from('creneaux').delete().eq('id', id);
    if (error) throw error;
}

// Messages
export async function getMessages(): Promise<Message[]> {
    const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function updateMessageStatus(id: string, updates: Partial<Message>): Promise<Message> {
    const { data, error } = await supabase.from('messages').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
}

// Disponibilites (Admin View)
export async function getDisponibilitesData() {
    const { data: activeSession, error: sessionError } = await supabase.from('sessions').select('*').eq('is_active', true).single();
    if (sessionError || !activeSession) {
        return { creneaux: [], soumissions: [], activeSessionName: null };
    }
    const { data: creneaux, error: cError } = await supabase.from('creneaux').select('*').eq('session_id', activeSession.id).order('date_surveillance').order('heure_debut_surveillance');
    const { data: soumissions, error: sError } = await supabase.from('soumissions_disponibilites').select('*').eq('session_id', activeSession.id);

    if (cError || sError) throw cError || sError;
    return { creneaux: creneaux || [], soumissions: soumissions || [], activeSessionName: activeSession.name };
}

// Soumissions (Admin)
export async function getSubmissionStatusData(): Promise<{ soumissions: SoumissionDisponibilite[], allActiveSurveillants: Surveillant[], activeSessionName: string | null }> {
    const { data: activeSession, error: sessionError } = await supabase.from('sessions').select('*').eq('is_active', true).single();
    const { data: allActiveSurveillants, error: survError } = await supabase.from('surveillants').select('*').eq('is_active', true);
    if (survError) throw survError;
    if (sessionError || !activeSession) {
        return { soumissions: [], allActiveSurveillants: allActiveSurveillants || [], activeSessionName: null };
    }
    const { data: soumissions, error: subError } = await supabase.from('soumissions_disponibilites').select('*').eq('session_id', activeSession.id);
    if (subError) throw subError;
    return { soumissions: soumissions || [], allActiveSurveillants: allActiveSurveillants || [], activeSessionName: activeSession.name };
}

export async function deleteSoumission(id: string): Promise<void> {
    // Récupérer les infos avant suppression pour l'audit
    const { data: submission } = await supabase
        .from('soumissions_disponibilites')
        .select('email, surveillant_id, session_id')
        .eq('id', id)
        .single();

    const { error } = await supabase.from('soumissions_disponibilites').delete().eq('id', id);
    if (error) throw error;

    // Logger la suppression
    if (submission) {
        await auditLogger.log({
            operation: 'delete',
            entity: 'submission',
            entity_id: id,
            user_email: submission.email,
            user_id: submission.surveillant_id || undefined,
            details: {
                session_id: submission.session_id,
                deleted_by: 'admin', // À améliorer avec l'authentification admin
            },
        });
    }
}

export async function updateSoumissionRemark(id: string, remarque_generale: string): Promise<SoumissionDisponibilite> {
    const { data, error } = await supabase.from('soumissions_disponibilites').update({ remarque_generale }).eq('id', id).select().single();
    if (error) throw error;
    return data;
}

export async function updateSoumissionDisponibilites(id: string, historique_disponibilites: any[]): Promise<SoumissionDisponibilite> {
    const { data, error } = await supabase
        .from('soumissions_disponibilites')
        .update({ historique_disponibilites })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

// --- Capacity Management API Functions (Admin only) ---

/**
 * Met à jour la capacité requise d'un créneau
 * @param id ID du créneau
 * @param nb_surveillants_requis Nombre de surveillants requis (1-20) ou null pour supprimer
 */
export async function updateCreneauCapacity(
  id: string, 
  nb_surveillants_requis: number | null
): Promise<Creneau> {
  // Validation côté client
  if (nb_surveillants_requis !== null && (nb_surveillants_requis < 1 || nb_surveillants_requis > 20)) {
    throw new Error('La capacité doit être un nombre entre 1 et 20');
  }

  const { data, error } = await supabase
    .from('creneaux')
    .update({ nb_surveillants_requis })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Récupère les créneaux avec leurs statistiques de remplissage
 * Utilise la vue v_creneaux_with_stats pour les performances
 * @param sessionId ID de la session
 */
export async function getCreneauxWithStats(sessionId: string): Promise<import('../types').CreneauWithStats[]> {
  const { data, error } = await supabase
    .from('v_creneaux_with_stats')
    .select('*')
    .eq('session_id', sessionId)
    .order('date_surveillance')
    .order('heure_debut_surveillance');

  if (error) throw error;

  // Calculer le statut de remplissage côté client
  return (data || []).map(creneau => {
    let statut_remplissage: import('../types').StatutRemplissage = 'non-defini';
    
    if (creneau.nb_surveillants_requis && creneau.taux_remplissage !== null) {
      if (creneau.taux_remplissage < 50) {
        statut_remplissage = 'critique';
      } else if (creneau.taux_remplissage < 100) {
        statut_remplissage = 'alerte';
      } else {
        statut_remplissage = 'ok';
      }
    }

    return {
      ...creneau,
      statut_remplissage
    };
  });
}

/**
 * Calcule les statistiques globales de capacité pour une session
 * @param creneaux Liste des créneaux avec statistiques
 */
export function calculateCapacityStats(creneaux: import('../types').CreneauWithStats[]): import('../types').CapacityStats {
  const creneauxAvecCapacite = creneaux.filter(c => c.nb_surveillants_requis);
  
  if (creneauxAvecCapacite.length === 0) {
    return {
      total_creneaux_avec_capacite: 0,
      creneaux_critiques: 0,
      creneaux_alerte: 0,
      creneaux_ok: 0,
      taux_remplissage_moyen: 0
    };
  }

  const stats = {
    total_creneaux_avec_capacite: creneauxAvecCapacite.length,
    creneaux_critiques: creneauxAvecCapacite.filter(c => c.statut_remplissage === 'critique').length,
    creneaux_alerte: creneauxAvecCapacite.filter(c => c.statut_remplissage === 'alerte').length,
    creneaux_ok: creneauxAvecCapacite.filter(c => c.statut_remplissage === 'ok').length,
    taux_remplissage_moyen: 0
  };

  // Calculer la moyenne des taux de remplissage
  const somme = creneauxAvecCapacite.reduce((acc, c) => acc + (c.taux_remplissage || 0), 0);
  stats.taux_remplissage_moyen = somme / creneauxAvecCapacite.length;

  return stats;
}

/**
 * Met à jour la capacité de plusieurs créneaux en une seule opération
 * @param creneauIds Liste des IDs des créneaux à mettre à jour
 * @param nb_surveillants_requis Capacité à appliquer
 */
export async function bulkUpdateCreneauCapacity(
  creneauIds: string[], 
  nb_surveillants_requis: number
): Promise<import('../types').BulkUpdateResult> {
  // Validation
  if (nb_surveillants_requis < 1 || nb_surveillants_requis > 20) {
    throw new Error('La capacité doit être un nombre entre 1 et 20');
  }

  if (creneauIds.length === 0) {
    return { success: 0, errors: [] };
  }

  const errors: string[] = [];
  let successCount = 0;

  // Mettre à jour en batch (Supabase supporte les updates avec .in())
  try {
    const { data, error } = await supabase
      .from('creneaux')
      .update({ nb_surveillants_requis })
      .in('id', creneauIds)
      .select();

    if (error) {
      throw error;
    }

    successCount = data?.length || 0;

    // Si certains créneaux n'ont pas été mis à jour
    if (successCount < creneauIds.length) {
      const updatedIds = new Set(data?.map(c => c.id) || []);
      const failedIds = creneauIds.filter(id => !updatedIds.has(id));
      errors.push(`${failedIds.length} créneau(x) n'ont pas pu être mis à jour`);
    }
  } catch (error) {
    console.error('Bulk update error:', error);
    errors.push(`Erreur lors de la mise à jour: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }

  return { success: successCount, errors };
}

/**
 * Copie les capacités d'une session source vers une session cible
 * Les créneaux sont appariés par date et heure
 * @param sourceSessionId ID de la session source
 * @param targetSessionId ID de la session cible
 */
export async function copyCapacitiesFromSession(
  sourceSessionId: string,
  targetSessionId: string
): Promise<import('../types').CopyCapacityResult> {
  // Récupérer les créneaux de la session source avec capacité définie
  const { data: sourceCreneaux, error: sourceError } = await supabase
    .from('creneaux')
    .select('*')
    .eq('session_id', sourceSessionId)
    .not('nb_surveillants_requis', 'is', null);

  if (sourceError) {
    throw new Error(`Erreur lors de la récupération de la session source: ${sourceError.message}`);
  }

  if (!sourceCreneaux || sourceCreneaux.length === 0) {
    return { copied: 0, skipped: 0, errors: ['Aucun créneau avec capacité définie dans la session source'] };
  }

  // Récupérer les créneaux de la session cible
  const { data: targetCreneaux, error: targetError } = await supabase
    .from('creneaux')
    .select('*')
    .eq('session_id', targetSessionId);

  if (targetError) {
    throw new Error(`Erreur lors de la récupération de la session cible: ${targetError.message}`);
  }

  if (!targetCreneaux || targetCreneaux.length === 0) {
    return { copied: 0, skipped: 0, errors: ['Aucun créneau dans la session cible'] };
  }

  // Créer un map des créneaux source par date+heure
  const sourceMap = new Map<string, number>();
  sourceCreneaux.forEach(c => {
    if (c.date_surveillance && c.heure_debut_surveillance && c.nb_surveillants_requis) {
      const key = `${c.date_surveillance}_${c.heure_debut_surveillance}`;
      sourceMap.set(key, c.nb_surveillants_requis);
    }
  });

  // Trouver les correspondances et mettre à jour
  const updates: Array<{ id: string; capacity: number }> = [];
  let skipped = 0;

  targetCreneaux.forEach(c => {
    if (c.date_surveillance && c.heure_debut_surveillance) {
      const key = `${c.date_surveillance}_${c.heure_debut_surveillance}`;
      const capacity = sourceMap.get(key);
      
      if (capacity !== undefined) {
        updates.push({ id: c.id, capacity });
      } else {
        skipped++;
      }
    } else {
      skipped++;
    }
  });

  if (updates.length === 0) {
    return { copied: 0, skipped, errors: ['Aucun créneau correspondant trouvé'] };
  }

  // Effectuer les mises à jour
  const errors: string[] = [];
  let copied = 0;

  for (const update of updates) {
    try {
      const { error } = await supabase
        .from('creneaux')
        .update({ nb_surveillants_requis: update.capacity })
        .eq('id', update.id);

      if (error) {
        errors.push(`Erreur pour le créneau ${update.id}: ${error.message}`);
      } else {
        copied++;
      }
    } catch (error) {
      errors.push(`Erreur inattendue pour le créneau ${update.id}`);
    }
  }

  return { copied, skipped, errors };
}
