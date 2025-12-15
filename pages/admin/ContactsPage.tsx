import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Phone, Mail, User, Download, Copy, Check } from 'lucide-react';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { supabase } from '../../lib/supabaseClient';
import { Surveillant, SurveillantType, SurveillantTypeLabels } from '../../types';
import toast from 'react-hot-toast';

const ContactsPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<SurveillantType | 'all'>('all');
    const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

    // Récupérer tous les surveillants actifs
    const { data: surveillants = [], isLoading, error } = useQuery({
        queryKey: ['surveillants-contacts'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('surveillants')
                .select('id, email, nom, prenom, type, telephone, affectation_faculte, affectation_institut')
                .eq('is_active', true)
                .order('nom', { ascending: true });

            if (error) throw error;
            return data as Surveillant[];
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
                                            {surveillant.telephone ? (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-gray-400" />
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
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400 dark:text-gray-500">
                                                    Non renseigné
                                                </span>
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