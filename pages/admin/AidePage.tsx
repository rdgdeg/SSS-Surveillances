import React, { useState } from 'react';
import { 
  HelpCircle, 
  Users, 
  Clock, 
  FileText, 
  BookOpen, 
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Info,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

export default function AidePage() {
  const { user } = useAuth();
  const isFullAdmin = user?.username === 'RaphD';
  const [expandedSections, setExpandedSections] = useState<string[]>(['intro']);

  const toggleSection = (id: string) => {
    setExpandedSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const sections: Section[] = [
    {
      id: 'intro',
      title: 'Introduction',
      icon: Info,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Bienvenue dans le système de gestion des surveillances d'examens de l'UCLouvain.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Cette plateforme vous permet de gérer efficacement les surveillances d'examens, 
            les disponibilités des surveillants, et les présences des enseignants.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Votre rôle :</strong> {isFullAdmin ? 'Administrateur complet' : 'Utilisateur standard'}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {isFullAdmin 
                ? 'Vous avez accès à toutes les fonctionnalités de la plateforme.'
                : 'Vous avez accès aux fonctionnalités de gestion des surveillants et des enseignants.'}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'surveillants',
      title: 'Surveillants - Gestion des surveillants',
      icon: Users,
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">Vue d'ensemble</h4>
          <p className="text-gray-700 dark:text-gray-300">
            Cette page vous permet de gérer la liste complète des surveillants disponibles pour les examens.
          </p>
          
          <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Fonctionnalités principales</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>Ajouter un surveillant :</strong> Cliquez sur "Ajouter un surveillant" et remplissez le formulaire avec le nom, prénom, email et téléphone.</li>
            <li><strong>Modifier un surveillant :</strong> Cliquez sur l'icône de modification (crayon) pour éditer les informations.</li>
            <li><strong>Supprimer un surveillant :</strong> Cliquez sur l'icône de suppression (poubelle) pour retirer un surveillant de la liste.</li>
            <li><strong>Rechercher :</strong> Utilisez la barre de recherche pour filtrer les surveillants par nom, prénom ou email.</li>
            <li><strong>Exporter :</strong> Exportez la liste complète en CSV ou Excel pour vos rapports.</li>
          </ul>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Important :</strong> La suppression d'un surveillant n'est possible que s'il n'a pas de disponibilités enregistrées.
              </div>
            </div>
          </div>

          <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Processus recommandé</h4>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Créez d'abord tous vos surveillants dans cette page</li>
            <li>Vérifiez que les informations de contact sont correctes</li>
            <li>Passez ensuite à la création des créneaux</li>
          </ol>
        </div>
      ),
    },
    {
      id: 'creneaux',
      title: 'Créneaux - Gestion des créneaux horaires',
      icon: Clock,
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">Vue d'ensemble</h4>
          <p className="text-gray-700 dark:text-gray-300">
            Les créneaux représentent les plages horaires pendant lesquelles les surveillants peuvent être disponibles pour surveiller des examens.
          </p>
          
          <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Fonctionnalités principales</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>Créer un créneau :</strong> Définissez une date, une heure de début et de fin pour un créneau de surveillance.</li>
            <li><strong>Modifier un créneau :</strong> Ajustez les horaires d'un créneau existant.</li>
            <li><strong>Supprimer un créneau :</strong> Retirez un créneau qui n'est plus nécessaire.</li>
            <li><strong>Filtrer par session :</strong> Visualisez les créneaux d'une session d'examens spécifique.</li>
            <li><strong>Vue calendrier :</strong> Visualisez tous les créneaux dans un format calendrier pour une meilleure planification.</li>
          </ul>

          <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Structure d'un créneau</h4>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• <strong>Date :</strong> Jour du créneau (ex: 15/12/2025)</li>
              <li>• <strong>Heure de début :</strong> Début de la surveillance (ex: 08:30)</li>
              <li>• <strong>Heure de fin :</strong> Fin de la surveillance (ex: 12:30)</li>
              <li>• <strong>Session :</strong> Session d'examens associée</li>
            </ul>
          </div>

          <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Processus recommandé</h4>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Créez une session d'examens (si pas déjà fait)</li>
            <li>Définissez tous les créneaux nécessaires pour la période d'examens</li>
            <li>Vérifiez qu'il n'y a pas de chevauchements problématiques</li>
            <li>Envoyez ensuite les liens de disponibilité aux surveillants</li>
          </ol>
        </div>
      ),
    },
    {
      id: 'disponibilites',
      title: 'Disponibilités - Collecte et gestion',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">Vue d'ensemble</h4>
          <p className="text-gray-700 dark:text-gray-300">
            Cette page centralise toutes les disponibilités soumises par les surveillants pour chaque créneau.
          </p>
          
          <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Fonctionnalités principales</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>Visualiser les disponibilités :</strong> Consultez qui est disponible pour chaque créneau.</li>
            <li><strong>Filtrer :</strong> Filtrez par session, date, ou surveillant spécifique.</li>
            <li><strong>Statistiques :</strong> Voyez le taux de réponse et le nombre de disponibles par créneau.</li>
            <li><strong>Générer un lien de partage :</strong> Créez un lien unique pour que les surveillants puissent soumettre leurs disponibilités.</li>
            <li><strong>Exporter :</strong> Exportez les données en CSV ou Excel pour planification.</li>
            <li><strong>Modifier manuellement :</strong> Ajoutez ou modifiez des disponibilités directement.</li>
          </ul>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
            <h5 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Lien de partage</h5>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Le lien de partage permet aux surveillants de soumettre leurs disponibilités sans avoir besoin de se connecter. 
              Vous pouvez définir une date d'expiration et révoquer le lien à tout moment.
            </p>
          </div>

          <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Processus de collecte</h4>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Créez les créneaux pour votre session d'examens</li>
            <li>Générez un lien de partage depuis cette page</li>
            <li>Envoyez le lien aux surveillants par email</li>
            <li>Suivez les soumissions en temps réel</li>
            <li>Relancez les surveillants qui n'ont pas répondu</li>
            <li>Exportez les données pour planifier les affectations</li>
          </ol>
        </div>
      ),
    },
    {
      id: 'cours',
      title: 'Cours - Gestion des cours',
      icon: BookOpen,
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">Vue d'ensemble</h4>
          <p className="text-gray-700 dark:text-gray-300">
            Cette page permet de gérer le catalogue complet des cours de l'université.
          </p>
          
          <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Fonctionnalités principales</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>Ajouter un cours :</strong> Créez un nouveau cours avec son code et son intitulé complet.</li>
            <li><strong>Modifier un cours :</strong> Mettez à jour les informations d'un cours existant.</li>
            <li><strong>Supprimer un cours :</strong> Retirez un cours du catalogue (uniquement s'il n'a pas d'examens associés).</li>
            <li><strong>Rechercher :</strong> Filtrez les cours par code ou intitulé.</li>
            <li><strong>Importer en masse :</strong> Importez plusieurs cours via un fichier CSV.</li>
            <li><strong>Exporter :</strong> Exportez la liste des cours en CSV ou Excel.</li>
            <li><strong>Consignes :</strong> Ajoutez des consignes spécifiques pour chaque cours (conservées entre sessions).</li>
          </ul>

          <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Structure d'un cours</h4>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• <strong>Code :</strong> Code unique du cours (ex: LBIR1234)</li>
              <li>• <strong>Intitulé complet :</strong> Nom complet du cours</li>
              <li>• <strong>Consignes :</strong> Instructions spécifiques pour la surveillance de ce cours</li>
            </ul>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Détection de doublons :</strong> Le système détecte automatiquement les cours similaires pour éviter les doublons.
              </div>
            </div>
          </div>

          <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Processus recommandé</h4>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Importez ou créez tous les cours de votre faculté</li>
            <li>Vérifiez qu'il n'y a pas de doublons</li>
            <li>Ajoutez les consignes spécifiques si nécessaire</li>
            <li>Passez ensuite à la création des examens</li>
          </ol>
        </div>
      ),
    },
    {
      id: 'examens',
      title: 'Examens - Planification des examens',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">Vue d'ensemble</h4>
          <p className="text-gray-700 dark:text-gray-300">
            Cette page centralise la planification de tous les examens pour une session donnée.
          </p>
          
          <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Fonctionnalités principales</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>Créer un examen :</strong> Planifiez un examen en sélectionnant le cours, la date, l'heure et le local.</li>
            <li><strong>Modifier un examen :</strong> Ajustez les détails d'un examen existant.</li>
            <li><strong>Supprimer un examen :</strong> Annulez un examen planifié.</li>
            <li><strong>Lier à un cours :</strong> Associez un examen à un cours existant du catalogue.</li>
            <li><strong>Nombre de surveillants requis :</strong> Indiquez combien de surveillants sont nécessaires.</li>
            <li><strong>Importer en masse :</strong> Importez plusieurs examens via un fichier CSV.</li>
            <li><strong>Exporter :</strong> Exportez le planning complet en CSV ou Excel.</li>
            <li><strong>Détection d'orphelins :</strong> Identifiez les examens non liés à un cours.</li>
          </ul>

          <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Structure d'un examen</h4>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• <strong>Cours :</strong> Cours associé (lien vers le catalogue)</li>
              <li>• <strong>Date :</strong> Date de l'examen</li>
              <li>• <strong>Heure de début :</strong> Heure de début de l'examen</li>
              <li>• <strong>Heure de fin :</strong> Heure de fin de l'examen</li>
              <li>• <strong>Local :</strong> Salle où se déroule l'examen</li>
              <li>• <strong>Nombre d'étudiants :</strong> Nombre d'étudiants inscrits</li>
              <li>• <strong>Surveillants requis :</strong> Nombre de surveillants nécessaires</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
            <h5 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Import CSV</h5>
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
              Vous pouvez importer plusieurs examens en une fois via un fichier CSV. Format attendu :
            </p>
            <code className="text-xs bg-white dark:bg-gray-900 p-2 rounded block">
              code_cours,date,heure_debut,heure_fin,local,nb_etudiants,surveillants_requis
            </code>
          </div>

          <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Processus recommandé</h4>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Assurez-vous que tous les cours sont créés</li>
            <li>Importez ou créez tous les examens de la session</li>
            <li>Vérifiez que tous les examens sont liés à un cours</li>
            <li>Définissez le nombre de surveillants requis pour chaque examen</li>
            <li>Envoyez les liens de déclaration de présence aux enseignants</li>
          </ol>
        </div>
      ),
    },
    {
      id: 'presences',
      title: 'Présences - Déclarations des enseignants',
      icon: CheckSquare,
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">Vue d'ensemble</h4>
          <p className="text-gray-700 dark:text-gray-300">
            Cette page centralise toutes les déclarations de présence des enseignants pour leurs examens.
          </p>
          
          <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Fonctionnalités principales</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>Visualiser les déclarations :</strong> Consultez toutes les présences déclarées par cours.</li>
            <li><strong>Filtrer :</strong> Filtrez par session, cours, ou enseignant.</li>
            <li><strong>Statistiques :</strong> Voyez le taux de réponse des enseignants.</li>
            <li><strong>Type de présence :</strong> Identifiez si l'enseignant sera présent (complet/partiel) ou absent.</li>
            <li><strong>Type d'examen :</strong> Consultez le type d'examen déclaré (écrit, QCM, oral, etc.).</li>
            <li><strong>Durée d'examen :</strong> Voyez si l'examen dure moins de 2h et sa durée exacte.</li>
            <li><strong>Surveillants accompagnants :</strong> Nombre total de surveillants nécessaires déclaré par l'enseignant.</li>
            <li><strong>Exporter :</strong> Exportez toutes les déclarations en CSV ou Excel.</li>
          </ul>

          <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Types de présence</h4>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• <strong>Présent surveillance complète :</strong> L'enseignant assure toute la surveillance (retire 1 surveillant du besoin)</li>
              <li>• <strong>Présent partiellement :</strong> L'enseignant est présent mais pas pour toute la durée (compte 1 surveillant)</li>
              <li>• <strong>Absent :</strong> L'enseignant ne sera pas présent</li>
            </ul>
          </div>

          <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Informations collectées</h4>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• Nom et prénom de l'enseignant</li>
              <li>• Email de contact</li>
              <li>• Type de présence</li>
              <li>• Type d'examen (écrit, QCM, oral, QROC, etc.)</li>
              <li>• Durée de l'examen (si moins de 2h)</li>
              <li>• Nombre total de surveillants nécessaires</li>
              <li>• Noms des surveillants accompagnants</li>
              <li>• Consignes et remarques spécifiques</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
            <h5 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Coordination entre enseignants</h5>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Si plusieurs enseignants déclarent pour le même cours, le système les alerte et pré-remplit 
              le nombre de surveillants avec le total déjà déclaré pour faciliter la coordination.
            </p>
          </div>

          <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Processus de collecte</h4>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Créez tous les examens dans le système</li>
            <li>Partagez le lien de déclaration de présence avec les enseignants</li>
            <li>Les enseignants remplissent le formulaire pour leurs cours</li>
            <li>Consultez les déclarations dans cette page</li>
            <li>Utilisez ces informations pour planifier les surveillances</li>
            <li>Exportez les données pour vos rapports</li>
          </ol>
        </div>
      ),
    },
    {
      id: 'workflow',
      title: 'Processus complet de gestion',
      icon: HelpCircle,
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">Workflow recommandé</h4>
          <p className="text-gray-700 dark:text-gray-300">
            Voici le processus complet pour gérer une session d'examens de A à Z :
          </p>

          <div className="space-y-6 mt-6">
            <div className="border-l-4 border-indigo-500 pl-4">
              <h5 className="font-semibold text-gray-900 dark:text-white">Phase 1 : Préparation</h5>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 mt-2">
                <li>Créez ou activez la session d'examens</li>
                <li>Importez ou créez tous les cours</li>
                <li>Créez tous les surveillants dans le système</li>
              </ol>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h5 className="font-semibold text-gray-900 dark:text-white">Phase 2 : Planification</h5>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 mt-2">
                <li>Créez tous les créneaux de surveillance</li>
                <li>Importez ou créez tous les examens</li>
                <li>Liez chaque examen à son cours</li>
                <li>Définissez le nombre de surveillants requis par examen</li>
              </ol>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h5 className="font-semibold text-gray-900 dark:text-white">Phase 3 : Collecte des disponibilités</h5>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 mt-2">
                <li>Générez un lien de partage pour les disponibilités</li>
                <li>Envoyez le lien aux surveillants</li>
                <li>Suivez les soumissions en temps réel</li>
                <li>Relancez les surveillants qui n'ont pas répondu</li>
              </ol>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h5 className="font-semibold text-gray-900 dark:text-white">Phase 4 : Collecte des présences enseignants</h5>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 mt-2">
                <li>Partagez le lien de déclaration de présence avec les enseignants</li>
                <li>Les enseignants déclarent leur présence et le nombre de surveillants</li>
                <li>Consultez les déclarations dans la page Présences</li>
              </ol>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <h5 className="font-semibold text-gray-900 dark:text-white">Phase 5 : Affectation et suivi</h5>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 mt-2">
                <li>Exportez les disponibilités et les présences</li>
                <li>Planifiez les affectations des surveillants</li>
                <li>Communiquez les plannings aux surveillants et enseignants</li>
              </ol>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Guide d'utilisation
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Documentation complète pour utiliser la plateforme de gestion des surveillances
        </p>
      </div>

      <div className="space-y-4">
        {sections.map((section) => {
          const isExpanded = expandedSections.includes(section.id);
          const Icon = section.icon;

          return (
            <div
              key={section.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {section.title}
                  </h2>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                )}
              </button>

              {isExpanded && (
                <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="pt-6">{section.content}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6">
        <h3 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-2">
          Besoin d'aide supplémentaire ?
        </h3>
        <p className="text-sm text-indigo-800 dark:text-indigo-300">
          Pour toute question ou assistance, contactez le secrétariat au <strong>02/436.16.89</strong>
        </p>
      </div>
    </div>
  );
}
