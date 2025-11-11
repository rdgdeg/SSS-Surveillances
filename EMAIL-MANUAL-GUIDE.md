# Guide de Gestion Manuelle des Emails

## 📧 Vue d'Ensemble

Ce guide vous aide à gérer efficacement les notifications email manuellement, en attendant une éventuelle automatisation future.

---

## 🎯 Types d'Emails à Envoyer

### 1. **Ouverture de Session** (Priorité: Haute)

**Quand** : Dès qu'une nouvelle session est activée

**À qui** : Tous les surveillants actifs

**Contenu suggéré** :
```
Objet : Nouvelle session [NOM SESSION] - Soumettez vos disponibilités avant le [DATE]

Bonjour [Prénom],

La session [NOM SESSION] est maintenant ouverte.

Veuillez soumettre vos disponibilités avant le [DATE LIMITE] via ce lien :
https://sss-surveillances.vercel.app/

Merci de votre collaboration.

Cordialement,
Service de Gestion des Surveillances
UCLouvain
```

**Comment faire** :
1. Aller dans l'onglet "Surveillants"
2. Filtrer par "Actifs"
3. Exporter la liste en CSV
4. Utiliser Outlook/Gmail avec publipostage ou BCC

---

### 2. **Rappels Avant Date Limite** (Priorité: Haute)

**Quand** : J-7, J-3, J-1 avant la date limite

**À qui** : Surveillants qui n'ont PAS encore soumis

**Comment identifier les non-soumis** :
1. Aller dans "Suivi des Soumissions"
2. Voir la liste des "Non soumis"
3. Copier les emails

**Contenu suggéré J-7** :
```
Objet : Rappel : Plus que 7 jours pour soumettre vos disponibilités

Bonjour [Prénom],

Nous n'avons pas encore reçu vos disponibilités pour la session [NOM SESSION].

Date limite : [DATE] (dans 7 jours)

Lien : https://sss-surveillances.vercel.app/

Merci de votre attention.
```

**Contenu suggéré J-1** (Plus urgent) :
```
Objet : URGENT : Dernière chance - Soumission demain !

Bonjour [Prénom],

⚠️ ATTENTION : La date limite pour soumettre vos disponibilités est DEMAIN ([DATE]).

Nous n'avons toujours pas reçu votre soumission.

Merci de compléter le formulaire dès que possible :
https://sss-surveillances.vercel.app/

En cas de problème, contactez-nous immédiatement.
```

---

### 3. **Confirmation de Soumission** (Priorité: Moyenne)

**Quand** : Après chaque soumission (optionnel si charge trop importante)

**À qui** : Le surveillant qui vient de soumettre

**Comment** : 
- Voir les nouvelles soumissions dans "Suivi des Soumissions"
- Envoyer un email de confirmation

**Contenu suggéré** :
```
Objet : Confirmation : Vos disponibilités ont été enregistrées

Bonjour [Prénom],

Nous confirmons la réception de vos disponibilités pour la session [NOM SESSION].

Date de soumission : [DATE ET HEURE]
Nombre de créneaux sélectionnés : [NOMBRE]

Vous pouvez modifier vos disponibilités à tout moment via :
https://sss-surveillances.vercel.app/

Merci de votre participation.
```

---

### 4. **Modification de Créneaux** (Priorité: Haute)

**Quand** : Si vous modifiez/supprimez un créneau

**À qui** : Surveillants disponibles pour ce créneau

**Comment identifier** :
1. Aller dans "Disponibilités"
2. Voir qui est disponible pour le créneau modifié
3. Noter leurs emails

**Contenu suggéré** :
```
Objet : Important : Modification du créneau [DATE HEURE]

Bonjour [Prénom],

Le créneau suivant pour lequel vous vous êtes déclaré(e) disponible a été modifié :

AVANT :
- Date : [ANCIENNE DATE]
- Heure : [ANCIENNE HEURE]

APRÈS :
- Date : [NOUVELLE DATE]
- Heure : [NOUVELLE HEURE]

Merci de vérifier si vous êtes toujours disponible et de mettre à jour vos disponibilités si nécessaire :
https://sss-surveillances.vercel.app/

En cas de question, contactez-nous.
```

---

## 📊 Outils Recommandés

### Option 1 : Outlook (Recommandé pour UCLouvain)

**Avantages** :
- Intégré à l'environnement UCLouvain
- Publipostage facile avec Excel
- Suivi des emails

**Comment faire un publipostage** :
1. Exporter la liste des emails en CSV depuis l'application
2. Ouvrir Outlook
3. Nouveau message → Publipostage
4. Sélectionner le fichier CSV
5. Insérer les champs (Prénom, Nom, etc.)
6. Envoyer

### Option 2 : Gmail avec BCC

**Avantages** :
- Simple et rapide
- Gratuit

**Limites** :
- Pas de personnalisation (pas de [Prénom])
- Limite de 500 destinataires/jour

**Comment faire** :
1. Nouveau message
2. Mettre tous les emails en BCC (copie cachée)
3. Envoyer

### Option 3 : Service de Mailing (Mailchimp, Sendinblue)

**Avantages** :
- Statistiques (taux d'ouverture)
- Templates professionnels
- Automatisation possible

**Inconvénients** :
- Coût (gratuit jusqu'à 300-500 emails/mois)
- Configuration initiale

---

## 📅 Planning Type

### Lors de l'Ouverture d'une Session

**Jour 0** : Activer la session
- [ ] Envoyer email "Ouverture de session" à tous les surveillants actifs
- [ ] Noter la date limite dans votre calendrier

**J-7** : Premier rappel
- [ ] Vérifier qui n'a pas soumis (Suivi des Soumissions)
- [ ] Envoyer rappel J-7 aux non-soumis

**J-3** : Deuxième rappel
- [ ] Vérifier qui n'a pas soumis
- [ ] Envoyer rappel J-3 aux non-soumis (ton plus urgent)

**J-1** : Dernier rappel
- [ ] Vérifier qui n'a pas soumis
- [ ] Envoyer rappel J-1 URGENT aux non-soumis
- [ ] Éventuellement appeler les récalcitrants

**Jour J** : Clôture
- [ ] Fermer les soumissions
- [ ] Analyser les résultats

---

## 📝 Templates Prêts à l'Emploi

### Template 1 : Ouverture Session Janvier

```
Objet : Session Janvier 2025 - Soumettez vos disponibilités avant le 15/12/2024

Bonjour,

La session d'examens de Janvier 2025 est maintenant ouverte.

📅 Date limite de soumission : 15 décembre 2024

Veuillez soumettre vos disponibilités via le lien suivant :
👉 https://sss-surveillances.vercel.app/

ℹ️ Rappel : Conformément aux directives des Décanats, il est attendu que vous maximisiez vos disponibilités pour assurer le bon déroulement de la session.

En cas de question ou de problème technique, n'hésitez pas à nous contacter.

Merci de votre collaboration.

Cordialement,
[Votre Nom]
Service de Gestion des Surveillances
UCLouvain
```

### Template 2 : Rappel J-7

```
Objet : Rappel : Plus que 7 jours pour soumettre vos disponibilités

Bonjour,

Nous n'avons pas encore reçu vos disponibilités pour la session Janvier 2025.

⏰ Date limite : 15 décembre 2024 (dans 7 jours)

Merci de compléter le formulaire dès que possible :
👉 https://sss-surveillances.vercel.app/

Cela ne prend que quelques minutes.

Cordialement,
[Votre Nom]
Service de Gestion des Surveillances
```

### Template 3 : Rappel J-1 URGENT

```
Objet : ⚠️ URGENT : Dernière chance - Soumission demain !

Bonjour,

⚠️ ATTENTION : La date limite pour soumettre vos disponibilités est DEMAIN (15 décembre 2024).

Nous n'avons toujours pas reçu votre soumission.

🚨 Merci de compléter le formulaire AUJOURD'HUI :
👉 https://sss-surveillances.vercel.app/

En cas de problème technique ou d'impossibilité, contactez-nous IMMÉDIATEMENT.

Merci de votre compréhension.

Cordialement,
[Votre Nom]
Service de Gestion des Surveillances
```

---

## 📈 Suivi de l'Efficacité

### Indicateurs à Suivre

**Taux de soumission** :
- Après email initial : X%
- Après rappel J-7 : X%
- Après rappel J-3 : X%
- Après rappel J-1 : X%

**Objectif** : > 90% de soumission

### Tableau de Suivi (Excel)

| Date | Action | Destinataires | Soumissions Avant | Soumissions Après | Taux |
|------|--------|---------------|-------------------|-------------------|------|
| 01/12 | Email initial | 120 | 0 | 45 | 37.5% |
| 08/12 | Rappel J-7 | 75 | 45 | 78 | 65% |
| 12/12 | Rappel J-3 | 42 | 78 | 105 | 87.5% |
| 14/12 | Rappel J-1 | 15 | 105 | 115 | 95.8% |

---

## 💡 Conseils et Bonnes Pratiques

### ✅ À Faire

1. **Personnaliser** : Utiliser le prénom si possible (publipostage)
2. **Être clair** : Mettre la date limite en gras
3. **Faciliter** : Toujours inclure le lien direct
4. **Être courtois** : Remercier pour la collaboration
5. **Suivre** : Noter qui a reçu quoi et quand

### ❌ À Éviter

1. **Spam** : Ne pas envoyer trop d'emails (max 1 par semaine)
2. **Ton agressif** : Rester professionnel même pour les rappels
3. **Emails trop longs** : Aller à l'essentiel
4. **Oublier le lien** : Toujours inclure le lien vers l'application
5. **Envoyer à tous** : Cibler uniquement les non-soumis pour les rappels

---

## 🔄 Évolution Future

Quand vous serez prêt à automatiser, vous pourrez :

1. **Phase 1** : Automatiser les confirmations de soumission
2. **Phase 2** : Automatiser l'email d'ouverture de session
3. **Phase 3** : Automatiser les rappels programmés
4. **Phase 4** : Dashboard de statistiques

Le spec complet est disponible dans `.kiro/specs/email-notifications/` si vous souhaitez automatiser plus tard.

---

## 📞 Support

En cas de question sur la gestion des emails :
- Consulter ce guide
- Voir les statistiques dans "Suivi des Soumissions"
- Exporter les listes depuis "Surveillants"

---

**Bonne gestion des notifications ! 📧**
