import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '../../components/shared/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/shared/Select';
import { Clock, PlusCircle, Edit, Trash2, Loader2, AlertTriangle, Users } from 'lucide-react';
import { getSessions, getCreneauxBySession, createCreneau, updateCreneau, deleteCreneau } from '../../lib/api';
import { Session, Creneau } from '../../types';
import toast from 'react-hot-toast';
import { useDataFetching } from '../../hooks/useDataFetching';
import { CapacityInput } from '../../components/shared/CapacityInput';

const CreneauForm: React.FC<{ creneau?: Partial<Creneau> | null; sessionId: string; onSave: () => void; onCancel: () => void; }> = ({ creneau, sessionId, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<Creneau>>({
        date_surveillance: '',
        heure_debut_surveillance: '08:30',
        heure_fin_surveillance: '12:30',
        type_creneau: 'PRINCIPAL',
        ...creneau,
        session_id: sessionId
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSelectChange = (value: string) => {
        setFormData(prev => ({ ...prev, type_creneau: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (creneau?.id) {
                await updateCreneau(creneau.id, formData);
                toast.success('Créneau mis à jour.');
            } else {
                await createCreneau(formData);
                toast.success('Créneau créé.');
            }
            onSave();
        } catch (error) {
            toast.error('Erreur lors de la sauvegarde.');
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div>
                <label htmlFor="date_surveillance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                <Input id="date_surveillance" name="date_surveillance" type="date" value={formData.date_surveillance || ''} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="heure_debut_surveillance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Heure de début</label>
                    <Input id="heure_debut_surveillance" name="heure_debut_surveillance" type="time" value={formData.heure_debut_surveillance || ''} onChange={handleChange} required />
                </div>
                <div>
                    <label htmlFor="heure_fin_surveillance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Heure de fin</label>
                    <Input id="heure_fin_surveillance" name="heure_fin_surveillance" type="time" value={formData.heure_fin_surveillance || ''} onChange={handleChange} required />
                </div>
            </div>
            <Select onValueChange={handleSelectChange} defaultValue={formData.type_creneau}>
                <SelectTrigger><SelectValue placeholder="Type de créneau" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="PRINCIPAL">Principal</SelectItem>
                    <SelectItem value="RESERVE">Réserve</SelectItem>
                </SelectContent>
            </Select>
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

const CreneauxPage: React.FC = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string>('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedCreneau, setSelectedCreneau] = useState<Creneau | null>(null);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [creneauToDelete, setCreneauToDelete] = useState<Creneau | null>(null);
    
    useEffect(() => {
        const fetchSessionsData = async () => {
            try {
                const sessionsData = await getSessions();
                setSessions(sessionsData);
                const activeSession = sessionsData.find(s => s.is_active);
                if (activeSession) setSelectedSessionId(activeSession.id);
                else if (sessionsData.length > 0) setSelectedSessionId(sessionsData[0].id);
            } catch (error) {
                toast.error("Erreur lors du chargement des sessions.");
            }
        };
        fetchSessionsData();
    }, []);

    const fetchCreneauxForSession = useCallback(() => {
        if (!selectedSessionId) return Promise.resolve([]);
        return getCreneauxBySession(selectedSessionId);
    }, [selectedSessionId]);

    const { data: creneaux, isLoading, refetch } = useDataFetching(fetchCreneauxForSession, [], [selectedSessionId]);
    
    const handleSave = () => {
        setIsFormOpen(false);
        setSelectedCreneau(null);
        refetch();
    };

    const handleEdit = (creneau: Creneau) => {
        setSelectedCreneau(creneau);
        setIsFormOpen(true);
    };

    const openDeleteConfirmation = (creneau: Creneau) => {
        setCreneauToDelete(creneau);
        setIsConfirmDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!creneauToDelete) return;
        try {
            await deleteCreneau(creneauToDelete.id);
            toast.success("Créneau supprimé.");
            refetch();
        } catch (error) {
            toast.error("Erreur lors de la suppression.");
        } finally {
            setIsConfirmDeleteOpen(false);
            setCreneauToDelete(null);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Gestion des Créneaux</h1>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="flex items-center gap-2"><Clock /> Créneaux de surveillance</CardTitle>
                            <CardDescription>Gérez les créneaux pour chaque session.</CardDescription>
                        </div>
                        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                             <DialogTrigger asChild>
                                 <Button onClick={() => setSelectedCreneau(null)} disabled={!selectedSessionId}><PlusCircle className="mr-2 h-4 w-4" /> Ajouter Créneau</Button>
                             </DialogTrigger>
                             <DialogContent>
                                 <DialogHeader><DialogTitle>{selectedCreneau ? 'Modifier le créneau' : 'Nouveau créneau'}</DialogTitle></DialogHeader>
                                 {selectedSessionId && <CreneauForm creneau={selectedCreneau} sessionId={selectedSessionId} onSave={handleSave} onCancel={() => setIsFormOpen(false)} />}
                             </DialogContent>
                         </Dialog>
                    </div>
                    <div className="pt-4">
                        <label htmlFor="session-select" className="text-sm font-medium mr-2">Session:</label>
                        <Select onValueChange={setSelectedSessionId} value={selectedSessionId}>
                            <SelectTrigger id="session-select" className="w-[300px]"><SelectValue placeholder="Sélectionnez une session" /></SelectTrigger>
                            <SelectContent>{sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
                    : <div className="overflow-x-auto border rounded-lg dark:border-gray-700">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Horaires</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                        <div className="flex items-center justify-center gap-1">
                                            <Users className="h-4 w-4" />
                                            <span>Surveillants requis</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                {creneaux.map(c => (
                                    <tr key={c.id} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-800/50 hover:bg-indigo-50 dark:hover:bg-gray-800">
                                        <td className="px-6 py-3 whitespace-nowrap text-sm">{c.date_surveillance ? new Date(c.date_surveillance + 'T00:00:00').toLocaleDateString('fr-FR') : 'N/A'}</td>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm">{c.heure_debut_surveillance} - {c.heure_fin_surveillance}</td>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                                            <CapacityInput 
                                                creneauId={c.id} 
                                                value={c.nb_surveillants_requis} 
                                                onChange={() => refetch()}
                                                autoSave={true}
                                            />
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(c)}><Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="sm" onClick={() => openDeleteConfirmation(c)} className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>}
                </CardContent>
            </Card>
             <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-red-500" />Confirmer la suppression</DialogTitle></DialogHeader>
                    <p>Êtes-vous sûr de vouloir supprimer ce créneau ? Cette action est irréversible.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmDeleteOpen(false)}>Annuler</Button>
                        <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Supprimer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CreneauxPage;