import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/shared/Card';
import { BarChart2, Calendar, Users, Clock, AlertTriangle, CheckCircle, Loader2, TrendingUp } from 'lucide-react';
import { useActiveSession } from '../../src/hooks/useActiveSession';
import { useDataFetching } from '../../hooks/useDataFetching';
import { getExamens } from '../../lib/examenManagementApi';

interface Examen {
    id: number;
    code_cours: string;
    date: string;
    heure_debut: string;
    heure_fin: string;
    local: string;
    nombre_etudiants: number;
    surveillants_requis: number;
    session_id: number;
}

const AnalyseExamensPage: React.FC = () => {
    const { data: activeSession, isLoading: isLoadingSession } = useActiveSession();
    const { data: examensData, isLoading } = useDataFetching<{ data: Examen[]; total: number }>(
        () => activeSession ? getExamens(activeSession.id) : Promise.resolve({ data: [], total: 0 }),
        { data: [], total: 0 }
    );
    
    const examens = examensData?.data || [];

    const stats = useMemo(() => {
        if (!examens.length) return null;

        const totalExamens = examens.length;
        const totalEtudiants = examens.reduce((sum, e) => sum + (e.nombre_etudiants || 0), 0);
        const totalSurveillantsRequis = examens.reduce((sum, e) => sum + (e.surveillants_requis || 0), 0);
        
        // Grouper par date
        const parDate = examens.reduce((acc, e) => {
            const date = e.date;
            if (!acc[date]) acc[date] = [];
            acc[date].push(e);
            return acc;
        }, {} as Record<string, Examen[]>);

        const joursExamen = Object.keys(parDate).length;
        const jourLePlusCharge = Object.entries(parDate).reduce((max, [date, exams]) => {
            const surveillants = exams.reduce((sum, e) => sum + (e.surveillants_requis || 0), 0);
            return surveillants > max.count ? { date, count: surveillants, examens: exams.length } : max;
        }, { date: '', count: 0, examens: 0 });

        // Grouper par local
        const parLocal = examens.reduce((acc, e) => {
            const local = e.local || 'Non défini';
            if (!acc[local]) acc[local] = 0;
            acc[local]++;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalExamens,
            totalEtudiants,
            totalSurveillantsRequis,
            moyenneEtudiantsParExamen: Math.round(totalEtudiants / totalExamens),
            moyenneSurveillantsParExamen: (totalSurveillantsRequis / totalExamens).toFixed(1),
            joursExamen,
            jourLePlusCharge,
            parDate,
            parLocal,
        };
    }, [examens]);

    if (isLoadingSession || isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!activeSession) {
        return (
            <Card className="bg-yellow-50 dark:bg-yellow-900/10">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                        <AlertTriangle className="h-5 w-5" />
                        <span>Aucune session active. Activez une session pour voir les analyses.</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!stats) {
        return (
            <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                    Aucun examen trouvé pour cette session
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Analyse des Examens</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Session: {activeSession.name}
                </p>
            </div>

            {/* Statistiques principales */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Examens</CardTitle>
                        <BarChart2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalExamens}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Sur {stats.joursExamen} jours
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Étudiants</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalEtudiants}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Moy. {stats.moyenneEtudiantsParExamen} par examen
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Surveillants Requis</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalSurveillantsRequis}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Moy. {stats.moyenneSurveillantsParExamen} par examen
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Jour le Plus Chargé</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.jourLePlusCharge.count}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {new Date(stats.jourLePlusCharge.date).toLocaleDateString('fr-FR')} ({stats.jourLePlusCharge.examens} examens)
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Répartition par date */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Répartition par Date
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Object.entries(stats.parDate)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([date, exams]) => {
                                const surveillantsRequis = exams.reduce((sum, e) => sum + (e.surveillants_requis || 0), 0);
                                const etudiants = exams.reduce((sum, e) => sum + (e.nombre_etudiants || 0), 0);
                                
                                return (
                                    <div key={date} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div>
                                            <div className="font-medium">
                                                {new Date(date).toLocaleDateString('fr-FR', { 
                                                    weekday: 'long', 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric' 
                                                })}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                {exams.length} examen{exams.length > 1 ? 's' : ''} • {etudiants} étudiants
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                                {surveillantsRequis}
                                            </div>
                                            <div className="text-xs text-gray-500">surveillants</div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </CardContent>
            </Card>

            {/* Répartition par local */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Répartition par Local
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(stats.parLocal)
                            .sort(([, a], [, b]) => b - a)
                            .map(([local, count]) => (
                                <div key={local} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="font-medium truncate">{local}</div>
                                    <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 ml-2">
                                        {count}
                                    </div>
                                </div>
                            ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AnalyseExamensPage;
