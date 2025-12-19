import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useActiveSession } from '../../src/hooks/useActiveSession';
import { 
  Users, 
  Download, 
  Search, 
  Filter,
  FileText,
  BarChart3,
  Calendar,
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Badge } from '../../components/shared/Badge';
import { exportToXLSX } from '../../lib/exportUtils';
import toast from 'react-hot-toast';

interface SurveillantSurveillance {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  type_surveillant: string;
  nb_surveillances: number;
  examens: Array<{
    code_examen: string;
    nom_examen: string;
    date_examen: string;
    heure_debut: string;
    heure_fin: string;
    auditoire: string;
  }>;
}

interface SurveillanceStats {
  total_surveillants: number;
  total_surveillances: number;
  moyenne_par_surveillant: number;
  max_surveillances: number;
  min_surveillances: number;
}

const SurveillantTypeLabels = {
  'assistant': 'Assistant',
  'doctorant': 'Doctorant',
  'externe': 'Externe',
  'etudiant': 'Étudiant',
  'autre': 'Autre'
};

export default function RapportSurveillancesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'nom' | 'surveillances'>('nom');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isExporting, setIsExporting] = useState(false);
  
  const { data: activeSession } = useActiveSession();

  // Fetch surveillances data
  const { data: surveillants, isLoading, error } = useQuery({
    queryKey: ['rapport-surveillances', activeSession?.id],
    queryFn: async () => {
      if (!activeSession?.id) return [];

      // Récupérer tous les auditoires avec leurs surveillants pour la session active
      const { data: auditoires, error: auditoiresError } = await supabase
        .from('examen_auditoires')
        .select(`
          surveillants,
          auditoire,
          examens!inner (
            id,
            code_examen,
            nom_examen,
            date_examen,
            heure_debut,
            heure_fin,
            session_id
          )
        `)
        .eq('examens.session_id', activeSession.id);

      if (auditoiresError) throw auditoiresError;

      // Récupérer les informations des surveillants
      const { data: surveillantsInfo, error: surveillantsError } = await supabase
        .from('view_surveillants_with_type')
        .select('nom, prenom, email, telephone, type_surveillant');

      if (surveillantsError) throw surveillantsError;

      // Créer un map des surveillants pour un accès rapide
      const surveillantsMap = new Map(
        surveillantsInfo.map(s => [s.email, s])
      );

      // Compter les surveillances par surveillant
      const surveillanceCount = new Map<string, SurveillantSurveillance>();

      auditoires?.forEach(auditoire => {
        if (auditoire.surveillants && Array.isArray(auditoire.surveillants)) {
          auditoire.surveillants.forEach((email: string) => {
            const surveillantInfo = surveillantsMap.get(email);
            if (surveillantInfo) {
              if (!surveillanceCount.has(email)) {
                surveillanceCount.set(email, {
                  nom: surveillantInfo.nom,
                  prenom: surveillantInfo.prenom,
                  email: surveillantInfo.email,
                  telephone: surveillantInfo.telephone,
                  type_surveillant: surveillantInfo.type_surveillant,
                  nb_surveillances: 0,
                  examens: []
                });
              }

              const surveillant = surveillanceCount.get(email)!;
              surveillant.nb_surveillances++;
              surveillant.examens.push({
                code_examen: (auditoire.examens as any)?.code_examen || '',
                nom_examen: (auditoire.examens as any)?.nom_examen || '',
                date_examen: (auditoire.examens as any)?.date_examen || '',
                heure_debut: (auditoire.examens as any)?.heure_debut || '',
                heure_fin: (auditoire.examens as any)?.heure_fin || '',
                auditoire: auditoire.auditoire
              });
            }
          });
        }
      });

      return Array.from(surveillanceCount.values());
    },
    enabled: !!activeSession?.id,
  });

  // Calculer les statistiques
  const stats = useMemo<SurveillanceStats>(() => {
    if (!surveillants || surveillants.length === 0) {
      return {
        total_surveillants: 0,
        total_surveillances: 0,
        moyenne_par_surveillant: 0,
        max_surveillances: 0,
        min_surveillances: 0
      };
    }

    const surveillances = surveillants.map(s => s.nb_surveillances);
    const total_surveillances = surveillances.reduce((sum, nb) => sum + nb, 0);

    return {
      total_surveillants: surveillants.length,
      total_surveillances,
      moyenne_par_surveillant: Math.round((total_surveillances / surveillants.length) * 10) / 10,
      max_surveillances: Math.max(...surveillances),
      min_surveillances: Math.min(...surveillances)
    };
  }, [surveillants]);

  // Filtrer et trier les surveillants
  const filteredAndSortedSurveillants = useMemo(() => {
    if (!surveillants) return [];

    let filtered = surveillants;

    // Filtrer par terme de recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.nom.toLowerCase().includes(term) ||
        s.prenom.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term)
      );
    }

    // Filtrer par type
    if (filterType !== 'all') {
      filtered = filtered.filter(s => s.type_surveillant === filterType);
    }

    // Trier
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'nom') {
        comparison = `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`);
      } else {
        comparison = a.nb_surveillances - b.nb_surveillances;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [surveillants, searchTerm, filterType, sortBy, sortOrder]);

  // Export vers Excel
  const handleExport = async () => {
    if (!surveillants || surveillants.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    try {
      setIsExporting(true);
      
      // Préparer les données pour l'export
      const exportData = filteredAndSortedSurveillants.map(surveillant => ({
        'Nom': surveillant.nom,
        'Prénom': surveillant.prenom,
        'Email': surveillant.email,
        'Téléphone': surveillant.telephone || '',
        'Type': SurveillantTypeLabels[surveillant.type_surveillant as keyof typeof SurveillantTypeLabels] || surveillant.type_surveillant,
        'Nb Surveillances': surveillant.nb_surveillances,
        'Détail des examens': surveillant.examens.map(e => 
          `${e.code_examen} (${e.date_examen} ${e.heure_debut}-${e.heure_fin}, ${e.auditoire})`
        ).join('; ')
      }));

      // Ajouter une feuille de statistiques
      const statsData = [
        ['Statistique', 'Valeur'],
        ['Total surveillants', stats.total_surveillants],
        ['Total surveillances', stats.total_surveillances],
        ['Moyenne par surveillant', stats.moyenne_par_surveillant],
        ['Maximum surveillances', stats.max_surveillances],
        ['Minimum surveillances', stats.min_surveillances],
        ['Session', activeSession?.name || ''],
        ['Date d\'export', new Date().toLocaleString('fr-FR')]
      ];

      await exportToXLSX(
        [
          { name: 'Surveillants', data: exportData },
          { name: 'Statistiques', data: statsData }
        ],
        `rapport-surveillances-${activeSession?.name?.replace(/\s+/g, '-') || 'session'}-${new Date().toISOString().split('T')[0]}`
      );

      toast.success(`${filteredAndSortedSurveillants.length} surveillant(s) exporté(s) avec succès`);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast.error('Erreur lors de l\'export');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Chargement du rapport...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="h-5 w-5" />
          <span>Erreur lors du chargement des données: {error.message}</span>
        </div>
      </div>
    );
  }

  if (!activeSession) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-yellow-800">
          <AlertCircle className="h-5 w-5" />
          <span>Aucune session active. Veuillez activer une session pour voir le rapport.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Rapport des Surveillances
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Session: {activeSession.name} ({activeSession.year})
          </p>
        </div>
        <Button 
          onClick={handleExport}
          disabled={isExporting || !surveillants || surveillants.length === 0}
          className="flex items-center gap-2"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Export...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Exporter Excel
            </>
          )}
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Surveillants</p>
                <p className="text-2xl font-bold">{stats.total_surveillants}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total surveillances</p>
                <p className="text-2xl font-bold">{stats.total_surveillances}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Moyenne</p>
                <p className="text-2xl font-bold">{stats.moyenne_par_surveillant}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Maximum</p>
                <p className="text-2xl font-bold">{stats.max_surveillances}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Minimum</p>
                <p className="text-2xl font-bold">{stats.min_surveillances}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et tri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Recherche */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rechercher
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nom, prénom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtre par type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type de surveillant
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Tous les types</option>
                {Object.entries(SurveillantTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Tri par */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trier par
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'nom' | 'surveillances')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="nom">Nom alphabétique</option>
                <option value="surveillances">Nombre de surveillances</option>
              </select>
            </div>

            {/* Ordre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ordre
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="asc">Croissant</option>
                <option value="desc">Décroissant</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des surveillants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Liste des surveillants ({filteredAndSortedSurveillants.length})
          </CardTitle>
          <CardDescription>
            Cliquez sur un surveillant pour voir le détail de ses surveillances
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAndSortedSurveillants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucun surveillant trouvé avec les filtres actuels</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAndSortedSurveillants.map((surveillant, index) => (
                <details key={surveillant.email} className="group">
                  <summary className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500 w-8">{index + 1}.</span>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {surveillant.nom} {surveillant.prenom}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {surveillant.email}
                          {surveillant.telephone && (
                            <span className="ml-2">📞 {surveillant.telephone}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="default">
                        {SurveillantTypeLabels[surveillant.type_surveillant as keyof typeof SurveillantTypeLabels] || surveillant.type_surveillant}
                      </Badge>
                      <Badge 
                        variant={surveillant.nb_surveillances === 0 ? 'destructive' : 
                                surveillant.nb_surveillances <= 2 ? 'warning' : 'success'}
                      >
                        {surveillant.nb_surveillances} surveillance{surveillant.nb_surveillances > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </summary>
                  
                  {surveillant.examens.length > 0 && (
                    <div className="mt-2 ml-12 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                        Détail des surveillances:
                      </h4>
                      <div className="space-y-2">
                        {surveillant.examens.map((examen, examIndex) => (
                          <div key={examIndex} className="flex items-center justify-between text-sm">
                            <div>
                              <span className="font-medium">{examen.code_examen}</span>
                              <span className="text-gray-600 dark:text-gray-400 ml-2">
                                {examen.nom_examen}
                              </span>
                            </div>
                            <div className="text-gray-500 text-xs">
                              {examen.date_examen} • {examen.heure_debut}-{examen.heure_fin} • {examen.auditoire}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </details>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}