# Guide - Gestion des remplacements de surveillants

## Vue d'ensemble

Le système de gestion des remplacements permet de garder une trace complète de tous les changements de surveillants pour un examen, avec l'historique des remplacements.

## Fonctionnalités

### 1. Remplacer un surveillant

Lorsqu'un surveillant ne peut plus assurer sa surveillance, vous pouvez le remplacer tout en gardant une trace :

**Étapes :**
1. Ouvrir la gestion des auditoires pour l'examen concerné (bouton "Gérer")
2. Dans la liste des surveillants assignés, cliquer sur "Remplacer" à côté du surveillant
3. Sélectionner le nouveau surveillant dans la liste
4. (Optionnel) Ajouter une raison du remplacement
5. Confirmer le remplacement

### 2. Affichage visuel

**Surveillants actifs :**
- Affichés avec une coche verte ✓
- Fond vert clair
- Bouton "Remplacer" disponible

**Historique des remplacements :**
- Ancien surveillant affiché en ~~barré~~ et rouge
- Nouveau surveillant en vert
- Date et heure du remplacement
- Raison du remplacement (si renseignée)

### 3. Informations conservées

Pour chaque remplacement, le système enregistre :
- **Ancien surveillant** : ID et nom complet
- **Nouveau surveillant** : ID et nom complet
- **Date et heure** : Timestamp précis du remplacement
- **Raison** : Texte libre expliquant le remplacement

## Cas d'usage

### Exemple 1 : Maladie

**Situation :** Jean Dupont est malade et ne peut pas surveiller l'examen.

**Action :**
1. Cliquer sur "Remplacer" à côté de Jean Dupont
2. Sélectionner Marie Martin comme remplaçante
3. Raison : "Maladie - certificat médical"
4. Confirmer

**Résultat :**
```
Surveillants assignés:
✓ Marie Martin [Remplacer]

Historique des remplacements:
~~Jean Dupont~~ → Marie Martin
Raison: Maladie - certificat médical
Date: 05/12/2025 14:30
```

### Exemple 2 : Changement de planning

**Situation :** Pierre Durand a un conflit d'horaire.

**Action :**
1. Remplacer Pierre Durand par Sophie Leblanc
2. Raison : "Conflit d'horaire - autre examen"

**Résultat :**
L'historique montre clairement le changement avec la raison.

### Exemple 3 : Remplacements multiples

Si un auditoire a plusieurs remplacements successifs, tous sont conservés dans l'historique :

```
Surveillants assignés:
✓ Claire Rousseau [Remplacer]

Historique des remplacements:
~~Jean Dupont~~ → Marie Martin
Raison: Maladie
Date: 01/12/2025 10:00

~~Marie Martin~~ → Claire Rousseau
Raison: Changement de dernière minute
Date: 05/12/2025 14:30
```

## Avantages

✅ **Traçabilité complète** : Tous les changements sont enregistrés
✅ **Justification** : Possibilité d'expliquer chaque remplacement
✅ **Historique permanent** : Les données ne sont jamais perdues
✅ **Audit** : Facilite les vérifications et les rapports
✅ **Communication** : Permet d'informer les parties prenantes des changements

## Export

L'historique des remplacements peut être consulté :
- Dans l'interface de gestion des auditoires
- Dans les logs d'audit (si activés)
- Via export de la base de données

## Bonnes pratiques

### Renseigner la raison

Toujours indiquer une raison claire pour faciliter :
- La compréhension ultérieure
- Les audits
- La communication avec les surveillants

**Exemples de raisons claires :**
- ✅ "Maladie - certificat médical fourni"
- ✅ "Conflit d'horaire - autre examen en même temps"
- ✅ "Indisponibilité de dernière minute - urgence familiale"
- ✅ "Erreur d'attribution initiale"
- ❌ "Changement" (trop vague)
- ❌ "Autre" (pas informatif)

### Timing des remplacements

- **Avant l'examen** : Remplacer dès que possible pour informer les surveillants
- **Après l'examen** : Si un remplacement a eu lieu sur place, l'enregistrer pour l'historique

### Vérification

Après un remplacement :
1. Vérifier que le nouveau surveillant apparaît dans la liste active
2. Vérifier que l'ancien apparaît dans l'historique
3. Informer les deux surveillants concernés

## Limitations

⚠️ **Pas de notification automatique** : Les surveillants ne sont pas automatiquement informés du remplacement

⚠️ **Pas d'annulation** : Un remplacement ne peut pas être annulé, mais un nouveau remplacement peut être effectué

⚠️ **Pas de validation** : Le système ne vérifie pas si le nouveau surveillant est disponible

## Structure technique

### Base de données

Le champ `surveillants_remplaces` dans la table `examen_auditoires` stocke un tableau JSON :

```json
[
  {
    "ancien_id": "uuid-ancien-surveillant",
    "nouveau_id": "uuid-nouveau-surveillant",
    "date": "2025-12-05T14:30:00.000Z",
    "raison": "Maladie - certificat médical"
  }
]
```

### Requête SQL pour consulter l'historique

```sql
SELECT 
  ea.auditoire,
  ea.surveillants_remplaces
FROM examen_auditoires ea
WHERE ea.examen_id = 'votre-examen-id'
  AND jsonb_array_length(ea.surveillants_remplaces) > 0;
```

## Support

Pour toute question sur les remplacements :
1. Vérifier que le remplacement apparaît dans l'historique
2. Consulter les logs d'audit si disponibles
3. Contacter l'administrateur système si nécessaire

## Évolutions futures

Fonctionnalités prévues :
- [ ] Notification automatique des surveillants concernés
- [ ] Export dédié de l'historique des remplacements
- [ ] Statistiques sur les remplacements (fréquence, raisons)
- [ ] Validation de disponibilité du remplaçant
- [ ] Commentaires additionnels sur les remplacements
