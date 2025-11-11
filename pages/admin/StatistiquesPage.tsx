import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/shared/Card';
import { Badge } from '../../components/shared/Badge';
import { Button } from '../../components/shared/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/shared/Select';
import { Input } from '../../components/shared/Input';
import { BarChart3, TrendingDown, TrendingUp, Clock, Calendar, User, Search, Download } from 'lucide-react';
import { useDataFetching } from '../../hooks/useDataFetching';
import { getDisponibilitesData, getSessions } from '../../lib/api';
import { SurveillantTypeLabels } from '../../types';

interface StatsSurveillant {
    nom: string;
    prenom: string;
    email: string;
    type: string;
    totalCreneaux: number;
    creneauxDisponibles: number;
    tauxDisponibilite: number;
    creneauxMatin: number; // 6h-12h
    creneauxApresMidi: number; // 12h-18h
    creneauxSoir: number; // 18h-22h
    preferenceHoraire: string;
}

const StatistiquesPage: React.FC = () => {
    const { data: disponibilitesData, isLoading } = useDataFetching(getDisponibilitesData, {
        creneaux: [],
        soumissions: [],
        activeSessionName: null,
    });
    
    const { data: sessions } = useDataFetching(getSessions, []);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('taux-asc');

    const { creneaux, soumissions, activeSessionName } = disponibilitesData;

    // Calculer les statistiques par surveillant
    const stats = useMemo<StatsSurveillant[]>(() => {
        if (!soumissions.length || !creneaux.length) return [];

        return soumissions.map(submission => {
            const disponibilites = submission.historique_disponibilites || [];
            const creneauxDisponibles = disponibilites.filter(d => d.est_disponible);

            // Analyser les préférences horaires
            let creneauxMatin = 0;
            let creneauxApresMidi = 0;
            let creneauxSoir = 0;

            creneauxDisponibles.forEach(disp => {
                const creneau = creneaux.find(c => c.id === disp.creneau_id);
                if (creneau?.heure_debut_surveillance) {
                    const heure = parseInt(creneau.heure_debut_surveillance.split(':')[0]);
                    if (heure >= 6 && heure < 12) creneauxMatin++;
                    else if (heure >= 12 && heure < 18) creneauxApresMidi++;
                    else if (heure >= 18 && heure < 22) creneauxSoir++;
                }
            });

            // Déterminer la préférence horaire
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

            return {
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
            };
        });
    }, [soumissions, creneaux]);

    // Filtrer et trier
    const filteredStats = useMemo(() => {
        let filtered = stats.filter(s => {
            const matchesSearch = `${s.prenom} ${s.nom}`.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = filterType === 'all' || s.type === filterType;
            return matchesSearch && matchesType;
        });

        // Trier
        const [sortKey, sortDir] = sortBy.split('-');
        filtered.sort((a, b) => {
            let valA: any, valB: any;
            
            if (sortKey === 'nom') {
                valA = a.nom;
                valB = b.nom;
            } else if (sortKey === 'taux') {
                valA = a.tauxDisponibilite;
                valB = b.tauxDisponibilite;
            } else if (sortKey === 'disponibles') {
                valA = a.creneauxDisponibles;
                valB = b.creneauxDisponibles;
            }

            if (typeof valA === 'string') {
                return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            return sortDir === 'asc' ? valA - valB : valB - valA;
        });

        return filtered;
    }, [stats, searchQuery, filterType, sortBy]);

    // Statistiques globales
    const globalStats = useMemo(() => {
        if (!stats.length) return null;

        const totalSurveillants = stats.length;
        const tauxMoyen = Math.round(stats.reduce((acc, s) => acc + s.tauxDisponibilite, 0) / totalSurveillants);
        const disponiblesMoyen = Math.round(stats.reduce((acc, s) => acc + s.creneauxDisponibles, 0) / totalSurveillants);
        
        // Identifier les moins disponibles
        const moinsDisponibles = [...stats]
            .sort((a, b) => a.tauxDisponibilite - b.tauxDisponibilite)
            .slice(0, 5);

        // Identifier ceux qui évitent certains horaires
        const evitentMatin = stats.filter(s => s.creneauxMatin === 0 && s.creneauxDisponibles > 0);
        const evitentSoir = stats.filter(s => s.creneauxSoir === 0 && s.creneauxDisponibles > 0);

        return {
            totalSurveillants,
            tauxMoyen,
            disponiblesMoyen,
            moinsDisponibles,
            evitentMatin,
            evitentSoir,
        };
    }, [stats]);

    const exportToCSV = () => {
        const headers = [
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

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `statistiques-${activeSessionName || 'session'}.csv`;
        link.click();
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Statistiques des Disponibilités</CardTitle>
                    <CardDescription>Chargement...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!activeSessionName) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Statistiques des Disponibilités</CardTitle>
                    <CardDescription>Aucune session active</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500">Veuillez activer une session pour voir les statistiques.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Statistiques des Disponibilités</h1>
                    <p className="text-gray-500 mt-1">Session : {activeSessionName}</p>
                </div>
                <Button onClick={exportToCSV} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter CSV
                </Button>
            </div>

            {/* Statistiques Globales */}
            {globalStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-500">Surveillants</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{globalStats.totalSurveillants}</div>
                            <p className="text-xs text-gray-500 mt-1">ont soumis</p>
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
                            <CardTitle className="text-sm font-medium text-gray-500">Moyenne Créneaux</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{globalStats.disponiblesMoyen}</div>
                            <p className="text-xs text-gray-500 mt-1">par surveillant</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-500">Évitent le Soir</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-orange-600">{globalStats.evitentSoir.length}</div>
                            <p className="text-xs text-gray-500 mt-1">surveillants (0 créneaux soir)</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Alertes */}
            {globalStats && globalStats.moinsDisponibles.length > 0 && (
                <Card className="border-orange-200 dark:border-orange-800">
                    <CardHeader>
                        <CardTitle className="flex items-center text-orange-700 dark:text-orange-400">
                            <TrendingDown className="h-5 w-5 mr-2" />
                            Surveillants Moins Disponibles
                        </CardTitle>
                        <CardDescription>Top 5 des taux de disponibilité les plus bas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {globalStats.moinsDisponibles.map((s, idx) => (
                                <div key={s.email} className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold text-orange-700 dark:text-orange-400">#{idx + 1}</span>
                                        <div>
                                            <div className="font-medium">{s.prenom} {s.nom}</div>
                                            <div className="text-xs text-gray-500">{SurveillantTypeLabels[s.type as keyof typeof SurveillantTypeLabels]}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-orange-700 dark:text-orange-400">{s.tauxDisponibilite}%</div>
                                        <div className="text-xs text-gray-500">{s.creneauxDisponibles}/{s.totalCreneaux}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filtres */}
            <Card>
                <CardHeader>
                    <CardTitle>Détails par Surveillant</CardTitle>
                    <div className="flex flex-wrap gap-4 mt-4">
                        <div className="flex items-center gap-2 flex-grow max-w-sm">
                            <Search className="h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Rechercher..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
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
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="nom-asc">Nom (A-Z)</SelectItem>
                                <SelectItem value="nom-desc">Nom (Z-A)</SelectItem>
                                <SelectItem value="taux-asc">Taux croissant</SelectItem>
                                <SelectItem value="taux-desc">Taux décroissant</SelectItem>
                                <SelectItem value="disponibles-asc">Créneaux croissant</SelectItem>
                                <SelectItem value="disponibles-desc">Créneaux décroissant</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
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
                                {filteredStats.map((stat) => (
                                    <tr key={stat.email} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
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
                            Aucun résultat trouvé
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default StatistiquesPage;
