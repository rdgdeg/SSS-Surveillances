import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Loader2, CheckCircle, XCircle, AlertCircle, Mail, UserX, UserCheck, Copy, Download } from 'lucide-react';
import { getSurveillants, getSubmissionStatusData, updateSurveillant } from '../../lib/api';
import { Surveillant, SurveillantType, SoumissionDisponibilite } from '../../types';
import toast from 'react-hot-toast';

interface SurveillantWithStatus extends Surveillant {
    hasSubmitted: boolean;
    submissionDate?: string;
}

const SuiviSoumissionsPage: React.FC = () => {
    const [surveillants, setSurveillants] = useState<SurveillantWithStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeSessionName, setActiveSessionName] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'submitted' | 'pending' | 'dispensed'>('pending');
    const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const { soumissions, allActiveSurveillants, activeSessionName } = await getSubmissionStatusData();
            setActiveSessionName(activeSessionName);

            // Filtrer les surveillants concernés (assistants et PAT FASB)
            const surveillantsConcernes = allActiveSurveillants.filter(s => 
                s.type === SurveillantType.ASSISTANT || 
                (s.type === SurveillantType.PAT && s.affectation_faculte === 'FASB')
            );

            // Créer un map des soumissions par email
            const soumissionsMap = new Map<string, SoumissionDisponibilite>();
            soumissions.forEach(s => {
                soumissionsMap.set(s.email.toLowerCase(), s);
            });

            // Enrichir les surveillants avec le statut de soumission
            const surveillantsWithStatus: SurveillantWithStatus[] = surveillantsConcernes.map(s => {
                const soumission = soumissionsMap.get(s.email.toLowerCase());
                return {
                    ...s,
                    hasSubmitted: !!soumission,
                    submissionDate: soumission?.submitted_at
                };
            });

            setSurveillants(surveillantsWithStatus);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Erreur lors du chargement des données');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleDispense = async (surveillant: SurveillantWithStatus) => {
        try {
            setUpdatingIds(prev => new Set(prev).add(surveillant.id));
            const newDispenseStatus = !surveillant.dispense_surveillance;
            
            await updateSurveillant(surveillant.id, {
                dispense_surveillance: newDispenseStatus
            });

            // Mettre à jour l'état local
            setSurveillants(prev => prev.map(s => 
                s.id === surveillant.id 
                    ? { ...s, dispense_surveillance: newDispenseStatus }
                    : s
            ));

            toast.success(
                newDispenseStatus 
                    ? `${surveillant.prenom} ${surveillant.nom} est maintenant dispensé(e)`
                    : `${surveillant.prenom} ${surveillant.nom} n'est plus dispensé(e)`
            );
        } catch (error) {
            console.error('Error updating dispense status:', error);
            toast.error('Erreur lors de la mise à jour');
        } finally {
            setUpdatingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(surveillant.id);
                return newSet;
            });
        }
    };

    const filteredSurveillants = surveillants.filter(s => {
        switch (filter) {
            case 'submitted':
                return s.hasSubmitted;
            case 'pending':
                return !s.hasSubmitted && !s.dispense_surveillance;
            case 'dispensed':
                return s.dispense_surveillance;
            case 'all':
            default:
                return true;
        }
    });

    const exportEmails = () => {
        const emails = filteredSurveillants.map(s => s.email).join('; ');
        navigator.clipboard.writeText(emails).then(() => {
            toast.success(`${filteredSurveillants.length} email(s) copié(s) dans le presse-papiers`);
        }).catch(() => {
            toast.error('Erreur lors de la copie');
        });
    };

    const downloadEmailsAsText = () => {
        const emails = filteredSurveillants.map(s => s.email).join('\n');
        const blob = new Blob([emails], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `emails-${filter}-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Fichier téléchargé');
    };

    const stats = {
        total: surveillants.length,
        submitted: surveillants.filter(s => s.hasSubmitted).length,
        pending: surveillants.filter(s => !s.hasSubmitted && !s.dispense_surveillance).length,
        dispensed: surveillants.filter(s => s.dispense_surveillance).length
    };

    const submissionRate = stats.total > 0 
        ? ((stats.submitted / (stats.total - stats.dispensed)) * 100).toFixed(1)
        : '0';

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!activeSessionName) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center text-gray-500">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                        <p>Aucune session active trouvée.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Suivi des Soumissions</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Session : <strong>{activeSessionName}</strong>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    Assistants et Personnel PAT FASB uniquement
                </p>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total concernés</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-green-200 dark:border-green-800">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.submitted}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Ont soumis</div>
                            <div className="text-xs text-green-600 dark:text-green-400 mt-1">{submissionRate}%</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-orange-200 dark:border-orange-800">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.pending}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">En attente</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-blue-200 dark:border-blue-800">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.dispensed}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Dispensés</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filtres */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Filtrer par statut</CardTitle>
                        {filteredSurveillants.length > 0 && (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={exportEmails}
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copier les emails ({filteredSurveillants.length})
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={downloadEmailsAsText}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Télécharger
                                </Button>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant={filter === 'all' ? 'default' : 'outline'}
                            onClick={() => setFilter('all')}
                        >
                            Tous ({stats.total})
                        </Button>
                        <Button
                            variant={filter === 'submitted' ? 'default' : 'outline'}
                            onClick={() => setFilter('submitted')}
                            className={filter === 'submitted' ? '' : 'border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400'}
                        >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Ont soumis ({stats.submitted})
                        </Button>
                        <Button
                            variant={filter === 'pending' ? 'default' : 'outline'}
                            onClick={() => setFilter('pending')}
                            className={filter === 'pending' ? '' : 'border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400'}
                        >
                            <AlertCircle className="mr-2 h-4 w-4" />
                            En attente ({stats.pending})
                        </Button>
                        <Button
                            variant={filter === 'dispensed' ? 'default' : 'outline'}
                            onClick={() => setFilter('dispensed')}
                            className={filter === 'dispensed' ? '' : 'border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400'}
                        >
                            <UserX className="mr-2 h-4 w-4" />
                            Dispensés ({stats.dispensed})
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Liste des surveillants */}
            <Card>
                <CardHeader>
                    <CardTitle>Liste des surveillants ({filteredSurveillants.length})</CardTitle>
                    <CardDescription>
                        {filter === 'pending' && 'Surveillants n\'ayant pas encore soumis leurs disponibilités'}
                        {filter === 'submitted' && 'Surveillants ayant soumis leurs disponibilités'}
                        {filter === 'dispensed' && 'Surveillants dispensés de surveillance'}
                        {filter === 'all' && 'Tous les surveillants concernés'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Nom
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Date soumission
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredSurveillants.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                            Aucun surveillant dans cette catégorie
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSurveillants.map(s => (
                                        <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {s.nom.toUpperCase()} {s.prenom}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                                <a href={`mailto:${s.email}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center">
                                                    <Mail className="h-4 w-4 mr-1" />
                                                    {s.email}
                                                </a>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                                    {s.type === SurveillantType.ASSISTANT ? 'Assistant' : 'PAT FASB'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                {s.dispense_surveillance ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                        <UserX className="h-3 w-3 mr-1" />
                                                        Dispensé
                                                    </span>
                                                ) : s.hasSubmitted ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Soumis
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                                        <XCircle className="h-3 w-3 mr-1" />
                                                        En attente
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                                {s.submissionDate 
                                                    ? new Date(s.submissionDate).toLocaleDateString('fr-FR', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })
                                                    : '-'
                                                }
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => toggleDispense(s)}
                                                    disabled={updatingIds.has(s.id)}
                                                    className={s.dispense_surveillance ? 'border-green-300 text-green-700 hover:bg-green-50' : ''}
                                                >
                                                    {updatingIds.has(s.id) ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : s.dispense_surveillance ? (
                                                        <>
                                                            <UserCheck className="h-4 w-4 mr-1" />
                                                            Réintégrer
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UserX className="h-4 w-4 mr-1" />
                                                            Dispenser
                                                        </>
                                                    )}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SuiviSoumissionsPage;
