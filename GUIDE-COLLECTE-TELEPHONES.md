# Guide de collecte des téléphones manquants

Ce guide explique comment utiliser le nouveau système de collecte automatique des numéros de téléphone des surveillants.

## 🎯 Objectif

Permettre aux surveillants de renseigner facilement leur numéro de téléphone via un formulaire web simple, sans nécessiter d'accès admin.

## 🔗 Lien du formulaire

**URL directe :** `https://votre-site.com/#/telephone`

## 📋 Processus de collecte

### 1. Identifier les téléphones manquants

1. Aller dans **Admin → Surveillants → Contacts**
2. Sélectionner le filtre **"Sans téléphone"**
3. Voir immédiatement le nombre de contacts sans téléphone

### 2. Exporter la liste des emails

1. Cliquer sur **"Exporter emails sans téléphone"**
2. Obtenir un fichier CSV avec tous les emails concernés
3. Utiliser cette liste pour l'envoi groupé d'emails

### 3. Préparer l'email de demande

1. Cliquer sur **"Copier message email"**
2. Le message complet est copié dans le presse-papiers
3. Coller dans votre client email (Outlook, Gmail, etc.)

### 4. Envoyer le lien direct

1. Cliquer sur **"Copier le lien"**
2. Le lien `https://votre-site.com/#/telephone` est copié
3. Utiliser ce lien dans vos communications

## 📝 Message email type

```
Bonjour,

Dans le cadre de l'organisation des surveillances d'examens, nous avons besoin de votre numéro de téléphone pour pouvoir vous contacter en cas d'urgence ou de changement de dernière minute.

Pourriez-vous prendre 2 minutes pour renseigner votre numéro de téléphone via ce lien sécurisé :

https://votre-site.com/#/telephone

Il vous suffit de :
1. Saisir votre adresse email UCLouvain
2. Indiquer votre numéro de téléphone
3. Valider

Vos informations seront automatiquement mises à jour dans notre système.

Merci d'avance pour votre collaboration !

Cordialement,
L'équipe de gestion des surveillances
```

## 🔧 Fonctionnement du formulaire

### Pour les surveillants :

1. **Accès au formulaire** : Clic sur le lien reçu par email
2. **Saisie email** : Leur adresse UCLouvain habituelle
3. **Saisie téléphone** : Numéro au format belge ou international
4. **Validation** : Vérification automatique que l'email existe
5. **Confirmation** : Message de succès avec récapitulatif

### Sécurité et validation :

- ✅ **Vérification email** : Seuls les emails de surveillants actifs sont acceptés
- ✅ **Validation format** : Email et téléphone vérifiés côté client et serveur
- ✅ **Mise à jour directe** : Sauvegarde automatique dans la base de données
- ✅ **Pas d'authentification** : Accès libre mais sécurisé par validation email

## 📊 Suivi des résultats

### Dans l'interface admin :

1. **Statistiques en temps réel** : Compteurs mis à jour automatiquement
2. **Filtre "Avec téléphone"** : Voir les nouveaux numéros ajoutés
3. **Historique** : Tous les téléphones sont horodatés

### Indicateurs de succès :

- **Compteur "Sans téléphone"** diminue
- **Compteur "Avec téléphone"** augmente
- **Export CSV** montre les nouveaux numéros

## 🚀 Avantages

### Pour l'administration :
- **Automatisation complète** : Plus de saisie manuelle
- **Gain de temps** : Envoi groupé d'emails
- **Suivi en temps réel** : Statistiques instantanées
- **Réduction d'erreurs** : Saisie directe par les intéressés

### Pour les surveillants :
- **Simplicité** : 2 champs à remplir
- **Rapidité** : Moins de 2 minutes
- **Accessibilité** : Fonctionne sur mobile et desktop
- **Confirmation** : Message de succès immédiat

## 💡 Conseils d'utilisation

1. **Timing** : Envoyer les demandes en début de semaine
2. **Relance** : Utiliser le filtre pour identifier les non-répondants
3. **Communication** : Expliquer l'importance du téléphone (urgences)
4. **Suivi** : Vérifier régulièrement les statistiques

## 🔄 Workflow complet

```
1. Admin → Contacts → Filtre "Sans téléphone"
2. Exporter la liste des emails
3. Copier le message email type
4. Envoyer à tous les emails de la liste
5. Suivre l'évolution via les statistiques
6. Relancer si nécessaire après quelques jours
```

## 📱 Responsive

Le formulaire fonctionne parfaitement sur :
- 💻 **Desktop** : Interface complète
- 📱 **Mobile** : Optimisé pour smartphone
- 📟 **Tablette** : Adaptation automatique

---

**Résultat attendu :** Collecte rapide et efficace de tous les numéros de téléphone manquants avec un minimum d'effort administratif.