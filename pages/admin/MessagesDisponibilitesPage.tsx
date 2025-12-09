import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Calendar, User, Filter, X, Check, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { Session } from '../../types';
import { ExportButton } from '../../components/shared/ExportButton';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface MessageWithDetails {
  id: string;
  surveillant_nom: string;
  surveillant_prenom: string;
  surveillant_email: string;
  type_surveillant: string;
  remarque_generale: string;
  session_name: string;
  submitted_at: string;
  updated_at?: string;
  message_traite: boolean;
  message_traite_par?: string;
  message_traite_le?: string;
}

export default function MessagesDisponibilitesPage() {
  const [messages, setMessages] = useState<MessageWithDetails[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [showOnlyWithMessages, setShowOnlyWithMessages] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'traite' | 'non_traite'>('all');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger les sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .order('year', { ascending: false })
        .order('period', { ascending: false });

      if (sessionsError) throw sessionsError;
      setSessions(sessionsData || []);

      // Charger toutes les soumissions avec leurs messages
      const { data: soumissionsData, error: soumissionsError } = await supabase
        .from('soumissions_disponibilites')
        .select(`
          id,
          nom,
          prenom,
          email,
          type_surveillant,
          remarque_generale,
          session_id,
          submitted_at,
          updated_at,
          message_traite,
          message_traite_par,
          message_traite_le,
          sessions (
            name
          )
        `)
        .is('deleted_at', null)
        .order('submitted_at', { ascending: false });

      if (soumissionsError) throw soumissionsError;

      const messagesData: MessageWithDetails[] = (soumissionsData || []).map((s: any) => ({
        id: s.id,
        surveillant_nom: s.nom,
        surveillant_prenom: s.prenom,
        surveillant_email: s.email,
        type_surveillant: s.type_surveillant,
        remarque_generale: s.remarque_generale || '',
        session_name: s.sessions?.name || 'Session inconnue',
        submitted_at: s.submitted_at,
        updated_at: s.updated_at,
        message_traite: s.message_traite || false,
        message_traite_par: s.message_traite_par,
        message_traite_le: s.message_traite_le,
      }));

      setMessages(messagesData);
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMessageStatus = async (messageId: string, currentStatus: boolean) => {
    if (!user?.username) {
      toast.error('Utilisateur non connecté');
      return;
    }

    setUpdatingStatus(messageId);
    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from('soumissions_disponibilites')
        .update({
          message_traite: newStatus,
          message_traite_par: newStatus ? user.username : null,
          message_traite_le: newStatus ? new Date().toISOString() : null,
        })
        .eq('id', messageId);

      if (error) throw error;

      // Mettre à jour l'état local
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                message_traite: newStatus,
                message_traite_par: newStatus ? user.username : undefined,
                message_traite_le: newStatus ? new Date().toISOString() : undefined,
              }
            : msg
        )
      );

      toast.success(newStatus ? 'Message marqué comme traité' : 'Statut annulé');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filteredMessages = messages.filter((msg) => {
    // Filtre: afficher uniquement les messages non vides
    if (showOnlyWithMessages && !msg.remarque_generale.trim()) {
      return false;
    }

    // Filtre: session
    if (selectedSession !== 'all' && msg.session_name !== selectedSession) {
      return false;
    }

    // Filtre: statut
    if (filterStatus === 'traite' && !msg.message_traite) {
      return false;
    }
    if (filterStatus === 'non_traite' && msg.message_traite) {
      return false;
    }

    // Filtre: recherche
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        msg.surveillant_nom.toLowerCase().includes(search) ||
        msg.surveillant_prenom.toLowerCase().includes(search) ||
        msg.surveillant_email.toLowerCase().includes(search) ||
        msg.remarque_generale.toLowerCase().includes(search)
      );
    }

    return true;
  });

  const uniqueSessions = Array.from(new Set(messages.map((m) => m.session_name))).sort();

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-blue-600" />
            Messages des disponibilités
          </h1>
          <p className="text-gray-600 mt-1">
            Consultez tous les messages laissés par les surveillants lors de la soumission de leurs disponibilités
          </p>
        </div>

        <ExportButton
          data={filteredMessages.map((msg) => ({
            'Nom': msg.surveillant_nom,
            'Prénom': msg.surveillant_prenom,
            'Email': msg.surveillant_email,
            'Type': msg.type_surveillant,
            'Session': msg.session_name,
            'Message': msg.remarque_generale,
            'Statut': msg.message_traite ? 'Traité' : 'Non traité',
            'Traité par': msg.message_traite_par || '-',
            'Traité le': msg.message_traite_le
              ? new Date(msg.message_traite_le).toLocaleString('fr-BE')
              : '-',
            'Date de soumission': new Date(msg.submitted_at).toLocaleString('fr-BE'),
            'Dernière modification': msg.updated_at
              ? new Date(msg.updated_at).toLocaleString('fr-BE')
              : '-',
          }))}
          filename={`messages-disponibilites-${new Date().toISOString().split('T')[0]}`}
          sheetName="Messages"
          disabled={filteredMessages.length === 0}
        />
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Total de soumissions</div>
          <div className="text-2xl font-bold text-gray-900">{messages.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Avec message</div>
          <div className="text-2xl font-bold text-blue-600">
            {messages.filter((m) => m.remarque_generale.trim()).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Messages traités</div>
          <div className="text-2xl font-bold text-green-600">
            {messages.filter((m) => m.remarque_generale.trim() && m.message_traite).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Affichés (filtrés)</div>
          <div className="text-2xl font-bold text-purple-600">{filteredMessages.length}</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <Filter className="w-5 h-5" />
          Filtres
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher (nom, email, message...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtre par session */}
          <div>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes les sessions</option>
              {uniqueSessions.map((session) => (
                <option key={session} value={session}>
                  {session}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre par statut */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'traite' | 'non_traite')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="non_traite">Non traités</option>
              <option value="traite">Traités</option>
            </select>
          </div>

          {/* Toggle messages uniquement */}
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyWithMessages}
                onChange={(e) => setShowOnlyWithMessages(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Uniquement avec message</span>
            </label>
          </div>
        </div>
      </div>

      {/* Liste des messages */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Chargement des messages...
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aucun message trouvé avec les filtres actuels</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Surveillant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Session
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMessages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2">
                        <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {msg.surveillant_prenom} {msg.surveillant_nom}
                          </div>
                          <div className="text-sm text-gray-500">{msg.surveillant_email}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {msg.type_surveillant}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{msg.session_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {msg.remarque_generale.trim() ? (
                        <div className="text-sm text-gray-900 max-w-md">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            {msg.remarque_generale}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Aucun message</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(msg.submitted_at).toLocaleDateString('fr-BE')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(msg.submitted_at).toLocaleTimeString('fr-BE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      {msg.updated_at && msg.updated_at !== msg.submitted_at && (
                        <div className="text-xs text-orange-600 mt-1">
                          Modifié le {new Date(msg.updated_at).toLocaleDateString('fr-BE')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {msg.remarque_generale.trim() ? (
                        <div className="space-y-2">
                          <button
                            onClick={() => toggleMessageStatus(msg.id, msg.message_traite)}
                            disabled={updatingStatus === msg.id}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              msg.message_traite
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            } ${updatingStatus === msg.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {msg.message_traite ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                Traité
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4" />
                                Marquer fait
                              </>
                            )}
                          </button>
                          {msg.message_traite && msg.message_traite_par && (
                            <div className="text-xs text-gray-500">
                              Par {msg.message_traite_par}
                              {msg.message_traite_le && (
                                <div>
                                  le {new Date(msg.message_traite_le).toLocaleDateString('fr-BE')}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
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
}
