import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useActiveSession } from '../../src/hooks/useActiveSession';
import { ExamenWithCours } from '../../types';
import { linkExamenToCours } from '../../lib/examenManagementApi';
import { extractCourseCode } from '../../lib/examenCsvParser';
import { 
  Link2, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter,
  RefreshCw,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { Button } from '../../components/shared/Button';
import toast from 'react-hot-toast';

interface ExamenCoursLink {
  examen_id: string;
  examen_code: string;
  examen_nom: string;
  examen_enseignants: string[];
  cours_id: string | null;
  cours_code: string | null;
  cours_nom: string | null;
  cours_enseignants: string[] | null;
  extracted_code: string;
  status: 'linked' | 'orphan' | 'mismatch' | 'perfect';
  confidence: 'high' | 'medium' | 'low' | 'none';
}

type FilterType = 'all' | 'linked' | 'orphan' | 'mismatch' | 'perfect';

export default function ExamenCoursLinksPage() {
  const { data: activeSession, isLoading: sessionLoading } = useActiveSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [editingExamen, setEditingExamen] = useState<string | null>(null);
  const [selectedCoursId, setSelectedCoursId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Fetch examens with cours data
  const { data: examensData, isLoading, refetch, error: queryError } = useQuery({
    queryKey: ['examens-cours-links', activeSession?.id],
    queryFn: async () => {
      if (!activeSession?.id) return [];

      console.log('Fetching examens for session:', activeSession.id);

      const { data: examens, error } = await supabase
        .from('examens')
        .select(`
          id,
          code_examen,
          nom_examen,
          enseignants,
          cours_id
        `)
        .eq('session_id', activeSession.id)
        .order('code_examen');

      if (error) {
        console.error('Error fetching examens:', error);
        throw error;
      }

      console.log('Examens fetched:', examens?.length || 0);

      if (!examens || examens.length === 0) {
        return [];
      }

      // Fetch cours data separately to avoid join issues
      const coursIds = examens.map(e => e.cours_id).filter(Boolean);
      let coursData: any[] = [];
      
      if (coursIds.length > 0) {
        const { data: cours, error: coursError } = await supabase
          .from('cours')
          .select('id, code, intitule_complet, enseignants')
          .in('id', coursIds);

        if (coursError) {
          console.error('Error fetching cours:', coursError);
        } else {
          coursData = cours || [];
        }
      }

      console.log('Cours fetched:', coursData.length);

      // Create a map for quick cours lookup
      const coursMap = new Map(coursData.map(c => [c.id, c]));

      return examens.map((examen): ExamenCoursLink => {
        const extractedCode = extractCourseCode(examen.code_examen);
        const cours = examen.cours_id ? coursMap.get(examen.cours_id) : null;
        
        let status: ExamenCoursLink['status'] = 'orphan';
        let confidence: ExamenCoursLink['confidence'] = 'none';

        if (cours) {
          // Examen lié à un cours
          if (cours.code === extractedCode) {
            status = 'perfect';
            confidence = 'high';
          } else if (cours.code.startsWith(extractedCode.substring(0, 4))) {
            status = 'linked';
            confidence = 'medium';
          } else {
            status = 'mismatch';
            confidence = 'low';
          }
        }

        return {
          examen_id: examen.id,
          examen_code: examen.code_examen,
          examen_nom: examen.nom_examen,
          examen_enseignants: examen.enseignants || [],
          cours_id: cours?.id || null,
          cours_code: cours?.code || null,
          cours_nom: cours?.intitule_complet || null,
          cours_enseignants: cours?.enseignants || null,
          extracted_code: extractedCode,
          status,
          confidence
        };
      });
    },
    enabled: !!activeSession?.id
  });

  // Fetch all cours for selection
  const { data: allCours } = useQuery({
    queryKey: ['all-cours', activeSession?.id],
    queryFn: async () => {
      if (!activeSession?.id) return [];

      const { data, error } = await supabase
        .from('cours')
        .select('id, code, intitule_complet, enseignants')
        .eq('session_id', activeSession.id)
        .order('code');

      if (error) throw error;
      return data;
    },
    enabled: !!activeSession?.id
  });

  // Filter and search logic
  const filteredExamens = useMemo(() => {
    if (!examensData) return [];

    let filtered = examensData;

    // Apply status filter
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.status === filterType);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.examen_code.toLowerCase().includes(term) ||
        item.examen_nom.toLowerCase().includes(term) ||
        item.cours_code?.toLowerCase().includes(term) ||
        item.cours_nom?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [examensData, filterType, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    if (!examensData) return { total: 0, linked: 0, orphan: 0, mismatch: 0, perfect: 0 };

    return {
      total: examensData.length,
      linked: examensData.filter(e => e.status === 'linked').length,
      orphan: examensData.filter(e => e.status === 'orphan').length,
      mismatch: examensData.filter(e => e.status === 'mismatch').length,
      perfect: examensData.filter(e => e.status === 'perfect').length,
    };
  }, [examensData]);

  // Handle link change
  const handleLinkChange = async (examenId: string, coursId: string) => {
    try {
      setSaving(true);
      await linkExamenToCours(examenId, coursId || null);
      toast.success('Lien modifié avec succès');
      setEditingExamen(null);
      setSelectedCoursId('');
      refetch();
    } catch (error) {
      console.error('Error linking examen to cours:', error);
      toast.error('Erreur lors de la modification du lien');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: ExamenCoursLink['status'], confidence: ExamenCoursLink['confidence']) => {
    switch (status) {
      case 'perfect':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Parfait
          </span>
        );
      case 'linked':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Link2 className="w-3 h-3 mr-1" />
            Lié
          </span>
        );
      case 'mismatch':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Incohérent
          </span>
        );
      case 'orphan':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Non lié
          </span>
        );
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Chargement de la session...</p>
        </div>
      </div>
    );
  }

  if (!activeSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Aucune session active</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erreur lors du chargement: {queryError.message}</p>
          <button 
            onClick={() => refetch()} 
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Liens Examen-Cours</h1>
              <p className="mt-2 text-sm text-gray-600">
                Session: {activeSession.name} ({activeSession.year})
              </p>
            </div>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">{stats.total}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Parfaits</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.perfect}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Link2 className="w-8 h-8 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Liés</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.linked}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="w-8 h-8 text-orange-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Incohérents</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.mismatch}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Non liés</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.orphan}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rechercher
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Code examen, nom, cours..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous ({stats.total})</option>
                <option value="perfect">Parfaits ({stats.perfect})</option>
                <option value="linked">Liés ({stats.linked})</option>
                <option value="mismatch">Incohérents ({stats.mismatch})</option>
                <option value="orphan">Non liés ({stats.orphan})</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Examen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code Extrait
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cours Lié
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enseignants
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Chargement...
                    </td>
                  </tr>
                ) : queryError ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-red-500">
                      Erreur: {queryError.message}
                    </td>
                  </tr>
                ) : !examensData ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Aucune donnée chargée
                    </td>
                  </tr>
                ) : examensData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Aucun examen trouvé dans la session active
                    </td>
                  </tr>
                ) : filteredExamens.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Aucun examen ne correspond aux filtres (Total: {examensData.length})
                    </td>
                  </tr>
                ) : (
                  filteredExamens.map((item) => (
                    <tr key={item.examen_id} className="hover:bg-gray-50">
                      {/* Examen */}
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.examen_code}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {item.examen_nom}
                          </div>
                        </div>
                      </td>

                      {/* Code Extrait */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {item.extracted_code}
                        </span>
                      </td>

                      {/* Cours Lié */}
                      <td className="px-6 py-4">
                        {editingExamen === item.examen_id ? (
                          <select
                            value={selectedCoursId}
                            onChange={(e) => setSelectedCoursId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={saving}
                          >
                            <option value="">Aucun cours</option>
                            {allCours?.map((cours) => (
                              <option key={cours.id} value={cours.id}>
                                {cours.code} - {cours.intitule_complet}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div>
                            {item.cours_code ? (
                              <>
                                <div className="text-sm font-medium text-gray-900">
                                  {item.cours_code}
                                </div>
                                <div className="text-sm text-gray-500 max-w-xs truncate">
                                  {item.cours_nom}
                                </div>
                              </>
                            ) : (
                              <span className="text-sm text-gray-400 italic">
                                Aucun cours lié
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Statut */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item.status, item.confidence)}
                      </td>

                      {/* Enseignants */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500">Examen:</div>
                          <div className="text-sm text-gray-900">
                            {item.examen_enseignants.join(', ') || 'Aucun'}
                          </div>
                          {item.cours_enseignants && (
                            <>
                              <div className="text-xs text-gray-500">Cours:</div>
                              <div className="text-sm text-gray-700">
                                {item.cours_enseignants.join(', ')}
                              </div>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingExamen === item.examen_id ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleLinkChange(item.examen_id, selectedCoursId)}
                              disabled={saving}
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Sauver
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingExamen(null);
                                setSelectedCoursId('');
                              }}
                              disabled={saving}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingExamen(item.examen_id);
                              setSelectedCoursId(item.cours_id || '');
                            }}
                          >
                            <Edit3 className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600">
          Affichage de {filteredExamens.length} examen(s) sur {stats.total}
        </div>
      </div>
    </div>
  );
}