import React, { useState, useEffect } from 'react';
import { Edit3, Eye, CheckCircle, XCircle, Clock, MessageSquare, RefreshCw, Search, Filter } from 'lucide-react';
import { Button } from '../../components/shared/Button';
import { supabase } from '../../lib/supabaseClient';

interface DemandeModification {
    id: string;
    nom_examen: string;
    date_examen: string;
    heure_examen: string;
    type_demande: 'modification' | 'permutation' | 'message';
    surveillant_remplacant?: string;
    surveillance_reprise_date?: string;
    surveillance_reprise_heure?: string;
    description: string;
    nom_demandeur: string;
    email_demandeur?: string;
    telephone_demandeur?: string;
    statut: 'en_attente' | 'en_cours' | 'traitee' | 'refusee';
    reponse_admin?: string;
    created_at: string;
    updated_at: string;
    traite_at?: string;
}

const DemandesModificationPage: React.FC = () => {
    const [demandes, setDemandes] = useState<DemandeModification[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDemande, setSelectedDemande] = useState<DemandeModification | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [reponseAdmin, setReponseAdmin] = useState('');
    const [nouveauStatut, setNouveauStatut] = useState<'en_attente' | 'en_cours' | 'traitee' | 'refusee'>('en_attente');
    const [isUpdating, setIsUpdating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        loadDemandes();
    }, []);

    const loadDemandes = async () => {
        try {
            const { data, error } = await supabase
                .from('demandes_modification')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            setDemandes(data || []);
        } catch (error) {
            console.error('Erreur lors du chargement des demandes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDemande = (demande: DemandeModification) => {
        setSelectedDemande(demande);
        setReponseAdmin(demande.reponse_admin || '');
        setNouveauStatut(demande.statut);
        setIsModalOpen(true);
    };

    const handleUpdateDemande = async () => {
        if (!selectedDemande) return;

        setIsUpdating(true);
        try {
            const updateData: any = {
                statut: nouveauStatut,
                reponse_admin: reponseAdmin || null,
                updated_at: new Date().toISOString()
            };

            if (nouveauStatut === 'traitee' || nouveauStatut === 'refusee') {
                updateData.traite_at = new Date().toISOString();
            }

            const { error } = await supabase
                .from('demandes_modification')
                .update(updateData)
                .eq('id', selectedDemande.id);

            if (error) {
                throw error;
            }

            // Recharger les demandes
            await loadDemandes();
            setIsModalOpen(false);
            setSelectedDemande(null);
        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusBadge = (statut: string) => {
        const badges = {
            en_attente: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300', icon: Clock, text: 'En attente' },
            en_cours: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300', icon: RefreshCw, text: 'En cours' },
            traitee: { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300', icon: CheckCircle, text: 'Traitée' },
            refusee: { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300', icon: XCircle, text: 'Refusée' }
        };
        
        const badge = badges[statut as keyof typeof badges];
        const Icon = badge.icon;
        
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {badge.text}
            </span>
        );
    };

    const getTypeBadge = (type: string) => {
        const badges = {
            modification: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300', text: 'Modification' },
            permutation: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300', text: 'Permutation' },
            message: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300', text: 'Message' }
        };
        
        const badge = badges[type as keyof typeof badges];
        
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                {badge.text}
            </span>
        );
    };

    const filteredDemandes = demandes.filter(demande => {
        const matchesSearch = searchTerm === '' || 
            demande.nom_examen.toLowerCase().includes(searchTerm.toLowerCase()) ||
            demande.nom_demandeur.toLowerCase().includes(searchTerm.toLowerCase()) ||
            demande.description.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || demande.statut === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Demandes de modification
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Gérez les demandes de modification des surveillances
                    </p>
                </div>
                <Button onClick={loadDemandes} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Actualiser
                </Button>
            </div>

            {/* Filtres */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Rechercher par examen, demandeur ou description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                            />
                        </div>
                    </div>
                    <div className="sm:w-48">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                        >
                            <option value="all">Tous les statuts</option>
                            <option value="en_attente">En attente</option>
                            <option value="en_cours">En cours</option>
                            <option value="traitee">Traitée</option>
                            <option value="refusee">Refusée</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Liste des demandes */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                {filteredDemandes.length === 0 ? (
                    <div className="text-center py-12">
                        <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                            Aucune demande trouvée
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {searchTerm || statusFilter !== 'all' 
                                ? 'Aucune demande ne correspond aux critères de recherche.'
                                : 'Aucune demande de modification n\'a été soumise pour le moment.'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Demandeur
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Examen
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Date de création
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredDemandes.map((demande) => (
                                    <tr key={demande.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {demande.nom_demandeur}
                                                </div>
                                                {demande.email_demandeur && (
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {demande.email_demandeur}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {demande.nom_examen}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(demande.date_examen).toLocaleDateString('fr-FR')} à {demande.heure_examen}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getTypeBadge(demande.type_demande)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(demande.statut)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(demande.created_at).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Button
                                                onClick={() => handleViewDemande(demande)}
                                                variant="outline"
                                                size="sm"
                                            >
                                                <Eye className="mr-1 h-4 w-4" />
                                                Voir
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de détail */}
            {isModalOpen && selectedDemande && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                Détail de la demande
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Informations générales */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                                        Informations sur l'examen
                                    </h3>
                                    <div className="space-y-2">
                                        <p><span className="font-medium">Examen:</span> {selectedDemande.nom_examen}</p>
                                        <p><span className="font-medium">Date:</span> {new Date(selectedDemande.date_examen).toLocaleDateString('fr-FR')}</p>
                                        <p><span className="font-medium">Heure:</span> {selectedDemande.heure_examen}</p>
                                        <p><span className="font-medium">Type:</span> {getTypeBadge(selectedDemande.type_demande)}</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                                        Informations du demandeur
                                    </h3>
                                    <div className="space-y-2">
                                        <p><span className="font-medium">Nom:</span> {selectedDemande.nom_demandeur}</p>
                                        {selectedDemande.email_demandeur && (
                                            <p><span className="font-medium">Email:</span> {selectedDemande.email_demandeur}</p>
                                        )}
                                        {selectedDemande.telephone_demandeur && (
                                            <p><span className="font-medium">Téléphone:</span> {selectedDemande.telephone_demandeur}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Informations spécifiques aux permutations */}
                            {selectedDemande.type_demande === 'permutation' && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                    <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-4">
                                        Détails de la permutation
                                    </h3>
                                    <div className="space-y-2">
                                        <p><span className="font-medium">Surveillant remplaçant:</span> {selectedDemande.surveillant_remplacant}</p>
                                        {selectedDemande.surveillance_reprise_date && (
                                            <p><span className="font-medium">Surveillance reprise le:</span> {new Date(selectedDemande.surveillance_reprise_date).toLocaleDateString('fr-FR')} à {selectedDemande.surveillance_reprise_heure}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                    Description de la demande
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                    {selectedDemande.description}
                                </p>
                            </div>

                            {/* Gestion de la demande */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                                    Traitement de la demande
                                </h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Statut
                                        </label>
                                        <select
                                            value={nouveauStatut}
                                            onChange={(e) => setNouveauStatut(e.target.value as any)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                                        >
                                            <option value="en_attente">En attente</option>
                                            <option value="en_cours">En cours</option>
                                            <option value="traitee">Traitée</option>
                                            <option value="refusee">Refusée</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Réponse de l'administration
                                        </label>
                                        <textarea
                                            value={reponseAdmin}
                                            onChange={(e) => setReponseAdmin(e.target.value)}
                                            rows={4}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                                            placeholder="Réponse à envoyer au demandeur..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Informations de suivi */}
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Informations de suivi</h4>
                                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    <p>Créée le: {new Date(selectedDemande.created_at).toLocaleString('fr-FR')}</p>
                                    <p>Dernière modification: {new Date(selectedDemande.updated_at).toLocaleString('fr-FR')}</p>
                                    {selectedDemande.traite_at && (
                                        <p>Traitée le: {new Date(selectedDemande.traite_at).toLocaleString('fr-FR')}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                            <Button
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                                disabled={isUpdating}
                            >
                                Annuler
                            </Button>
                            <Button
                                onClick={handleUpdateDemande}
                                disabled={isUpdating}
                                className="bg-indigo-600 hover:bg-indigo-700"
                            >
                                {isUpdating ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Mise à jour...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Mettre à jour
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DemandesModificationPage;