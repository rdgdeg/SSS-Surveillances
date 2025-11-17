import React, { useState, useEffect } from 'react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Link, Copy, Trash2, Loader2, Check, Share2, Calendar, Clock } from 'lucide-react';
import { generateShareToken, getShareTokens, revokeShareToken } from '../../lib/api';
import toast from 'react-hot-toast';

interface ShareLinkModalProps {
    sessionId: string;
    sessionName: string;
    onClose: () => void;
}

interface ShareToken {
    token: string;
    created_at: string;
    expires_at: string;
}

export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({ sessionId, sessionName, onClose }) => {
    const [tokens, setTokens] = useState<ShareToken[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [expiresInDays, setExpiresInDays] = useState(30);

    useEffect(() => {
        loadTokens();
    }, [sessionId]);

    const loadTokens = async () => {
        try {
            setIsLoading(true);
            const data = await getShareTokens(sessionId);
            setTokens(data);
        } catch (error) {
            console.error('Error loading tokens:', error);
            toast.error('Erreur lors du chargement des liens');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = async () => {
        try {
            setIsGenerating(true);
            const { url } = await generateShareToken(sessionId, expiresInDays);
            toast.success('Lien de partage créé !');
            await loadTokens();
            
            // Copier automatiquement le lien
            await navigator.clipboard.writeText(url);
            toast.success('Lien copié dans le presse-papiers !');
        } catch (error) {
            console.error('Error generating token:', error);
            toast.error('Erreur lors de la génération du lien');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = async (token: string) => {
        const url = `${window.location.origin}/shared/disponibilites/${token}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopiedToken(token);
            toast.success('Lien copié !');
            setTimeout(() => setCopiedToken(null), 2000);
        } catch (error) {
            toast.error('Erreur lors de la copie');
        }
    };

    const handleRevoke = async (token: string) => {
        if (!confirm('Êtes-vous sûr de vouloir révoquer ce lien ? Il ne sera plus accessible.')) {
            return;
        }

        try {
            await revokeShareToken(token);
            toast.success('Lien révoqué');
            await loadTokens();
        } catch (error) {
            console.error('Error revoking token:', error);
            toast.error('Erreur lors de la révocation');
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b dark:border-gray-700">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Share2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                Liens de Partage
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Session : {sessionName}
                            </p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            <span className="text-2xl">×</span>
                        </button>
                    </div>
                </div>
                
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
                    {/* Générer un nouveau lien */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4 mb-6">
                        <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-3">
                            Créer un nouveau lien de partage
                        </h4>
                        <div className="flex items-end gap-3">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-2">
                                    Expiration (jours)
                                </label>
                                <Input
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={expiresInDays}
                                    onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 30)}
                                    className="w-full"
                                />
                            </div>
                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="whitespace-nowrap"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Génération...
                                    </>
                                ) : (
                                    <>
                                        <Link className="h-4 w-4 mr-2" />
                                        Générer un lien
                                    </>
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-2">
                            Le lien permettra de consulter les disponibilités en lecture seule
                        </p>
                    </div>

                    {/* Liste des liens actifs */}
                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <Link className="h-5 w-5" />
                            Liens actifs ({tokens.length})
                        </h4>
                        
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                            </div>
                        ) : tokens.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <Link className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">Aucun lien de partage actif</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {tokens.map((token) => {
                                    const url = `${window.location.origin}/shared/disponibilites/${token.token}`;
                                    const isCopied = copiedToken === token.token;
                                    
                                    return (
                                        <div
                                            key={token.token}
                                            className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>Créé le {formatDate(token.created_at)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                                        <Clock className="h-3 w-3" />
                                                        <span>Expire le {formatDate(token.expires_at)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleCopy(token.token)}
                                                    >
                                                        {isCopied ? (
                                                            <>
                                                                <Check className="h-4 w-4 mr-1" />
                                                                Copié
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="h-4 w-4 mr-1" />
                                                                Copier
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleRevoke(token.token)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                                                {url}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <Button onClick={onClose} variant="outline" className="w-full">
                        Fermer
                    </Button>
                </div>
            </div>
        </div>
    );
};
