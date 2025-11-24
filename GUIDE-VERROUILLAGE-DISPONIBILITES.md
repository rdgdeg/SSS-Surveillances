## Système de Verrouillage des Disponibilités

### Fonctionnalité

Ce système permet de bloquer les soumissions et modifications de disponibilités pour une session donnée.

### Utilisation

#### 1. Verrouiller une session

Dans la page **Admin > Sessions**, vous pouvez activer le verrouillage :
- Cliquez sur le bouton "Verrouiller" à côté de la session
- Les surveillants ne pourront plus soumettre ni modifier leurs disponibilités
- Un message s'affichera sur le formulaire public

#### 2. Message affiché aux surveillants

Quand une session est verrouillée, les surveillants voient :

```
🔒 Les disponibilités pour cette session sont verrouillées

La période de soumission des disponibilités est terminée.

Si vous avez besoin de modifier vos disponibilités pour des raisons exceptionnelles :
- Contactez le secrétariat : 02/436.16.89
- Ou organisez-vous avec un collègue pour un échange de surveillance

Merci de votre compréhension.
```

#### 3. Déverrouiller une session

Pour rouvrir les soumissions :
- Cliquez sur "Déverrouiller" dans la page Sessions
- Les surveillants pourront à nouveau modifier leurs disponibilités

### Configuration SQL

#### Verrouiller manuellement une session

```sql
-- Verrouiller la session active
UPDATE sessions 
SET lock_submissions = true,
    lock_message = 'La période de soumission est terminée. Contactez le secrétariat au 02/436.16.89 pour toute modification exceptionnelle.'
WHERE is_active = true;
```

#### Déverrouiller une session

```sql
-- Déverrouiller la session active
UPDATE sessions 
SET lock_submissions = false,
    lock_message = NULL
WHERE is_active = true;
```

#### Vérifier le statut

```sql
SELECT 
    name,
    is_active,
    lock_submissions,
    lock_message
FROM sessions
WHERE is_active = true;
```

### Comportement

#### Quand verrouillé :
- ❌ Impossible de soumettre de nouvelles disponibilités
- ❌ Impossible de modifier des disponibilités existantes
- ✅ Les surveillants peuvent toujours consulter leurs disponibilités soumises
- ✅ Les admins peuvent toujours modifier les disponibilités via l'interface admin

#### Quand déverrouillé :
- ✅ Les surveillants peuvent soumettre leurs disponibilités
- ✅ Les surveillants peuvent modifier leurs disponibilités
- ✅ Fonctionnement normal

### Cas d'usage

1. **Avant la planification** : Verrouiller les disponibilités une fois la date limite passée
2. **Pendant la planification** : Empêcher les modifications pendant que vous créez le planning
3. **Après la planification** : Garder verrouillé pour éviter les changements de dernière minute
4. **Modifications exceptionnelles** : Déverrouiller temporairement si nécessaire

### Notifications

Quand un surveillant tente de modifier ses disponibilités alors que c'est verrouillé :
- Un message clair s'affiche
- Les coordonnées du secrétariat sont fournies
- Une suggestion d'échange avec un collègue est proposée

### Sécurité

- Le verrouillage est géré au niveau de la base de données
- Même si quelqu'un contourne l'interface, la base de données refusera les modifications
- Les admins gardent toujours accès pour les cas exceptionnels

### Recommandations

1. **Communiquez la date limite** aux surveillants avant de verrouiller
2. **Vérifiez les soumissions** avant de verrouiller
3. **Gardez une trace** des demandes de modification après verrouillage
4. **Déverrouillez temporairement** si plusieurs modifications sont nécessaires
