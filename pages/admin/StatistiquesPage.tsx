import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/shared/Card';
import { Badge } from '../../components/shared/Badge';
import { Button } from '../../components/shared/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/shared/Select';
import { Input } from '../../components/shared/Input';
import { BarChart3, TrendingDown, Search, Download, Loader2 } from 'lucide-react';
import { getSessions } from '../../lib/api';
import { supabase } from '../../lib/supabaseClient';
import { SurveillantTypeLabels, Session, Creneau, SoumissionDisponibilite } from '../../types';
import toast from 'react-hot-toast';

interface StatsSurveillantSession {
    sessionId: string;
    sessionName: string;
    sessionYear: number;
    sessionPeriod: number;
    nom: string;
    prenom: string;
    email: string;
    type: string;
    totalCreneaux: number;
    creneauxDisponibles: number;
    tauxDisponibilite: number;
    creneauxMatin: number;
    creneauxApresMidi: number;
    creneauxSoir: number;
    preferenceHoraire: string;
}

const StatistiquesPage: React.FC = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [allStats, setAllStats] = useState<StatsSurveillantSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterSession, setFilterSession] = useState<string>('active'); // 'active', 'year-2025', 'all', ou session-id
    const [sortBy, setSortBy] = useState<string>('session-desc');

    // Charger toutes les données
    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setIsLoading(true);
        try {
            // Charger toutes les sessions
            const sessionsData = await getSessions();
            setSessions(sessionsData);

            // Charger les stats pour toutes les sessions
            const allStatsData: StatsSurveillantSession[] = [];

            for (const session of sessionsData) {
                // Charger les créneaux de cette session
                const { data: creneaux } = await supabase
                    .from('creneaux')
                    .select('*')
                    .eq('session_id', session.id);

                // Charger les soumissions de cette session
                const { data: soumissions } = await supabase
                    .from('soumissions_disponibilites')
                    .select('*')
                    .eq('session_id', session.id);

                if (!creneaux || !soumissions) continue;

                // Calculer les stats pour chaque soumission
                soumissions.forEach(submission => {
                    const disponibilites = submission.historique_disponibilites || [];
                    const creneauxDisponibles = disponibilites.filter((d: any) => d.est_disponible);

                    let creneauxMatin = 0;
                    let creneauxApresMidi = 0;
                    let creneauxSoir = 0;

                    creneauxDisponibles.forEach((disp: any) => {
                        const creneau = creneaux.find((c: any) => c.id === disp.creneau_id);
                        if (creneau) {
                            // Utiliser l'heure de début pour déterminer la période
                            const heureDebut = creneau.heure_debut_surveillance || '';
                            const heureFin = creneau.heure_fin_surveillance || '';
                            
                            // Convertir en minutes depuis minuit pour comparaison précise
                            const parseTime = (time: string) => {
                                const [h, m] = time.split(':').map(Number);
                                return h * 60 + m;
                            };
                            
                            const minutesDebut = parseTime(heureDebut);
                            const minutesFin = parseTime(heureFin);
                            
                            // Matin : créneaux qui finissent jusqu'à 12h00 inclus
                            if (minutesFin <= 12 * 60) {
                                creneauxMatin++;
                            }
                            // Soir : créneaux qui commencent à partir de 15h45 (945 minutes)
                            else if (minutesDebut >= 15 * 60 + 45) {
                                creneauxSoir++;
                            }
                            // Après-midi : tout le reste (finit après 12h00 et commence avant 15h45)
                            else {
                                creneauxApresMidi++;
                            }
                        }
                    });

                    let preferenceHoraire = 'Équilibré';
                    const total = creneauxMatin + creneauxApresMidi + creneauxSoir;
                    if (total > 0) {
                        const ratioMatin = creneauxMatin / total;
                        const ratioAM = creneauxApresMidi / total;
                        const ratioSoir = creneauxSoir / total;

                        if (ratioMatin > 0.6) preferenceHoraire = 'Matin';
                        else if (ratioAM > 0.6) preferenceHoraire = 'Après-midi';
                        else if (ratioSoir > 0.6) preferenceHoraire = 'Soir';
                        else if (ratioMatin > 0.4 && ratioAM > 0.4) preferenceHoraire = 'Matin/AM';
                        else if (ratioAM > 0.4 && ratioSoir > 0.4) preferenceHoraire = 'AM/Soir';
                    }

                    allStatsData.push({
                        sessionId: session.id,
                        sessionName: session.name,
                        sessionYear: session.year,
                        sessionPeriod: session.period,
                        nom: submission.nom,
                        prenom: submission.prenom,
                        email: submission.email,
                        type: submission.type_surveillant,
                        totalCreneaux: creneaux.length,
                        creneauxDisponibles: creneauxDisponibles.length,
                        tauxDisponibilite: creneaux.length > 0 
                            ? Math.round((creneauxDisponibles.length / creneaux.length) * 100) 
                            : 0,
                        creneauxMatin,
                        creneauxApresMidi,
                        creneauxSoir,
                        preferenceHoraire,
                    });
                });
            }

            setAllStats(allStatsData);
        } catch (error) {
            console.error('Error loading stats:', error);
            toast.error('Erreur lors du chargement des statistiques');
        } finally {
            setIsLoading(false);
        }
    };

    // Filtrer les stats
    const filteredStats = useMemo(() => {
        let filtered = allStats;

        // Filtre par session
        if (filterSession === 'active') {
            const activeSession = sessions.find(s => s.is_active);
            if (activeSession) {
                filtered = filtered.filter(s => s.sessionId === activeSession.id);
            }
        } else if (filterSession.startsWith('year-')) {
            const year = parseInt(filterSession.split('-')[1]);
            filtered = filtered.filter(s => s.sessionYear === year);
        } else if (filterSession !== 'all') {
            filtered = filtered.filter(s => s.sessionId === filterSession);
        }

        // Filtre par type
        if (filterType !== 'all') {
            filtered = filtered.filter(s => s.type === filterType);
        }

        // Filtre par recherche
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(s => 
                `${s.prenom} ${s.nom}`.toLowerCase().includes(query) ||
                s.email.toLowerCase().includes(query)
            );
        }

        // Tri
        const [sortKey, sortDir] = sortBy.split('-');
        filtered.sort((a, b) => {
            let valA: any, valB: any;
            
            if (sortKey === 'nom') {
                // Trier par nom de famille d'abord, puis prénom
                valA = `${a.nom} ${a.prenom}`;
                valB = `${b.nom} ${b.prenom}`;
            } else if (sortKey === 'taux') {
                valA = a.tauxDisponibilite;
                valB = b.tauxDisponibilite;
            } else if (sortKey === 'disponibles') {
                valA = a.creneauxDisponibles;
                valB = b.creneauxDisponibles;
            } else if (sortKey === 'session') {
                valA = `${a.sessionYear}-${a.sessionPeriod}`;
                valB = `${b.sessionYear}-${b.sessionPeriod}`;
            }

            if (typeof valA === 'string') {
                return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            return sortDir === 'asc' ? valA - valB : valB - valA;
        });

        return filtered;
    }, [allStats, filterSession, filterType, searchQuery, sortBy, sessions]);

    // Statistiques globales
    const globalStats = useMemo(() => {
        if (!filteredStats.length) return null;

        const tauxMoyen = Math.round(
            filteredStats.reduce((acc, s) => acc + s.tauxDisponibilite, 0) / filteredStats.length
        );
        
        const disponiblesMoyen = Math.round(
            filteredStats.reduce((acc, s) => acc + s.creneauxDisponibles, 0) / filteredStats.length
        );

        // Compter les surveillants uniques
        const uniqueSurveillants = new Set(filteredStats.map(s => s.email)).size;

        // Compter les sessions
        const uniqueSessions = new Set(filteredStats.map(s => s.sessionId)).size;

        return {
            totalLignes: filteredStats.length,
            uniqueSurveillants,
            uniqueSessions,
            tauxMoyen,
            disponiblesMoyen,
        };
    }, [filteredStats]);

    // Options de filtre par année
    const availableYears = useMemo(() => {
        const years = new Set(sessions.map(s => s.year));
        return Array.from(years).sort((a, b) => b - a);
    }, [sessions]);

    const exportToCSV = () => {
        const headers = [
            'Session',
            'Année',
            'Période',
            'Nom',
            'Prénom',
            'Email',
            'Type',
            'Créneaux Disponibles',
            'Total Créneaux',
            'Taux (%)',
            'Matin',
            'Après-midi',
            'Soir',
            'Préférence',
        ];

        const rows = filteredStats.map(s => [
            s.sessionName,
            s.sessionYear,
            s.sessionPeriod,
            s.nom,
            s.prenom,
            s.email,
            SurveillantTypeLabels[s.type as keyof typeof SurveillantTypeLabels] || s.type,
            s.creneauxDisponibles,
            s.totalCreneaux,
            s.tauxDisponibilite,
            s.creneauxMatin,
            s.creneauxApresMidi,
            s.creneauxSoir,
            s.preferenceHoraire,
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `statistiques-${filterSession}.csv`;
        link.click();
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <BarChart3 className="mr-2 h-6 w-6" />
                        Statistiques des Disponibilités
                    </CardTitle>
                    <CardDescription>Chargement des données...</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Statistiques des Disponibilités</h1>
                    <p className="text-gray-500 mt-1">Historique complet toutes sessions</p>
                </div>
                <Button onClick={exportToCSV} variant="outline" disabled={filteredStats.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter CSV
                </Button>
            </div>

            {/* Statistiques Globales */}
            {globalStats && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-500">Lignes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{globalStats.totalLignes}</div>
                            <p className="text-xs text-gray-500 mt-1">soumissions</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-500">Surveillants</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{globalStats.uniqueSurveillants}</div>
                            <p className="text-xs text-gray-500 mt-1">uniques</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-500">Sessions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{globalStats.uniqueSessions}</div>
                            <p className="text-xs text-gray-500 mt-1">couvertes</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-500">Taux Moyen</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{globalStats.tauxMoyen}%</div>
                            <p className="text-xs text-gray-500 mt-1">de disponibilité</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-500">Moyenne</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{globalStats.disponiblesMoyen}</div>
                            <p className="text-xs text-gray-500 mt-1">créneaux/soumission</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filtres */}
            <Card>
                <CardHeader>
                    <CardTitle>Filtres et Recherche</CardTitle>
                    <div className="flex flex-wrap gap-4 mt-4">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium shrink-0">Session:</label>
                            <Select value={filterSession} onValueChange={setFilterSession}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Session Active</SelectItem>
                                    <SelectItem value="all">Toutes les Sessions</SelectItem>
                                    {availableYears.map(year => (
                                        <SelectItem key={year} value={`year-${year}`}>
                                            Année {year}
                                        </SelectItem>
                                    ))}
                                    {sessions.length > 0 && <SelectItem value="separator">───────────</SelectItem>}
                                    {sessions.map(session => (
                                        <SelectItem key={session.id} value={session.id}>
                                            {session.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium shrink-0">Type:</label>
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les types</SelectItem>
                                    {Object.entries(SurveillantTypeLabels).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2 flex-grow max-w-sm">
                            <Search className="h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Rechercher..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium shrink-0">Tri:</label>
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="session-desc">Session (récent)</SelectItem>
                                    <SelectItem value="session-asc">Session (ancien)</SelectItem>
                                    <SelectItem value="nom-asc">Nom (A-Z)</SelectItem>
                                    <SelectItem value="nom-desc">Nom (Z-A)</SelectItem>
                                    <SelectItem value="taux-asc">Taux croissant</SelectItem>
                                    <SelectItem value="taux-desc">Taux décroissant</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Surveillant</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Disponibles</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Taux</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Matin</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">AM</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Soir</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Préférence</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredStats.map((stat, idx) => (
                                    <tr key={`${stat.sessionId}-${stat.email}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium">{stat.sessionName}</div>
                                            <div className="text-xs text-gray-500">{stat.sessionYear}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{stat.prenom} {stat.nom}</div>
                                            <div className="text-xs text-gray-500">{stat.email}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge variant="default" className="text-xs">
                                                {SurveillantTypeLabels[stat.type as keyof typeof SurveillantTypeLabels]}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-center font-medium">
                                            {stat.creneauxDisponibles}/{stat.totalCreneaux}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge 
                                                variant={
                                                    stat.tauxDisponibilite >= 70 ? 'success' :
                                                    stat.tauxDisponibilite >= 40 ? 'warning' :
                                                    'destructive'
                                                }
                                            >
                                                {stat.tauxDisponibilite}%
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm">{stat.creneauxMatin}</td>
                                        <td className="px-4 py-3 text-center text-sm">{stat.creneauxApresMidi}</td>
                                        <td className="px-4 py-3 text-center text-sm">
                                            <span className={stat.creneauxSoir === 0 && stat.creneauxDisponibles > 0 ? 'text-orange-600 font-bold' : ''}>
                                                {stat.creneauxSoir}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-xs">{stat.preferenceHoraire}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredStats.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            Aucune donnée pour les filtres sélectionnés
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default StatistiquesPage;
