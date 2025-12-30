
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Users, FileText, CheckCircle, BarChart2, Loader2, Calendar, Clock, AlertTriangle, TrendingUp, BookOpen, UserCheck, History, MessageSquare, Bell, Edit3, Mail, MailOpen, ExternalLink, RefreshCw } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { getDashboardStats } from '../../lib/api';
import { useDataFetching } from '../../hooks/useDataFetching';
import { useActiveSession } from '../../src/hooks/useActiveSession';
import { useRecentChanges } from '../../hooks/useVersioning';
import { formatUtils } from '../../lib/versioningService';
import VersioningButton from '../../components/shared/VersioningButton';
import { supabase } from '../../lib/supabaseClient';

interface DashboardStats {
    totalSurveillants: number;
    totalSubmissions: number;
    submissionRate: number;
    availableCount: number;
    availabilityRate: number;
}

interface DemandeModification {
    id: string;
    nom_examen: string;
    date_examen: string;
    type_demande: 'modification' | 'permutation' | 'message';
    nom_demandeur: string;
    statut: 'en_attente' | 'en_cours' | 'traitee' | 'refusee';
    lu: boolean;
    created_at: string;
}

interface RecentActivity {
    id: string;
    type: 'demande' | 'soumission' | 'examen';
    title: string;
    description: string;
    timestamp: string;
    urgent?: boolean;
}

const initialStats: DashboardStats = {
    totalSurveillants: 0,
    totalSubmissions: 0,
    submissionRate: 0,
    availableCount: 0,
    availabilityRate: 0,
};

const DashboardPage: React.FC = () => {
    const { data: stats, isLoading } = useDataFetching(getDashboardStats, initialStats);
    const { data: activeSession } = useActiveSession();
    const [demandes, setDemandes] = useState<DemandeModification[]>([]);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(true);

    // Charger les demandes de modification non lues
    useEffect(() => {
        loadDemandes();
        loadRecentActivity();
    }, []);

    const loadDemandes = async () => {
        try {
            const { data, error } = await supabase
                .from('demandes_modification')
                .select('*')
                .eq('lu', false)
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;
            setDemandes(data || []);
        } catch (error) {
            console.error('Erreur lors du chargement des demandes:', error);
        }
    };

    const loadRecentActivity = async () => {
        try {
            setLoadingMessages(true);
            const activities: RecentActivity[] = [];

            // Récupérer les demandes récentes
            const { data: demandesData, error: demandesError } = await supabase
                .from('demandes_modification')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(3);

            if (!demandesError && demandesData) {
                demandesData.forEach(demande => {
                    activities.push({
                        id: `demande-${demande.id}`,
                        type: 'demande',
                        title: `Nouvelle demande: ${demande.nom_examen}`,
                        description: `${demande.nom_demandeur} - ${demande.type_demande}`,
                        timestamp: demande.created_at,
                        urgent: !demande.lu
                    });
                });
            }

            // Récupérer les soumissions récentes
            const { data: soumissionsData, error: soumissionsError } = await supabase
                .from('soumissions_disponibilites')
                .select('*, surveillants(nom, prenom)')
                .order('created_at', { ascending: false })
                .limit(3);

            if (!soumissionsError && soumissionsData) {
                soumissionsData.forEach(soumission => {
                    const surveillant = soumission.surveillants;
                    activities.push({
                        id: `soumission-${soumission.id}`,
                        type: 'soumission',
                        title: 'Nouvelle soumission de disponibilités',
                        description: `${surveillant?.prenom} ${surveillant?.nom}`,
                        timestamp: soumission.created_at
                    });
                });
            }

            // Trier par date
            activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setRecentActivity(activities.slice(0, 5));
        } catch (error) {
            console.error('Erreur lors du chargement de l\'activité récente:', error);
        } finally {
            setLoadingMessages(false);
        }
    };

    const getStatusBadge = (statut: string) => {
        const badges = {
            en_attente: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300', text: 'En attente' },
            en_cours: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300', text: 'En cours' },
            traitee: { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300', text: 'Traitée' },
            refusee: { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300', text: 'Refusée' }
        };
        
        const badge = badges[statut as keyof typeof badges];
        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                {badge.text}
            </span>
        );
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'demande': return Edit3;
            case 'soumission': return CheckCircle;
            case 'examen': return Calendar;
            default: return Bell;
        }
    };

    if (isLoading) {
        return (
             <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" aria-label="Loading stats" />
             </div>
        );
    }
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Tableau de bord</h1>
                <div className="flex items-center gap-4">
                    {activeSession && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Session active: <span className="font-semibold">{activeSession.name}</span>
                        </div>
                    )}
                    <Button onClick={() => { loadDemandes(); loadRecentActivity(); }} variant="outline" size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Actualiser
                    </Button>
                </div>
            </div>

            {/* Alertes importantes */}
            <div className="space-y-4">
                {/* Demandes non lues */}
                {demandes.length > 0 && (
                    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-400">
                                <Mail className="h-5 w-5" />
                                {demandes.length} demande{demandes.length > 1 ? 's' : ''} de modification non lue{demandes.length > 1 ? 's' : ''}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {demandes.slice(0, 3).map((demande) => (
                                    <div key={demande.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{demande.nom_examen}</div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                                {demande.nom_demandeur} - {new Date(demande.created_at).toLocaleDateString('fr-FR')}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(demande.statut)}
                                        </div>
                                    </div>
                                ))}
                                {demandes.length > 3 && (
                                    <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
                                        ... et {demandes.length - 3} autre{demandes.length - 3 > 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>
                            <div className="mt-4">
                                <NavLink to="/admin/demandes-modification">
                                    <Button variant="outline" size="sm" className="w-full">
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        Voir toutes les demandes
                                    </Button>
                                </NavLink>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Alerte taux de participation */}
                {stats.submissionRate < 50 && (
                    <Card className="border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-400">
                                <AlertTriangle className="h-5 w-5" />
                                Attention: Taux de participation critique
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                                Seulement {stats.submissionRate.toFixed(0)}% des surveillants ont soumis leurs disponibilités.
                                {stats.totalSurveillants - stats.totalSubmissions} surveillants n'ont pas encore répondu.
                            </p>
                            <NavLink to="/admin/suivi-soumissions">
                                <Button variant="outline" size="sm">
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Envoyer des relances
                                </Button>
                            </NavLink>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Statistiques principales */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Surveillants</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalSurveillants}</div>
                        <p className="text-xs text-muted-foreground mt-1">Inscrits dans le système</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Soumissions</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
                        <p className="text-xs text-muted-foreground mt-1">{stats.submissionRate.toFixed(1)}% de participation</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Disponibilités</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.availableCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">{stats.availabilityRate.toFixed(1)}% des créneaux cochés</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Taux de réponse</CardTitle>
                        <TrendingUp className={`h-4 w-4 ${stats.submissionRate >= 70 ? 'text-green-500' : stats.submissionRate >= 50 ? 'text-yellow-500' : 'text-red-500'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${stats.submissionRate >= 70 ? 'text-green-600' : stats.submissionRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {stats.submissionRate.toFixed(0)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.totalSurveillants - stats.totalSubmissions} en attente
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Activité récente et accès rapides */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Activité récente */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-indigo-600" />
                            Activité récente
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loadingMessages ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                            </div>
                        ) : recentActivity.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <Bell className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                <p className="text-sm">Aucune activité récente</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentActivity.map((activity) => {
                                    const Icon = getActivityIcon(activity.type);
                                    return (
                                        <div key={activity.id} className={`flex items-start gap-3 p-3 rounded-lg border ${activity.urgent ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                                            <Icon className={`h-4 w-4 mt-0.5 ${activity.urgent ? 'text-blue-600' : 'text-gray-500'}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {activity.title}
                                                </div>
                                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                                    {activity.description}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                    {new Date(activity.timestamp).toLocaleDateString('fr-FR', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                            {activity.urgent && (
                                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Accès rapides */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            Actions rapides
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3">
                            <NavLink to="/admin/disponibilites" className="block">
                                <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <BarChart2 className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <div className="font-medium text-sm">Tableau croisé</div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">Analyser les disponibilités</div>
                                    </div>
                                </div>
                            </NavLink>
                            
                            <NavLink to="/admin/suivi-soumissions" className="block">
                                <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <MessageSquare className="h-5 w-5 text-orange-600" />
                                    <div>
                                        <div className="font-medium text-sm">Relances</div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">Gérer les relances automatiques</div>
                                    </div>
                                </div>
                            </NavLink>
                            
                            <NavLink to="/admin/examens" className="block">
                                <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <Calendar className="h-5 w-5 text-green-600" />
                                    <div>
                                        <div className="font-medium text-sm">Examens</div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">Gérer les examens</div>
                                    </div>
                                </div>
                            </NavLink>
                            
                            <NavLink to="/admin/statistiques" className="block">
                                <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <BarChart2 className="h-5 w-5 text-purple-600" />
                                    <div>
                                        <div className="font-medium text-sm">Statistiques</div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">Rapports détaillés</div>
                                    </div>
                                </div>
                            </NavLink>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default DashboardPage;