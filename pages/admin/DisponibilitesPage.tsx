import React, { useState, useMemo } from 'react';
import { Creneau, SoumissionDisponibilite, SurveillantTypeLabels, CreneauWithStats, Session } from '../../types';
import { getDisponibilitesData, updateSoumissionDisponibilites, getCreneauxWithStats, calculateCapacityStats } from '../../lib/api';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/shared/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/shared/Select';
import { Input } from '../../components/shared/Input';
import { CheckIcon } from '../../components/icons/CheckIcon';
import { XIcon } from '../../components/icons/XIcon';
import { MinusIcon } from '../../components/icons/MinusIcon';
import { Filter, FileText, Search, Loader2, List, Columns, Edit, Clock, History, Calendar, Users, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '../../components/shared/Badge';
import { useDataFetching } from '../../hooks/useDataFetching';
import { Button } from '../../components/shared/Button';
import toast from 'react-hot-toast';
import { CapacityDashboard } from '../../components/admin/CapacityDashboard';
import { FillRateIndicator } from '../../components/shared/FillRateIndicator';
import { useExport } from '../../hooks/useExport';
import { exportDisponibilitesMatriciel } from '../../lib/exportData';
import { exportToXLSX } from '../../lib/exportUtils';
import { ShareLinkModal } from '../../components/admin/ShareLinkModal';
import { Share2 } from 'lucide-react';
import { LockSubmissionsControl } from '../../components/admin/LockSubmissionsControl';

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

// Modal pour afficher l'historique des modifications
const HistoryModal: React.FC<{ 
    submission: SoumissionDisponibilite | null; 
    onClose: () => void;
}> = ({ submission, onClose }) => {
    if (!submission) return null;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('fr-FR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const isModified = submission.updated_at && submission.updated_at !== submission.submitted_at;
    const modificationsCount = submission.historique_modifications?.length || 0;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b dark:border-gray-700">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <History className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                Historique des modifications
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {submission.prenom} {submission.nom} ({submission.email})
                            </p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>
                
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
                    {/* Informations principales */}
                    <div className="space-y-4 mb-6">
                        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div>
                                        <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">Première soumission :</span>
                                        <p className="text-sm text-blue-800 dark:text-blue-300">{formatDate(submission.submitted_at)}</p>
                                    </div>
                                    {isModified && (
                                        <div>
                                            <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">Dernière modification :</span>
                                            <p className="text-sm text-blue-800 dark:text-blue-300">{formatDate(submission.updated_at!)}</p>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">Nombre de créneaux actuels :</span>
                                        <p className="text-sm text-blue-800 dark:text-blue-300">
                                            {submission.historique_disponibilites.filter(d => d.est_disponible).length} créneau(x) sélectionné(s)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Remarque générale */}
                        {submission.remarque_generale && (
                            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <span className="text-sm font-semibold text-amber-900 dark:text-amber-300 block mb-1">Remarque du surveillant :</span>
                                        <p className="text-sm text-amber-800 dark:text-amber-300 whitespace-pre-wrap">{submission.remarque_generale}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Historique des modifications */}
                    {modificationsCount > 0 ? (
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Historique des modifications ({modificationsCount})
                            </h4>
                            <div className="space-y-3">
                                {submission.historique_modifications?.map((modif, index) => (
                                    <div 
                                        key={index}
                                        className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    Modification #{modificationsCount - index}
                                                </p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                    {formatDate(modif.date)}
                                                </p>
                                            </div>
                                            <Badge variant="default">
                                                {modif.nb_creneaux} créneau{modif.nb_creneaux > 1 ? 'x' : ''}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Aucune modification depuis la soumission initiale</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <Button onClick={onClose} variant="outline" className="w-full">
                        Fermer
                    </Button>
                </div>
            </div>
        </div>
    );
};

// Composant pour afficher les timestamps dans le tableau
const TimestampCell: React.FC<{ 
    submission: SoumissionDisponibilite;
    onClick: () => void;
}> = ({ submission, onClick }) => {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('fr-FR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit'
        });
    };

    const isModified = submission.updated_at && submission.updated_at !== submission.submitted_at;
    const modificationsCount = submission.historique_modifications?.length || 0;

    return (
        <button
            onClick={onClick}
            className="text-left w-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors p-2 rounded group"
        >
            <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                        {formatDate(submission.submitted_at)}
                    </span>
                </div>
                {isModified && (
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-orange-500" />
                        <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                            Modifié {modificationsCount > 0 && `(${modificationsCount}×)`}
                        </span>
                    </div>
                )}
            </div>
            <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Voir l'historique →
            </div>
        </button>
    );
};

const CreneauView: React.FC<{ 
    creneaux: Creneau[]; 
    soumissions: SoumissionDisponibilite[]; 
    availabilityMap: Map<string, any>;
    editMode: boolean;
    updatingCell: string | null;
    onToggle: (submission: SoumissionDisponibilite, creneauId: string) => void;
    onShowHistory: (submission: SoumissionDisponibilite) => void;
}> = ({ creneaux, soumissions, availabilityMap, editMode, updatingCell, onToggle, onShowHistory }) => {
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
        <div className="w-full overflow-x-auto overflow-y-auto border rounded-lg dark:border-gray-700 max-h-[70vh]">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700 border-separate border-spacing-0" style={{ minWidth: 'max-content' }}>
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th scope="col" className="sticky left-0 top-0 bg-gray-50 dark:bg-gray-800 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase z-30 border-b dark:border-gray-700">Créneau</th>
                        {soumissions.map(soumission => (
                            <th key={soumission.id} scope="col" className="sticky top-0 bg-gray-50 dark:bg-gray-800 px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase whitespace-nowrap border-b dark:border-gray-700">
                                <div>{soumission.prenom} {soumission.nom}</div>
                                {soumission.telephone && (
                                    <div className="text-xs text-gray-600 dark:text-gray-400 normal-case font-normal mt-0.5">📞 {soumission.telephone}</div>
                                )}
                                {soumission.remarque_generale && (
                                    <div className="mt-1 normal-case font-normal">
                                        <div className="text-xs text-amber-700 dark:text-amber-400 flex items-center justify-center gap-1" title={soumission.remarque_generale}>
                                            <FileText className="h-3 w-3" />
                                            <span className="truncate max-w-[100px]">Remarque</span>
                                        </div>
                                    </div>
                                )}
                                <div className="mt-1 normal-case font-normal">
                                    <TimestampCell submission={soumission} onClick={() => onShowHistory(soumission)} />
                                </div>
                            </th>
                        ))}
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
                                <div className="mt-1 space-y-1">
                                    <Badge variant={badgeVariant}>{availableCount} disponible{availableCount !== 1 && 's'}</Badge>
                                    {creneau.nb_surveillants_requis && (
                                        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                            <Users className="h-3 w-3" />
                                            <span>{creneau.nb_surveillants_requis} requis</span>
                                        </div>
                                    )}
                                    <FillRateIndicator 
                                        disponibles={availableCount} 
                                        requis={creneau.nb_surveillants_requis}
                                        showDetails={false}
                                        size="sm"
                                    />
                                </div>
                            </td>
                            {soumissions.map(soumission => {
                                const key = `${soumission.surveillant_id ?? soumission.email}-${creneau.id}`;
                                const cellKey = `${soumission.id}-${creneau.id}`;
                                const availability = availabilityMap.get(key);
                                const Icon = availability ? (availability.est_disponible ? CheckIcon : XIcon) : MinusIcon;
                                const colorClass = availability ? (availability.est_disponible ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400') : 'text-gray-400';
                                const bgClass = availability ? (availability.est_disponible ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30') : 'bg-gray-50/50 dark:bg-gray-800/30';
                                const isUpdating = updatingCell === cellKey;
                                
                                return (
                                    <td 
                                        key={soumission.id} 
                                        className={`px-6 py-3 text-sm ${bgClass} ${editMode ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''}`}
                                        onClick={() => editMode && onToggle(soumission, creneau.id)}
                                        title={editMode ? 'Cliquer pour modifier' : ''}
                                    >
                                        <div className="flex justify-center">
                                            {isUpdating ? (
                                                <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                                            ) : (
                                                <Icon className={`h-5 w-5 ${colorClass}`} />
                                            )}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    )})}
                </tbody>
            </table>
        </div>
    );
};

const SurveillantView: React.FC<{ 
    creneaux: Creneau[]; 
    soumissions: SoumissionDisponibilite[]; 
    availabilityMap: Map<string, any>;
    editMode: boolean;
    updatingCell: string | null;
    sortBy: 'name' | 'date';
    sortOrder: 'asc' | 'desc';
    onToggle: (submission: SoumissionDisponibilite, creneauId: string) => void;
    onShowHistory: (submission: SoumissionDisponibilite) => void;
    onSortToggle: (field: 'name' | 'date') => void;
}> = ({ creneaux, soumissions, availabilityMap, editMode, updatingCell, sortBy, sortOrder, onToggle, onShowHistory, onSortToggle }) => {
    return (
        <div className="w-full overflow-x-auto overflow-y-auto border rounded-lg dark:border-gray-700 max-h-[70vh]">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700 border-separate border-spacing-0" style={{ minWidth: 'max-content' }}>
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th scope="col" className="sticky left-0 top-0 bg-gray-50 dark:bg-gray-800 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase z-30 border-b dark:border-gray-700">
                            <div className="flex items-center gap-2">
                                <span>Surveillant</span>
                                <div className="flex flex-col gap-0.5">
                                    <button
                                        onClick={() => onSortToggle('name')}
                                        className={`hover:text-gray-700 dark:hover:text-gray-100 transition-colors ${sortBy === 'name' ? 'text-indigo-600 dark:text-indigo-400' : ''}`}
                                        title="Trier par nom"
                                    >
                                        {sortBy === 'name' ? (
                                            sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                        ) : (
                                            <ArrowUpDown className="h-3 w-3" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => onSortToggle('date')}
                                        className={`hover:text-gray-700 dark:hover:text-gray-100 transition-colors ${sortBy === 'date' ? 'text-indigo-600 dark:text-indigo-400' : ''}`}
                                        title="Trier par date de soumission"
                                    >
                                        {sortBy === 'date' ? (
                                            sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                        ) : (
                                            <Clock className="h-3 w-3" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </th>
                        {creneaux.map(c => <th key={c.id} scope="col" className="sticky top-0 bg-gray-50 dark:bg-gray-800 px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase whitespace-nowrap border-b dark:border-gray-700">
                            <div>{new Date(c.date_surveillance + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</div>
                            <div className="font-normal">{c.heure_debut_surveillance?.substring(0, 5)}-{c.heure_fin_surveillance?.substring(0, 5)}</div>
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
                                {submission.telephone && (
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">📞 {submission.telephone}</div>
                                )}
                                <div className="mt-1"><Badge variant="default">{availableCount} créneau{availableCount > 1 ? 'x' : ''}</Badge></div>
                                {submission.remarque_generale && (
                                    <div className="mt-2 pt-2 border-t dark:border-gray-700">
                                        <div className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1">
                                            <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                            <span className="line-clamp-2" title={submission.remarque_generale}>{submission.remarque_generale}</span>
                                        </div>
                                    </div>
                                )}
                                <div className="mt-2 pt-2 border-t dark:border-gray-700">
                                    <TimestampCell submission={submission} onClick={() => onShowHistory(submission)} />
                                </div>
                            </td>
                            {creneaux.map(creneau => {
                                const key = `${submission.surveillant_id ?? submission.email}-${creneau.id}`;
                                const cellKey = `${submission.id}-${creneau.id}`;
                                const availability = availabilityMap.get(key);
                                const Icon = availability ? (availability.est_disponible ? CheckIcon : XIcon) : MinusIcon;
                                const colorClass = availability ? (availability.est_disponible ? 'text-green-600' : 'text-red-600') : 'text-gray-400';
                                const isUpdating = updatingCell === cellKey;
                                
                                return (
                                    <td 
                                        key={creneau.id} 
                                        className={`px-6 py-3 text-sm text-center ${editMode ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors' : ''}`}
                                        onClick={() => editMode && onToggle(submission, creneau.id)}
                                        title={editMode ? 'Cliquer pour modifier' : ''}
                                    >
                                        {isUpdating ? (
                                            <Loader2 className="h-5 w-5 mx-auto animate-spin text-indigo-500" />
                                        ) : (
                                            <Icon className={`h-5 w-5 mx-auto ${colorClass}`} />
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    )})}
                </tbody>
            </table>
        </div>
    );
};


const DisponibilitesPage: React.FC = () => {
    const { data, isLoading, refetch } = useDataFetching(getDisponibilitesData, initialData);
    const { creneaux, soumissions, activeSessionName } = data;
    const [activeSession, setActiveSession] = React.useState<Session | null>(null);
    
    const [viewMode, setViewMode] = useState<ViewMode>('creneau');
    const [filterType, setFilterType] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [sortBy, setSortBy] = useState<'name' | 'date'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [editMode, setEditMode] = useState<boolean>(false);
    const [updatingCell, setUpdatingCell] = useState<string | null>(null);
    const [selectedSubmission, setSelectedSubmission] = useState<SoumissionDisponibilite | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);

    // Charger la session active pour le contrôle de verrouillage
    React.useEffect(() => {
        const loadActiveSession = async () => {
            try {
                const { data: session, error } = await supabase
                    .from('sessions')
                    .select('*')
                    .eq('is_active', true)
                    .limit(1)
                    .single();
                
                if (!error && session) {
                    setActiveSession(session);
                }
            } catch (error) {
                console.error('Erreur lors du chargement de la session:', error);
            }
        };
        loadActiveSession();
    }, [data]);

    // Handle sort toggle
    const handleSortToggle = (field: 'name' | 'date') => {
        if (sortBy === field) {
            // Toggle order if same field
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            // Change field and reset to ascending
            setSortBy(field);
            setSortOrder(field === 'date' ? 'desc' : 'asc'); // Date defaults to desc (newest first)
        }
    };
    
    // Export hook
    const { exportData, isExporting } = useExport();

    // Calculer les statistiques de capacité
    const creneauxWithStats = useMemo<CreneauWithStats[]>(() => {
        return creneaux.map(creneau => {
            // Compter le nombre de disponibles pour ce créneau
            const nb_disponibles = soumissions.reduce((count, submission) => {
                const isAvailable = submission.historique_disponibilites.some(
                    h => h.creneau_id === creneau.id && h.est_disponible
                );
                return count + (isAvailable ? 1 : 0);
            }, 0);

            // Calculer le taux et le statut
            let taux_remplissage: number | undefined;
            let statut_remplissage: 'critique' | 'alerte' | 'ok' | 'non-defini' = 'non-defini';

            if (creneau.nb_surveillants_requis) {
                taux_remplissage = (nb_disponibles / creneau.nb_surveillants_requis) * 100;
                
                if (taux_remplissage < 50) {
                    statut_remplissage = 'critique';
                } else if (taux_remplissage < 100) {
                    statut_remplissage = 'alerte';
                } else {
                    statut_remplissage = 'ok';
                }
            }

            return {
                ...creneau,
                nb_disponibles,
                taux_remplissage,
                statut_remplissage
            };
        });
    }, [creneaux, soumissions]);

    const capacityStats = useMemo(() => {
        return calculateCapacityStats(creneauxWithStats);
    }, [creneauxWithStats]);

    const handleToggleAvailability = async (submission: SoumissionDisponibilite, creneauId: string) => {
        if (!editMode) return;
        
        const cellKey = `${submission.id}-${creneauId}`;
        setUpdatingCell(cellKey);

        try {
            // Trouver la disponibilité actuelle
            const currentAvail = submission.historique_disponibilites.find(h => h.creneau_id === creneauId);
            
            // Créer le nouvel historique
            let newHistorique;
            if (currentAvail) {
                if (currentAvail.est_disponible) {
                    // Si actuellement disponible, on supprime l'entrée (toggle vers indisponible)
                    newHistorique = submission.historique_disponibilites.filter(h => h.creneau_id !== creneauId);
                } else {
                    // Si actuellement indisponible, on remet à disponible
                    newHistorique = submission.historique_disponibilites.map(h =>
                        h.creneau_id === creneauId
                            ? { ...h, est_disponible: true }
                            : h
                    );
                }
            } else {
                // Ajouter une nouvelle disponibilité
                newHistorique = [
                    ...submission.historique_disponibilites,
                    { creneau_id: creneauId, est_disponible: true }
                ];
            }

            // Filtrer pour ne garder que les disponibilités vraies
            newHistorique = newHistorique.filter(h => h.est_disponible);

            // Mettre à jour dans la base de données
            await updateSoumissionDisponibilites(submission.id, newHistorique);
            
            // Rafraîchir les données
            await refetch();
            
            toast.success('Disponibilité mise à jour');
        } catch (error) {
            console.error('Error updating availability:', error);
            toast.error('Erreur lors de la mise à jour');
        } finally {
            setUpdatingCell(null);
        }
    };

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
            .sort((a, b) => {
                let comparison = 0;
                if (sortBy === 'date') {
                    // Tri par date de soumission
                    comparison = new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
                } else {
                    // Tri par nom
                    comparison = (a.nom || '').localeCompare(b.nom || '') || (a.prenom || '').localeCompare(b.prenom || '');
                }
                return sortOrder === 'asc' ? comparison : -comparison;
            });
    }, [soumissions, filterType, searchQuery, sortBy, sortOrder]);
    
    // Export function
    const handleExportDisponibilites = async () => {
        if (!data.creneaux.length || !data.soumissions.length) {
            toast.error('Aucune donnée à exporter');
            return;
        }

        await exportData(
            async () => {
                // Get session ID from first créneau
                const sessionId = data.creneaux[0]?.session_id;
                if (!sessionId) throw new Error('Session ID non trouvé');
                
                return await exportDisponibilitesMatriciel(sessionId);
            },
            `disponibilites-${activeSessionName || 'session'}`,
            'Disponibilités'
        );
    };
    
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
        <>
            <HistoryModal 
                submission={selectedSubmission} 
                onClose={() => setSelectedSubmission(null)} 
            />
            
            {showShareModal && creneaux.length > 0 && (
                <ShareLinkModal
                    sessionId={creneaux[0].session_id}
                    sessionName={activeSessionName || 'Session'}
                    onClose={() => setShowShareModal(false)}
                />
            )}
            
            {/* Contrôle de verrouillage des disponibilités */}
            <LockSubmissionsControl 
                session={activeSession} 
                onUpdate={() => {
                    refetch();
                    // Recharger la session
                    supabase
                        .from('sessions')
                        .select('*')
                        .eq('is_active', true)
                        .limit(1)
                        .single()
                        .then(({ data }) => {
                            if (data) setActiveSession(data);
                        });
                }} 
            />
            
            {/* Tableau de bord de capacité */}
            <CapacityDashboard stats={capacityStats} isLoading={isLoading} />
            
            <Card>
                <CardHeader>
                <CardTitle className="flex items-center"><FileText className="mr-2 h-6 w-6" />Analyse des Disponibilités</CardTitle>
                <CardDescription>
                    {activeSessionName ? `Tableau croisé pour la session : "${activeSessionName}".` : "Aucune session active. Veuillez en activer une."}
                </CardDescription>
                <div className="flex flex-wrap items-center gap-4 pt-4 border-t dark:border-gray-700 mt-4">
                    <div className="flex items-center gap-2">
                        <Button 
                            variant={editMode ? 'default' : 'outline'} 
                            onClick={() => setEditMode(!editMode)}
                            className={editMode ? 'bg-orange-600 hover:bg-orange-700' : ''}
                        >
                            <Edit className="h-4 w-4 mr-2"/>
                            {editMode ? 'Mode Édition Actif' : 'Activer Édition'}
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={handleExportDisponibilites}
                            disabled={isExporting || !creneaux.length || !soumissions.length}
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Export...
                                </>
                            ) : (
                                <>
                                    <FileText className="h-4 w-4 mr-2"/>
                                    Exporter (Excel)
                                </>
                            )}
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={() => setShowShareModal(true)}
                            disabled={!creneaux.length || !soumissions.length}
                        >
                            <Share2 className="h-4 w-4 mr-2"/>
                            Partager
                        </Button>
                    </div>
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
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-gray-500" />
                        <label htmlFor="sort-by" className="text-sm font-medium shrink-0">Trier par:</label>
                        <Select onValueChange={(value) => setSortBy(value as 'name' | 'date')} defaultValue="name">
                            <SelectTrigger id="sort-by" className="w-[180px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name">Nom (A-Z)</SelectItem>
                                <SelectItem value="date">Date de soumission</SelectItem>
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
            <CardContent className="overflow-hidden">
                {editMode && (
                    <div className="mb-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-300 p-3 rounded-lg flex items-start gap-3">
                        <Edit className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold">Mode Édition Actif</h4>
                            <p className="text-sm">Cliquez sur une cellule pour basculer entre disponible (✓) et indisponible (✗). Les modifications sont sauvegardées immédiatement.</p>
                        </div>
                    </div>
                )}
                {creneaux.length === 0 || filteredSoumissions.length === 0 ? (
                     <div className="text-center py-16 text-gray-500"><p>Aucune donnée à afficher pour la session et les filtres actuels.</p></div>
                ) : (
                    viewMode === 'creneau'
                        ? <CreneauView 
                            creneaux={creneaux} 
                            soumissions={filteredSoumissions} 
                            availabilityMap={availabilityMap}
                            editMode={editMode}
                            updatingCell={updatingCell}
                            onToggle={handleToggleAvailability}
                            onShowHistory={setSelectedSubmission}
                          />
                        : <SurveillantView 
                            creneaux={creneaux} 
                            soumissions={filteredSoumissions} 
                            availabilityMap={availabilityMap}
                            editMode={editMode}
                            updatingCell={updatingCell}
                            sortBy={sortBy}
                            sortOrder={sortOrder}
                            onToggle={handleToggleAvailability}
                            onShowHistory={setSelectedSubmission}
                            onSortToggle={handleSortToggle}
                          />
                )}
            </CardContent>
        </Card>
        </>
    );
};

export default DisponibilitesPage;
