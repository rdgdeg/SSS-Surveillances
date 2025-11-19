import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '../../components/shared/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/shared/Select';
import { Users, PlusCircle, Edit, Trash2, Search, Loader2, Upload, AlertTriangle } from 'lucide-react';
import { getSurveillants, createSurveillant, updateSurveillant, deleteSurveillant, getSurveillantAttributions } from '../../lib/api';
import { Surveillant, SurveillantType, SurveillantTypeLabels } from '../../types';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';
import { Switch } from '../../components/shared/Switch';
import { Badge } from '../../components/shared/Badge';
import { useDataFetching } from '../../hooks/useDataFetching';
import SurveillantImport from '../../components/admin/SurveillantImport';
import { ExportButton } from '../../components/shared/ExportButton';
import { exportSurveillants } from '../../lib/exportData';

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

const SurveillantRow = memo<{ 
    surveillant: Surveillant; 
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    onEdit: (s: Surveillant) => void; 
    onDelete: (s: Surveillant) => void;
    onToggleDispense: (s: Surveillant) => void;
    nbAttributions: number;
}>(({ surveillant, isSelected, onToggleSelect, onEdit, onDelete, onToggleDispense, nbAttributions }) => {
    const quotaRemaining = (surveillant.quota_surveillances || 0) - nbAttributions;
    const isOverQuota = quotaRemaining < 0;
    const isNearQuota = quotaRemaining >= 0 && quotaRemaining <= 1;
    
    return (
    <tr className={`transition-all duration-150 hover:bg-indigo-50/50 dark:hover:bg-gray-800/50 ${!surveillant.is_active ? 'opacity-50' : ''} ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-200 dark:ring-indigo-800' : ''}`}>
        <td className="px-3 py-2 whitespace-nowrap">
            <input 
                type="checkbox" 
                checked={isSelected}
                onChange={() => onToggleSelect(surveillant.id)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
            />
        </td>
        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-gray-100">
            {surveillant.nom.toUpperCase()} {surveillant.prenom}
        </td>
        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
            {surveillant.email}
        </td>
        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">
            {surveillant.telephone || '-'}
        </td>
        <td className="px-3 py-2 whitespace-nowrap text-xs">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                {SurveillantTypeLabels[surveillant.type]}
            </span>
        </td>
        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">
            {surveillant.affectation_faculte || '-'}
        </td>
        <td className="px-3 py-2 whitespace-nowrap text-xs">
            <Badge variant={surveillant.is_active ? 'success' : 'default'} className="text-xs py-0">
                {surveillant.is_active ? 'Actif' : 'Inactif'}
            </Badge>
        </td>
        <td className="px-3 py-2 whitespace-nowrap text-xs text-center font-mono text-gray-700 dark:text-gray-300">
            {surveillant.etp_total ?? '-'}
        </td>
        <td className="px-3 py-2 whitespace-nowrap text-xs text-center font-mono text-gray-700 dark:text-gray-300">
            {surveillant.etp_recherche ?? '-'}
        </td>
        <td className="px-3 py-2 whitespace-nowrap text-xs text-center font-semibold text-indigo-600 dark:text-indigo-400">
            {surveillant.quota_surveillances ?? 0}
        </td>
        <td className="px-3 py-2 whitespace-nowrap text-xs text-center">
            <div className="flex flex-col items-center gap-0.5">
                <span className={`font-semibold ${isOverQuota ? 'text-red-600 dark:text-red-400' : isNearQuota ? 'text-amber-600 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {nbAttributions}
                </span>
                <span className={`text-[10px] ${isOverQuota ? 'text-red-500' : isNearQuota ? 'text-amber-500' : 'text-gray-500'}`}>
                    {isOverQuota ? `+${Math.abs(quotaRemaining)}` : `reste ${quotaRemaining}`}
                </span>
            </div>
        </td>
        <td className="px-3 py-2 whitespace-nowrap text-center">
            <div className="flex justify-center">
                <Switch 
                    checked={!!surveillant.dispense_surveillance} 
                    onCheckedChange={() => onToggleDispense(surveillant)}
                />
            </div>
        </td>
        <td className="px-3 py-2 whitespace-nowrap text-right">
            <div className="flex items-center justify-end gap-1.5">
                <Button variant="ghost" size="sm" onClick={() => onEdit(surveillant)} className="h-8 px-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                    <Edit className="h-4 w-4 mr-1" />
                    <span className="text-xs">Modifier</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(surveillant)} className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 className="h-4 w-4 mr-1" />
                    <span className="text-xs">Supprimer</span>
                </Button>
            </div>
        </td>
    </tr>
)});


const SurveillantsPage: React.FC = () => {
    const { data: surveillants, isLoading, refetch } = useDataFetching(getSurveillants, []);
    const [attributions, setAttributions] = useState<Map<string, number>>(new Map());
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [isConfirmBulkDeleteOpen, setIsConfirmBulkDeleteOpen] = useState(false);
    const [selectedSurveillant, setSelectedSurveillant] = useState<Surveillant | null>(null);
    const [surveillantToDelete, setSurveillantToDelete] = useState<Surveillant | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [filters, setFilters] = useState({ type: 'all', active: 'all', faculte: 'all', sort: 'nom-asc' });
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [currentPage, setCurrentPage] = useState(1);
    const [updatingDispenseIds, setUpdatingDispenseIds] = useState<Set<string>>(new Set());
    const ITEMS_PER_PAGE = 25;

    // Charger les attributions de surveillances
    useEffect(() => {
        const loadAttributions = async () => {
            try {
                const data = await getSurveillantAttributions();
                setAttributions(data);
            } catch (error) {
                console.error('Erreur lors du chargement des attributions:', error);
            }
        };
        loadAttributions();
    }, []);

    
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

    const toggleSelectOne = useCallback((id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        
        try {
            let deleted = 0;
            let failed = 0;
            
            for (const id of selectedIds) {
                try {
                    await deleteSurveillant(id);
                    deleted++;
                } catch (error) {
                    failed++;
                    console.error('Erreur suppression:', id, error);
                }
            }
            
            if (deleted > 0) {
                toast.success(`${deleted} surveillant(s) supprimé(s)${failed > 0 ? `, ${failed} échec(s)` : ''}`);
            } else {
                toast.error("Aucun surveillant n'a pu être supprimé.");
            }
            
            setSelectedIds(new Set());
            refetch();
        } catch (error) {
            toast.error("Erreur lors de la suppression en bloc.");
        } finally {
            setIsConfirmBulkDeleteOpen(false);
        }
    };

    const handleToggleDispense = async (surveillant: Surveillant) => {
        try {
            setUpdatingDispenseIds(prev => new Set(prev).add(surveillant.id));
            const newDispenseStatus = !surveillant.dispense_surveillance;
            
            await updateSurveillant(surveillant.id, {
                dispense_surveillance: newDispenseStatus
            });

            toast.success(
                newDispenseStatus 
                    ? `${surveillant.prenom} ${surveillant.nom} est dispensé(e)`
                    : `${surveillant.prenom} ${surveillant.nom} n'est plus dispensé(e)`
            );
            
            refetch();
        } catch (error) {
            console.error('Error updating dispense status:', error);
            toast.error('Erreur lors de la mise à jour');
        } finally {
            setUpdatingDispenseIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(surveillant.id);
                return newSet;
            });
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

    const toggleSelectAll = useCallback(() => {
        if (selectedIds.size === paginatedSurveillants.length && paginatedSurveillants.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(paginatedSurveillants.map(s => s.id)));
        }
    }, [selectedIds.size, paginatedSurveillants]);

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
                <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Users className="h-5 w-5" /> 
                                Base de données des surveillants
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                                Ajoutez, modifiez et consultez la liste des surveillants.
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                             {selectedIds.size > 0 && (
                                 <Button 
                                     variant="outline" 
                                     onClick={() => setIsConfirmBulkDeleteOpen(true)}
                                     size="sm"
                                     className="h-9 text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20"
                                 >
                                     <Trash2 className="mr-1.5 h-3.5 w-3.5" /> 
                                     Supprimer ({selectedIds.size})
                                 </Button>
                             )}
                             <Button variant="outline" onClick={() => setIsImportOpen(true)} size="sm" className="h-9">
                                 <Upload className="mr-1.5 h-3.5 w-3.5" /> Importer
                             </Button>
                             <ExportButton
                                 data={(surveillants || []).map(s => ({
                                     'Email': s.email,
                                     'Nom': s.nom,
                                     'Prénom': s.prenom,
                                     'Type': s.type,
                                     'Faculté': s.affectation_faculte || '',
                                     'Institut': s.affectation_institut || '',
                                     'Statut salarial': s.statut_salarial || '',
                                     'ETP Total': s.etp_total || '',
                                     'ETP Recherche': s.etp_recherche || '',
                                     'Téléphone': s.telephone || '',
                                     'Quota': s.quota_surveillances || '',
                                     'Actif': s.is_active ? 'Oui' : 'Non',
                                     'Dispensé': s.dispense_surveillance ? 'Oui' : 'Non',
                                 }))}
                                 filename="surveillants"
                                 sheetName="Surveillants"
                                 size="sm"
                                 label="Exporter"
                             />
                             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                                 <DialogTrigger asChild>
                                     <Button onClick={() => setSelectedSurveillant(null)} size="sm" className="h-9">
                                         <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Ajouter
                                     </Button>
                                 </DialogTrigger>
                                 <DialogContent>
                                     <DialogHeader><DialogTitle>{selectedSurveillant ? `Modifier : ${selectedSurveillant.nom.toUpperCase()} ${selectedSurveillant.prenom}` : 'Nouveau surveillant'}</DialogTitle></DialogHeader>
                                     <SurveillantForm surveillant={selectedSurveillant} onSave={handleSave} onCancel={handleCancel} />
                                 </DialogContent>
                             </Dialog>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pt-4 border-t mt-4 dark:border-gray-700">
                        <div className="relative flex-grow min-w-[250px] max-w-sm">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input 
                                placeholder="Rechercher par nom, prénom, email..." 
                                value={searchQuery} 
                                onChange={e => setSearchQuery(e.target.value)} 
                                className="pl-8 h-9 text-xs"
                            />
                        </div>

                        <div className="flex items-center gap-1.5">
                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Statut:</label>
                            <Select onValueChange={v => setFilters(f => ({...f, active: v}))} defaultValue="all">
                                <SelectTrigger className="w-[110px] h-9 text-xs"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous</SelectItem>
                                    <SelectItem value="active">Actifs</SelectItem>
                                    <SelectItem value="inactive">Inactifs</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Type:</label>
                            <Select onValueChange={v => setFilters(f => ({...f, type: v}))} defaultValue="all">
                                <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous</SelectItem>
                                    {Object.entries(SurveillantTypeLabels).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Faculté:</label>
                            <Select onValueChange={v => setFilters(f => ({...f, faculte: v}))} defaultValue="all">
                                <SelectTrigger className="w-[110px] h-9 text-xs"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Toutes</SelectItem>
                                    {uniqueFaculties.map(fac => <SelectItem key={fac} value={fac}>{fac}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-1.5 ml-auto">
                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Trier:</label>
                            <Select onValueChange={v => setFilters(f => ({...f, sort: v}))} defaultValue="nom-asc">
                                <SelectTrigger className="w-[160px] h-9 text-xs"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="nom-asc">Nom (A-Z)</SelectItem>
                                    <SelectItem value="nom-desc">Nom (Z-A)</SelectItem>
                                    <SelectItem value="prenom-asc">Prénom (A-Z)</SelectItem>
                                    <SelectItem value="prenom-desc">Prénom (Z-A)</SelectItem>
                                    <SelectItem value="quota_surveillances-asc">Quota ↑</SelectItem>
                                    <SelectItem value="quota_surveillances-desc">Quota ↓</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
                    : <div className="border rounded-lg dark:border-gray-700 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto max-h-[calc(100vh-280px)]">
                            <table className="w-full table-auto">
                            <colgroup>
                                <col style={{ width: '3%' }} />
                                <col style={{ width: '15%' }} />
                                <col style={{ width: '17%' }} />
                                <col style={{ width: '8%' }} />
                                <col style={{ width: '7%' }} />
                                <col style={{ width: '6%' }} />
                                <col style={{ width: '5%' }} />
                                <col style={{ width: '5%' }} />
                                <col style={{ width: '5%' }} />
                                <col style={{ width: '5%' }} />
                                <col style={{ width: '6%' }} />
                                <col style={{ width: '5%' }} />
                                <col style={{ width: '13%' }} />
                            </colgroup>
                            <thead className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10">
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-3 py-2.5 text-left">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.size === paginatedSurveillants.length && paginatedSurveillants.length > 0}
                                            onChange={toggleSelectAll}
                                            className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Nom</th>
                                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Email</th>
                                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Téléphone</th>
                                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Faculté</th>
                                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Statut</th>
                                    <th className="px-3 py-2.5 text-center text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">EFT T.</th>
                                    <th className="px-3 py-2.5 text-center text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">EFT R.</th>
                                    <th className="px-3 py-2.5 text-center text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Quota</th>
                                    <th className="px-3 py-2.5 text-center text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Attrib.</th>
                                    <th className="px-3 py-2.5 text-center text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Dispense</th>
                                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                {paginatedSurveillants.map(s => (
                                    <SurveillantRow 
                                        key={s.id} 
                                        surveillant={s} 
                                        isSelected={selectedIds.has(s.id)}
                                        onToggleSelect={toggleSelectOne}
                                        onEdit={handleEdit} 
                                        onDelete={openDeleteConfirmation}
                                        onToggleDispense={handleToggleDispense}
                                        nbAttributions={attributions.get(s.id) || 0}
                                    />
                                ))}
                            </tbody>
                        </table>
                        </div>
                    </div>}
                </CardContent>
                <CardFooter className="flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50 py-3">
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                            {filteredAndSortedSurveillants.length > 0 ? (
                                <>
                                    <span className="text-gray-900 dark:text-gray-100">{filteredAndSortedSurveillants.length}</span> surveillant{filteredAndSortedSurveillants.length > 1 ? 's' : ''}
                                    {totalPages > 1 && <span className="ml-2">• Page {currentPage}/{totalPages}</span>}
                                </>
                            ) : 'Aucun résultat'}
                        </span>
                        {selectedIds.size > 0 && (
                            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                {selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    {totalPages > 1 && (
                        <div className="flex gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-8 px-3 text-xs"
                            >
                                Précédent
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="h-8 px-3 text-xs"
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

            <Dialog open={isConfirmBulkDeleteOpen} onOpenChange={setIsConfirmBulkDeleteOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-red-500" />Confirmer la suppression en bloc</DialogTitle></DialogHeader>
                    <p>Vous êtes sur le point de supprimer <strong>{selectedIds.size} surveillant(s)</strong>. Cette action est irréversible.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmBulkDeleteOpen(false)}>Annuler</Button>
                        <Button onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">Supprimer tout</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SurveillantsPage;