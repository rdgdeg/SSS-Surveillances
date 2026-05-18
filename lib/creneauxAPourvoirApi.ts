import { supabase } from './supabaseClient';
import {
  CreneauAPourvoir,
  CreneauAPourvoirWithStats,
  ReponseCreneauAPourvoir,
} from '../types';

export function getPublicCreneauxAPourvoirUrl(sessionId: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/#/creneaux-a-pourvoir/${sessionId}`;
}

export async function getCreneauxAPourvoirPublic(sessionId: string): Promise<CreneauAPourvoir[]> {
  const { data, error } = await supabase
    .from('creneaux_a_pourvoir')
    .select('*')
    .eq('session_id', sessionId)
    .eq('is_open', true)
    .order('date_surveillance', { ascending: true })
    .order('heure_debut', { ascending: true });

  if (error) throw error;
  return (data || []) as CreneauAPourvoir[];
}

export async function getCreneauxAPourvoirAdmin(sessionId: string): Promise<CreneauAPourvoirWithStats[]> {
  const { data: creneaux, error: cErr } = await supabase
    .from('creneaux_a_pourvoir')
    .select('*')
    .eq('session_id', sessionId)
    .order('date_surveillance', { ascending: true })
    .order('heure_debut', { ascending: true });

  if (cErr) throw cErr;
  if (!creneaux?.length) return [];

  const { data: selections, error: sErr } = await supabase
    .from('reponses_creneaux_a_pourvoir_selections')
    .select(`
      creneau_a_pourvoir_id,
      reponse:reponses_creneaux_a_pourvoir (
        email,
        nom,
        prenom
      )
    `)
    .in(
      'creneau_a_pourvoir_id',
      creneaux.map((c) => c.id)
    );

  if (sErr) throw sErr;

  const byCreneau = new Map<string, Array<{ email: string; nom: string; prenom: string }>>();

  (selections || []).forEach((row: any) => {
    const cid = row.creneau_a_pourvoir_id;
    const rep = row.reponse;
    if (!rep) return;
    const list = byCreneau.get(cid) || [];
    list.push({ email: rep.email, nom: rep.nom, prenom: rep.prenom });
    byCreneau.set(cid, list);
  });

  return creneaux.map((c) => {
    const candidats = byCreneau.get(c.id) || [];
    return {
      ...(c as CreneauAPourvoir),
      nb_reponses: candidats.length,
      candidats,
    };
  });
}

export async function createCreneauAPourvoir(
  payload: Omit<CreneauAPourvoir, 'id' | 'created_at' | 'updated_at'>
): Promise<CreneauAPourvoir> {
  const { data, error } = await supabase
    .from('creneaux_a_pourvoir')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as CreneauAPourvoir;
}

export async function updateCreneauAPourvoir(
  id: string,
  updates: Partial<
    Pick<
      CreneauAPourvoir,
      | 'date_surveillance'
      | 'heure_debut'
      | 'heure_fin'
      | 'nb_personnes_manquantes'
      | 'libelle'
      | 'is_open'
    >
  >
): Promise<void> {
  const { error } = await supabase.from('creneaux_a_pourvoir').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteCreneauAPourvoir(id: string): Promise<void> {
  const { error } = await supabase.from('creneaux_a_pourvoir').delete().eq('id', id);
  if (error) throw error;
}

export async function getReponseByEmail(
  sessionId: string,
  email: string
): Promise<ReponseCreneauAPourvoir | null> {
  const normalized = email.trim().toLowerCase();
  const { data: reponse, error } = await supabase
    .from('reponses_creneaux_a_pourvoir')
    .select('*')
    .eq('session_id', sessionId)
    .ilike('email', normalized)
    .maybeSingle();

  if (error) throw error;
  if (!reponse) return null;

  const { data: selections, error: sErr } = await supabase
    .from('reponses_creneaux_a_pourvoir_selections')
    .select('creneau_a_pourvoir_id')
    .eq('reponse_id', reponse.id);

  if (sErr) throw sErr;

  return {
    ...(reponse as ReponseCreneauAPourvoir),
    creneau_ids: (selections || []).map((s) => s.creneau_a_pourvoir_id),
  };
}

export async function saveReponseCreneauxAPourvoir(params: {
  sessionId: string;
  email: string;
  nom: string;
  prenom: string;
  creneauIds: string[];
}): Promise<ReponseCreneauAPourvoir> {
  const email = params.email.trim().toLowerCase();
  const nom = params.nom.trim();
  const prenom = params.prenom.trim();

  const existing = await getReponseByEmail(params.sessionId, email);

  let reponseId: string;

  if (existing) {
    const { error } = await supabase
      .from('reponses_creneaux_a_pourvoir')
      .update({ nom, prenom, email })
      .eq('id', existing.id);
    if (error) throw error;
    reponseId = existing.id;

    const { error: delErr } = await supabase
      .from('reponses_creneaux_a_pourvoir_selections')
      .delete()
      .eq('reponse_id', reponseId);
    if (delErr) throw delErr;
  } else {
    const { data, error } = await supabase
      .from('reponses_creneaux_a_pourvoir')
      .insert({
        session_id: params.sessionId,
        email,
        nom,
        prenom,
      })
      .select()
      .single();
    if (error) throw error;
    reponseId = data.id;
  }

  if (params.creneauIds.length > 0) {
    const rows = params.creneauIds.map((creneau_a_pourvoir_id) => ({
      reponse_id: reponseId,
      creneau_a_pourvoir_id,
    }));
    const { error: insErr } = await supabase
      .from('reponses_creneaux_a_pourvoir_selections')
      .insert(rows);
    if (insErr) throw insErr;
  }

  const saved = await getReponseByEmail(params.sessionId, email);
  if (!saved) throw new Error('Erreur lors de la sauvegarde');
  return saved;
}

export async function getSessionById(sessionId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, name, year, is_active')
    .eq('id', sessionId)
    .single();
  if (error) throw error;
  return data;
}
