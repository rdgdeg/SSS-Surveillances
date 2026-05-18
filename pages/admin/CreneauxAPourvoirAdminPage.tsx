import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  Copy,
  Download,
  Loader2,
  Link2,
  Users,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getSessions } from '../../lib/api';
import {
  createCreneauAPourvoir,
  deleteCreneauAPourvoir,
  getCreneauxAPourvoirAdmin,
  getPublicCreneauxAPourvoirUrl,
  updateCreneauAPourvoir,
} from '../../lib/creneauxAPourvoirApi';
import { exportMultiSheetXLSX } from '../../lib/exportUtils';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Session } from '../../types';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(t: string | null) {
  return t ? t.slice(0, 5) : '—';
}

export default function CreneauxAPourvoirAdminPage() {
  const [sessionId, setSessionId] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    date_surveillance: '',
    heure_debut: '08:30',
    heure_fin: '12:30',
    nb_personnes_manquantes: 1,
    libelle: '',
  });

  const queryClient = useQueryClient();

  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: getSessions,
  });

  const { data: creneaux, isLoading } = useQuery({
    queryKey: ['creneaux-a-pourvoir-admin', sessionId],
    queryFn: () => getCreneauxAPourvoirAdmin(sessionId),
    enabled: !!sessionId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createCreneauAPourvoir({
        session_id: sessionId,
        date_surveillance: form.date_surveillance,
        heure_debut: form.heure_debut || null,
        heure_fin: form.heure_fin || null,
        nb_personnes_manquantes: form.nb_personnes_manquantes,
        libelle: form.libelle || null,
        is_open: true,
      }),
    onSuccess: () => {
      toast.success('Créneau ajouté');
      setForm((f) => ({ ...f, libelle: '' }));
      queryClient.invalidateQueries({ queryKey: ['creneaux-a-pourvoir-admin', sessionId] });
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const toggleOpenMutation = useMutation({
    mutationFn: ({ id, is_open }: { id: string; is_open: boolean }) =>
      updateCreneauAPourvoir(id, { is_open }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creneaux-a-pourvoir-admin', sessionId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCreneauAPourvoir,
    onSuccess: () => {
      toast.success('Créneau supprimé');
      queryClient.invalidateQueries({ queryKey: ['creneaux-a-pourvoir-admin', sessionId] });
    },
  });

  const copyLink = async () => {
    if (!sessionId) return;
    const url = getPublicCreneauxAPourvoirUrl(sessionId);
    await navigator.clipboard.writeText(url);
    toast.success('Lien copié dans le presse-papiers');
  };

  const handleExport = () => {
    if (!creneaux?.length) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    const sessionName = sessions?.find((s: Session) => s.id === sessionId)?.name || 'session';

    const synthese = creneaux.map((c) => ({
      Date: c.date_surveillance,
      Début: formatTime(c.heure_debut),
      Fin: formatTime(c.heure_fin),
      Libellé: c.libelle || '',
      'Personnes recherchées': c.nb_personnes_manquantes,
      'Candidats inscrits': c.nb_reponses,
      Ouvert: c.is_open ? 'Oui' : 'Non',
    }));

    const detail: Array<Record<string, string | number>> = [];
    creneaux.forEach((c) => {
      c.candidats.forEach((can) => {
        detail.push({
          Date: c.date_surveillance,
          Horaire: `${formatTime(c.heure_debut)} - ${formatTime(c.heure_fin)}`,
          Libellé: c.libelle || '',
          Email: can.email,
          Prénom: can.prenom,
          Nom: can.nom,
        });
      });
    });

    exportMultiSheetXLSX(
      [
        { name: 'Synthèse créneaux', data: synthese },
        { name: 'Candidats', data: detail.length ? detail : [{ Info: 'Aucun candidat pour le moment' }] },
      ],
      `creneaux-a-pourvoir-${sessionName}`
    );
    toast.success('Export Excel téléchargé');
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) {
      toast.error('Sélectionnez une session');
      return;
    }
    if (!form.date_surveillance) {
      toast.error('Date obligatoire');
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Créneaux à pourvoir</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Publiez des créneaux où il manque des surveillants et consultez les volontaires.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Session
        </label>
        <select
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
        >
          <option value="">Choisir une session…</option>
          {(sessions || []).map((s: Session) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.year}){s.is_active ? ' — active' : ''}
            </option>
          ))}
        </select>

        {sessionId && (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={copyLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copier le lien public
            </Button>
            <Button type="button" variant="outline" onClick={handleExport} disabled={!creneaux?.length}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        )}

        {sessionId && (
          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all flex items-start gap-1">
            <Link2 className="h-3 w-3 mt-0.5 flex-shrink-0" />
            {getPublicCreneauxAPourvoirUrl(sessionId)}
          </p>
        )}
      </div>

      {sessionId && (
        <form
          onSubmit={handleAdd}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4"
        >
          <h2 className="font-semibold text-gray-900 dark:text-white">Ajouter un créneau</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <Input
                type="date"
                value={form.date_surveillance}
                onChange={(e) => setForm({ ...form, date_surveillance: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Heure début</label>
              <Input
                type="time"
                value={form.heure_debut}
                onChange={(e) => setForm({ ...form, heure_debut: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Heure fin</label>
              <Input
                type="time"
                value={form.heure_fin}
                onChange={(e) => setForm({ ...form, heure_fin: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Personnes recherchées *</label>
              <Input
                type="number"
                min={1}
                max={50}
                value={form.nb_personnes_manquantes}
                onChange={(e) =>
                  setForm({ ...form, nb_personnes_manquantes: parseInt(e.target.value, 10) || 1 })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Libellé (optionnel)</label>
              <Input
                value={form.libelle}
                onChange={(e) => setForm({ ...form, libelle: e.target.value })}
                placeholder="Ex. Auditoire 10A, secrétariat MED…"
              />
            </div>
          </div>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Ajouter
          </Button>
        </form>
      )}

      {sessionId && isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      )}

      {sessionId && !isLoading && creneaux && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Créneaux publiés ({creneaux.length})
          </h2>
          {creneaux.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucun créneau. Ajoutez-en ci-dessus.</p>
          ) : (
            creneaux.map((c) => (
              <div
                key={c.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(c.date_surveillance)} — {formatTime(c.heure_debut)} à{' '}
                      {formatTime(c.heure_fin)}
                    </p>
                    {c.libelle && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{c.libelle}</p>
                    )}
                    <p className="text-sm mt-1 flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                          c.nb_reponses >= c.nb_personnes_manquantes
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        <Users className="h-3 w-3" />
                        {c.nb_reponses} / {c.nb_personnes_manquantes} candidat
                        {c.nb_reponses !== 1 ? 's' : ''}
                      </span>
                      {!c.is_open && (
                        <span className="text-xs text-gray-500">(fermé au public)</span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        toggleOpenMutation.mutate({ id: c.id, is_open: !c.is_open })
                      }
                    >
                      {c.is_open ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" /> Fermer
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" /> Ouvrir
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    >
                      {expandedId === c.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() => {
                        if (confirm('Supprimer ce créneau et les candidatures associées ?')) {
                          deleteMutation.mutate(c.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {expandedId === c.id && (
                  <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-900/50">
                    {c.candidats.length === 0 ? (
                      <p className="text-sm text-gray-500">Aucun candidat pour ce créneau.</p>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {c.candidats.map((can) => (
                          <li key={can.email} className="text-gray-700 dark:text-gray-300">
                            <strong>
                              {can.prenom} {can.nom}
                            </strong>{' '}
                            — {can.email}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
