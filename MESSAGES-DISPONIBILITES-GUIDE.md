# Guide - Messages des Disponibilités

## Vue d'ensemble

La page **Messages des Disponibilités** permet aux administrateurs de consulter facilement tous les messages laissés par les surveillants lors de la soumission de leurs disponibilités.

## Accès

**Navigation :** Admin → Surveillants → Messages

**Permissions :** Accessible à tous les utilisateurs admin (pas uniquement RaphD)

## Fonctionnalités

### 1. Affichage des messages

La page affiche un tableau avec :
- **Surveillant** : Nom, prénom, email et type
- **Session** : Session concernée
- **Message** : Le message laissé (remarque générale)
- **Date** : Date et heure de soumission, avec indication si modifié
- **Statut** : Badge indiquant si le message est traité ou non

### 2. Statistiques

Quatre indicateurs en haut de page :
- **Total de soumissions** : Nombre total de soumissions dans la base
- **Avec message** : Nombre de soumissions contenant un message
- **Messages traités** : Nombre de messages marqués comme traités
- **Affichés (filtrés)** : Nombre de messages après application des filtres

### 3. Filtres

#### Recherche textuelle
- Recherche dans : nom, prénom, email, contenu du message
- Temps réel avec bouton de réinitialisation

#### Filtre par session
- Menu déroulant avec toutes les sessions disponibles
- Option "Toutes les sessions" par défaut

#### Filtre par statut
- Menu déroulant avec trois options : Tous / Non traités / Traités
- Permet de se concentrer sur les messages nécessitant une action

#### Toggle "Uniquement avec message"
- Activé par défaut
- Masque les soumissions sans message pour se concentrer sur les communications importantes

### 4. Gestion du statut

Chaque message peut être marqué comme "Traité" :
- **Bouton "Marquer fait"** : Marque le message comme traité
- **Badge "Traité"** : Indique que le message a été traité (vert)
- **Informations de traitement** : Affiche qui a traité le message et quand
- **Toggle du statut** : Cliquer à nouveau pour annuler le statut

Le système enregistre automatiquement :
- L'utilisateur qui a marqué le message comme traité
- La date et l'heure du traitement

### 5. Filtre par statut

Menu déroulant permettant de filtrer les messages par statut :
- **Tous les statuts** : Affiche tous les messages
- **Non traités** : Uniquement les messages en attente de traitement
- **Traités** : Uniquement les messages déjà traités

### 6. Export

Bouton d'export en haut à droite permettant d'exporter les données filtrées en :
- **CSV** : Format texte compatible avec tous les tableurs
- **XLSX** : Format Excel avec mise en forme

**Colonnes exportées :**
- Nom
- Prénom
- Email
- Type
- Session
- Message
- Statut (Traité / Non traité)
- Traité par
- Traité le
- Date de soumission
- Dernière modification

**Nom du fichier :** `messages-disponibilites-YYYY-MM-DD.csv/xlsx`

## Cas d'usage

### 1. Suivi des demandes spéciales
Les surveillants peuvent indiquer des contraintes particulières dans leurs messages :
- Disponibilités partielles
- Préférences d'horaires
- Situations personnelles

### 2. Communication proactive
Identifier rapidement les surveillants ayant laissé des messages nécessitant une attention particulière.

### 3. Analyse des retours
Exporter les messages pour analyse ou archivage des communications.

### 4. Vérification des soumissions
Croiser les messages avec les disponibilités déclarées pour détecter d'éventuelles incohérences.

### 5. Suivi du traitement
Marquer les messages comme traités pour garder une trace des actions effectuées et éviter les doublons de traitement.

## Interface technique

### Champs de base de données

Les messages et leur statut sont stockés dans la table `soumissions_disponibilites` :
- `remarque_generale` : Le message laissé par le surveillant
- `message_traite` : Boolean indiquant si le message a été traité
- `message_traite_par` : Username de l'admin qui a traité le message
- `message_traite_le` : Date et heure du traitement

### Requête SQL
```sql
SELECT 
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
  message_traite_le
FROM soumissions_disponibilites
WHERE deleted_at IS NULL
ORDER BY submitted_at DESC
```

### Jointure avec sessions
La requête joint automatiquement avec la table `sessions` pour afficher le nom de la session.

## Bonnes pratiques

1. **Activer le filtre "Uniquement avec message"** pour se concentrer sur les communications importantes

2. **Utiliser le filtre "Non traités"** pour voir rapidement les messages nécessitant une action

3. **Marquer les messages comme traités** après avoir pris en compte la demande du surveillant

4. **Utiliser la recherche** pour retrouver rapidement un surveillant spécifique

5. **Filtrer par session** lors de la préparation d'une session d'examens

6. **Exporter régulièrement** les messages pour archivage et suivi

7. **Vérifier les dates de modification** pour identifier les mises à jour récentes

## Améliorations futures possibles

- [x] Marquer les messages comme "traités" ✅
- [ ] Ajouter des réponses aux messages
- [ ] Système de tags/catégories pour les messages
- [ ] Notifications pour les nouveaux messages
- [ ] Statistiques sur les types de messages reçus
- [ ] Filtres avancés (par type de surveillant, par date, etc.)
- [ ] Historique des changements de statut

## Support

Pour toute question ou suggestion d'amélioration, contacter l'équipe de développement.
