
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/shared/Card';
import { Users, FileText, CheckCircle, BarChart2, Loader2 } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Button } from '../../components/shared/Button';
import { getDashboardStats } from '../../lib/api';
import { useDataFetching } from '../../hooks/useDataFetching';

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

    if (isLoading) {
        return (
             <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" aria-label="Loading stats" />
             </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Tableau de bord</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Surveillants</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalSurveillants}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Soumissions</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
                        <p className="text-xs text-muted-foreground">{stats.submissionRate.toFixed(1)}% de participation</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Disponibilités Confirmées</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.availableCount}</div>
                         <p className="text-xs text-muted-foreground">{stats.availabilityRate.toFixed(1)}% des créneaux cochés</p>
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Analyse Détaillée</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-4">Consultez le tableau croisé pour voir les disponibilités détaillées par surveillant et par créneau.</p>
                    <NavLink to="/admin/disponibilites">
                        <Button>
                            <BarChart2 className="mr-2 h-4 w-4" />
                            Voir l'analyse des disponibilités
                        </Button>
                    </NavLink>
                </CardContent>
             </Card>
        </div>
    );
}

export default DashboardPage;