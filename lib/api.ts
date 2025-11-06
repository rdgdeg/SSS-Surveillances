import { supabase } from '../lib/supabaseClient';
import { Session, Creneau, Surveillant, SoumissionDisponibilite, Message } from '../types';

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
    const { error } = await supabase.from('soumissions_disponibilites').delete().eq('id', id);
    if (error) throw error;
}

export async function updateSoumissionRemark(id: string, remarque_generale: string): Promise<SoumissionDisponibilite> {
    const { data, error } = await supabase.from('soumissions_disponibilites').update({ remarque_generale }).eq('id', id).select().single();
    if (error) throw error;
    return data;
}
