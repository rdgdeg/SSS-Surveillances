# Guide - Extraction des emails des surveillants

## Vue d'ensemble

Cette fonctionnalité permet d'extraire rapidement les adresses emails de tous les surveillants actifs assignés à un examen spécifique, pour faciliter l'envoi groupé de consignes par email.

## Fonctionnalités

### 🎯 Objectif
- Obtenir rapidement la liste des emails des surveillants d'un examen
- Copier-coller facilement ces emails dans un client de messagerie
- Éviter les erreurs en excluant automatiquement les surveillants remplacés

### ✨ Caractéristiques
- **Surveillants actifs uniquement** : Exclut automatiquement les surveillants qui ont été remplacés
- **Inclut les remplaçants** : Prend en compte les nouveaux surveillants assignés en remplacement
- **Format prêt à l'emploi** : Emails séparés par des points-virgules, compatible avec tous les clients email
- **Copie en un clic** : Bouton pour copier tous les emails dans le presse-papiers
- **Interface claire** : Affichage de la liste des surveillants avec leurs emails respectifs

## Utilisation

### 1. Accès à la fonctionnalité
1. Aller dans **Admin > Examens**
2. Localiser l'examen souhaité dans la liste
3. Cliquer sur le bouton **"Emails"** (icône enveloppe verte) à côté du bouton "Gérer"

### 2. Extraction des emails
1. La modal s'ouvre et affiche :
   - Le nombre de surveillants actifs
   - La liste détaillée des surveillants avec leurs emails
   - La zone de texte avec tous les emails formatés

2. Cliquer sur **"Copier tous les emails"** pour copier la liste dans le presse-papiers

### 3. Envoi des consignes
1. Ouvrir votre client email (Outlook, Gmail, etc.)
2. Créer un nouveau message
3. Coller les emails dans le champ "À" ou "Cci" (recommandé pour la confidentialité)
4. Rédiger vos consignes d'examen
5. Envoyer

## Logique de filtrage

### Surveillants inclus ✅
- Surveillants assignés à des auditoires spécifiques
- Surveillants assignés pour "répartition par le secrétariat"
- Nouveaux surveillants assignés en remplacement

### Surveillants exclus ❌
- Surveillants qui ont été remplacés (anciens surveillants)
- Surveillants inactifs dans la base de données
- Surveillants non assignés à l'examen

## Format de sortie

```
email1@uclouvain.be; email2@uclouvain.be; email3@uclouvain.be
```

Ce format est compatible avec :
- Microsoft Outlook
- Gmail
- Apple Mail
- Thunderbird
- Tous les clients email standards

## Cas d'usage typiques

### 📧 Envoi de consignes générales
- Instructions de surveillance
- Horaires et lieux de rendez-vous
- Procédures spécifiques à l'examen

### 📋 Communications administratives
- Modifications de dernière minute
- Rappels importants
- Informations logistiques

### 🔄 Suivi post-examen
- Demandes de rapports
- Remerciements
- Feedback

## Bonnes pratiques

### 🔒 Confidentialité
- Utiliser le champ "Cci" (copie cachée) pour préserver la confidentialité des adresses
- Éviter le champ "À" qui expose tous les emails aux destinataires

### ✍️ Rédaction
- Utiliser un objet clair : "Consignes examen [CODE_EXAMEN] - [DATE]"
- Inclure toutes les informations essentielles dans le corps du message
- Prévoir un délai suffisant avant l'examen

### 🎯 Ciblage
- Vérifier que la liste correspond bien aux surveillants effectivement assignés
- Utiliser cette fonctionnalité après finalisation des attributions

## Dépannage

### Aucun email affiché
- Vérifier que des surveillants sont bien assignés à l'examen
- S'assurer que les surveillants ont des adresses email valides dans la base

### Emails manquants
- Vérifier les remplacements récents
- Contrôler que les surveillants sont bien actifs

### Problème de copie
- Essayer de sélectionner manuellement le texte et copier (Ctrl+C)
- Vérifier les permissions du navigateur pour le presse-papiers

## Intégration

Cette fonctionnalité s'intègre parfaitement avec :
- **Gestion des auditoires** : Les emails reflètent les attributions actuelles
- **Système de remplacements** : Prise en compte automatique des changements
- **Gestion des surveillants** : Utilise les données à jour de la base

---

*Cette fonctionnalité simplifie grandement la communication avec les équipes de surveillance et garantit que seuls les surveillants effectivement présents reçoivent les consignes.*