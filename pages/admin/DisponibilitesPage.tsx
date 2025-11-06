import React, { useState, useMemo } from 'react';
import { Creneau, SoumissionDisponibilite, SurveillantTypeLabels } from '../../types';
import { getDisponibilitesData } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/shared/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/shared/Select';
import { Input } from '../../components/shared/Input';
import { CheckIcon } from '../../components/icons/CheckIcon';
import { XIcon } from '../../components/icons/XIcon';
import { MinusIcon } from '../../components/icons/MinusIcon';
import { Filter, FileText, Search, Loader2, List, Columns } from 'lucide-react';
import { Badge } from '../../components/shared/Badge';
import { useDataFetching } from '../../hooks/useDataFetching';
import { Button } from '../../components/shared/Button';

interface DisponibilitesData {
    creneaux: Creneau[];
    soumissions: SoumissionDisponibilite[];
    activeSessionName: string | null;
}

const initialData: DisponibilitesData = {
    creneaux: [],
    soumissions: [],
    activeSessionName: null,
};

type ViewMode = 'creneau' | 'surveillant';

const CreneauView: React.FC<{ creneaux: Creneau[]; soumissions: SoumissionDisponibilite[]; availabilityMap: Map<string, any> }> = ({ creneaux, soumissions, availabilityMap }) => {
    const stats = useMemo(() => {
        const creneauStats = new Map<string, number>();
        creneaux.forEach(creneau => {
            let count = soumissions.reduce((acc, submission) => {
                const key = `${submission.surveillant_id ?? submission.email}-${creneau.id}`;
                return acc + (availabilityMap.get(key)?.est_disponible ? 1 : 0);
            }, 0);
            creneauStats.set(creneau.id, count);
        });
        return creneauStats;
    }, [creneaux, soumissions, availabilityMap]);

    return (
        <div className="overflow-auto border rounded-lg dark:border-gray-700 max-h-[70vh]">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border-separate border-spacing-0">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th scope="col" className="sticky left-0 top-0 bg-gray-50 dark:bg-gray-800 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase z-30 border-b dark:border-gray-700">Créneau</th>
                        {soumissions.map(s => <th key={s.id} scope="col" className="sticky top-0 bg-gray-50 dark:bg-gray-800 px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase whitespace-nowrap border-b dark:border-gray-700">{s.prenom} {s.nom}</th>)}
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {creneaux.map(creneau => {
                        const availableCount = stats.get(creneau.id) || 0;
                        const badgeVariant = availableCount < 2 ? 'destructive' : availableCount < 4 ? 'warning' : 'success';
                        return (
                        <tr key={creneau.id}>
                            <td className="sticky left-0 bg-white dark:bg-gray-900 px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 border-r dark:border-gray-700 z-10">
                                <div>{creneau.date_surveillance ? new Date(creneau.date_surveillance + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' }) : 'N/A'}</div>
                                <div className="text-xs text-gray-500">{creneau.heure_debut_surveillance} - {creneau.heure_fin_surveillance}</div>
                                <div className="mt-1"><Badge variant={badgeVariant}>{availableCount} disponible{availableCount !== 1 && 's'}</Badge></div>
                            </td>
                            {soumissions.map(submission => {
                                const key = `${submission.surveillant_id ?? submission.email}-${creneau.id}`;
                                const availability = availabilityMap.get(key);
                                const Icon = availability ? (availability.est_disponible ? CheckIcon : XIcon) : MinusIcon;
                                const colorClass = availability ? (availability.est_disponible ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400') : 'text-gray-400';
                                const bgClass = availability ? (availability.est_disponible ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30') : 'bg-gray-50/50 dark:bg-gray-800/30';
                                return <td key={submission.id} className={`px-6 py-3 text-sm ${bgClass}`}><div className="flex justify-center"><Icon className={`h-5 w-5 ${colorClass}`} /></div></td>;
                            })}
                        </tr>
                    )})}
                </tbody>
            </table>
        </div>
    );
};

const SurveillantView: React.FC<{ creneaux: Creneau[]; soumissions: SoumissionDisponibilite[]; availabilityMap: Map<string, any> }> = ({ creneaux, soumissions, availabilityMap }) => {
    return (
        <div className="overflow-auto border rounded-lg dark:border-gray-700 max-h-[70vh]">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border-separate border-spacing-0">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th scope="col" className="sticky left-0 top-0 bg-gray-50 dark:bg-gray-800 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase z-30 border-b dark:border-gray-700">Surveillant</th>
                        {creneaux.map(c => <th key={c.id} scope="col" className="sticky top-0 bg-gray-50 dark:bg-gray-800 px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase whitespace-nowrap border-b dark:border-gray-700">
                            <div>{new Date(c.date_surveillance + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</div>
                            <div className="font-normal">{c.heure_debut_surveillance?.substring(0, 5)}</div>
                        </th>)}
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {soumissions.map(submission => {
                        const availableCount = submission.historique_disponibilites.filter(d => d.est_disponible).length;
                        return (
                        <tr key={submission.id}>
                            <td className="sticky left-0 bg-white dark:bg-gray-900 px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 border-r dark:border-gray-700 z-10">
                                <div>{submission.prenom} {submission.nom}</div>
                                <div className="text-xs text-gray-500">{SurveillantTypeLabels[submission.type_surveillant as keyof typeof SurveillantTypeLabels]}</div>
                                <div className="mt-1"><Badge variant="default">{availableCount} créneau{availableCount > 1 ? 'x' : ''}</Badge></div>
                            </td>
                            {creneaux.map(creneau => {
                                const key = `${submission.surveillant_id ?? submission.email}-${creneau.id}`;
                                const availability = availabilityMap.get(key);
                                const Icon = availability ? (availability.est_disponible ? CheckIcon : XIcon) : MinusIcon;
                                const colorClass = availability ? (availability.est_disponible ? 'text-green-600' : 'text-red-600') : 'text-gray-400';
                                return <td key={creneau.id} className="px-6 py-3 text-sm text-center"><Icon className={`h-5 w-5 mx-auto ${colorClass}`} /></td>;
                            })}
                        </tr>
                    )})}
                </tbody>
            </table>
        </div>
    );
};


const DisponibilitesPage: React.FC = () => {
    const { data, isLoading } = useDataFetching(getDisponibilitesData, initialData);
    const { creneaux, soumissions, activeSessionName } = data;
    
    const [viewMode, setViewMode] = useState<ViewMode>('creneau');
    const [filterType, setFilterType] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const availabilityMap = useMemo(() => {
        const map = new Map<string, { est_disponible: boolean }>();
        soumissions.forEach(submission => {
            const id = submission.surveillant_id ?? submission.email;
            if (Array.isArray(submission.historique_disponibilites)) {
                submission.historique_disponibilites.forEach(avail => {
                    if (avail?.creneau_id) {
                        map.set(`${id}-${avail.creneau_id}`, { est_disponible: avail.est_disponible });
                    }
                });
            }
        });
        return map;
    }, [soumissions]);

    const filteredSoumissions = useMemo(() => {
        const lowercasedQuery = searchQuery.toLowerCase();
        return soumissions
            .filter(s => filterType === 'all' || s.type_surveillant === filterType)
            .filter(s => `${s.prenom} ${s.nom}`.toLowerCase().includes(lowercasedQuery))
            .sort((a, b) => (a.nom || '').localeCompare(b.nom || '') || (a.prenom || '').localeCompare(b.prenom || ''));
    }, [soumissions, filterType, searchQuery]);
    
    if (isLoading) {
         return (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><FileText className="mr-2 h-6 w-6" />Analyse des Disponibilités</CardTitle>
                    <CardDescription>Chargement des données de la session active...</CardDescription>
                </CardHeader>
                 <CardContent className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                 </CardContent>
             </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><FileText className="mr-2 h-6 w-6" />Analyse des Disponibilités</CardTitle>
                <CardDescription>
                    {activeSessionName ? `Tableau croisé pour la session : "${activeSessionName}".` : "Aucune session active. Veuillez en activer une."}
                </CardDescription>
                <div className="flex flex-wrap items-center gap-4 pt-4 border-t dark:border-gray-700 mt-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium shrink-0">Vue:</label>
                        <div className="inline-flex rounded-md shadow-sm">
                            <Button variant={viewMode === 'creneau' ? 'default' : 'outline'} onClick={() => setViewMode('creneau')} className="rounded-r-none"><Columns className="h-4 w-4 mr-2"/>Par Créneau</Button>
                            <Button variant={viewMode === 'surveillant' ? 'default' : 'outline'} onClick={() => setViewMode('surveillant')} className="rounded-l-none -ml-px"><List className="h-4 w-4 mr-2"/>Par Surveillant</Button>
                        </div>
                    </div>
                     <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-gray-500" />
                        <label htmlFor="type-filter" className="text-sm font-medium shrink-0">Filtrer par type:</label>
                        <Select onValueChange={setFilterType} defaultValue="all">
                            <SelectTrigger id="type-filter" className="w-[180px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les types</SelectItem>
                                {Object.entries(SurveillantTypeLabels).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2 flex-grow">
                         <label htmlFor="name-search" className="text-sm font-medium shrink-0">Rechercher:</label>
                        <div className="relative flex-grow max-w-sm">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                           <Input id="name-search" placeholder="Nom ou prénom..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {creneaux.length === 0 || filteredSoumissions.length === 0 ? (
                     <div className="text-center py-16 text-gray-500"><p>Aucune donnée à afficher pour la session et les filtres actuels.</p></div>
                ) : (
                    viewMode === 'creneau'
                        ? <CreneauView creneaux={creneaux} soumissions={filteredSoumissions} availabilityMap={availabilityMap} />
                        : <SurveillantView creneaux={creneaux} soumissions={filteredSoumissions} availabilityMap={availabilityMap} />
                )}
            </CardContent>
        </Card>
    );
};

export default DisponibilitesPage;
