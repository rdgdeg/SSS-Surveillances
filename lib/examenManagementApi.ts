/**
 * Exam Management API
 * Provides CRUD operations and utilities for managing exams
 */

import { supabase } from './supabaseClient';
import {
  Examen,
  ExamenWithStatus,
  ExamenFormData,
  ExamenFilters,
  ExamenDashboardStats,
  ExamenImportResult,
  ParsedCSVExamen,
  Cours
} from '../types';
import {
  extractCourseCode,
  convertDateFormat,
  convertTimeFormat,
  parseDuration,
  parseTeachers
} from './examenCsvParser';

// ============================================
// CRUD Operations
// ============================================

/**
 * Get all examens for a session with filters, sorting, and pagination
 * @param sessionId Session ID
 * @param filters Optional filters
 * @param page Page number (1-indexed)
 * @param pageSize Number of items per page
 * @returns Paginated list of exams with status
 */
export async function getExamens(
  sessionId: string,
  filters?: ExamenFilters,
  page: number = 1,
  pageSize: number = 25
): Promise<{ data: ExamenWithStatus[]; total: number }> {
  try {
    // Build base query
    let query = supabase
      .from('examens')
      .select('*, cours(*)', { count: 'exact' })
      .eq('session_id', sessionId);

    // Apply filters
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.or(`code_examen.ilike.${searchTerm},nom_examen.ilike.${searchTerm}`);
    }

    if (filters?.dateFrom) {
      query = query.gte('date_examen', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('date_examen', filters.dateTo);
    }

    if (filters?.secretariat) {
      query = query.eq('secretariat', filters.secretariat);
    }

    if (filters?.hasCoursLinked !== undefined) {
      if (filters.hasCoursLinked) {
        query = query.not('cours_id', 'is', null);
      } else {
        query = query.is('cours_id', null);
      }
    }

    if (filters?.hasSupervisorRequirement !== undefined) {
      if (filters.hasSupervisorRequirement) {
        query = query.not('nb_surveillants_requis', 'is', null);
      } else {
        query = query.is('nb_surveillants_requis', null);
      }
    }

    // Apply sorting (default: date, then time)
    query = query
      .order('date_examen', { ascending: true, nullsFirst: false })
      .order('heure_debut', { ascending: true, nullsFirst: false })
      .order('code_examen', { ascending: true });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: examens, error, count } = await query;

    if (error) {
      console.error('Error fetching examens:', error);
      throw error;
    }

    if (!examens) {
      return { data: [], total: 0 };
    }

    // Fetch presence declarations for all exams
    const examenIds = examens.map(e => e.id);
    const { data: presences } = await supabase
      .from('presences_enseignants')
      .select('examen_id, est_present, nb_surveillants_accompagnants')
      .in('examen_id', examenIds);

    // Group presences by exam
    const presencesByExamen = new Map<string, typeof presences>();
    (presences || []).forEach(p => {
      if (!presencesByExamen.has(p.examen_id)) {
        presencesByExamen.set(p.examen_id, []);
      }
      presencesByExamen.get(p.examen_id)!.push(p);
    });

    // Build ExamenWithStatus objects
    const examensWithStatus: ExamenWithStatus[] = examens.map(examen => {
      const examenPresences = presencesByExamen.get(examen.id) || [];
      const nb_presences_declarees = examenPresences.length;
      const nb_enseignants_presents = examenPresences.filter(p => p.est_present).length;
      const nb_surveillants_accompagnants = examenPresences
        .filter(p => p.est_present)
        .reduce((sum, p) => sum + (p.nb_surveillants_accompagnants || 0), 0);

      return {
        ...examen,
        cours: examen.cours || undefined,
        has_presence_declarations: nb_presences_declarees > 0,
        nb_presences_declarees,
        nb_enseignants_presents,
        nb_surveillants_accompagnants
      };
    });

    // Apply response status filter (after fetching presences)
    let filteredExamens = examensWithStatus;
    if (filters?.responseStatus && filters.responseStatus !== 'all') {
      if (filters.responseStatus === 'declared') {
        filteredExamens = examensWithStatus.filter(e => e.has_presence_declarations);
      } else if (filters.responseStatus === 'pending') {
        filteredExamens = examensWithStatus.filter(e => !e.has_presence_declarations);
      }
    }

    return {
      data: filteredExamens,
      total: count || 0
    };
  } catch (error) {
    console.error('Error in getExamens:', error);
    throw error;
  }
}

/**
 * Get single examen by ID with course and presence data
 * @param id Exam ID
 * @returns Exam with status or null
 */
export async function getExamenById(id: string): Promise<ExamenWithStatus | null> {
  try {
    const { data: examen, error } = await supabase
      .from('examens')
      .select('*, cours(*)')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching examen:', error);
      throw error;
    }

    if (!examen) {
      return null;
    }

    // Fetch presence declarations
    const { data: presences } = await supabase
      .from('presences_enseignants')
      .select('*')
      .eq('examen_id', id);

    const nb_presences_declarees = presences?.length || 0;
    const nb_enseignants_presents = presences?.filter(p => p.est_present).length || 0;
    const nb_surveillants_accompagnants = presences
      ?.filter(p => p.est_present)
      .reduce((sum, p) => sum + (p.nb_surveillants_accompagnants || 0), 0) || 0;

    return {
      ...examen,
      cours: examen.cours || undefined,
      has_presence_declarations: nb_presences_declarees > 0,
      nb_presences_declarees,
      nb_enseignants_presents,
      nb_surveillants_accompagnants
    };
  } catch (error) {
    console.error('Error in getExamenById:', error);
    throw error;
  }
}

/**
 * Create new examen
 * @param sessionId Session ID
 * @param data Exam form data
 * @param userId Optional user ID for audit trail
 * @param username Optional username for audit trail
 * @returns Created exam
 */
export async function createExamen(
  sessionId: string,
  data: ExamenFormData,
  userId?: string,
  username?: string
): Promise<Examen> {
  try {
    const examenData = {
      session_id: sessionId,
      cours_id: data.cours_id,
      code_examen: data.code_examen,
      nom_examen: data.nom_examen,
      date_examen: data.date_examen || null,
      heure_debut: data.heure_debut || null,
      heure_fin: data.heure_fin || null,
      duree_minutes: data.duree_minutes,
      auditoires: data.auditoires || null,
      enseignants: data.enseignants,
      secretariat: data.secretariat || null,
      nb_surveillants_requis: data.nb_surveillants_requis,
      saisie_manuelle: false,
      valide: true
    };

    const { data: examen, error } = await supabase
      .from('examens')
      .insert(examenData)
      .select()
      .single();

    if (error) {
      console.error('Error creating examen:', error);
      throw error;
    }

    // Log audit trail if user info provided
    if (userId && username && examen) {
      await supabase.from('audit_log').insert({
        user_id: userId,
        username,
        action: 'create',
        table_name: 'examens',
        record_id: examen.id,
        old_values: null,
        new_values: examenData,
      });
    }

    return examen;
  } catch (error) {
    console.error('Error in createExamen:', error);
    throw error;
  }
}

/**
 * Update examen
 * @param id Exam ID
 * @param updates Partial exam data to update
 * @param userId Optional user ID for audit trail
 * @param username Optional username for audit trail
 * @returns Updated exam
 */
export async function updateExamen(
  id: string,
  updates: Partial<ExamenFormData>,
  userId?: string,
  username?: string
): Promise<Examen> {
  try {
    // Fetch old values for audit trail
    const { data: oldExamen } = await supabase
      .from('examens')
      .select('*')
      .eq('id', id)
      .single();

    const updateData: any = {};

    if (updates.cours_id !== undefined) updateData.cours_id = updates.cours_id;
    if (updates.code_examen !== undefined) updateData.code_examen = updates.code_examen;
    if (updates.nom_examen !== undefined) updateData.nom_examen = updates.nom_examen;
    if (updates.date_examen !== undefined) updateData.date_examen = updates.date_examen || null;
    if (updates.heure_debut !== undefined) updateData.heure_debut = updates.heure_debut || null;
    if (updates.heure_fin !== undefined) updateData.heure_fin = updates.heure_fin || null;
    if (updates.duree_minutes !== undefined) updateData.duree_minutes = updates.duree_minutes;
    if (updates.auditoires !== undefined) updateData.auditoires = updates.auditoires || null;
    if (updates.enseignants !== undefined) updateData.enseignants = updates.enseignants;
    if (updates.secretariat !== undefined) updateData.secretariat = updates.secretariat || null;
    if (updates.nb_surveillants_requis !== undefined) {
      updateData.nb_surveillants_requis = updates.nb_surveillants_requis;
    }

    const { data: examen, error } = await supabase
      .from('examens')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating examen:', error);
      throw error;
    }

    // Log audit trail if user info provided
    if (userId && username && oldExamen) {
      await supabase.from('audit_log').insert({
        user_id: userId,
        username,
        action: 'update',
        table_name: 'examens',
        record_id: id,
        old_values: oldExamen,
        new_values: updateData,
      });
    }

    return examen;
  } catch (error) {
    console.error('Error in updateExamen:', error);
    throw error;
  }
}

/**
 * Delete examen (cascades to presence declarations)
 * @param id Exam ID
 * @param userId Optional user ID for audit trail
 * @param username Optional username for audit trail
 */
export async function deleteExamen(id: string, userId?: string, username?: string): Promise<void> {
  try {
    // Fetch old values for audit trail
    const { data: oldExamen } = await supabase
      .from('examens')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('examens')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting examen:', error);
      throw error;
    }

    // Log audit trail if user info provided
    if (userId && username && oldExamen) {
      await supabase.from('audit_log').insert({
        user_id: userId,
        username,
        action: 'delete',
        table_name: 'examens',
        record_id: id,
        old_values: oldExamen,
        new_values: null,
      });
    }
  } catch (error) {
    console.error('Error in deleteExamen:', error);
    throw error;
  }
}

/**
 * Link examen to course
 * @param examenId Exam ID
 * @param coursId Course ID
 * @returns Updated exam
 */
export async function linkExamenToCours(
  examenId: string,
  coursId: string
): Promise<Examen> {
  try {
    const { data: examen, error } = await supabase
      .from('examens')
      .update({ cours_id: coursId })
      .eq('id', examenId)
      .select()
      .single();

    if (error) {
      console.error('Error linking examen to cours:', error);
      throw error;
    }

    return examen;
  } catch (error) {
    console.error('Error in linkExamenToCours:', error);
    throw error;
  }
}

// ============================================
// CSV Import
// ============================================

/**
 * Import examens from parsed CSV data
 * @param sessionId Session ID
 * @param csvData Parsed CSV exam data
 * @param onProgress Progress callback
 * @returns Import result with counts and errors
 */
export async function importExamensFromCSV(
  sessionId: string,
  csvData: ParsedCSVExamen[],
  onProgress?: (current: number, total: number) => void
): Promise<ExamenImportResult> {
  const result: ExamenImportResult = {
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    warnings: []
  };

  const total = csvData.length;

  // Fetch all courses once for matching
  const { data: allCours } = await supabase
    .from('cours')
    .select('id, code');

  const coursMap = new Map<string, string>();
  (allCours || []).forEach(c => coursMap.set(c.code, c.id));

  for (let i = 0; i < csvData.length; i++) {
    const csvExamen = csvData[i];

    try {
      // Extract and clean course code
      const courseCode = extractCourseCode(csvExamen.activite);
      const coursId = coursMap.get(courseCode) || null;

      if (!coursId) {
        result.warnings.push(
          `Examen ${csvExamen.activite}: Cours "${courseCode}" non trouvé dans la base de données`
        );
      }

      // Convert date and times
      const date_examen = convertDateFormat(csvExamen.date);
      const heure_debut = convertTimeFormat(csvExamen.debut);
      const heure_fin = convertTimeFormat(csvExamen.fin);
      const duree_minutes = parseDuration(csvExamen.duree);
      const enseignants = parseTeachers(csvExamen.enseignants);

      // Check for duplicate (same session, code, and date)
      const { data: existing } = await supabase
        .from('examens')
        .select('id')
        .eq('session_id', sessionId)
        .eq('code_examen', courseCode)
        .eq('date_examen', date_examen)
        .single();

      const examenData = {
        session_id: sessionId,
        cours_id: coursId,
        code_examen: courseCode,
        nom_examen: csvExamen.code,
        date_examen: date_examen || null,
        heure_debut: heure_debut || null,
        heure_fin: heure_fin || null,
        duree_minutes: duree_minutes || null,
        auditoires: csvExamen.auditoires || null,
        enseignants: enseignants,
        secretariat: csvExamen.secretariat || null,
        nb_surveillants_requis: null,
        saisie_manuelle: false,
        valide: true
      };

      if (existing) {
        // Skip duplicate
        result.skipped++;
      } else {
        // Create new exam
        const { error } = await supabase
          .from('examens')
          .insert(examenData);

        if (error) {
          result.errors.push(
            `Erreur lors de la création de l'examen ${csvExamen.activite}: ${error.message}`
          );
        } else {
          result.imported++;
        }
      }
    } catch (error) {
      result.errors.push(
        `Erreur inattendue pour l'examen ${csvExamen.activite}: ${
          error instanceof Error ? error.message : 'Erreur inconnue'
        }`
      );
    }

    // Update progress
    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  return result;
}

// ============================================
// Dashboard Statistics
// ============================================

/**
 * Get dashboard statistics for a session
 * @param sessionId Session ID
 * @returns Dashboard statistics
 */
export async function getExamenDashboardStats(
  sessionId: string
): Promise<ExamenDashboardStats> {
  try {
    // Fetch all exams for the session
    const { data: examens, error: examensError } = await supabase
      .from('examens')
      .select('id, cours_id, nb_surveillants_requis, secretariat, date_examen')
      .eq('session_id', sessionId);

    if (examensError) {
      console.error('Error fetching examens for stats:', examensError);
      throw examensError;
    }

    const total_examens = examens?.length || 0;

    // Fetch all presence declarations for these exams
    const examenIds = examens?.map(e => e.id) || [];
    const { data: presences } = await supabase
      .from('presences_enseignants')
      .select('examen_id')
      .in('examen_id', examenIds);

    // Calculate stats
    const examensWithDeclarations = new Set(presences?.map(p => p.examen_id) || []);
    const examens_with_declarations = examensWithDeclarations.size;
    const examens_pending_declarations = total_examens - examens_with_declarations;

    const total_supervisors_required = examens?.reduce(
      (sum, e) => sum + (e.nb_surveillants_requis || 0),
      0
    ) || 0;

    const examens_without_course = examens?.filter(e => !e.cours_id).length || 0;
    const examens_without_supervisor_requirement = examens?.filter(
      e => e.nb_surveillants_requis === null
    ).length || 0;

    // Calculate completion percentage
    // An exam is "complete" if it has: course linked, supervisor requirement set, and declarations
    const completeExamens = examens?.filter(e => 
      e.cours_id && 
      e.nb_surveillants_requis !== null && 
      examensWithDeclarations.has(e.id)
    ).length || 0;
    const completion_percentage = total_examens > 0 
      ? Math.round((completeExamens / total_examens) * 100) 
      : 0;

    // Group by secretariat
    const secretariatCounts = new Map<string, number>();
    examens?.forEach(e => {
      const sec = e.secretariat || 'Non assigné';
      secretariatCounts.set(sec, (secretariatCounts.get(sec) || 0) + 1);
    });
    const examens_by_secretariat = Array.from(secretariatCounts.entries()).map(
      ([secretariat, count]) => ({ secretariat, count })
    );

    // Group by date
    const dateCounts = new Map<string, number>();
    examens?.forEach(e => {
      if (e.date_examen) {
        dateCounts.set(e.date_examen, (dateCounts.get(e.date_examen) || 0) + 1);
      }
    });
    const examens_by_date = Array.from(dateCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      total_examens,
      examens_with_declarations,
      examens_pending_declarations,
      total_supervisors_required,
      examens_without_course,
      examens_without_supervisor_requirement,
      completion_percentage,
      examens_by_secretariat,
      examens_by_date
    };
  } catch (error) {
    console.error('Error in getExamenDashboardStats:', error);
    throw error;
  }
}

/**
 * Check if exam has presence declarations
 * @param examenId Exam ID
 * @returns Status and count
 */
export async function checkExamenPresenceStatus(
  examenId: string
): Promise<{ has_declarations: boolean; count: number }> {
  try {
    const { count, error } = await supabase
      .from('presences_enseignants')
      .select('*', { count: 'exact', head: true })
      .eq('examen_id', examenId);

    if (error) {
      console.error('Error checking presence status:', error);
      throw error;
    }

    return {
      has_declarations: (count || 0) > 0,
      count: count || 0
    };
  } catch (error) {
    console.error('Error in checkExamenPresenceStatus:', error);
    throw error;
  }
}
