# Guide d'Export des Disponibilités

## Vue d'ensemble

L'application permet maintenant d'exporter les disponibilités des surveillants en format matriciel Excel, facilitant le partage et l'analyse des données.

## Fonctionnalités

### Export Matriciel

L'export matriciel présente les données sous forme de tableau croisé :
- **Lignes** : Surveillants (avec nom, prénom, email, type)
- **Colonnes** : Créneaux de surveillance (date + heure)
- **Cellules** : ✓ si le surveillant est disponible pour ce créneau

### Accès à l'Export

1. Accédez à la page **Admin > Disponibilités**
2. Cliquez sur le bouton **"Exporter (Excel)"** dans la barre d'outils
3. Le fichier Excel sera téléchargé automatiquement

### Format du Fichier

Le fichier Excel exporté contient :
- **Nom** : Nom du surveillant
- **Prénom** : Prénom du surveillant
- **Email** : Adresse email
- **Type** : Type de surveillant (Assistant, PAT, etc.)
- **Nb créneaux** : Nombre total de créneaux sélectionnés
- **Colonnes de créneaux** : Une colonne par créneau avec ✓ si disponible

Exemple de structure :

| Nom | Prénom | Email | Type | Nb créneaux | 04/12/2025 17:30 | 08/12/2025 12:45 | ... |
|-----|--------|-------|------|-------------|------------------|------------------|-----|
| Dupont | Jean | jean.dupont@uclouvain.be | Assistant | 15 | ✓ | ✓ | ... |
| Martin | Marie | marie.martin@uclouvain.be | PAT | 12 | | ✓ | ... |

## Cas d'Usage

### Partage avec les Coordinateurs

L'export Excel permet de :
- Partager facilement les disponibilités avec les coordinateurs de session
- Identifier rapidement les créneaux sous-dotés
- Planifier les attributions de surveillance

### Analyse des Données

Le format matriciel facilite :
- La visualisation globale des disponibilités
- L'identification des surveillants les plus disponibles
- La détection des créneaux problématiques

### Communication

Le fichier peut être :
- Envoyé par email aux parties prenantes
- Partagé via OneDrive/SharePoint
- Imprimé pour les réunions de planification

## Filtres et Recherche

Avant d'exporter, vous pouvez :
- **Filtrer par type** : Exporter uniquement certains types de surveillants
- **Rechercher** : Filtrer par nom/prénom avant l'export
- Les filtres appliqués sont pris en compte dans l'export

## Notes Techniques

- Format : Excel (.xlsx)
- Encodage : UTF-8 avec BOM
- Tri : Par nom puis prénom
- Créneaux : Triés par date puis heure

## Partage via Lien Public

### Génération d'un Lien de Partage

1. Accédez à la page **Admin > Disponibilités**
2. Cliquez sur le bouton **"Partager"**
3. Dans le modal, configurez la durée d'expiration (par défaut : 30 jours)
4. Cliquez sur **"Générer un lien"**
5. Le lien est automatiquement copié dans le presse-papiers

### Caractéristiques du Lien

- **Accès en lecture seule** : Aucune modification possible
- **Sécurisé** : Token unique et non devinable
- **Temporaire** : Expiration configurable (1-365 jours)
- **Révocable** : Possibilité de révoquer un lien à tout moment

### Gestion des Liens

Dans le modal de partage, vous pouvez :
- Voir tous les liens actifs
- Copier un lien existant
- Révoquer un lien (le rend immédiatement inaccessible)
- Voir les dates de création et d'expiration

### Cas d'Usage du Partage

- Partager avec des coordinateurs externes
- Donner accès temporaire à des consultants
- Permettre la consultation sans accès admin
- Partager lors de réunions de planification

## Améliorations Futures Possibles

- Export en format PDF pour impression
- Export avec statistiques de remplissage par créneau
- Envoi automatique par email aux coordinateurs
- Notifications d'expiration de lien
