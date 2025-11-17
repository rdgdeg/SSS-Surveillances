import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Creneau, SoumissionDisponibilite, SurveillantTypeLabels } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/shared/Card';
import { CheckIcon } from '../../components/icons/CheckIcon';
import { XIcon } from '../../components/icons/XIcon';
import { MinusIcon } from '../../components/icons/MinusIcon';
import { FileText, Loader2, Users, Calendar, Lock } from 'lucide-react';
import { Badge } from '../../components/shared/Badge';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

interface SharedDisponibilitesData {
    creneaux: Creneau[];
    soumissions: SoumissionDisponibilite[];
    sessionName: string;
}

const SharedDisponibilitesPage: React.FC = () => {
    const { shareToken } = useParams<{ shareToken: string }>();
    const [data, setData] = useState<SharedDisponibilitesData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadSharedData = async () => {
            if (!shareToken) {
                setError('Token de partage manquant');
                setIsLoading(false);
                return;
            }

            try {
                // Vérifier le token et récupérer les données
                const { data: shareData, error: shareError } = await supabase
                    .from('share_tokens')
                    .select('session_id, expires_at')
                    .eq('token', shareToken)
                    .eq('resource_type', 'disponibilites')
                    .single();

                if (shareError || !shareData) {
                    setError('Lien de partage invalide ou expiré');
                    setIsLoading(false);
                    return;
                }

                // Vérifier l'expiration
                if (new Date(shareData.expires_at) < new Date()) {
                    setError('Ce lien de partage a expiré');
                    setIsLoading(false);
                    return;
                }

                // Charger la session
                const { data: session, error: sessionError } = await supabase
                    .from('sessions')
                    .select('name')
                    .eq('id', shareData.session_id)
                    .single();

                if (sessionError) throw sessionError;

                // Charger les créneaux
                const { data: creneaux, error: creneauxError } = await supabase
                    .from('creneaux')
                    .select('*')
                    .eq('session_id', shareData.session_id)
                    .order('date_surveillance, heure_debut_surveillance');

                if (creneauxError) throw creneauxError;

                // Charger les soumissions
                const { data: soumissions, error: soumissionsError } = await supabase
                    .from('soumissions_disponibilites')
                    .select('*')
                    .eq('session_id', shareData.session_id)
                    .order('nom, prenom');

                if (soumissionsError) throw soumissionsError;

                setData({
                    creneaux: creneaux || [],
                    soumissions: soumissions || [],
                    sessionName: session?.name || 'Session'
                });
            } catch (err) {
                console.error('Error loading shared data:', err);
                setError('Erreur lors du chargement des données');
            } finally {
                setIsLoading(false);
            }
        };

        loadSharedData();
    }, [shareToken]);

    const availabilityMap = useMemo(() => {
        if (!data) return new Map();
        
        const map = new Map<string, boolean>();
        data.soumissions.forEach(submission => {
            const id = submission.surveillant_id || submission.email;
            submission.historique_disponibilites?.forEach((dispo: any) => {
                map.set(`${id}-${dispo.creneau_id}`, dispo.est_disponible);
            });
        });
        return map;
    }, [data]);

    const stats = useMemo(() => {
        if (!data) return { totalSurveillants: 0, totalCreneaux: 0, totalDisponibilites: 0 };
        
        const totalDisponibilites = data.soumissions.reduce((acc, s) => 
            acc + (s.historique_disponibilites?.filter((d: any) => d.est_disponible).length || 0), 0
        );

        return {
            totalSurveillants: data.soumissions.length,
            totalCreneaux: data.creneaux.length,
            totalDisponibilites
        };
    }, [data]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mb-4" />
                        <p className="text-lg text-gray-600 dark:text-gray-400">Chargement des disponibilités...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-red-300 dark:border-red-700">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                            <Lock className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <CardTitle className="text-red-800 dark:text-red-300">Accès Refusé</CardTitle>
                        <CardDescription className="text-red-600 dark:text-red-400">
                            {error || 'Impossible d\'accéder aux données'}
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Disponibilités des Surveillants
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Session : {data.sessionName}
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Lock className="h-4 w-4" />
                        <span>Vue en lecture seule</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Surveillants</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSurveillants}</p>
                                </div>
                                <Users className="h-8 w-8 text-indigo-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Créneaux</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCreneaux}</p>
                                </div>
                                <Calendar className="h-8 w-8 text-indigo-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Disponibilités</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalDisponibilites}</p>
                                </div>
                                <FileText className="h-8 w-8 text-indigo-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <FileText className="mr-2 h-6 w-6" />
                            Tableau des Disponibilités
                        </CardTitle>
                        <CardDescription>
                            Vue d'ensemble des disponibilités par surveillant et par créneau
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-auto border rounded-lg dark:border-gray-700 max-h-[70vh]">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border-separate border-spacing-0">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th scope="col" className="sticky left-0 top-0 bg-gray-50 dark:bg-gray-800 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase z-30 border-b dark:border-gray-700">
                                            Surveillant
                                        </th>
                                        {data.creneaux.map(c => (
                                            <th key={c.id} scope="col" className="sticky top-0 bg-gray-50 dark:bg-gray-800 px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase whitespace-nowrap border-b dark:border-gray-700">
                                                <div>{new Date(c.date_surveillance + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</div>
                                                <div className="font-normal">{c.heure_debut_surveillance?.substring(0, 5)}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                    {data.soumissions.map(submission => {
                                        const availableCount = submission.historique_disponibilites?.filter((d: any) => d.est_disponible).length || 0;
                                        return (
                                            <tr key={submission.id}>
                                                <td className="sticky left-0 bg-white dark:bg-gray-900 px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 border-r dark:border-gray-700 z-10">
                                                    <div>{submission.prenom} {submission.nom}</div>
                                                    <div className="text-xs text-gray-500">{SurveillantTypeLabels[submission.type_surveillant as keyof typeof SurveillantTypeLabels]}</div>
                                                    <div className="mt-1"><Badge variant="default">{availableCount} créneau{availableCount > 1 ? 'x' : ''}</Badge></div>
                                                </td>
                                                {data.creneaux.map(creneau => {
                                                    const id = submission.surveillant_id || submission.email;
                                                    const isAvailable = availabilityMap.get(`${id}-${creneau.id}`);
                                                    const Icon = isAvailable === true ? CheckIcon : isAvailable === false ? XIcon : MinusIcon;
                                                    const colorClass = isAvailable === true ? 'text-green-600 dark:text-green-400' : isAvailable === false ? 'text-red-600 dark:text-red-400' : 'text-gray-400';
                                                    
                                                    return (
                                                        <td key={creneau.id} className="px-6 py-3 text-sm text-center">
                                                            <Icon className={`h-5 w-5 mx-auto ${colorClass}`} />
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SharedDisponibilitesPage;
