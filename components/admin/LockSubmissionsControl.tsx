import React, { useState } from 'react';
import { Session } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Lock, Unlock, AlertTriangle, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateSession } from '../../lib/api';

interface LockSubmissionsControlProps {
    session: Session | null;
    onUpdate: () => void;
}

export const LockSubmissionsControl: React.FC<LockSubmissionsControlProps> = ({ session, onUpdate }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [customMessage, setCustomMessage] = useState(session?.lock_message || '');
    const [showMessageInput, setShowMessageInput] = useState(false);

    if (!session) {
        return (
            <Card className="border-gray-300 dark:border-gray-600">
                <CardHeader>
                    <CardTitle className="flex items-center text-gray-500">
                        <Lock className="mr-2 h-5 w-5" />
                        Verrouillage des disponibilités
                    </CardTitle>
                    <CardDescription>Aucune session active</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const isLocked = session.lock_submissions || false;

    const handleToggleLock = async () => {
        setIsUpdating(true);
        try {
            const newLockState = !isLocked;
            const updates: Partial<Session> = {
                lock_submissions: newLockState,
            };

            // Si on verrouille et qu'un message personnalisé est fourni
            if (newLockState && customMessage.trim()) {
                updates.lock_message = customMessage.trim();
            }

            // Si on déverrouille, on peut optionnellement effacer le message
            if (!newLockState) {
                updates.lock_message = null;
            }

            await updateSession(session.id, updates);
            
            toast.success(
                newLockState 
                    ? 'Les disponibilités sont maintenant verrouillées. Les surveillants ne peuvent plus les modifier.' 
                    : 'Les disponibilités sont maintenant déverrouillées. Les surveillants peuvent à nouveau les modifier.'
            );
            
            setShowMessageInput(false);
            onUpdate();
        } catch (error) {
            console.error('Erreur lors de la mise à jour du verrouillage:', error);
            toast.error('Erreur lors de la mise à jour du verrouillage');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateMessage = async () => {
        setIsUpdating(true);
        try {
            await updateSession(session.id, {
                lock_message: customMessage.trim() || null
            });
            
            toast.success('Message personnalisé mis à jour');
            setShowMessageInput(false);
            onUpdate();
        } catch (error) {
            console.error('Erreur lors de la mise à jour du message:', error);
            toast.error('Erreur lors de la mise à jour du message');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Card className={`border-2 ${isLocked ? 'border-amber-400 dark:border-amber-600' : 'border-green-400 dark:border-green-600'}`}>
            <CardHeader className={`${isLocked ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-full ${isLocked ? 'bg-amber-100 dark:bg-amber-900/50' : 'bg-green-100 dark:bg-green-900/50'}`}>
                            {isLocked ? (
                                <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                            ) : (
                                <Unlock className="h-6 w-6 text-green-600 dark:text-green-400" />
                            )}
                        </div>
                        <div>
                            <CardTitle className={`${isLocked ? 'text-amber-800 dark:text-amber-300' : 'text-green-800 dark:text-green-300'}`}>
                                Verrouillage des disponibilités
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Session : <strong>{session.name}</strong>
                            </CardDescription>
                        </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full font-semibold ${
                        isLocked 
                            ? 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200' 
                            : 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                    }`}>
                        {isLocked ? '🔒 Verrouillé' : '🔓 Ouvert'}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                {/* Statut actuel */}
                <div className={`p-4 rounded-lg border ${
                    isLocked 
                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700' 
                        : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                }`}>
                    <p className={`text-sm ${isLocked ? 'text-amber-800 dark:text-amber-300' : 'text-green-800 dark:text-green-300'}`}>
                        {isLocked ? (
                            <>
                                <strong>Les surveillants ne peuvent plus modifier leurs disponibilités.</strong>
                                <br />
                                Ils doivent vous contacter pour toute modification.
                            </>
                        ) : (
                            <>
                                <strong>Les surveillants peuvent soumettre et modifier leurs disponibilités.</strong>
                                <br />
                                Verrouillez les disponibilités après l'export pour empêcher les modifications.
                            </>
                        )}
                    </p>
                </div>

                {/* Message personnalisé actuel */}
                {isLocked && session.lock_message && !showMessageInput && (
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                            Message affiché aux surveillants :
                        </p>
                        <p className="text-sm text-blue-800 dark:text-blue-300 italic">
                            "{session.lock_message}"
                        </p>
                    </div>
                )}

                {/* Input pour message personnalisé */}
                {showMessageInput && (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Message personnalisé (optionnel)
                            </label>
                            <Input
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                placeholder="Ex: L'établissement du planning est en cours et les attributions vont suivre."
                                className="w-full"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Ce message sera affiché aux surveillants lorsqu'ils tentent d'accéder au formulaire.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleUpdateMessage}
                                disabled={isUpdating}
                                size="sm"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Enregistrer le message
                            </Button>
                            <Button
                                onClick={() => {
                                    setShowMessageInput(false);
                                    setCustomMessage(session.lock_message || '');
                                }}
                                variant="outline"
                                size="sm"
                            >
                                Annuler
                            </Button>
                        </div>
                    </div>
                )}

                {/* Avertissement */}
                {!isLocked && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">
                                    Recommandation
                                </h4>
                                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                                    Verrouillez les disponibilités après avoir exporté les données pour éviter que les surveillants ne modifient leurs disponibilités pendant que vous préparez les attributions.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
                    <Button
                        onClick={handleToggleLock}
                        disabled={isUpdating}
                        className={isLocked ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'}
                    >
                        {isLocked ? (
                            <>
                                <Unlock className="h-4 w-4 mr-2" />
                                Déverrouiller les disponibilités
                            </>
                        ) : (
                            <>
                                <Lock className="h-4 w-4 mr-2" />
                                Verrouiller les disponibilités
                            </>
                        )}
                    </Button>
                    
                    {isLocked && !showMessageInput && (
                        <Button
                            onClick={() => setShowMessageInput(true)}
                            variant="outline"
                            disabled={isUpdating}
                        >
                            Modifier le message
                        </Button>
                    )}
                    
                    {!isLocked && !showMessageInput && (
                        <Button
                            onClick={() => setShowMessageInput(true)}
                            variant="outline"
                            disabled={isUpdating}
                        >
                            Personnaliser le message
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
