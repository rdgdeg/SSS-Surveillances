
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { MessageSquare, Archive, MailOpen, Mail, Loader2, Inbox } from 'lucide-react';
import { getMessages, updateMessageStatus } from '../../lib/api';
import { Message } from '../../types';
import { Badge } from '../../components/shared/Badge';
import toast from 'react-hot-toast';
import { useDataFetching } from '../../hooks/useDataFetching';

const MessagesPage: React.FC = () => {
    const { data: messages, isLoading, refetch } = useDataFetching(getMessages, []);
    const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('unread');

    const handleUpdateStatus = useCallback(async (id: string, newStatus: Partial<Message>) => {
        try {
            await updateMessageStatus(id, newStatus);
            refetch();
            toast.success("Statut du message mis à jour.");
        } catch(error) {
            toast.error("Erreur lors de la mise à jour.");
        }
    }, [refetch]);

    const filteredMessages = messages.filter(m => {
        if (filter === 'unread') return !m.lu && !m.archive;
        if (filter === 'archived') return m.archive;
        return true;
    });

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Messages & Communications</h1>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare />
                        Boîte de réception
                    </CardTitle>
                    <CardDescription>Consultez les messages et remarques des surveillants.</CardDescription>
                     <div className="flex space-x-2 pt-4">
                        <Button variant={filter === 'unread' ? 'default' : 'outline'} onClick={() => setFilter('unread')}>Non lus</Button>
                        <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>Tous</Button>
                        <Button variant={filter === 'archived' ? 'default' : 'outline'} onClick={() => setFilter('archived')}>Archivés</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
                    ) : filteredMessages.length > 0 ? (
                        <div className="space-y-4">
                            {filteredMessages.map(msg => (
                                <div key={msg.id} className="p-4 border rounded-lg dark:border-gray-700">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold">{msg.sujet}</h3>
                                                {!msg.lu && <Badge variant="success">Nouveau</Badge>}
                                            </div>
                                            <p className="text-sm text-gray-500">De: {msg.expediteur_prenom} {msg.expediteur_nom} ({msg.expediteur_email})</p>
                                             <p className="text-xs text-gray-400">Reçu le: {new Date(msg.created_at).toLocaleString('fr-FR')}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {msg.lu ? (
                                                <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(msg.id, { lu: false })}>
                                                    <Mail className="mr-2 h-4 w-4"/> Marquer non lu
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(msg.id, { lu: true })}>
                                                    <MailOpen className="mr-2 h-4 w-4"/> Marquer lu
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(msg.id, { archive: !msg.archive })}>
                                                <Archive className="mr-2 h-4 w-4"/> {msg.archive ? 'Désarchiver' : 'Archiver'}
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded">{msg.contenu}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <Inbox className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucun message</h3>
                            <p className="mt-1 text-sm text-gray-500">Il n'y a pas de message à afficher dans cette catégorie.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default MessagesPage;