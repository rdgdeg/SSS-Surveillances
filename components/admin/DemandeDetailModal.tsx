import React, { useState } from 'react';
import { X, Edit3, Eye, CheckCircle, XCircle, Clock, RefreshCw, Mail, MailOpen, Calendar, User, MessageSquare, Phone } from 'lucide-react';
import { Button } from '../shared/Button';
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
    lu: boolean;
    created_at: string;
    updated_at: string;
    traite_at?: string;
}

interface DemandeDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    demande: DemandeModification | null;
    onUpdate?: () => void;
}

const DemandeDetailModal: React.FC<DemandeDetailModalProps> = ({ 
    isOpen, 
    onClose, 
    demande,
    onUpdate 
}) => {
    const [reponseAdmin, setReponseAdmin] = useState('');
    const [nouveauStatut, setNouveauStatut] = useState<'en_attente' | 'en_cours' | 'traitee' | 'refusee'>('en_attente');
    const [isUpdating, setIsUpdating] = useState(false);

    React.useEffect(() => {
        if (demande) {
            setReponseAdmin(demande.reponse_admin || '');
            setNouveauStatut(demande.statut);
            
            // Marquer comme lu automatiquement
            if (!demande.lu) {
                handleMarkAsRead();
            }
        }
    }, [demande]);

    const handleMarkAsRead = async () => {
        if (!demande) return;
        
        try {
            const { error } = await supabase
                .from('demandes_modification')
                .update({ lu: true, updated_at: new Date().toISOString() })
                .eq('id', demande.id);

            if (error) throw error;
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Erreur lors du marquage comme lu:', error);
        }
    };

    const handleUpdateDemande = async () => {
        if (!demande) return;

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
                .eq('id', demande.id);

            if (error) throw error;

            if (onUpdate) onUpdate();
            onClose();
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

    if (!isOpen || !demande) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            Détail de la demande
                        </h2>
                        {!demande.lu && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                                <MailOpen className="w-3 h-3 mr-1" />
                                Nouveau
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Informations générales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-indigo-600" />
                                Informations sur l'examen
                            </h3>
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2">
                                <p><span className="font-medium">Examen:</span> {demande.nom_examen}</p>
                                <p><span className="font-medium">Date:</span> {new Date(demande.date_examen).toLocaleDateString('fr-FR')}</p>
                                <p><span className="font-medium">Heure:</span> {demande.heure_examen}</p>
                                <p><span className="font-medium">Type:</span> {getTypeBadge(demande.type_demande)}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <User className="h-5 w-5 text-green-600" />
                                Informations du demandeur
                            </h3>
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2">
                                <p><span className="font-medium">Nom:</span> {demande.nom_demandeur}</p>
                                {demande.email_demandeur && (
                                    <p className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        <span>{demande.email_demandeur}</span>
                                    </p>
                                )}
                                {demande.telephone_demandeur && (
                                    <p className="flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        <span>{demande.telephone_demandeur}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Permutation spécifique */}
                    {demande.type_demande === 'permutation' && (demande.surveillant_remplacant || demande.surveillance_reprise_date) && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-3">
                                Détails de la permutation
                            </h3>
                            <div className="space-y-2">
                                {demande.surveillant_remplacant && (
                                    <p><span className="font-medium">Surveillant remplaçant:</span> {demande.surveillant_remplacant}</p>
                                )}
                                {demande.surveillance_reprise_date && (
                                    <p><span className="font-medium">Date de reprise:</span> {new Date(demande.surveillance_reprise_date).toLocaleDateString('fr-FR')}</p>
                                )}
                                {demande.surveillance_reprise_heure && (
                                    <p><span className="font-medium">Heure de reprise:</span> {demande.surveillance_reprise_heure}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-purple-600" />
                            Description
                        </h3>
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {demande.description || 'Aucune description fournie'}
                            </p>
                        </div>
                    </div>

                    {/* Statut et traitement */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                            Traitement de la demande
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Statut actuel
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
                            <div className="flex items-end">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    <p>Créée le: {new Date(demande.created_at).toLocaleDateString('fr-FR')}</p>
                                    {demande.traite_at && (
                                        <p>Traitée le: {new Date(demande.traite_at).toLocaleDateString('fr-FR')}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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

                        {demande.reponse_admin && (
                            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                                    Réponse précédente:
                                </p>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    {demande.reponse_admin}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isUpdating}
                    >
                        Fermer
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
    );
};

export default DemandeDetailModal;