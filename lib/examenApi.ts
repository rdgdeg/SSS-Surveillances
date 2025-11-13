import { supabase } from './supabaseClient';
import {
  Examen,
  PresenceEnseignant,
  NotificationAdmin,
  ExamenWithPresence,
  ExamenImportResult,
  PresenceFormData,
  ManualExamenFormData,
  ParsedExamen
} from '../types';

// ============================================
// Fonctions API pour les examens
// ============================================

/**
 * Recherche d'examens par code ou nom
 * @param sessionId ID de la session
 * @param query Terme de recherche (code ou nom)
 * @returns Liste des examens correspondants
 */
export async function searchExamens(
  sessionId: string,
  query: string
): Promise<Examen[]> {
  const searchTerm = `%${query}%`;
  
  const { data, error } = await supabase
    .from('examens')
    .select('*')
    .eq('session_id', sessionId)
    .or(`code_examen.ilike.${searchTerm},nom_examen.ilike.${searchTerm}`)
    .order('code_examen');
  
  if (error) {
    console.error('Error searching examens:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Récupère un examen par son ID
 * @param id ID de l'examen
 * @returns Examen ou null si non trouvé
 */
export async function getExamenById(id: string): Promise<Examen | null> {
  const { data, error } = await supabase
    .from('examens')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching examen:', error);
    throw error;
  }
  
  return data;
}

/**
 * Récupère tous les examens d'une session
 * @param sessionId ID de la session
 * @returns Liste des examens
 */
export async function getExamensBySession(sessionId: string): Promise<Examen[]> {
  const { data, error } = await supabase
    .from('examens')
    .select('*')
    .eq('session_id', sessionId)
    .order('date_examen', { ascending: true, nullsFirst: false })
    .order('heure_debut', { ascending: true, nullsFirst: false })
    .order('code_examen');
  
  if (error) {
    console.error('Error fetching examens:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Crée un examen manuellement (enseignant)
 * @param sessionId ID de la session
 * @param data Données du formulaire
 * @param enseignantEmail Email de l'enseignant qui crée l'examen
 * @returns Examen créé
 */
export async function createManualExamen(
  sessionId: string,
  data: ManualExamenFormData,
  enseignantEmail: string
): Promise<Examen> {
  const examenData = {
    session_id: sessionId,
    code_examen: data.code_examen,
    nom_examen: data.nom_examen,
    enseignants: [enseignantEmail],
    date_examen: data.date_examen || null,
    heure_debut: data.heure_debut || null,
    heure_fin: data.heure_fin || null,
    saisie_manuelle: true,
    cree_par_email: enseignantEmail,
    valide: false // En attente de validation admin
  };
  
  const { data: examen, error } = await supabase
    .from('examens')
    .insert(examenData)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating manual examen:', error);
    throw error;
  }
  
  // Créer une notification admin
  await createNotification({
    type: 'examen_manuel',
    titre: 'Nouvel examen saisi manuellement',
    message: `L'enseignant ${enseignantEmail} a saisi manuellement l'examen "${data.code_examen} - ${data.nom_examen}"`,
    reference_id: examen.id,
    reference_type: 'examen'
  });
  
  return examen;
}

/**
 * Import CSV d'examens
 * @param sessionId ID de la session
 * @param examens Liste des examens parsés
 * @param onProgress Callback pour la progression
 * @returns Résultat de l'import
 */
export async function importExamens(
  sessionId: string,
  examens: ParsedExamen[],
  onProgress?: (current: number, total: number) => void
): Promise<ExamenImportResult> {
  const result: ExamenImportResult = {
    imported: 0,
    updated: 0,
    errors: [],
    warnings: []
  };
  
  const total = examens.length;
  
  for (let i = 0; i < examens.length; i++) {
    const examen = examens[i];
    
    try {
      // Vérifier si l'examen existe déjà
      const { data: existing } = await supabase
        .from('examens')
        .select('id')
        .eq('session_id', sessionId)
        .eq('code_examen', examen.code_examen)
        .single();
      
      const examenData = {
        session_id: sessionId,
        code_examen: examen.code_examen,
        nom_examen: examen.nom_examen,
        enseignants: examen.enseignants,
        date_examen: examen.date_examen || null,
        heure_debut: examen.heure_debut || null,
        heure_fin: examen.heure_fin || null,
        saisie_manuelle: false,
        valide: true
      };
      
      if (existing) {
        // Mettre à jour l'examen existant
        const { error } = await supabase
          .from('examens')
          .update(examenData)
          .eq('id', existing.id);
        
        if (error) {
          result.errors.push(`Erreur lors de la mise à jour de l'examen ${examen.code_examen}: ${error.message}`);
        } else {
          result.updated++;
        }
      } else {
        // Créer un nouvel examen
        const { error } = await supabase
          .from('examens')
          .insert(examenData);
        
        if (error) {
          result.errors.push(`Erreur lors de la création de l'examen ${examen.code_examen}: ${error.message}`);
        } else {
          result.imported++;
        }
      }
    } catch (error) {
      result.errors.push(`Erreur inattendue pour l'examen ${examen.code_examen}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
    
    // Mettre à jour la progression
    if (onProgress) {
      onProgress(i + 1, total);
    }
  }
  
  return result;
}

/**
 * Récupère tous les examens d'une session avec leurs présences
 * @param sessionId ID de la session
 * @returns Liste des examens avec présences
 */
export async function getExamensWithPresences(
  sessionId: string
): Promise<ExamenWithPresence[]> {
  // Récupérer les examens
  const { data: examens, error: examensError } = await supabase
    .from('examens')
    .select('*')
    .eq('session_id', sessionId)
    .order('date_examen', { ascending: true, nullsFirst: false })
    .order('heure_debut', { ascending: true, nullsFirst: false })
    .order('code_examen');
  
  if (examensError) {
    console.error('Error fetching examens:', examensError);
    throw examensError;
  }
  
  if (!examens || examens.length === 0) {
    return [];
  }
  
  // Récupérer toutes les présences pour ces examens
  const examenIds = examens.map(e => e.id);
  const { data: presences, error: presencesError } = await supabase
    .from('presences_enseignants')
    .select('*')
    .in('examen_id', examenIds);
  
  if (presencesError) {
    console.error('Error fetching presences:', presencesError);
    throw presencesError;
  }
  
  // Grouper les présences par examen
  const presencesByExamen = new Map<string, PresenceEnseignant[]>();
  (presences || []).forEach(p => {
    if (!presencesByExamen.has(p.examen_id)) {
      presencesByExamen.set(p.examen_id, []);
    }
    presencesByExamen.get(p.examen_id)!.push(p);
  });
  
  // Construire les examens avec présences
  return examens.map(examen => {
    const examenPresences = presencesByExamen.get(examen.id) || [];
    const nb_enseignants_presents = examenPresences.filter(p => p.est_present).length;
    const nb_surveillants_accompagnants_total = examenPresences
      .filter(p => p.est_present)
      .reduce((sum, p) => sum + p.nb_surveillants_accompagnants, 0);
    
    return {
      ...examen,
      presences: examenPresences,
      nb_presences_declarees: examenPresences.length,
      nb_enseignants_total: examen.enseignants.length,
      nb_enseignants_presents,
      nb_surveillants_accompagnants_total,
      besoin_surveillants_calcule: null // À calculer côté client si nécessaire
    };
  });
}

/**
 * Valide un examen saisi manuellement
 * @param examenId ID de l'examen
 * @param updates Mises à jour optionnelles
 * @returns Examen validé
 */
export async function validateManualExamen(
  examenId: string,
  updates?: Partial<Examen>
): Promise<Examen> {
  const updateData = {
    ...updates,
    saisie_manuelle: false,
    valide: true
  };
  
  const { data, error } = await supabase
    .from('examens')
    .update(updateData)
    .eq('id', examenId)
    .select()
    .single();
  
  if (error) {
    console.error('Error validating examen:', error);
    throw error;
  }
  
  return data;
}

/**
 * Supprime un examen
 * @param examenId ID de l'examen
 */
export async function deleteExamen(examenId: string): Promise<void> {
  const { error } = await supabase
    .from('examens')
    .delete()
    .eq('id', examenId);
  
  if (error) {
    console.error('Error deleting examen:', error);
    throw error;
  }
}

// ============================================
// Fonctions API pour les présences
// ============================================

/**
 * Soumet une déclaration de présence
 * @param examenId ID de l'examen
 * @param data Données du formulaire
 * @returns Présence créée ou mise à jour
 */
export async function submitPresence(
  examenId: string,
  data: PresenceFormData
): Promise<PresenceEnseignant> {
  // Récupérer les informations de l'examen pour le message
  const { data: examen } = await supabase
    .from('examens')
    .select('code_examen, nom_examen, session_id')
    .eq('id', examenId)
    .single();

  const presenceData = {
    examen_id: examenId,
    enseignant_email: data.enseignant_email.toLowerCase(),
    enseignant_nom: data.enseignant_nom,
    enseignant_prenom: data.enseignant_prenom,
    est_present: data.est_present,
    nb_surveillants_accompagnants: data.est_present ? data.nb_surveillants_accompagnants : 0,
    remarque: data.remarque || null
  };
  
  // Upsert (insert or update)
  const { data: presence, error } = await supabase
    .from('presences_enseignants')
    .upsert(presenceData, {
      onConflict: 'examen_id,enseignant_email'
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error submitting presence:', error);
    throw error;
  }

  // Si une remarque est fournie, créer un message
  if (data.remarque && data.remarque.trim() && examen) {
    const newMessage = {
      session_id: examen.session_id,
      expediteur_email: data.enseignant_email.toLowerCase(),
      expediteur_nom: data.enseignant_nom,
      expediteur_prenom: data.enseignant_prenom,
      sujet: `Remarque enseignant - ${examen.code_examen}`,
      contenu: `Examen: ${examen.code_examen} - ${examen.nom_examen}\n\nRemarque:\n${data.remarque}`,
      lu: false,
      archive: false,
      priorite: 'normale',
    };
    
    const { error: messageError } = await supabase.from('messages').insert(newMessage);
    if (messageError) {
      console.error("Error creating message from remark:", messageError);
      // Ne pas bloquer la soumission si le message échoue
    }
  }
  
  return presence;
}

/**
 * Récupère la présence existante d'un enseignant pour un examen
 * @param examenId ID de l'examen
 * @param enseignantEmail Email de l'enseignant
 * @returns Présence ou null si non trouvée
 */
export async function getExistingPresence(
  examenId: string,
  enseignantEmail: string
): Promise<PresenceEnseignant | null> {
  const { data, error } = await supabase
    .from('presences_enseignants')
    .select('*')
    .eq('examen_id', examenId)
    .eq('enseignant_email', enseignantEmail.toLowerCase())
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching presence:', error);
    throw error;
  }
  
  return data;
}

/**
 * Met à jour une présence existante
 * @param presenceId ID de la présence
 * @param data Données à mettre à jour
 * @returns Présence mise à jour
 */
export async function updatePresence(
  presenceId: string,
  data: Partial<PresenceFormData>
): Promise<PresenceEnseignant> {
  const updateData: any = {};
  
  if (data.enseignant_nom !== undefined) updateData.enseignant_nom = data.enseignant_nom;
  if (data.enseignant_prenom !== undefined) updateData.enseignant_prenom = data.enseignant_prenom;
  if (data.est_present !== undefined) {
    updateData.est_present = data.est_present;
    updateData.nb_surveillants_accompagnants = data.est_present ? (data.nb_surveillants_accompagnants || 0) : 0;
  }
  if (data.remarque !== undefined) updateData.remarque = data.remarque || null;
  
  const { data: presence, error } = await supabase
    .from('presences_enseignants')
    .update(updateData)
    .eq('id', presenceId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating presence:', error);
    throw error;
  }
  
  return presence;
}

// ============================================
// Fonctions API pour les notifications admin
// ============================================

/**
 * Crée une notification admin
 * @param notification Données de la notification
 * @returns Notification créée
 */
export async function createNotification(
  notification: Omit<NotificationAdmin, 'id' | 'lu' | 'archive' | 'created_at'>
): Promise<NotificationAdmin> {
  const { data, error } = await supabase
    .from('notifications_admin')
    .insert(notification)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
  
  return data;
}

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
 * Récupère toutes les notifications admin
 * @param includeArchived Inclure les notifications archivées
 * @returns Liste des notifications
 */
export async function getAllNotifications(includeArchived: boolean = false): Promise<NotificationAdmin[]> {
  let query = supabase
    .from('notifications_admin')
    .select('*');
  
  if (!includeArchived) {
    query = query.eq('archive', false);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
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
 * Compte le nombre de notifications non lues
 * @returns Nombre de notifications non lues
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const { count, error } = await supabase
    .from('notifications_admin')
    .select('*', { count: 'exact', head: true })
    .eq('lu', false)
    .eq('archive', false);
  
  if (error) {
    console.error('Error counting notifications:', error);
    throw error;
  }
  
  return count || 0;
}
