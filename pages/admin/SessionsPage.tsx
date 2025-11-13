import React, { useState, useEffect, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/shared/Card';
import { CalendarDays, PlusCircle, Edit, Loader2, Copy } from 'lucide-react';
import { getSessions, createSession, updateSession, duplicateSession } from '../../lib/api';
import { Session } from '../../types';
import { Button } from '../../components/shared/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '../../components/shared/Dialog';
import { Input } from '../../components/shared/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/shared/Select';
import { Switch } from '../../components/shared/Switch';
import { Badge } from '../../components/shared/Badge';
import toast from 'react-hot-toast';
import { useDataFetching } from '../../hooks/useDataFetching';

const periodLabels: { [key: number]: string } = {
    1: 'Janvier',
    2: 'Juin',
    3: 'Août/Septembre',
    4: 'Hors-Session Janvier',
    5: 'Hors-Session Juin'
};

const SessionForm: React.FC<{ session?: Session | null; onSave: () => void; onCancel: () => void; }> = ({ session, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<Session>>({
        name: '',
        year: new Date().getFullYear(),
        period: 1,
        is_active: false,
        ...session
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) || 0 : value }));
    };

    const handleSelectChange = (value: string) => {
        setFormData(prev => ({ ...prev, period: parseInt(value) as (1 | 2 | 3 | 4 | 5) }));
    };
    
    const handleSwitchChange = (checked: boolean) => {
        setFormData(prev => ({ ...prev, is_active: checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = { ...formData, name: formData.name || `${periodLabels[formData.period as number]} ${formData.year}` };
            if (session?.id) {
                await updateSession(session.id, payload);
                toast.success('Session mise à jour avec succès.');
            } else {
                await createSession(payload);
                toast.success('Session créée avec succès.');
            }
            onSave();
        } catch (error) {
            toast.error('Erreur lors de la sauvegarde.');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input name="name" placeholder={`Ex: ${periodLabels[formData.period as number]} ${formData.year}`} value={formData.name} onChange={handleChange} />
            <div className="grid grid-cols-2 gap-4">
                <Input name="year" type="number" placeholder="Année" value={formData.year} onChange={handleChange} required />
                <Select onValueChange={handleSelectChange} defaultValue={String(formData.period)}>
                    <SelectTrigger><SelectValue placeholder="Période" /></SelectTrigger>
                    <SelectContent>
                        {Object.entries(periodLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="flex items-center space-x-2">
                <Switch id="is_active" checked={!!formData.is_active} onCheckedChange={handleSwitchChange} />
                <label htmlFor="is_active" className="text-sm font-medium">Activer la session</label>
            </div>
            <p className="text-xs text-gray-500">Activer une session la rendra visible sur le formulaire public. Une seule session peut être active à la fois.</p>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sauvegarder
                </Button>
            </DialogFooter>
        </form>
    );
};

const SessionRow = memo<{ session: Session; onEdit: (s: Session) => void; onDuplicate: (s: Session) => void; onToggleActive: (s: Session) => void; }>(({ session, onEdit, onDuplicate, onToggleActive }) => (
    <tr className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-800/50 hover:bg-indigo-50 dark:hover:bg-gray-800">
        <td className="px-6 py-3 whitespace-nowrap text-sm">{session.name}</td>
        <td className="px-6 py-3 whitespace-nowrap text-sm">{session.year}</td>
        <td className="px-6 py-3 whitespace-nowrap text-sm">{periodLabels[session.period]}</td>
        <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
            <Badge variant={session.is_active ? 'success' : 'default'}>
                {session.is_active ? 'Active' : 'Inactive'}
            </Badge>
        </td>
        <td className="px-6 py-3 whitespace-nowrap text-sm text-right space-x-2">
            <Switch checked={session.is_active} onCheckedChange={() => onToggleActive(session)} aria-label="Activer la session" />
            <Button variant="ghost" size="sm" onClick={() => onEdit(session)}><Edit className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => onDuplicate(session)}><Copy className="h-4 w-4" /></Button>
        </td>
    </tr>
));

const SessionsPage: React.FC = () => {
    const { data: sessions, isLoading, refetch } = useDataFetching(getSessions, []);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);

    const handleSave = useCallback(() => {
        setIsFormOpen(false);
        setSelectedSession(null);
        refetch();
    }, [refetch]);

    const handleCancel = useCallback(() => {
        setIsFormOpen(false);
        setSelectedSession(null);
    }, []);

    const handleEdit = useCallback((session: Session) => {
        setSelectedSession(session);
        setIsFormOpen(true);
    }, []);

    const handleDuplicate = useCallback(async (session: Session) => {
        try {
            await duplicateSession(session);
            toast.success(`Session "${session.name}" dupliquée.`);
            refetch();
        } catch (error) {
            toast.error("Erreur lors de la duplication de la session.");
            console.error(error);
        }
    }, [refetch]);
    
    const handleToggleActive = useCallback(async (session: Session) => {
        try {
            await updateSession(session.id, { is_active: !session.is_active });
            toast.success(`Session ${!session.is_active ? 'activée' : 'désactivée'}.`);
            refetch();
        } catch(error) {
            toast.error("Erreur lors de la mise à jour.");
        }
    }, [refetch]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Gestion des Sessions</h1>
            <Card>
                <CardHeader>
                     <div className="flex justify-between items-start">
                         <div>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarDays />
                                Sessions d'examens
                            </CardTitle>
                            <CardDescription>Créez et gérez les sessions d'examens.</CardDescription>
                         </div>
                         <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                             <DialogTrigger asChild>
                                 <Button onClick={() => setSelectedSession(null)}><PlusCircle className="mr-2 h-4 w-4" /> Nouvelle Session</Button>
                             </DialogTrigger>
                             <DialogContent>
                                 <DialogHeader>
                                     <DialogTitle>{selectedSession ? 'Modifier la session' : 'Nouvelle session'}</DialogTitle>
                                 </DialogHeader>
                                 <SessionForm session={selectedSession} onSave={handleSave} onCancel={handleCancel} />
                             </DialogContent>
                         </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                     {isLoading ? (
                        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
                    ) : (
                        <div className="overflow-x-auto border rounded-lg dark:border-gray-700">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nom</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Année</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Période</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Statut</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                    {sessions.map(s => (
                                        <SessionRow 
                                            key={s.id} 
                                            session={s} 
                                            onEdit={handleEdit}
                                            onDuplicate={handleDuplicate}
                                            onToggleActive={handleToggleActive}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default SessionsPage;