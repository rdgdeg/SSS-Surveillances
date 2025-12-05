# Guide : Verrouillage des Disponibilités

## Vue d'ensemble

Le système de verrouillage des disponibilités permet aux administrateurs de contrôler quand les surveillants peuvent soumettre ou modifier leurs disponibilités. Cette fonctionnalité est essentielle pour garantir l'intégrité des données après l'export et pendant la préparation des attributions.

## Fonctionnalités

### 1. Contrôle de verrouillage dans l'admin

Dans la page **Admin > Disponibilités**, un nouveau panneau de contrôle permet de :

- **Verrouiller les disponibilités** : Empêche les surveillants de modifier leurs disponibilités
- **Déverrouiller les disponibilités** : Permet à nouveau aux surveillants de soumettre/modifier
- **Personnaliser le message** : Afficher un message spécifique aux surveillants

### 2. Comportement pour les surveillants

#### Quand les disponibilités sont ouvertes (déverrouillées)
- Les surveillants peuvent accéder au formulaire normalement
- Ils peuvent soumettre de nouvelles disponibilités
- Ils peuvent modifier leurs disponibilités existantes

#### Quand les disponibilités sont verrouillées
- Le formulaire n'est plus accessible
- Un message informatif est affiché expliquant que les disponibilités sont verrouillées
- Le message par défaut ou personnalisé indique comment contacter l'administration
- Les surveillants doivent contacter le secrétariat pour toute modification

## Utilisation recommandée

### Workflow typique

1. **Phase de collecte** (Disponibilités ouvertes)
   - Les surveillants soumettent leurs disponibilités
   - Ils peuvent les modifier librement

2. **Avant l'export** (Disponibilités ouvertes)
   - Vérifier que tous les surveillants ont soumis
   - Relancer les retardataires si nécessaire

3. **Export des données** (Transition)
   - Exporter les disponibilités vers Excel
   - **VERROUILLER immédiatement après l'export**

4. **Préparation des attributions** (Disponibilités verrouillées)
   - Travailler sur les attributions avec des données stables
   - Gérer les demandes de modification exceptionnelles manuellement

5. **Après les attributions** (Disponibilités verrouillées)
   - Garder verrouillé pendant toute la session d'examens
   - Les modifications se font uniquement via l'admin ou par contact direct

### Message personnalisé recommandé

Exemples de messages à afficher aux surveillants :

**Pendant la préparation :**
```
La période de soumission des disponibilités est terminée. 
Les attributions sont en cours de préparation.
Pour toute modification exceptionnelle, contactez le secrétariat au 02/436.16.89.
```

**Pendant la session :**
```
Les disponibilités sont verrouillées pour la durée de la session d'examens.
Pour tout changement de dernière minute, contactez immédiatement le secrétariat au 02/436.16.89.
```

## Interface administrateur

### Panneau de contrôle

Le panneau affiche :
- **Statut actuel** : Verrouillé 🔒 ou Ouvert 🔓
- **Session concernée** : Nom de la session active
- **Message actuel** : Le message personnalisé si défini
- **Bouton d'action** : Verrouiller/Déverrouiller
- **Bouton de personnalisation** : Modifier le message

### États visuels

- **Verrouillé** : Bordure et fond ambrés/oranges
- **Ouvert** : Bordure et fond verts
- **Avertissement** : Recommandation de verrouiller après export

## Aspects techniques

### Base de données

La table `sessions` contient deux colonnes :
- `lock_submissions` (boolean) : État du verrouillage
- `lock_message` (text) : Message personnalisé optionnel

### Migration

La migration `add_lock_submissions_to_sessions.sql` a créé ces colonnes avec :
- Valeur par défaut : `false` (ouvert)
- Index sur `lock_submissions` pour les requêtes optimisées

### Vérification côté client

Le formulaire de disponibilités vérifie automatiquement :
1. Si une session active existe
2. Si `session.lock_submissions` est `true`
3. Affiche le message de verrouillage si nécessaire

## Gestion des cas particuliers

### Modification exceptionnelle pendant le verrouillage

Si un surveillant a une raison valable de modifier ses disponibilités :

1. **Option 1 : Modification manuelle par l'admin**
   - Aller dans Admin > Disponibilités
   - Activer le mode édition
   - Modifier directement les disponibilités du surveillant

2. **Option 2 : Déverrouillage temporaire**
   - Déverrouiller les disponibilités
   - Informer le surveillant qu'il peut modifier
   - Reverrouiller immédiatement après

3. **Option 3 : Échange entre surveillants**
   - Organiser un échange avec un collègue
   - Mettre à jour manuellement dans l'admin

### Urgence de dernière minute

En cas d'absence imprévue pendant la session :
- Les disponibilités restent verrouillées
- Le secrétariat gère la réattribution manuellement
- Utiliser le téléphone du surveillant pour le contacter

## Sécurité et traçabilité

### Audit

Toutes les modifications de verrouillage sont tracées :
- Qui a verrouillé/déverrouillé
- Quand l'action a été effectuée
- Quel message a été défini

### Permissions

Seuls les administrateurs peuvent :
- Verrouiller/déverrouiller les disponibilités
- Modifier le message personnalisé
- Modifier les disponibilités en mode édition

## Bonnes pratiques

### ✅ À faire

- Verrouiller immédiatement après l'export
- Définir un message clair avec les coordonnées du secrétariat
- Garder verrouillé pendant toute la session
- Documenter les modifications exceptionnelles

### ❌ À éviter

- Laisser ouvert pendant la préparation des attributions
- Déverrouiller sans raison valable
- Oublier de reverrouiller après une modification exceptionnelle
- Modifier sans informer les personnes concernées

## Dépannage

### Le verrouillage ne fonctionne pas

1. Vérifier que la migration a été appliquée :
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'sessions' 
   AND column_name IN ('lock_submissions', 'lock_message');
   ```

2. Vérifier l'état de la session active :
   ```sql
   SELECT id, name, is_active, lock_submissions, lock_message 
   FROM sessions 
   WHERE is_active = true;
   ```

3. Rafraîchir la page admin après modification

### Les surveillants voient toujours le formulaire

1. Vérifier que le verrouillage est bien activé dans l'admin
2. Demander aux surveillants de rafraîchir leur page (Ctrl+F5)
3. Vérifier qu'il n'y a qu'une seule session active

## Support

Pour toute question ou problème :
- Consulter ce guide
- Vérifier les logs dans Admin > Audit
- Contacter le support technique si nécessaire
