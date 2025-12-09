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

### 2. Statistiques

Trois indicateurs en haut de page :
- **Total de soumissions** : Nombre total de soumissions dans la base
- **Avec message** : Nombre de soumissions contenant un message
- **Affichés (filtrés)** : Nombre de messages après application des filtres

### 3. Filtres

#### Recherche textuelle
- Recherche dans : nom, prénom, email, contenu du message
- Temps réel avec bouton de réinitialisation

#### Filtre par session
- Menu déroulant avec toutes les sessions disponibles
- Option "Toutes les sessions" par défaut

#### Toggle "Uniquement avec message"
- Activé par défaut
- Masque les soumissions sans message pour se concentrer sur les communications importantes

### 4. Export

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

## Interface technique

### Champ de base de données
Les messages sont stockés dans la colonne `remarque_generale` de la table `soumissions_disponibilites`.

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
  updated_at
FROM soumissions_disponibilites
WHERE deleted_at IS NULL
ORDER BY submitted_at DESC
```

### Jointure avec sessions
La requête joint automatiquement avec la table `sessions` pour afficher le nom de la session.

## Bonnes pratiques

1. **Activer le filtre "Uniquement avec message"** pour se concentrer sur les communications importantes

2. **Utiliser la recherche** pour retrouver rapidement un surveillant spécifique

3. **Filtrer par session** lors de la préparation d'une session d'examens

4. **Exporter régulièrement** les messages pour archivage et suivi

5. **Vérifier les dates de modification** pour identifier les mises à jour récentes

## Améliorations futures possibles

- [ ] Marquer les messages comme "lus" ou "traités"
- [ ] Ajouter des réponses aux messages
- [ ] Système de tags/catégories pour les messages
- [ ] Notifications pour les nouveaux messages
- [ ] Statistiques sur les types de messages reçus
- [ ] Filtres avancés (par type de surveillant, par date, etc.)

## Support

Pour toute question ou suggestion d'amélioration, contacter l'équipe de développement.
