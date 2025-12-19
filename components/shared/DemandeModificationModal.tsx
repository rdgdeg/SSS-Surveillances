import React, { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './Button';
import { supabase } from '../../lib/supabaseClient';

interface DemandeModificationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type TypeDemande = 'modification' | 'permutation' | 'message';

interface FormData {
    nomExamen: string;
    dateExamen: string;
    heureExamen: string;
    typeDemande: TypeDemande;
    surveillantRemplacant: string;
    surveillanceRepriseDate: string;
    surveillanceRepriseHeure: string;
    description: string;
    nomDemandeur: string;
    emailDemandeur: string;
    telephoneDemandeur: string;
}

const DemandeModificationModal: React.FC<DemandeModificationModalProps> = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState<FormData>({
        nomExamen: '',
        dateExamen: '',
        heureExamen: '',
        typeDemande: 'modification',
        surveillantRemplacant: '',
        surveillanceRepriseDate: '',
        surveillanceRepriseHeure: '',
        description: '',
        nomDemandeur: '',
        emailDemandeur: '',
        telephoneDemandeur: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const resetForm = () => {
        setFormData({
            nomExamen: '',
            dateExamen: '',
            heureExamen: '',
            typeDemande: 'modification',
            surveillantRemplacant: '',
            surveillanceRepriseDate: '',
            surveillanceRepriseHeure: '',
            description: '',
            nomDemandeur: '',
            emailDemandeur: '',
            telephoneDemandeur: ''
        });
        setSubmitStatus('idle');
        setErrorMessage('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage('');

        try {
            // Validation
            if (!formData.nomExamen || !formData.dateExamen || !formData.heureExamen || 
                !formData.nomDemandeur) {
                throw new Error('Veuillez remplir tous les champs obligatoires');
            }

            if (formData.typeDemande === 'permutation') {
                if (!formData.surveillantRemplacant || !formData.surveillanceRepriseDate || !formData.surveillanceRepriseHeure) {
                    throw new Error('Pour une permutation, veuillez indiquer qui reprend la surveillance et quand');
                }
            }

            // Préparer les données pour l'insertion
            const demandeData = {
                nom_examen: formData.nomExamen,
                date_examen: formData.dateExamen,
                heure_examen: formData.heureExamen,
                type_demande: formData.typeDemande,
                description: formData.description,
                nom_demandeur: formData.nomDemandeur,
                email_demandeur: formData.emailDemandeur || null,
                telephone_demandeur: formData.telephoneDemandeur || null,
                surveillant_remplacant: formData.typeDemande === 'permutation' ? formData.surveillantRemplacant : null,
                surveillance_reprise_date: formData.typeDemande === 'permutation' ? formData.surveillanceRepriseDate : null,
                surveillance_reprise_heure: formData.typeDemande === 'permutation' ? formData.surveillanceRepriseHeure : null
            };

            const { error } = await supabase
                .from('demandes_modification')
                .insert([demandeData]);

            if (error) {
                throw error;
            }

            setSubmitStatus('success');
            setTimeout(() => {
                handleClose();
            }, 2000);

        } catch (error) {
            console.error('Erreur lors de l\'envoi de la demande:', error);
            setErrorMessage(error instanceof Error ? error.message : 'Une erreur est survenue');
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Demande de modification
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {submitStatus === 'success' ? (
                    <div className="p-6 text-center">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Demande envoyée avec succès !
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Votre demande a été transmise à l'administration. Vous recevrez une réponse dans les plus brefs délais.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Informations sur l'examen */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                Informations sur l'examen
                            </h3>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nom de l'examen *
                                </label>
                                <input
                                    type="text"
                                    name="nomExamen"
                                    value={formData.nomExamen}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                                    placeholder="Ex: WFARM1300 - Chimie générale"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Date de l'examen *
                                    </label>
                                    <input
                                        type="date"
                                        name="dateExamen"
                                        value={formData.dateExamen}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Heure de l'examen *
                                    </label>
                                    <input
                                        type="time"
                                        name="heureExamen"
                                        value={formData.heureExamen}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Type de demande */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Type de demande *
                            </label>
                            <select
                                name="typeDemande"
                                value={formData.typeDemande}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                                required
                            >
                                <option value="modification">Demande de modification</option>
                                <option value="permutation">Permutation avec un autre surveillant</option>
                                <option value="message">Message général</option>
                            </select>
                        </div>

                        {/* Champs spécifiques aux permutations */}
                        {formData.typeDemande === 'permutation' && (
                            <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <h4 className="text-md font-medium text-blue-900 dark:text-blue-100">
                                    Informations sur la permutation
                                </h4>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Nom du surveillant qui reprend votre surveillance *
                                    </label>
                                    <input
                                        type="text"
                                        name="surveillantRemplacant"
                                        value={formData.surveillantRemplacant}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                                        placeholder="Nom et prénom du surveillant"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Date de la surveillance que vous reprenez *
                                        </label>
                                        <input
                                            type="date"
                                            name="surveillanceRepriseDate"
                                            value={formData.surveillanceRepriseDate}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Heure de la surveillance que vous reprenez *
                                        </label>
                                        <input
                                            type="time"
                                            name="surveillanceRepriseHeure"
                                            value={formData.surveillanceRepriseHeure}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Description de votre demande
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                                placeholder="Décrivez votre demande en détail (optionnel)..."
                            />
                        </div>

                        {/* Informations du demandeur */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                Vos informations de contact
                            </h3>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nom et prénom *
                                </label>
                                <input
                                    type="text"
                                    name="nomDemandeur"
                                    value={formData.nomDemandeur}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                                    placeholder="Votre nom et prénom"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="emailDemandeur"
                                        value={formData.emailDemandeur}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                                        placeholder="votre.email@uclouvain.be"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Téléphone
                                    </label>
                                    <input
                                        type="tel"
                                        name="telephoneDemandeur"
                                        value={formData.telephoneDemandeur}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                                        placeholder="0123456789"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Message d'erreur */}
                        {submitStatus === 'error' && (
                            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                                <AlertCircle className="h-5 w-5" />
                                <span className="text-sm">{errorMessage}</span>
                            </div>
                        )}

                        {/* Boutons */}
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isSubmitting}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-indigo-600 hover:bg-indigo-700"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Envoi en cours...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Envoyer la demande
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default DemandeModificationModal;