import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/shared/Card';
import { FileText, Download, Calendar, Users, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../../components/shared/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/shared/Select';
import { getSessions } from '../../lib/api';
import { Session } from '../../types';
import toast from 'react-hot-toast';

type ReportType = 'disponibilites' | 'examens' | 'surveillants' | 'presences';

const RapportsPage: React.FC = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string>('');
    const [isLoadingSessions, setIsLoadingSessions] = useState(true);
    const [generatingReport, setGeneratingReport] = useState<ReportType | null>(null);

    useEffect(() => {
        const loadSessions = async () => {
            try {
                const data = await getSessions();
                setSessions(data);
                
                // Sélectionner automatiquement la session active
                const activeSession = data.find(s => s.is_active);
                if (activeSession) {
                    setSelectedSessionId(activeSession.id);
                } else if (data.length > 0) {
                    // Sinon, sélectionner la première session
                    setSelectedSessionId(data[0].id);
                }
            } catch (error) {
                console.error('Error loading sessions:', error);
                toast.error('Erreur lors du chargement des sessions');
            } finally {
                setIsLoadingSessions(false);
            }
        };

        loadSessions();
    }, []);

    const selectedSession = sessions.find(s => s.id === selectedSessionId);

    const generateReport = async (type: ReportType) => {
        if (!selectedSessionId) {
            toast.error('Veuillez sélectionner une session');
            return;
        }

        setGeneratingReport(type);
        // Simuler la génération du rapport
        await new Promise(resolve => setTimeout(resolve, 1500));
        setGeneratingReport(null);
        
        // TODO: Implémenter la génération réelle des rapports
        toast.success(`Rapport ${type} généré avec succès pour la session ${selectedSession?.name}!`);
    };

    const reports = [
        {
            id: 'disponibilites' as ReportType,
            title: 'Rapport des Disponibilités',
            description: 'Liste complète des disponibilités par surveillant et par créneau',
            icon: Clock,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-900/10',
        },
        {
            id: 'examens' as ReportType,
            title: 'Rapport des Examens',
            description: 'Détails des examens avec surveillants requis et affectations',
            icon: FileText,
            color: 'text-green-600',
            bgColor: 'bg-green-50 dark:bg-green-900/10',
        },
        {
            id: 'surveillants' as ReportType,
            title: 'Rapport des Surveillants',
            description: 'Liste des surveillants avec leurs statistiques de participation',
            icon: Users,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50 dark:bg-purple-900/10',
        },
        {
            id: 'presences' as ReportType,
            title: 'Rapport des Présences',
            description: 'Suivi des présences déclarées par les enseignants',
            icon: CheckCircle,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50 dark:bg-orange-900/10',
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Rapports</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Générez et téléchargez des rapports détaillés
                </p>
            </div>

            <Card className="bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <Calendar className="h-5 w-5 text-indigo-700 dark:text-indigo-400" />
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-indigo-900 dark:text-indigo-300 mb-2">
                                Sélectionner une session
                            </label>
                            {isLoadingSessions ? (
                                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm">Chargement des sessions...</span>
                                </div>
                            ) : sessions.length === 0 ? (
                                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="text-sm">Aucune session disponible</span>
                                </div>
                            ) : (
                                <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                                    <SelectTrigger className="w-full max-w-md bg-white dark:bg-gray-800">
                                        <SelectValue placeholder="Choisir une session" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sessions.map((session) => (
                                            <SelectItem key={session.id} value={session.id}>
                                                {session.name} {session.is_active && '(Active)'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                {reports.map((report) => {
                    const Icon = report.icon;
                    const isGenerating = generatingReport === report.id;
                    
                    return (
                        <Card key={report.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${report.bgColor}`}>
                                        <Icon className={`h-6 w-6 ${report.color}`} />
                                    </div>
                                    <span>{report.title}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {report.description}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => generateReport(report.id)}
                                        disabled={!selectedSessionId || isGenerating}
                                        className="flex-1"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Génération...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="mr-2 h-4 w-4" />
                                                Télécharger (CSV)
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => generateReport(report.id)}
                                        disabled={!selectedSessionId || isGenerating}
                                    >
                                        <FileText className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Rapports personnalisés */}
            <Card>
                <CardHeader>
                    <CardTitle>Rapports Personnalisés</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Créez des rapports personnalisés en sélectionnant les données à inclure
                    </p>
                    <Button variant="outline" disabled>
                        <FileText className="mr-2 h-4 w-4" />
                        Créer un rapport personnalisé (Bientôt disponible)
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default RapportsPage;
