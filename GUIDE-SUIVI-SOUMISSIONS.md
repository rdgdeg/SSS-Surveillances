# Guide du Suivi des Soumissions et Relances

## 📋 Vue d'ensemble

La page **Relances** permet de suivre les soumissions de disponibilités et d'identifier facilement qui doit encore soumettre ses disponibilités.

### Personnes concernées
Seuls les surveillants suivants sont **obligés** de soumettre leurs disponibilités :
- ✅ **Assistants** (tous)
- ✅ **Personnel PAT de la faculté FASB**

Les autres types de surveillants (PAT autres facultés, jobistes, etc.) ne sont pas affichés dans cette page.

---

## 🚀 Accès à la page

1. Connectez-vous à l'interface admin
2. Cliquez sur **"Relances"** dans le menu de navigation
3. La page affiche automatiquement les statistiques de la session active

---

## 📊 Statistiques affichées

### Cartes de statistiques
- **Total concernés** : Nombre total d'assistants + PAT FASB actifs
- **Ont soumis** : Nombre de personnes ayant soumis leurs disponibilités (avec pourcentage)
- **En attente** : Nombre de personnes n'ayant pas encore soumis (excluant les dispensés)
- **Dispensés** : Nombre de personnes dispensées de surveillance

### Calcul du taux de soumission
```
Taux = (Nombre de soumissions / (Total - Dispensés)) × 100
```

Les personnes dispensées ne sont **pas** comptées dans le calcul du taux de soumission.

---

## 🔍 Filtres disponibles

Utilisez les boutons de filtre pour afficher :

### Tous (par défaut)
Affiche tous les surveillants concernés, quel que soit leur statut.

### Ont soumis ✅
Affiche uniquement les surveillants ayant déjà soumis leurs disponibilités.
- Badge vert "Soumis"
- Date et heure de soumission affichées

### En attente ⚠️
**Filtre le plus utile pour les relances !**
Affiche uniquement les surveillants qui :
- N'ont **pas** encore soumis leurs disponibilités
- Ne sont **pas** dispensés

C'est la liste des personnes à relancer.

### Dispensés 🔵
Affiche uniquement les surveillants dispensés de surveillance.
- Badge bleu "Dispensé"
- Ces personnes ne sont plus comptées dans les statistiques

---

## 🎯 Actions disponibles

### Dispenser un surveillant

Si un surveillant ne doit **pas** participer aux surveillances (congé, absence, etc.) :

1. Trouvez le surveillant dans la liste
2. Cliquez sur le bouton **"Dispenser"**
3. Le statut passe à "Dispensé" (badge bleu)
4. Il n'apparaît plus dans le filtre "En attente"
5. Il n'est plus compté dans le taux de soumission

### Réintégrer un surveillant

Si un surveillant dispensé doit finalement participer :

1. Filtrez par "Dispensés"
2. Trouvez le surveillant
3. Cliquez sur le bouton **"Réintégrer"**
4. Le statut revient à "En attente" ou "Soumis" selon le cas
5. Il est à nouveau compté dans les statistiques

### Contacter un surveillant

Cliquez sur l'email du surveillant pour ouvrir votre client email avec l'adresse pré-remplie.

---

## 📧 Processus de relance recommandé

### 1. Première relance (J-7 avant la deadline)

```sql
-- Filtrer par "En attente"
-- Exporter la liste des emails
```

**Modèle d'email :**
```
Objet : Rappel - Déclaration de disponibilités [Session]

Bonjour,

Nous vous rappelons que vous devez soumettre vos disponibilités 
pour la session [nom de la session] avant le [date limite].

Lien : [URL du formulaire]

Cordialement,
```

### 2. Deuxième relance (J-3 avant la deadline)

Filtrez à nouveau par "En attente" et relancez uniquement ceux qui n'ont toujours pas soumis.

### 3. Relance finale (J-1)

Relance individuelle par email ou téléphone si nécessaire.

---

## 💡 Cas d'usage

### Identifier rapidement qui relancer

1. Allez sur la page "Relances"
2. Cliquez sur le filtre **"En attente"**
3. Vous avez la liste exacte des personnes à relancer
4. Utilisez les emails cliquables pour les contacter

### Gérer les absences

Un assistant est en congé parental :
1. Trouvez-le dans la liste
2. Cliquez sur **"Dispenser"**
3. Il ne sera plus compté comme "en attente"
4. Vous pouvez ajouter une note dans ses informations de surveillant

### Suivre l'évolution des soumissions

Consultez régulièrement les statistiques :
- Le taux de soumission augmente au fil du temps
- Le nombre "En attente" diminue
- Identifiez les retardataires persistants

### Exporter la liste pour relance groupée

1. Filtrez par "En attente"
2. Copiez les emails depuis le tableau
3. Collez dans le champ BCC de votre client email
4. Envoyez une relance groupée

---

## 🔧 Avant d'utiliser cette page

### Prérequis en base de données

Exécutez le script SQL pour ajouter le champ `dispense_surveillance` :

```bash
# Dans Supabase SQL Editor
# Exécutez le fichier: supabase-add-dispense-field.sql
```

Ce script :
- Ajoute le champ `dispense_surveillance` (boolean, défaut: false)
- Crée un index pour les performances
- Est idempotent (peut être exécuté plusieurs fois sans problème)

### Vérification

Après exécution du script, vérifiez :

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'surveillants' 
AND column_name = 'dispense_surveillance';
```

Vous devriez voir :
```
column_name            | data_type | column_default
-----------------------|-----------|---------------
dispense_surveillance  | boolean   | false
```

---

## 📈 Interprétation des statistiques

### Taux de soumission sain
- **> 80%** : Excellent, la majorité a soumis
- **60-80%** : Bon, quelques relances nécessaires
- **40-60%** : Moyen, relances urgentes
- **< 40%** : Faible, action immédiate requise

### Nombre "En attente"
- Si ce nombre est élevé proche de la deadline → relances intensives
- Si ce nombre stagne → identifier les blocages (email incorrect, absence, etc.)

### Utilisation des dispenses
- Utilisez les dispenses pour les absences longues (congé, maladie)
- Ne dispensez pas quelqu'un qui est juste en retard de soumission
- Les dispenses sont réversibles à tout moment

---

## ⚠️ Points d'attention

### Dispenses vs Désactivation
- **Dispense** : Temporaire, pour une session spécifique
- **Désactivation** (is_active = false) : Permanent, le surveillant n'apparaît nulle part

Utilisez les dispenses pour les absences temporaires.

### Synchronisation avec les soumissions
Si un surveillant dispensé soumet quand même ses disponibilités :
- Sa soumission est enregistrée normalement
- Il reste marqué comme "dispensé"
- Vous pouvez le réintégrer pour qu'il soit compté

### Emails en minuscules
Les emails sont comparés en minuscules pour éviter les doublons.
`Jean.Dupont@uclouvain.be` = `jean.dupont@uclouvain.be`

---

## 🎨 Codes couleur

- 🟢 **Vert** : Soumis (tout va bien)
- 🟠 **Orange** : En attente (action requise)
- 🔵 **Bleu** : Dispensé (exclu des statistiques)

---

## 📝 Notes

- Les données sont mises à jour en temps réel
- Les changements de statut (dispense/réintégration) sont immédiats
- La page se recharge automatiquement après chaque action
- Les toasts confirment chaque action réussie

---

## 🆘 Dépannage

### La page est vide
- Vérifiez qu'une session est active
- Vérifiez qu'il y a des assistants ou PAT FASB dans la base

### Un surveillant n'apparaît pas
- Vérifiez son type (doit être 'assistant' ou 'pat')
- Si PAT, vérifiez que `affectation_faculte = 'FASB'`
- Vérifiez que `is_active = true`

### Le taux de soumission semble incorrect
- Vérifiez que les dispenses sont correctement appliquées
- Le taux exclut les dispensés du dénominateur

### Erreur lors de la dispense
- Vérifiez que le champ `dispense_surveillance` existe dans la table
- Exécutez le script `supabase-add-dispense-field.sql`
