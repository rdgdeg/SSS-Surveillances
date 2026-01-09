# Guide - Avertissement Modifications Attributions

## 🎯 Nouvelle fonctionnalité

Quand vous modifiez les attributions de surveillants dans l'application, un avertissement automatique vous rappelle de mettre à jour :
- 📊 **L'Excel** de suivi des surveillances
- 📅 **Le planning** général des examens

## 📍 Où apparaît l'avertissement

### **Déclenchement automatique :**
- ✅ Modification des surveillants assignés à un auditoire
- ✅ Ajout/suppression de surveillants
- ✅ Remplacement de surveillants
- ✅ Modification des répartitions par auditoire

### **Apparence :**
- 🟡 **Couleur** : Fond jaune/ambre pour attirer l'attention
- ⚠️ **Icône** : Triangle d'avertissement
- 📋 **Contenu** : Rappel Excel + Planning
- ⏱️ **Durée** : 8 secondes d'affichage
- 📍 **Position** : Coin supérieur droit

## 🎨 Interface de l'avertissement

```
⚠️  Attributions modifiées !
    Pour l'examen WMED1234, n'oubliez pas de mettre à jour :
    
    📊 Excel    📅 Planning
    
                        [OK]
```

## 💡 Pourquoi cet avertissement ?

### **Synchronisation des données**
- **Application** : Modifications en temps réel
- **Excel** : Mise à jour manuelle nécessaire
- **Planning** : Ajustements à faire

### **Éviter les incohérences**
- ❌ **Sans avertissement** : Risque d'oubli
- ✅ **Avec avertissement** : Rappel systématique
- 🔄 **Workflow complet** : App → Excel → Planning

## 🔧 Actions recommandées après modification

### **1. Mettre à jour l'Excel**
- Ouvrir le fichier Excel de suivi
- Modifier les attributions correspondantes
- Vérifier les totaux et statistiques
- Sauvegarder le fichier

### **2. Ajuster le planning**
- Consulter le planning général
- Modifier les créneaux si nécessaire
- Vérifier les conflits d'horaires
- Communiquer les changements

### **3. Informer les concernés**
- Notifier les surveillants affectés
- Prévenir les responsables d'examen
- Mettre à jour les communications

## ⚙️ Configuration technique

### **Déclenchement**
- **Événement** : Succès de modification d'auditoire
- **Délai** : 1 seconde après la confirmation
- **Condition** : Modification des surveillants uniquement

### **Personnalisation**
- **Code examen** : Affiché dans le message si disponible
- **Durée** : 8 secondes par défaut
- **Position** : Configurable (top-right par défaut)

## 📋 Cas d'usage typiques

### **Scénario 1 : Ajout de surveillant**
1. Utilisateur ajoute un surveillant à un auditoire
2. ✅ Confirmation "Auditoire modifié"
3. ⚠️ Avertissement "N'oubliez pas Excel + Planning"
4. Utilisateur met à jour Excel et planning

### **Scénario 2 : Remplacement**
1. Utilisateur remplace un surveillant absent
2. ✅ Confirmation du remplacement
3. ⚠️ Avertissement avec code examen
4. Mise à jour des documents externes

### **Scénario 3 : Réorganisation complète**
1. Modifications multiples d'attributions
2. ✅ Confirmations successives
3. ⚠️ Avertissements pour chaque modification
4. Révision complète Excel + Planning

## 🎯 Avantages

### **Prévention des oublis**
- 🔔 **Rappel automatique** après chaque modification
- 📝 **Checklist visuelle** des actions à faire
- ⏰ **Timing optimal** juste après la modification

### **Workflow amélioré**
- 🔄 **Processus complet** : App → Avertissement → Actions
- 📊 **Cohérence** entre tous les supports
- 👥 **Communication** facilitée avec les équipes

### **Réduction des erreurs**
- ❌ **Moins d'incohérences** entre systèmes
- ✅ **Suivi systématique** des modifications
- 🎯 **Actions ciblées** selon le contexte

## 🚀 Utilisation optimale

### **Bonnes pratiques**
1. **Ne pas ignorer** l'avertissement
2. **Traiter immédiatement** ou noter pour plus tard
3. **Vérifier la cohérence** entre tous les supports
4. **Communiquer** les changements aux équipes

### **Workflow recommandé**
```
Modification App → Avertissement → Excel → Planning → Communication
```

Cette fonctionnalité garantit que toutes les modifications d'attributions sont répercutées dans l'ensemble du système de gestion des surveillances !