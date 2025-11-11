import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '../../components/shared/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/shared/Select';
import { Users, PlusCircle, Edit, Trash2, Search, Loader2, Upload, AlertTriangle } from 'lucide-react';
import { getSurveillants, createSurveillant, updateSurveillant, deleteSurveillant } from '../../lib/api';
import { Surveillant, SurveillantType, SurveillantTypeLabels } from '../../types';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';
import { Switch } from '../../components/shared/Switch';
import { Badge } from '../../components/shared/Badge';
import { useDataFetching } from '../../hooks/useDataFetching';
import SurveillantImport from '../../components/admin/SurveillantImport';

const SurveillantForm: React.FC<{ surveillant?: Surveillant | null; onSave: () => void; onCancel: () => void; }> = ({ surveillant, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<Surveillant>>(() => {
        const defaults = {
            prenom: '', nom: '', email: '', type: SurveillantType.ASSISTANT,
            affectation_faculte: '',
            etp_total: 1, etp_recherche: undefined, quota_surveillances: 6, is_active: true
        };
        const initialData = { ...defaults, ...surveillant };
        if (!surveillant?.id && initialData.type === SurveillantType.PAT) {
            initialData.quota_surveillances = 0;
        }
        return initialData;
    });

    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.prenom?.trim()) newErrors.prenom = 'Le prénom est requis.';
        if (!formData.nom?.trim()) newErrors.nom = 'Le nom est requis.';
        if (!formData.email?.trim()) newErrors.email = "L'email est requis.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Le format de l'email est invalide.";
        
        // Validation ETP Total ou ETP Recherche (au moins un doit être rempli)
        const eftT = formData.etp_total;
        const eftR = formData.etp_recherche;
        if ((eftT === undefined || eftT === null) && (eftR === undefined || eftR === null)) {
            newErrors.etp_total = 'Au moins EFT T. ou EFT R. doit être rempli.';
        }
        if (eftT !== undefined && eftT !== null && (isNaN(eftT) || eftT < 0 || eftT > 1)) {
            newErrors.etp_total = 'EFT T. doit être entre 0.0 et 1.0.';
        }
        if (eftR !== undefined && eftR !== null && (isNaN(eftR) || eftR < 0 || eftR > 1)) {
            newErrors.etp_recherche = 'EFT R. doit être entre 0.0 et 1.0.';
        }
        
        if (formData.quota_surveillances === undefined || formData.quota_surveillances === null || isNaN(formData.quota_surveillances) || !Number.isInteger(Number(formData.quota_surveillances)) || formData.quota_surveillances < 0) {
            newErrors.quota_surveillances = 'Le quota doit être un entier positif.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? (value === '' ? undefined : parseInt(value, 10)) : value }));
    };

    const handleEtpTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(',', '.');
        const newEtpTotal = value === '' ? undefined : parseFloat(value);
        setFormData(prev => {
            // Recalculer le quota si c'est un assistant
            let newQuota = prev.quota_surveillances;
            if (prev.type === SurveillantType.ASSISTANT && newEtpTotal) {
                newQuota = Math.round(newEtpTotal * 6);
            }
            return { ...prev, etp_total: newEtpTotal, quota_surveillances: newQuota };
        });
    };

    const handleEtpRechercheChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(',', '.');
        const newEtpRecherche = value === '' ? undefined : parseFloat(value);
        setFormData(prev => {
            // Si ETP Total est vide et qu'on remplit ETP Recherche, recalculer le quota
            let newQuota = prev.quota_surveillances;
            if (prev.type === SurveillantType.ASSISTANT && !prev.etp_total && newEtpRecherche) {
                newQuota = Math.round(newEtpRecherche * 6);
            }
            return { ...prev, etp_recherche: newEtpRecherche, quota_surveillances: newQuota };
        });
    };

    const handleSelectChange = (value: string) => {
        const newType = value as SurveillantType;
        setFormData(prev => {
            const etp = prev.etp_total ?? prev.etp_recherche ?? 1;
            let newQuota = prev.quota_surveillances;

            if (newType === SurveillantType.PAT) {
                newQuota = 0;
            } else if (newType === SurveillantType.ASSISTANT) {
                newQuota = Math.round(etp * 6);
            } else { // Jobiste, Autre
                newQuota = Math.round(etp * 10);
            }
            return { ...prev, type: newType, quota_surveillances: newQuota };
        });
    };

    const handleSwitchChange = (checked: boolean) => setFormData(prev => ({ ...prev, is_active: checked }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return toast.error("Veuillez corriger les erreurs.");
        setIsSaving(true);
        try {
            if (surveillant?.id) {
                await updateSurveillant(surveillant.id, formData);
                toast.success('Surveillant mis à jour.');
            } else {
                await createSurveillant(formData);
                toast.success('Surveillant créé.');
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
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="prenom" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Prénom</label>
                    <Input id="prenom" name="prenom" value={formData.prenom} onChange={handleChange} />
                    {errors.prenom && <p className="text-sm text-red-500 mt-1">{errors.prenom}</p>}
                </div>
                <div>
                    <label htmlFor="nom" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Nom</label>
                    <Input id="nom" name="nom" value={formData.nom} onChange={handleChange} />
                    {errors.nom && <p className="text-sm text-red-500 mt-1">{errors.nom}</p>}
                </div>
            </div>
             <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Email</label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Type</label>
                    <Select onValueChange={handleSelectChange} defaultValue={formData.type}>
                        <SelectTrigger id="type"><SelectValue/></SelectTrigger>
                        <SelectContent>{Object.entries(SurveillantTypeLabels).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div>
                    <label htmlFor="affectation_faculte" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Affect. fac.</label>
                    <Input id="affectation_faculte" name="affectation_faculte" value={formData.affectation_faculte || ''} onChange={handleChange} placeholder="Ex: EPL, FIAL..." />
                </div>
            </div>
            <div className="flex items-center space-x-3">
                <Switch id="is_active" checked={!!formData.is_active} onCheckedChange={handleSwitchChange} />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer">Actif</label>
            </div>
            <div className="grid grid-cols-3 gap-4">
                 <div>
                    <label htmlFor="etp_total" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">EFT T.</label>
                    <Input id="etp_total" name="etp_total" type="text" inputMode="decimal" placeholder="1,0" value={formData.etp_total !== undefined ? String(formData.etp_total).replace('.', ',') : ''} onChange={handleEtpTotalChange} />
                    {errors.etp_total && <p className="text-sm text-red-500 mt-1">{errors.etp_total}</p>}
                </div>
                 <div>
                    <label htmlFor="etp_recherche" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">EFT R.</label>
                    <Input id="etp_recherche" name="etp_recherche" type="text" inputMode="decimal" placeholder="0,8" value={formData.etp_recherche !== undefined ? String(formData.etp_recherche).replace('.', ',') : ''} onChange={handleEtpRechercheChange} />
                    {errors.etp_recherche && <p className="text-sm text-red-500 mt-1">{errors.etp_recherche}</p>}
                </div>
                 <div>
                    <label htmlFor="quota_surveillances" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Quota</label>
                    <Input id="quota_surveillances" name="quota_surveillances" type="number" value={formData.quota_surveillances ?? ''} onChange={handleChange} />
                    {errors.quota_surveillances && <p className="text-sm text-red-500 mt-1">{errors.quota_surveillances}</p>}
                </div>
            </div>
            <DialogFooter className="pt-4 !mt-8">
                <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sauvegarder
                </Button>
            </DialogFooter>
        </form>
    );
};

const SurveillantRow = memo<{ surveillant: Surveillant; onEdit: (s: Surveillant) => void; onDelete: (s: Surveillant) => void }>(({ surveillant, onEdit, onDelete }) => (
    <tr className={`transition-opacity odd:bg-white even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-800/50 hover:bg-indigo-50 dark:hover:bg-gray-800 ${!surveillant.is_active ? 'opacity-60' : ''}`}>
        <td className="px-6 py-3 whitespace-nowrap text-sm">{surveillant.nom.toUpperCase()} {surveillant.prenom}</td>
        <td className="px-6 py-3 whitespace-nowrap truncate text-sm">{surveillant.email}</td>
        <td className="px-6 py-3 whitespace-nowrap text-sm">{SurveillantTypeLabels[surveillant.type]}</td>
        <td className="px-6 py-3 whitespace-nowrap text-sm">{surveillant.affectation_faculte || 'N/A'}</td>
        <td className="px-6 py-3 whitespace-nowrap text-sm"><Badge variant={surveillant.is_active ? 'success' : 'default'}>{surveillant.is_active ? 'Actif' : 'Inactif'}</Badge></td>
        <td className="px-6 py-3 whitespace-nowrap text-sm">{surveillant.etp_total ?? '-'}</td>
        <td className="px-6 py-3 whitespace-nowrap text-sm">{surveillant.etp_recherche ?? '-'}</td>
        <td className="px-6 py-3 whitespace-nowrap text-sm">{surveillant.quota_surveillances ?? 0}</td>
        <td className="px-6 py-3 whitespace-nowrap text-right text-sm">
            <Button variant="ghost" size="sm" onClick={() => onEdit(surveillant)}><Edit className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(surveillant)} className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></Button>
        </td>
    </tr>
));


const SurveillantsPage: React.FC = () => {
    const { data: surveillants, isLoading, refetch } = useDataFetching(getSurveillants, []);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [selectedSurveillant, setSelectedSurveillant] = useState<Surveillant | null>(null);
    const [surveillantToDelete, setSurveillantToDelete] = useState<Surveillant | null>(null);
    const [filters, setFilters] = useState({ type: 'all', active: 'all', faculte: 'all', sort: 'nom-asc' });
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    
    const handleSave = useCallback(() => {
        setIsFormOpen(false);
        setSelectedSurveillant(null);
        refetch();
    }, [refetch]);

    const handleCancel = useCallback(() => {
        setIsFormOpen(false);
        setSelectedSurveillant(null);
    }, []);

    const handleEdit = useCallback((surveillant: Surveillant) => {
        setSelectedSurveillant(surveillant);
        setIsFormOpen(true);
    }, []);
    
    const openDeleteConfirmation = useCallback((surveillant: Surveillant) => {
        setSurveillantToDelete(surveillant);
        setIsConfirmDeleteOpen(true);
    }, []);

    const handleDelete = async () => {
        if (!surveillantToDelete) return;
        try {
            await deleteSurveillant(surveillantToDelete.id);
            toast.success("Surveillant supprimé.");
            refetch();
        } catch (error) {
            toast.error("Erreur lors de la suppression.");
        } finally {
            setIsConfirmDeleteOpen(false);
            setSurveillantToDelete(null);
        }
    };
    
    const uniqueFaculties = useMemo(() => {
        if (!surveillants) return [];
        const faculties = new Set(surveillants.map(s => s.affectation_faculte).filter((f): f is string => !!f));
        return Array.from(faculties).sort();
    }, [surveillants]);
    
    const filteredAndSortedSurveillants = useMemo(() => {
        const filtered = surveillants
            .filter(s => filters.active === 'all' || (filters.active === 'active' ? s.is_active : !s.is_active))
            .filter(s => filters.type === 'all' || s.type === filters.type)
            .filter(s => filters.faculte === 'all' || s.affectation_faculte === filters.faculte)
            .filter(s => {
                const search = debouncedSearchQuery.toLowerCase();
                return `${s.prenom} ${s.nom} ${s.email}`.toLowerCase().includes(search);
            });

        const [key, dir] = filters.sort.split('-');
        return [...filtered].sort((a, b) => {
            const valA = a[key as keyof Surveillant] ?? '';
            const valB = b[key as keyof Surveillant] ?? '';
            if (typeof valA === 'string' && typeof valB === 'string') return dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            return dir === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
        });
    }, [surveillants, filters, debouncedSearchQuery]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters, debouncedSearchQuery]);
    
    const totalPages = Math.ceil(filteredAndSortedSurveillants.length / ITEMS_PER_PAGE);
    const paginatedSurveillants = useMemo(() => {
        return filteredAndSortedSurveillants.slice(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE
        );
    }, [filteredAndSortedSurveillants, currentPage]);


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Gestion des Surveillants</h1>
            
            {/* Modal d'import */}
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Import de surveillants</DialogTitle>
                    </DialogHeader>
                    <SurveillantImport onImportComplete={() => {
                        setIsImportOpen(false);
                        refetch();
                    }} />
                </DialogContent>
            </Dialog>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="flex items-center gap-2"><Users /> Base de données des surveillants</CardTitle>
                            <CardDescription>Ajoutez, modifiez et consultez la liste des surveillants.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                             <Button variant="outline" onClick={() => setIsImportOpen(true)}><Upload className="mr-2 h-4 w-4" /> Importer</Button>
                             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                                 <DialogTrigger asChild><Button onClick={() => setSelectedSurveillant(null)}><PlusCircle className="mr-2 h-4 w-4" /> Ajouter</Button></DialogTrigger>
                                 <DialogContent>
                                     <DialogHeader><DialogTitle>{selectedSurveillant ? `Modifier : ${selectedSurveillant.nom.toUpperCase()} ${selectedSurveillant.prenom}` : 'Nouveau surveillant'}</DialogTitle></DialogHeader>
                                     <SurveillantForm surveillant={selectedSurveillant} onSave={handleSave} onCancel={handleCancel} />
                                 </DialogContent>
                             </Dialog>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-4 pt-4 border-t mt-4 dark:border-gray-700">
                        <div className="relative flex-grow min-w-[250px] max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder="Rechercher par nom, prénom, email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Statut:</label>
                            <Select onValueChange={v => setFilters(f => ({...f, active: v}))} defaultValue="all">
                                <SelectTrigger className="w-[130px]"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous</SelectItem>
                                    <SelectItem value="active">Actifs</SelectItem>
                                    <SelectItem value="inactive">Inactifs</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Type:</label>
                            <Select onValueChange={v => setFilters(f => ({...f, type: v}))} defaultValue="all">
                                <SelectTrigger className="w-[150px]"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous</SelectItem>
                                    {Object.entries(SurveillantTypeLabels).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Faculté:</label>
                            <Select onValueChange={v => setFilters(f => ({...f, faculte: v}))} defaultValue="all">
                                <SelectTrigger className="w-[130px]"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Toutes</SelectItem>
                                    {uniqueFaculties.map(fac => <SelectItem key={fac} value={fac}>{fac}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Trier par:</label>
                            <Select onValueChange={v => setFilters(f => ({...f, sort: v}))} defaultValue="nom-asc">
                                <SelectTrigger className="w-[180px]"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="nom-asc">Nom (A-Z)</SelectItem>
                                    <SelectItem value="nom-desc">Nom (Z-A)</SelectItem>
                                    <SelectItem value="prenom-asc">Prénom (A-Z)</SelectItem>
                                    <SelectItem value="prenom-desc">Prénom (Z-A)</SelectItem>
                                    <SelectItem value="quota_surveillances-asc">Quota (Croissant)</SelectItem>
                                    <SelectItem value="quota_surveillances-desc">Quota (Décroissant)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
                    : <div className="border rounded-lg dark:border-gray-700 overflow-x-auto">
                        <table className="w-full table-auto divide-y divide-gray-200 dark:divide-gray-700">
                            <colgroup>
                                <col style={{ width: '22%' }} />
                                <col style={{ width: '22%' }} />
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '8%' }} />
                                <col style={{ width: '8%' }} />
                                <col style={{ width: '6%' }} />
                                <col style={{ width: '6%' }} />
                                <col style={{ width: '6%' }} />
                                <col style={{ width: '12%' }} />
                            </colgroup>
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nom</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Affect. fac.</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Statut</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">EFT T.</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">EFT R.</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Quota</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                {paginatedSurveillants.map(s => <SurveillantRow key={s.id} surveillant={s} onEdit={handleEdit} onDelete={openDeleteConfirmation} />)}
                            </tbody>
                        </table>
                    </div>}
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                         {filteredAndSortedSurveillants.length > 0 ? `Page ${currentPage} sur ${totalPages}` : 'Aucun résultat'} ({filteredAndSortedSurveillants.length} surveillants)
                    </span>
                    {totalPages > 1 && (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                Précédent
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Suivant
                            </Button>
                        </div>
                    )}
                </CardFooter>
            </Card>
            <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-red-500" />Confirmer la suppression</DialogTitle></DialogHeader>
                    <p>Supprimer <strong>{surveillantToDelete?.prenom} {surveillantToDelete?.nom}</strong>? Cette action est irréversible.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmDeleteOpen(false)}>Annuler</Button>
                        <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Supprimer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SurveillantsPage;