import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Phone, Mail, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const UpdatePhonePage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [telephone, setTelephone] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [surveillantInfo, setSurveillantInfo] = useState<{ nom: string; prenom: string } | null>(null);

    // Mutation pour mettre à jour le téléphone
    const updatePhoneMutation = useMutation({
        mutationFn: async ({ email, telephone }: { email: string; telephone: string }) => {
            // D'abord vérifier que l'email existe dans les surveillants
            const { data: surveillant, error: searchError } = await supabase
                .from('surveillants')
                .select('id, nom, prenom, email, telephone')
                .eq('email', email.toLowerCase().trim())
                .eq('is_active', true)
                .single();

            if (searchError || !surveillant) {
                throw new Error('Email non trouvé dans notre base de données des surveillants');
            }

            // Mettre à jour le téléphone
            const { error: updateError } = await supabase
                .from('surveillants')
                .update({ telephone: telephone.trim() })
                .eq('id', surveillant.id);

            if (updateError) {
                throw updateError;
            }

            return { surveillant, previousPhone: surveillant.telephone };
        },
        onSuccess: (data) => {
            setSurveillantInfo({ nom: data.surveillant.nom, prenom: data.surveillant.prenom });
            setIsSuccess(true);
            
            if (data.previousPhone) {
                toast.success(`Téléphone mis à jour avec succès ! (ancien: ${data.previousPhone})`);
            } else {
                toast.success('Téléphone ajouté avec succès !');
            }
        },
        onError: (error: any) => {
            toast.error(error.message || 'Erreur lors de la mise à jour');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email.trim()) {
            toast.error('Veuillez saisir votre adresse email');
            return;
        }
        
        if (!telephone.trim()) {
            toast.error('Veuillez saisir votre numéro de téléphone');
            return;
        }

        // Validation basique du format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            toast.error('Veuillez saisir une adresse email valide');
            return;
        }

        // Validation basique du téléphone (au moins 8 chiffres)
        const phoneRegex = /[\d\s\+\-\(\)]{8,}/;
        if (!phoneRegex.test(telephone.trim())) {
            toast.error('Veuillez saisir un numéro de téléphone valide');
            return;
        }

        updatePhoneMutation.mutate({ email: email.trim(), telephone: telephone.trim() });
    };

    const resetForm = () => {
        setEmail('');
        setTelephone('');
        setIsSuccess(false);
        setSurveillantInfo(null);
    };

    if (isSuccess && surveillantInfo) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-green-950 flex items-center justify-center px-4">
                <div className="max-w-md w-full">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Téléphone mis à jour !
                        </h1>
                        
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Merci <strong>{surveillantInfo.prenom} {surveillantInfo.nom}</strong> !<br />
                            Votre numéro de téléphone a été enregistré avec succès.
                        </p>

                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <Phone className="w-4 h-4" />
                                <span>{telephone}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Button
                                onClick={resetForm}
                                variant="outline"
                                className="w-full"
                            >
                                Mettre à jour un autre téléphone
                            </Button>
                            
                            <Link to="/">
                                <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    Retour à l'accueil
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                    {/* En-tête */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Phone className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Mise à jour téléphone
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            Ajoutez ou mettez à jour votre numéro de téléphone pour les surveillances d'examens
                        </p>
                    </div>

                    {/* Formulaire */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Adresse email UCLouvain
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="prenom.nom@uclouvain.be"
                                    className="pl-10"
                                    required
                                />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Utilisez votre adresse email UCLouvain habituelle
                            </p>
                        </div>

                        <div>
                            <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Numéro de téléphone
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    id="telephone"
                                    type="tel"
                                    value={telephone}
                                    onChange={(e) => setTelephone(e.target.value)}
                                    placeholder="0XXX XX XX XX ou +32 XXX XX XX XX"
                                    className="pl-10"
                                    required
                                />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Format belge ou international accepté
                            </p>
                        </div>

                        <Button
                            type="submit"
                            disabled={updatePhoneMutation.isPending}
                            className="w-full"
                        >
                            {updatePhoneMutation.isPending ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Mise à jour...
                                </div>
                            ) : (
                                'Mettre à jour mon téléphone'
                            )}
                        </Button>
                    </form>

                    {/* Informations */}
                    <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-800 dark:text-blue-200">
                                <p className="font-medium mb-1">Informations importantes :</p>
                                <ul className="space-y-1 text-xs">
                                    <li>• Votre email doit être enregistré comme surveillant</li>
                                    <li>• Le téléphone sera utilisé pour les communications urgentes</li>
                                    <li>• Vous pouvez modifier votre numéro à tout moment</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Lien retour */}
                    <div className="mt-6 text-center">
                        <Link 
                            to="/" 
                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        >
                            ← Retour à l'accueil
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdatePhonePage;