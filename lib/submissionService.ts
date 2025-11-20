import { supabase } from './supabaseClient';
import { SoumissionDisponibilite, SubmissionResult, SubmissionStatus, SubmissionPayload } from '../types';
import { isOnline, submitWithRetry } from './networkManager';
import { enqueue, processQueue } from './offlineQueueManager';
import { clearFormProgress } from './localStorageManager';
import * as auditLogger from './auditLogger';
import { recordSubmission } from './metricsCollector';

/**
 * Valide le payload côté client
 */
function validatePayload(payload: SubmissionPayload): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validation email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!payload.email || !emailRegex.test(payload.email)) {
    errors.push('Email invalide');
  }

  // Validation nom et prénom
  if (!payload.nom || payload.nom.trim().length < 2) {
    errors.push('Le nom doit contenir au moins 2 caractères');
  }
  if (!payload.prenom || payload.prenom.trim().length < 2) {
    errors.push('Le prénom doit contenir au moins 2 caractères');
  }

  // Validation type surveillant
  if (!payload.type_surveillant) {
    errors.push('Type de surveillant non spécifié');
  }

  // Validation session
  if (!payload.session_id) {
    errors.push('Session non spécifiée');
  }

  // Validation disponibilités
  if (!payload.availabilities || payload.availabilities.length === 0) {
    errors.push('Aucune disponibilité spécifiée');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Télécharge une copie locale de la soumission au format JSON
 */
export function downloadLocalCopy(payload: SubmissionPayload): void {
  const data = {
    ...payload,
    timestamp: new Date().toISOString(),
    note: 'Cette copie locale peut être utilisée pour soumettre vos disponibilités ultérieurement',
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `disponibilites-${payload.email}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Soumet les disponibilités via l'API Supabase avec validation serveur
 */
async function submitToAPI(payload: SubmissionPayload): Promise<SoumissionDisponibilite> {
  // Vérifier que la session existe et est active
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, is_active')
    .eq('id', payload.session_id)
    .single();

  if (sessionError || !session) {
    throw new Error('VALIDATION_ERROR: Session invalide ou inexistante');
  }

  if (!session.is_active) {
    throw new Error('VALIDATION_ERROR: La session n\'est plus active');
  }

  // Vérifier que tous les créneaux existent et appartiennent à la session
  const creneauIds = payload.availabilities.map(a => a.creneau_id);
  if (creneauIds.length > 0) {
    const { data: creneaux, error: creneauxError } = await supabase
      .from('creneaux')
      .select('id, session_id')
      .in('id', creneauIds);

    if (creneauxError) {
      throw new Error('VALIDATION_ERROR: Erreur lors de la vérification des créneaux');
    }

    if (!creneaux || creneaux.length !== creneauIds.length) {
      throw new Error('VALIDATION_ERROR: Certains créneaux sont invalides');
    }

    const invalidCreneaux = creneaux.filter(c => c.session_id !== payload.session_id);
    if (invalidCreneaux.length > 0) {
      throw new Error('VALIDATION_ERROR: Certains créneaux n\'appartiennent pas à cette session');
    }
  }

  // Préparer les données pour l'upsert
  const submissionData = {
    session_id: payload.session_id,
    surveillant_id: payload.surveillant_id,
    email: payload.email.toLowerCase().trim(),
    nom: payload.nom.trim(),
    prenom: payload.prenom.trim(),
    type_surveillant: payload.type_surveillant,
    telephone: payload.telephone?.trim() || null,
    remarque_generale: payload.remarque_generale?.trim() || null,
    historique_disponibilites: payload.availabilities,
    submitted_at: new Date().toISOString(),
  };

  // Vérifier si c'est une création ou une mise à jour
  const { data: existing } = await supabase
    .from('soumissions_disponibilites')
    .select('id')
    .eq('session_id', payload.session_id)
    .eq('email', payload.email.toLowerCase().trim())
    .is('deleted_at', null)
    .single();

  const isUpdate = !!existing;

  // Effectuer l'upsert
  const { data, error } = await supabase
    .from('soumissions_disponibilites')
    .upsert(submissionData, {
      onConflict: 'session_id,email',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('DUPLICATE_SUBMISSION: Une soumission existe déjà pour cet email et cette session');
    }
    throw new Error(`DATABASE_ERROR: ${error.message}`);
  }

  // Logger l'opération dans audit_logs
  await auditLogger.log({
    operation: isUpdate ? 'update' : 'create',
    entity: 'submission',
    entity_id: data.id,
    user_email: payload.email,
    user_id: payload.surveillant_id || undefined,
    details: {
      session_id: payload.session_id,
      nb_disponibilites: payload.availabilities.length,
      nb_disponibles: payload.availabilities.filter(a => a.est_disponible).length,
      type_surveillant: payload.type_surveillant,
      is_update: isUpdate,
    },
  });

  return data;
}

/**
 * Orchestre la soumission complète avec gestion offline et retry
 */
export async function submit(payload: SubmissionPayload): Promise<SubmissionStatus> {
  // Étape 1 : Validation côté client
  const validation = validatePayload(payload);
  if (!validation.valid) {
    return {
      success: false,
      message: validation.errors.join(', '),
      errors: validation.errors,
    };
  }

  // Étape 2 : Vérifier la connexion
  const online = isOnline();

  // Étape 3 : Si offline, ajouter à la file d'attente
  if (!online) {
    try {
      await enqueue({
        payload,
        timestamp: Date.now(),
        attempts: 0,
      });

      return {
        success: false,
        message: 'Vous êtes hors ligne. Votre soumission a été mise en file d\'attente et sera envoyée automatiquement lorsque la connexion sera rétablie.',
        queued: true,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Impossible de mettre en file d\'attente. Veuillez télécharger une copie locale et réessayer plus tard.',
        errors: [(error as Error).message],
      };
    }
  }

  // Étape 4 : Si online, soumettre avec retry logic
  const startTime = Date.now();
  const result = await submitWithRetry<SoumissionDisponibilite>(
    () => submitToAPI(payload),
    {
      maxAttempts: 5,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
    }
  );
  const duration = Date.now() - startTime;

  // Enregistrer les métriques
  recordSubmission(result.success, duration, result.attempts, result.error?.message);

  // Étape 5 : Si succès, nettoyer LocalStorage
  if (result.success && result.data) {
    clearFormProgress();
    return {
      success: true,
      message: 'Vos disponibilités ont été enregistrées avec succès !',
      submissionId: result.data.id,
      data: result.data,
    };
  }

  // Étape 6 : Si échec après retries, ajouter à la file d'attente
  try {
    await enqueue({
      payload,
      timestamp: Date.now(),
      attempts: result.attempts,
      lastError: result.error?.message,
    });

    return {
      success: false,
      message: `La soumission a échoué après ${result.attempts} tentatives. Elle a été mise en file d'attente et sera réessayée automatiquement.`,
      queued: true,
      errors: [result.error?.message || 'Erreur inconnue'],
    };
  } catch (queueError) {
    return {
      success: false,
      message: 'La soumission a échoué et n\'a pas pu être mise en file d\'attente. Veuillez télécharger une copie locale.',
      errors: [result.error?.message || 'Erreur inconnue', (queueError as Error).message],
    };
  }
}

/**
 * Vérifie l'état d'une soumission existante
 */
export async function checkStatus(
  email: string,
  sessionId: string
): Promise<SoumissionDisponibilite | null> {
  try {
    const { data, error } = await supabase
      .from('soumissions_disponibilites')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('session_id', sessionId)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Aucune soumission trouvée
        return null;
      }
      throw error;
    }

    // Logger la consultation
    if (data) {
      await auditLogger.log({
        operation: 'view',
        entity: 'submission',
        entity_id: data.id,
        user_email: email,
        user_id: data.surveillant_id || undefined,
        details: {
          session_id: sessionId,
        },
      });
    }

    return data;
  } catch (error) {
    console.error('Erreur lors de la vérification du statut:', error);
    return null;
  }
}

/**
 * Traite manuellement la file d'attente
 */
export async function processOfflineQueue(): Promise<{
  success: boolean;
  processed: number;
  failed: number;
  message: string;
}> {
  const result = await processQueue(async (payload) => {
    try {
      await submitToAPI(payload);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
  
  return {
    success: result.failed === 0,
    processed: result.processed,
    failed: result.failed,
    message: result.failed === 0
      ? `${result.processed} soumission(s) traitée(s) avec succès`
      : `${result.processed} soumission(s) traitée(s), ${result.failed} échec(s)`,
  };
}
