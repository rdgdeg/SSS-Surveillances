import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/shared/Dialog';
import { ClipboardList, Trash2, Edit, Search, Loader2, AlertTriangle, Users, CheckCircle, Clock, Upload } from 'lucide-react';
import { getSubmissionStatusData, deleteSoumission, updateSoumissionRemark } from '../../lib/api';
import { SoumissionDisponibilite, Surveillant, SurveillantType, SurveillantTypeLabels } from '../../types';
import toast from 'react-hot-toast';
import { useDataFetching } from '../../hooks/useDataFetching';
import { useDebounce } from '../../hooks/useDebounce';
import { Badge } from '../../components/shared/Badge';
import { Input } from '../../components/shared/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/shared/Select';

const EditRemarkModal: React.FC<{ submission: SoumissionDisponibilite; onSave: (id: string, remark: string) => Promise<void>; onCancel: () => void; }> = ({ submission, onSave, onCancel }) => {
    const [remark, setRemark] = useState(submission.remarque_generale || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(submission.id, remark);
        setIsSaving(false);
    };

    return (
        <DialogContent>
            <DialogHeader><DialogTitle>Modifier la remarque de {submission.prenom} {submission.nom}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit}>
                <textarea rows={5} className="w-full p-2 border rounded-md bg-transparent dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none" value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Aucune remarque..." />
                <DialogFooter className="mt-4">
                    <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sauvegarder
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
};

const SoumissionsPage: React.FC = () => {
    const { data, isLoading, refetch } = useDataFetching(getSubmissionStatusData, { soumissions: [], allActiveSurveillants: [], activeSessionName: null });
    const { soumissions, allActiveSurveillants, activeSessionName } = data;
    const [activeTab, setActiveTab] = useState<'status' | 'list'>('status');
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const [pendingFilters, setPendingFilters] = useState({ type: 'all', faculte: 'all' });
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [submissionToDelete, setSubmissionToDelete] = useState<SoumissionDisponibilite | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [submissionToEdit, setSubmissionToEdit] = useState<SoumissionDisponibilite | null>(null);
    
    const uniqueFaculties = useMemo(() => {
        const faculties = new Set(allActiveSurveillants.map(s => s.affectation_faculte).filter((f): f is string => !!f));
        return Array.from(faculties).sort();
    }, [allActiveSurveillants]);

    const { submitted, pending, stats } = useMemo(() => {
        const submittedEmails = new Set(soumissions.map(s => s.email));
        const submittedSurveillants = soumissions
            .map(s => {
                const surveillantDetails = allActiveSurveillants.find(surv => surv.email === s.email);
                return { ...s, ...surveillantDetails };
            })
            .sort((a, b) => a.nom.localeCompare(b.nom));

        const pendingSurveillants = allActiveSurveillants
            .filter(s => !submittedEmails.has(s.email))
            .sort((a, b) => a.nom.localeCompare(b.nom));
        
        const participationRate = allActiveSurveillants.length > 0 ? (submittedSurveillants.length / allActiveSurveillants.length) * 100 : 0;
        
        return {
            submitted: submittedSurveillants,
            pending: pendingSurveillants,
            stats: {
                total: allActiveSurveillants.length,
                submittedCount: submittedSurveillants.length,
                pendingCount: pendingSurveillants.length,
                rate: participationRate,
            }
        };
    }, [soumissions, allActiveSurveillants]);
    
    const filteredSubmitted = useMemo(() => submitted.filter(s => `${s.prenom} ${s.nom} ${s.email}`.toLowerCase().includes(debouncedSearchQuery.toLowerCase())), [submitted, debouncedSearchQuery]);
    
    const filteredPending = useMemo(() => pending
        .filter(s => pendingFilters.type === 'all' || s.type === pendingFilters.type)
        .filter(s => pendingFilters.faculte === 'all' || s.affectation_faculte === pendingFilters.faculte)
        .filter(s => `${s.prenom} ${s.nom} ${s.email}`.toLowerCase().includes(debouncedSearchQuery.toLowerCase())), 
        [pending, debouncedSearchQuery, pendingFilters]
    );

    const filteredList = useMemo(() => soumissions.filter(s => `${s.prenom} ${s.nom} ${s.email}`.toLowerCase().includes(debouncedSearchQuery.toLowerCase())).sort((a,b) => a.nom.localeCompare(b.nom)), [soumissions, debouncedSearchQuery]);


    const openDeleteConfirmation = useCallback((s: SoumissionDisponibilite) => { setSubmissionToDelete(s); setIsConfirmDeleteOpen(true); }, []);
    const openEditModal = useCallback((s: SoumissionDisponibilite) => { setSubmissionToEdit(s); setIsEditModalOpen(true); }, []);

    const handleDelete = async () => {
        if (!submissionToDelete) return;
        try {
            await deleteSoumission(submissionToDelete.id);
            toast.success("Soumission supprimée.");
            refetch();
        } catch (error) { toast.error("Erreur lors de la suppression."); } 
        finally { setIsConfirmDeleteOpen(false); setSubmissionToDelete(null); }
    };
    
    const handleSaveRemark = async (id: string, remark: string) => {
        try {
            await updateSoumissionRemark(id, remark);
            toast.success("Remarque mise à jour.");
            refetch();
        } catch (error) { toast.error("Erreur lors de la sauvegarde."); }
        finally { setIsEditModalOpen(false); setSubmissionToEdit(null); }
    };
    
    const handleExportEmails = () => {
        const emails = filteredPending.map(s => s.email).join(', ');
        if (emails) {
            navigator.clipboard.writeText(emails)
                .then(() => toast.success(`${filteredPending.length} emails copiés dans le presse-papiers.`))
                .catch(() => toast.error("La copie a échoué."));
        } else {
            toast.error("Aucun email à exporter pour les filtres sélectionnés.");
        }
    };


    if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Suivi des Soumissions</h1>
            <p className="text-gray-500 dark:text-gray-400">{activeSessionName ? `Session active : ${activeSessionName}` : "Aucune session active."}</p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card><CardHeader><CardTitle className="text-sm font-medium">Surveillants Actifs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
                <Card><CardHeader><CardTitle className="text-sm font-medium">Soumissions Reçues</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.submittedCount}</div></CardContent></Card>
                <Card><CardHeader><CardTitle className="text-sm font-medium">En Attente</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.pendingCount}</div></CardContent></Card>
                <Card><CardHeader><CardTitle className="text-sm font-medium">Taux de Participation</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.rate.toFixed(1)}%</div><div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2"><div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${stats.rate}%` }}></div></div></CardContent></Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div className="flex border-b dark:border-gray-700">
                             <button onClick={() => setActiveTab('status')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'status' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Statut des Soumissions</button>
                             <button onClick={() => setActiveTab('list')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'list' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Liste des Soumissions</button>
                        </div>
                         <div className="relative flex-grow max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder="Rechercher par nom, prénom, email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
                        </div>
                    </div>
                </CardHeader>

                {activeTab === 'status' ? (
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4"><CheckCircle className="text-green-500" /> Ont soumis ({filteredSubmitted.length})</h3>
                            <div className="border rounded-lg dark:border-gray-700 overflow-auto max-h-96">
                                <table className="w-full text-sm">
                                    <tbody>{filteredSubmitted.map(s => <tr key={s.id} className="border-b dark:border-gray-700 last:border-b-0">
                                        <td className="p-3">{s.nom.toUpperCase()} {s.prenom}</td>
                                        <td className="p-3 text-gray-500">{s.email}</td>
                                        <td className="p-3 text-right text-gray-400 text-xs">{new Date(s.submitted_at).toLocaleDateString('fr-FR')}</td>
                                    </tr>)}</tbody>
                                </table>
                            </div>
                        </div>
                        <div>
                             <h3 className="text-lg font-semibold flex items-center gap-2 mb-4"><Clock className="text-orange-500" /> En attente de soumission ({filteredPending.length})</h3>
                              <div className="flex flex-wrap gap-4 items-center mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                 <Select onValueChange={v => setPendingFilters(f => ({ ...f, type: v }))} defaultValue="all">
                                    <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type..."/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous les types</SelectItem>
                                        {Object.entries(SurveillantTypeLabels).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                 <Select onValueChange={v => setPendingFilters(f => ({ ...f, faculte: v }))} defaultValue="all">
                                    <SelectTrigger className="w-[150px]"><SelectValue placeholder="Faculté..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Toutes facultés</SelectItem>
                                        {uniqueFaculties.map(fac => <SelectItem key={fac} value={fac}>{fac}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" size="sm" onClick={handleExportEmails} className="ml-auto"><Upload className="mr-2 h-4 w-4"/> Exporter Emails</Button>
                             </div>
                             <div className="border rounded-lg dark:border-gray-700 overflow-auto max-h-80">
                                <table className="w-full text-sm">
                                    <tbody>{filteredPending.map(s => <tr key={s.id} className="border-b dark:border-gray-700 last:border-b-0">
                                        <td className="p-3">{s.nom.toUpperCase()} {s.prenom}</td>
                                        <td className="p-3 text-gray-500">{s.email}</td>
                                        <td className="p-3 text-right"><Button variant="ghost" size="sm" onClick={() => toast.error('Fonctionnalité non implémentée.')}>Rappeler</Button></td>
                                    </tr>)}</tbody>
                                </table>
                            </div>
                        </div>
                    </CardContent>
                ) : (
                    <CardContent>
                        <div className="border rounded-lg dark:border-gray-700 overflow-x-auto">
                            <table className="w-full table-auto divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nom</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"># Dispos</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Remarque</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredList.map(s => <tr key={s.id}>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm">{s.nom.toUpperCase()} {s.prenom}</td>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm">{SurveillantTypeLabels[s.type_surveillant as keyof typeof SurveillantTypeLabels]}</td>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm text-center"><Badge variant="default">{s.historique_disponibilites.filter(d => d.est_disponible).length}</Badge></td>
                                        <td className="px-6 py-3 text-sm max-w-xs truncate">{s.remarque_generale || <span className="text-gray-400">Aucune</span>}</td>
                                        <td className="px-6 py-3 whitespace-nowrap text-right text-sm">
                                            <Button variant="ghost" size="sm" onClick={() => openEditModal(s)}><Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="sm" onClick={() => openDeleteConfirmation(s)} className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></Button>
                                        </td>
                                    </tr>)}
                                </tbody>
                            </table>
                        </div>
                         <CardFooter className="pt-4 px-0">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{filteredList.length} soumission(s) trouvée(s).</span>
                         </CardFooter>
                    </CardContent>
                )}
            </Card>

            <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-red-500" />Confirmer la suppression</DialogTitle></DialogHeader>
                    <p>Supprimer la soumission de <strong>{submissionToDelete?.prenom} {submissionToDelete?.nom}</strong>? Cette action est irréversible.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmDeleteOpen(false)}>Annuler</Button>
                        <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Supprimer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                {submissionToEdit && <EditRemarkModal submission={submissionToEdit} onSave={handleSaveRemark} onCancel={() => setIsEditModalOpen(false)} />}
            </Dialog>
        </div>
    );
};

export default SoumissionsPage;
