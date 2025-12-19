import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface Surveillance {
  id: string;
  nom_examen: string;
  date_examen: string;
  heure_debut: string;
  heure_fin: string;
  auditoire?: string;
  type_examen?: string;
  faculte?: string;
  surveillant_nom?: string;
  statut_attribution?: string;
}

export interface UseSurveillancesOptions {
  surveillantNom?: string;
  dateDebut?: string;
  dateFin?: string;
  statut?: string;
}

export function useSurveillances(options: UseSurveillancesOptions = {}) {
  const [surveillances, setSurveillances] = useState<Surveillance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSurveillances();
  }, [options.surveillantNom, options.dateDebut, options.dateFin, options.statut]);

  const loadSurveillances = async () => {
    try {
      setLoading(true);
      setError(null);

      // Construire la requête de base
      let query = supabase
        .from('view_surveillants_examens')
        .select(`
          id,
          nom_examen,
          date_examen,
          heure_debut,
          heure_fin,
          auditoire,
          type_examen,
          faculte,
          surveillant_nom,
          statut_attribution
        `);

      // Appliquer les filtres
      if (options.surveillantNom) {
        query = query.ilike('surveillant_nom', `%${options.surveillantNom}%`);
      }

      if (options.dateDebut) {
        query = query.gte('date_examen', options.dateDebut);
      }

      if (options.dateFin) {
        query = query.lte('date_examen', options.dateFin);
      }

      if (options.statut) {
        query = query.eq('statut_attribution', options.statut);
      }

      // Ordonner par date
      query = query.order('date_examen', { ascending: true });
      query = query.order('heure_debut', { ascending: true });

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setSurveillances(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des surveillances:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const refreshSurveillances = () => {
    loadSurveillances();
  };

  return {
    surveillances,
    loading,
    error,
    refreshSurveillances
  };
}