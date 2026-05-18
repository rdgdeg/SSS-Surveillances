import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  Send,
  Users,
  CheckCircle,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useActiveSession } from '../../src/hooks/useActiveSession';
import {
  getCreneauxAPourvoirPublic,
  getReponseByEmail,
  saveReponseCreneauxAPourvoir,
  getSessionById,
} from '../../lib/creneauxAPourvoirApi';
import { CreneauAPourvoir } from '../../types';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Checkbox } from '../../components/shared/Checkbox';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(t: string | null) {
  if (!t) return '';
  return t.slice(0, 5);
}

function groupByDate(creneaux: CreneauAPourvoir[]) {
  const map: Record<string, CreneauAPourvoir[]> = {};
  creneaux.forEach((c) => {
    if (!map[c.date_surveillance]) map[c.date_surveillance] = [];
    map[c.date_surveillance].push(c);
  });
  Object.values(map).forEach((list) =>
    list.sort((a, b) => (a.heure_debut || '').localeCompare(b.heure_debut || ''))
  );
  return map;
}

export default function CreneauxAPourvoirPage() {
  const { sessionId: sessionIdParam } = useParams<{ sessionId?: string }>();
  const { data: activeSession } = useActiveSession();
  const sessionId = sessionIdParam || activeSession?.id;

  const [email, setEmail] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadedExisting, setLoadedExisting] = useState(false);

  const queryClient = useQueryClient();

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSessionById(sessionId!),
    enabled: !!sessionId,
  });

  const { data: creneaux, isLoading: creneauxLoading, error } = useQuery({
    queryKey: ['creneaux-a-pourvoir-public', sessionId],
    queryFn: () => getCreneauxAPourvoirPublic(sessionId!),
    enabled: !!sessionId,
  });

  const grouped = useMemo(() => groupByDate(creneaux || []), [creneaux]);

  const loadExisting = async () => {
    if (!sessionId || !email.trim()) return;
    try {
      const existing = await getReponseByEmail(sessionId, email);
      if (existing) {
        setNom(existing.nom);
        setPrenom(existing.prenom);
        setSelectedIds(new Set(existing.creneau_ids));
        setLoadedExisting(true);
        toast.success('Votre participation précédente a été chargée — vous pouvez la modifier.');
      } else {
        setLoadedExisting(false);
        toast('Aucune participation enregistrée pour cet email. Cochez vos créneaux ci-dessous.');
      }
    } catch {
      toast.error('Impossible de charger votre participation');
    }
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      saveReponseCreneauxAPourvoir({
        sessionId: sessionId!,
        email,
        nom,
        prenom,
        creneauIds: Array.from(selectedIds),
      }),
    onSuccess: () => {
      toast.success('Merci ! Votre participation a été enregistrée.');
      queryClient.invalidateQueries({ queryKey: ['creneaux-a-pourvoir-public', sessionId] });
    },
    onError: () => toast.error('Erreur lors de l\'enregistrement'),
  });

  const toggleCreneau = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !nom.trim() || !prenom.trim()) {
      toast.error('Email, nom et prénom sont obligatoires');
      return;
    }
    saveMutation.mutate();
  };

  if (!sessionId && !sessionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 max-w-md text-amber-900">
          <AlertCircle className="h-6 w-6 mb-2" />
          <p>Aucune session spécifiée. Utilisez le lien reçu par email ou attendez une session active.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Créneaux à pourvoir
          </h1>
          {session && (
            <p className="text-gray-600 dark:text-gray-400">
              Session : {session.name} ({session.year})
            </p>
          )}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex gap-3 text-sm text-blue-800 dark:text-blue-200">
            <Users className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>
              Indiquez vos coordonnées et cochez les créneaux auxquels vous pouvez participer.
              Vous pourrez revenir sur cette page pour modifier votre choix avec le même email.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-800">
            Erreur de chargement. Vérifiez que la migration base de données a été appliquée.
          </div>
        )}

        {(sessionLoading || creneauxLoading) && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        )}

        {!creneauxLoading && creneaux && creneaux.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucun créneau à pourvoir pour le moment.</p>
          </div>
        )}

        {creneaux && creneaux.length > 0 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">Vos coordonnées</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setLoadedExisting(false);
                    }}
                    placeholder="vous@uclouvain.be"
                    required
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={loadExisting} disabled={!email.trim()}>
                    <Search className="h-4 w-4 mr-1" />
                    Charger
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prénom *
                  </label>
                  <Input value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom *
                  </label>
                  <Input value={nom} onChange={(e) => setNom(e.target.value)} required />
                </div>
              </div>
              {loadedExisting && (
                <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Participation existante chargée — modifiez et enregistrez à nouveau.
                </p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
                Créneaux disponibles ({selectedIds.size} sélectionné{selectedIds.size !== 1 ? 's' : ''})
              </h2>
              <div className="space-y-6">
                {Object.entries(grouped)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([date, list]) => (
                    <div key={date}>
                      <h3 className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(date)}
                      </h3>
                      <div className="space-y-2">
                        {list.map((c) => (
                          <label
                            key={c.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedIds.has(c.id)
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                          >
                            <Checkbox
                              id={`creneau-${c.id}`}
                              checked={selectedIds.has(c.id)}
                              onCheckedChange={() => toggleCreneau(c.id)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                                <Clock className="h-4 w-4 text-gray-400" />
                                {formatTime(c.heure_debut)}
                                {c.heure_fin ? ` – ${formatTime(c.heure_fin)}` : ''}
                                <span className="text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded text-xs">
                                  {c.nb_personnes_manquantes} personne{c.nb_personnes_manquantes > 1 ? 's' : ''} recherchée{c.nb_personnes_manquantes > 1 ? 's' : ''}
                                </span>
                              </div>
                              {c.libelle && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{c.libelle}</p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <Button type="submit" disabled={saveMutation.isPending} className="w-full sm:w-auto">
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enregistrer ma participation
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
