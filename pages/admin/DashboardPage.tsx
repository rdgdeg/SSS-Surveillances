
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Users, FileText, CheckCircle, BarChart2, Loader2, Calendar, Clock, AlertTriangle, TrendingUp, BookOpen, UserCheck, History } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { getDashboardStats } from '../../lib/api';
import { useDataFetching } from '../../hooks/useDataFetching';
import { useActiveSession } from '../../src/hooks/useActiveSession';
import { useRecentChanges } from '../../hooks/useVersioning';
import { formatUtils } from '../../lib/versioningService';
import VersioningButton from '../../components/shared/VersioningButton';

interface DashboardStats {
    totalSurveillants: number;
    totalSubmissions: number;
    submissionRate: number;
    availableCount: number;
    availabilityRate: number;
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
    const { activeSession } = useActiveSession();

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
                {activeSession && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Session active: <span className="font-semibold">{activeSession.nom}</span>
                    </div>
                )}
            </div>

            {/* Statistiques principales */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Surveillants</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalSurveillants}</div>
                        <p className="text-xs text-muted-foreground mt-1">Inscrits dans le système</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Soumissions</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
                        <p className="text-xs text-muted-foreground mt-1">{stats.submissionRate.toFixed(1)}% de participation</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Disponibilités</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.availableCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">{stats.availabilityRate.toFixed(1)}% des créneaux cochés</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Taux de réponse</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.submissionRate.toFixed(0)}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.totalSurveillants - stats.totalSubmissions} en attente
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Accès rapides */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-indigo-600" />
                            Gestion des Sessions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Créer et gérer les sessions d'examens
                        </p>
                        <NavLink to="/admin/sessions">
                            <Button variant="outline" className="w-full">
                                Voir les sessions
                            </Button>
                        </NavLink>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-blue-600" />
                            Créneaux & Disponibilités
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Analyser les disponibilités des surveillants
                        </p>
                        <NavLink to="/admin/disponibilites">
                            <Button variant="outline" className="w-full">
                                <BarChart2 className="mr-2 h-4 w-4" />
                                Tableau croisé
                            </Button>
                        </NavLink>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                            Suivi & Relances
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Relancer les surveillants n'ayant pas répondu
                        </p>
                        <NavLink to="/admin/suivi-soumissions">
                            <Button variant="outline" className="w-full">
                                Gérer les relances
                            </Button>
                        </NavLink>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-green-600" />
                            Examens & Cours
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Gérer les examens et leurs liens avec les cours
                        </p>
                        <NavLink to="/admin/examens">
                            <Button variant="outline" className="w-full">
                                Voir les examens
                            </Button>
                        </NavLink>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCheck className="h-5 w-5 text-purple-600" />
                            Présences Enseignants
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Suivre les déclarations de présence
                        </p>
                        <NavLink to="/admin/presences-enseignants">
                            <Button variant="outline" className="w-full">
                                Voir les présences
                            </Button>
                        </NavLink>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart2 className="h-5 w-5 text-red-600" />
                            Statistiques
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Rapports détaillés et analyses
                        </p>
                        <NavLink to="/admin/statistiques">
                            <Button variant="outline" className="w-full">
                                Voir les stats
                            </Button>
                        </NavLink>
                    </CardContent>
                </Card>
            </div>

            {/* Alertes et notifications */}
            {stats.submissionRate < 50 && (
                <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-400">
                            <AlertTriangle className="h-5 w-5" />
                            Attention: Taux de participation faible
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-orange-700 dark:text-orange-300">
                            Seulement {stats.submissionRate.toFixed(0)}% des surveillants ont soumis leurs disponibilités.
                            Pensez à envoyer des relances.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default DashboardPage;