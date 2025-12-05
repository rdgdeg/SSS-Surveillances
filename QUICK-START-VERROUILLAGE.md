# Quick Start : Verrouillage des Disponibilités

## 🚀 Démarrage rapide (2 minutes)

### Étape 1 : Accéder au contrôle

1. Connectez-vous en tant qu'administrateur
2. Allez dans **Admin > Disponibilités**
3. Le panneau de contrôle est en haut de la page

### Étape 2 : Verrouiller

**Quand ?** Immédiatement après avoir exporté les disponibilités

**Comment ?**
1. Cliquez sur le bouton **"Verrouiller les disponibilités"**
2. (Optionnel) Cliquez sur **"Personnaliser le message"** pour ajouter un message spécifique
3. Confirmez

**Résultat :** Les surveillants ne peuvent plus modifier leurs disponibilités

### Étape 3 : Vérifier

1. Ouvrez le formulaire public dans un autre navigateur (mode incognito)
2. Vous devriez voir le message de verrouillage
3. Le formulaire n'est plus accessible

### Étape 4 : Déverrouiller (si nécessaire)

1. Retournez dans **Admin > Disponibilités**
2. Cliquez sur **"Déverrouiller les disponibilités"**
3. Confirmez

## 📋 Checklist rapide

Avant de verrouiller, assurez-vous que :

- [ ] Tous les surveillants ont été relancés
- [ ] Vous avez exporté les disponibilités
- [ ] Vous avez sauvegardé l'export
- [ ] Vous êtes prêt à commencer les attributions

Après avoir verrouillé :

- [ ] Vérifiez que le message s'affiche correctement
- [ ] Informez les surveillants (email/annonce)
- [ ] Notez la date de verrouillage

## 💡 Cas d'usage courants

### Cas 1 : Modification exceptionnelle

**Situation :** Un surveillant a une urgence et doit modifier ses disponibilités

**Solution :**
1. Allez dans **Admin > Disponibilités**
2. Activez le **Mode Édition**
3. Modifiez directement les disponibilités du surveillant
4. Gardez les disponibilités verrouillées

### Cas 2 : Erreur dans l'export

**Situation :** Vous devez refaire l'export avec des données à jour

**Solution :**
1. Déverrouillez temporairement
2. Informez les surveillants concernés
3. Attendez les modifications
4. Exportez à nouveau
5. Reverrouillez immédiatement

### Cas 3 : Fin de session

**Situation :** La session d'examens est terminée

**Solution :**
1. Gardez verrouillé pour l'archivage
2. Créez une nouvelle session pour la prochaine période
3. La nouvelle session sera automatiquement ouverte

## ⚠️ Points d'attention

### À faire
- ✅ Verrouiller après l'export
- ✅ Communiquer la date limite aux surveillants
- ✅ Garder verrouillé pendant toute la session
- ✅ Documenter les modifications exceptionnelles

### À éviter
- ❌ Déverrouiller sans raison valable
- ❌ Oublier de reverrouiller après une modification
- ❌ Verrouiller trop tôt (avant que tous aient soumis)
- ❌ Modifier sans informer les personnes concernées

## 🎯 Workflow idéal

```
Semaine 1-2 : Collecte
├─> Disponibilités OUVERTES
└─> Les surveillants soumettent

Semaine 3 : Rappels
├─> Disponibilités OUVERTES
└─> Relancer les retardataires

Jour J : Export
├─> Exporter les données
└─> 🔒 VERROUILLER IMMÉDIATEMENT

Semaine 4 : Préparation
├─> Disponibilités VERROUILLÉES
└─> Préparer les attributions

Session d'examens
├─> Disponibilités VERROUILLÉES
└─> Modifications via admin uniquement
```

## 📞 Support

**Problème ?** Consultez :
- Guide complet : `GUIDE-VERROUILLAGE-DISPONIBILITES.md`
- Script de test : `scripts/test-lock-submissions.sql`
- Résumé : `RESUME-VERROUILLAGE-DISPONIBILITES.md`

**Rappel :** Permutation obligatoire entre collègues en cas d'indisponibilité

---

**Temps de lecture :** 2 minutes  
**Temps de mise en œuvre :** 30 secondes  
**Difficulté :** ⭐ Très facile
