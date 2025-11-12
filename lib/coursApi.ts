import { supabase } from './supabaseClient';
import { Cours, CoursListItem, CoursSearchParams, CoursImportResult } from '../types';

/**
 * Récupère la liste des cours avec filtres et tri
 */
export async function getCours(params?: CoursSearchParams): Promise<{ data: CoursListItem[], total: number }> {
  let query = supabase
    .from('cours')
    .select('id, code, intitule_complet, consignes, updated_at', { count: 'exact' });

  // Filtre par recherche
  if (params?.search) {
    const searchTerm = params.search.trim();
    query = query.or(`code.ilike.%${searchTerm}%,intitule_complet.ilike.%${searchTerm}%`);
  }

  // Filtre par présence de consignes
  if (params?.hasInstructions !== undefined) {
    if (params.hasInstructions) {
      query = query.not('consignes', 'is', null);
    } else {
      query = query.is('consignes', null);
    }
  }

  // Tri
  const sortBy = params?.sortBy || 'code';
  const sortOrder = params?.sortOrder || 'asc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data, error, count } = await query;

  if (error) throw error;

  // Transformer les données pour inclure has_consignes
  const coursListItems: CoursListItem[] = (data || []).map(cours => ({
    id: cours.id,
    code: cours.code,
    intitule_complet: cours.intitule_complet,
    has_consignes: cours.consignes !== null && cours.consignes.trim() !== '',
    updated_at: cours.updated_at
  }));

  return {
    data: coursListItems,
    total: count || 0
  };
}

/**
 * Récupère un cours par son ID
 */
export async function getCoursById(id: string): Promise<Cours> {
  const { data, error } = await supabase
    .from('cours')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Récupère un cours par son code
 */
export async function getCoursByCode(code: string): Promise<Cours | null> {
  const { data, error } = await supabase
    .from('cours')
    .select('*')
    .eq('code', code)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Crée un nouveau cours (Admin)
 */
export async function createCours(cours: { code: string; intitule_complet: string; consignes?: string }): Promise<Cours> {
  const { data, error } = await supabase
    .from('cours')
    .insert(cours)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Met à jour un cours (Admin)
 */
export async function updateCours(id: string, updates: { intitule_complet?: string; consignes?: string | null }): Promise<Cours> {
  const { data, error } = await supabase
    .from('cours')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Supprime les consignes d'un cours (Admin)
 */
export async function deleteCoursConsignes(id: string): Promise<Cours> {
  const { data, error } = await supabase
    .from('cours')
    .update({ consignes: null })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Supprime un cours (Admin)
 */
export async function deleteCours(id: string): Promise<void> {
  const { error } = await supabase
    .from('cours')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Importe des cours depuis un tableau (Admin)
 * Met à jour les cours existants et crée les nouveaux
 */
export async function importCours(
  courses: { code: string; intitule_complet: string }[],
  onProgress?: (current: number, total: number) => void
): Promise<CoursImportResult> {
  let imported = 0;
  let updated = 0;
  const errors: string[] = [];
  const total = courses.length;

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    try {
      // Vérifier si le cours existe déjà
      const existing = await getCoursByCode(course.code);

      if (existing) {
        // Mettre à jour uniquement l'intitulé (préserver les consignes)
        await supabase
          .from('cours')
          .update({ intitule_complet: course.intitule_complet })
          .eq('id', existing.id);
        updated++;
      } else {
        // Créer un nouveau cours
        await supabase
          .from('cours')
          .insert({
            code: course.code,
            intitule_complet: course.intitule_complet,
            consignes: null
          });
        imported++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      errors.push(`${course.code}: ${errorMessage}`);
    }

    // Notifier la progression
    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  return { imported, updated, errors };
}

/**
 * Compte le nombre de cours avec et sans consignes
 */
export async function getCoursStats(): Promise<{ total: number; withInstructions: number; withoutInstructions: number }> {
  const { count: total, error: totalError } = await supabase
    .from('cours')
    .select('*', { count: 'exact', head: true });

  const { count: withInstructions, error: withError } = await supabase
    .from('cours')
    .select('*', { count: 'exact', head: true })
    .not('consignes', 'is', null);

  if (totalError || withError) {
    throw totalError || withError;
  }

  return {
    total: total || 0,
    withInstructions: withInstructions || 0,
    withoutInstructions: (total || 0) - (withInstructions || 0)
  };
}
