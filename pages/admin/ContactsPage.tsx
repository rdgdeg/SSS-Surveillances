import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Phone, Mail, User, Download, Copy, Check, Edit2, Save, X } from 'lucide-react';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { supabase } from '../../lib/supabaseClient';
import { Surveillant, SurveillantType, SurveillantTypeLabels } from '../../types';
import toast from 'react-hot-toast';

// Type étendu pour inclure les suggestions
interface SurveillantWithSuggestion extends Surveillant {
    suggestedPhone?: string | null;
}

// Dictionnaire des téléphones connus
const TELEPHONES_CONNUS: Record<string, string> = {
    'ASSOIGNON_THEO': '+32 471 84 70 75',
    'ATIK_HICHAM': '0479 02 15 45',
    'AUQUIERE_MARIE': '0491 07 43 31',
    'BARBE_ALICE': '0470 32 82 17',
    'BECKERS_PAULINE': '0474 08 91 40',
    'BRACONNIER_PAULINE': '0470 34 86 93',
    'CAPIAU_MADELEINE': '0497 79 28 66',
    'CHARLIER_MATHILDE': '0496 77 57 30',
    'CHOME_CELINE': '0491 88 15 21',
    'CHOTEAU_MATHILDE': '0473 12 07 27',
    'CHRETIEN_ANTOINE': '+33 6 27 15 87 17',
    'COLAK_RAMAZAN': '0483 54 90 96',
    'COMEIN_AUDREY': '0497 41 26 0',
    'DELOOF_MARINE': '0498 50 69 12',
    'DEMONTIGNY_MANON': '0478 48 23 84',
    'DECHENNE_JUHANS': '0472 08 31 10',
    'DECLERCK_LOUISE': '0476 48 03 14',
    'DEVIS_JULIE': '0476 48 21 23',
    'DJURKIN_ANDREJ': '0472 43 42 45',
    'EVRARD_PERRINE': '0497 23 91 75',
    'FUCHS_VICTORIA': '+33 6 81 47 52 21',
    'GHODSI_MARINE': '0472 49 14 58',
    'HAJJHASSAN_YARA': '0493 02 76 21',
    'IORDANESCU_ANDRA': '0474 34 92 38',
    'LAGHOUATI_ADAM': '+33 6 48 14 24 11',
    'LAMOTTE_ALVY': '0479 86 77 13',
    'MARCIANO_FLORIAN': '0494 37 92 09',
    'PIERRE_ELISA': '+32 499 26 49 94',
    'RUIZ_LUCIE': '+33 6 22 00 49 47',
    'SCHROEDERCHAIDRON_LENA': '0499 11 55 07',
    'TONDEUR_VINCIANE': '0485 75 79 64',
    'VANDEVELDE_JUSTINE': '0476 78 88 39',
    'VANVARENBERG_KEVIN': '0478 48 71 20',
    'VERGAUWEN_MARTIAL': '0471 46 18 91',
    'WANGERMEZ_CAMILLE': '0472 75 37 73'
};

// Fonction pour nettoyer et normaliser les noms
const cleanName = (text: string): string => {
    return text
        .toUpperCase()
        .replace(/[ÉÈÊË]/g, 'E')
        .replace(/[ÀÁÂÃ]/g, 'A')
        .replace(/[ÔÖÕ]/g, 'O')
        .replace(/[ÇC]/g, 'C')
        .replace(/[^A-Z]/g, '');
};

// Fonction pour trouver un téléphone suggéré
const getSuggestedPhone = (nom: string, prenom: string): string | null => {
    const cleanedNom = cleanName(nom);
    const cleanedPrenom = cleanName(prenom);
    const key = `${cleanedNom}_${cleanedPrenom}`;
    return TELEPHONES_CONNUS[key] || null;
};

const ContactsPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<SurveillantType | 'all'>('all');
    const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
    const [editingPhone, setEditingPhone] = useState<string | null>(null);
    const [editPhoneValue, setEditPhoneValue] = useState('');
    
    const queryClient = useQueryClient();

    // Récupérer tous les surveillants actifs avec leurs téléphones depuis les soumissions
    const { data: surveillants = [], isLoading, error } = useQuery<SurveillantWithSuggestion[]>({
        queryKey: ['surveillants-contacts'],
        queryFn: async () => {
            // D'abord récupérer les surveillants
            const { data: surveillantsData, error: surveillantsError } = await supabase
                .from('surveillants')
                .select('id, email, nom, prenom, type, telephone, affectation_faculte, affectation_institut')
                .eq('is_active', true)
                .order('nom', { ascending: true });

            if (surveillantsError) throw surveillantsError;

            // Ensuite récupérer les téléphones depuis les soumissions pour compléter
            const { data: soumissionsData, error: soumissionsError } = await supabase
                .from('soumissions_disponibilites')
                .select('email, telephone, submitted_at')
                .not('telephone', 'is', null)
                .neq('telephone', '')
                .order('submitted_at', { ascending: false });

            if (soumissionsError) throw soumissionsError;

            // Créer un map des téléphones les plus récents par email
            const telephoneMap = new Map<string, string>();
            soumissionsData?.forEach(soumission => {
                if (!telephoneMap.has(soumission.email) && soumission.telephone) {
                    telephoneMap.set(soumission.email, soumission.telephone);
                }
            });

            // Enrichir les surveillants avec les téléphones des soumissions et suggestions
            const enrichedSurveillants = surveillantsData?.map(surveillant => {
                const telephoneFromSubmission = telephoneMap.get(surveillant.email);
                const suggestedPhone = getSuggestedPhone(surveillant.nom, surveillant.prenom);
                
                return {
                    ...surveillant,
                    telephone: surveillant.telephone || telephoneFromSubmission || null,
                    suggestedPhone: !surveillant.telephone && !telephoneFromSubmission ? suggestedPhone : null
                };
            });

            return enrichedSurveillants as SurveillantWithSuggestion[];
        }
    });

    // Filtrer les surveillants selon les critères de recherche
    const filteredSurveillants = useMemo(() => {
        return surveillants.filter(surveillant => {
            const matchesSearch = searchTerm === '' || 
                surveillant.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                surveillant.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                surveillant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (surveillant.telephone && surveillant.telephone.includes(searchTerm));

            const matchesType = typeFilter === 'all' || surveillant.type === typeFilter;

            return matchesSearch && matchesType;
        });
    }, [surveillants, searchTerm, typeFilter]);

    // Copier l'email dans le presse-papiers
    const copyEmail = async (email: string) => {
        try {
            await navigator.clipboard.writeText(email);
            setCopiedEmail(email);
            toast.success('Email copié dans le presse-papiers');
            setTimeout(() => setCopiedEmail(null), 2000);
        } catch (error) {
            toast.error('Erreur lors de la copie');
        }
    };

    // Copier le téléphone dans le presse-papiers
    const copyPhone = async (phone: string) => {
        try {
            await navigator.clipboard.writeText(phone);
            toast.success('Téléphone copié dans le presse-papiers');
        } catch (error) {
            toast.error('Erreur lors de la copie');
        }
    };

    // Exporter les contacts en CSV
    const exportContacts = () => {
        const csvContent = [
            ['Nom', 'Prénom', 'Email', 'Téléphone', 'Type', 'Faculté', 'Institut'].join(','),
            ...filteredSurveillants.map(s => [
                s.nom,
                s.prenom,
                s.email,
                s.telephone || '',
                SurveillantTypeLabels[s.type],
                s.affectation_faculte || '',
                s.affectation_institut || ''
            ].map(field => `"${field}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `contacts-surveillants-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`${filteredSurveillants.length} contacts exportés`);
    };

    // Mutation pour mettre à jour le téléphone
    const updatePhoneMutation = useMutation({
        mutationFn: async ({ surveillantId, telephone }: { surveillantId: string; telephone: string }) => {
            const { error } = await supabase
                .from('surveillants')
                .update({ telephone: telephone.trim() || null })
                .eq('id', surveillantId);
            
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['surveillants-contacts'] });
            toast.success('Téléphone mis à jour');
            setEditingPhone(null);
            setEditPhoneValue('');
        },
        onError: (error) => {
            toast.error('Erreur lors de la mise à jour');
            console.error('Erreur mise à jour téléphone:', error);
        }
    });

    // Commencer l'édition d'un téléphone
    const startEditPhone = (surveillantId: string, currentPhone: string | null) => {
        setEditingPhone(surveillantId);
        setEditPhoneValue(currentPhone || '');
    };

    // Annuler l'édition
    const cancelEditPhone = () => {
        setEditingPhone(null);
        setEditPhoneValue('');
    };

    // Sauvegarder le téléphone
    const savePhone = (surveillantId: string) => {
        updatePhoneMutation.mutate({ surveillantId, telephone: editPhoneValue });
    };

    // Utiliser le téléphone suggéré
    const useSuggestedPhone = (surveillantId: string, suggestedPhone: string) => {
        updatePhoneMutation.mutate({ surveillantId, telephone: suggestedPhone });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600 dark:text-red-400">
                    Erreur lors du chargement des contacts
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Contacts Surveillants
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {filteredSurveillants.length} contact{filteredSurveillants.length > 1 ? 's' : ''} trouvé{filteredSurveillants.length > 1 ? 's' : ''}
                    </p>
                </div>
                
                <Button
                    onClick={exportContacts}
                    disabled={filteredSurveillants.length === 0}
                    className="flex items-center gap-2"
                >
                    <Download className="h-4 w-4" />
                    Exporter CSV
                </Button>
            </div>

            {/* Filtres */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Rechercher par nom, prénom, email ou téléphone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    
                    <div className="sm:w-48">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as SurveillantType | 'all')}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="all">Tous les types</option>
                            {Object.entries(SurveillantTypeLabels).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Liste des contacts */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 overflow-hidden">
                {filteredSurveillants.length === 0 ? (
                    <div className="text-center py-12">
                        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">
                            Aucun contact trouvé
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Nom & Prénom
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Téléphone
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Affectation
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                {filteredSurveillants.map((surveillant) => (
                                    <tr key={surveillant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                                                    <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {surveillant.nom} {surveillant.prenom}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm text-gray-900 dark:text-white">
                                                    {surveillant.email}
                                                </span>
                                                <button
                                                    onClick={() => copyEmail(surveillant.email)}
                                                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                                    title="Copier l'email"
                                                >
                                                    {copiedEmail === surveillant.email ? (
                                                        <Check className="h-3 w-3 text-green-500" />
                                                    ) : (
                                                        <Copy className="h-3 w-3" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {editingPhone === surveillant.id ? (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-gray-400" />
                                                    <Input
                                                        type="text"
                                                        value={editPhoneValue}
                                                        onChange={(e) => setEditPhoneValue(e.target.value)}
                                                        placeholder="Numéro de téléphone"
                                                        className="w-40 text-sm"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                savePhone(surveillant.id);
                                                            } else if (e.key === 'Escape') {
                                                                cancelEditPhone();
                                                            }
                                                        }}
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => savePhone(surveillant.id)}
                                                        disabled={updatePhoneMutation.isPending}
                                                        className="p-1 text-green-600 hover:text-green-700 transition-colors"
                                                        title="Sauvegarder"
                                                    >
                                                        <Save className="h-3 w-3" />
                                                    </button>
                                                    <button
                                                        onClick={cancelEditPhone}
                                                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                                        title="Annuler"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-gray-400" />
                                                    {surveillant.telephone ? (
                                                        <>
                                                            <span className="text-sm text-gray-900 dark:text-white">
                                                                {surveillant.telephone}
                                                            </span>
                                                            <button
                                                                onClick={() => copyPhone(surveillant.telephone!)}
                                                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                                                title="Copier le téléphone"
                                                            >
                                                                <Copy className="h-3 w-3" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-sm text-gray-400 dark:text-gray-500">
                                                                Non renseigné
                                                            </span>
                                                            {surveillant.suggestedPhone && (
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-xs text-blue-600 dark:text-blue-400">
                                                                        Suggéré: {surveillant.suggestedPhone}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => useSuggestedPhone(surveillant.id, surveillant.suggestedPhone!)}
                                                                        className="text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded transition-colors"
                                                                        title="Utiliser ce numéro"
                                                                    >
                                                                        Utiliser
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => startEditPhone(surveillant.id, surveillant.telephone || surveillant.suggestedPhone)}
                                                        className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                        title="Modifier le téléphone"
                                                    >
                                                        <Edit2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                {SurveillantTypeLabels[surveillant.type]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            <div>
                                                {surveillant.affectation_faculte && (
                                                    <div className="font-medium">
                                                        {surveillant.affectation_faculte}
                                                    </div>
                                                )}
                                                {surveillant.affectation_institut && (
                                                    <div className="text-gray-500 dark:text-gray-400">
                                                        {surveillant.affectation_institut}
                                                    </div>
                                                )}
                                                {!surveillant.affectation_faculte && !surveillant.affectation_institut && (
                                                    <span className="text-gray-400 dark:text-gray-500">
                                                        Non renseigné
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactsPage;