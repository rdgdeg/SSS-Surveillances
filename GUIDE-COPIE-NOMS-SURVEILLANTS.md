# Guide - Copie des Noms et Emails des Surveillants

## 🎯 Nouvelle fonctionnalité

Dans la modal "Emails des surveillants", vous pouvez maintenant copier :
- ✉️ **Les emails** des surveillants (fonctionnalité existante)
- 👥 **Les noms et prénoms** des surveillants (nouvelle fonctionnalité)

## 📍 Où trouver cette fonctionnalité

1. **Page Examens** → Cliquer sur un examen
2. **Bouton "Emails"** dans la liste des actions
3. **Modal qui s'ouvre** avec deux sections de copie

## 🔧 Fonctionnalités disponibles

### **Section Noms et Prénoms**
- **Bouton** : "Copier tous les noms"
- **Format** : Un nom par ligne (retour à la ligne)
- **Jobistes** : Indication "(Jobiste)" ajoutée automatiquement
- **Exemple** : 
```
Jean Dupont
Marie Martin (Jobiste)
Pierre Durand
Sophie Laurent (Jobiste)
```

### **Section Emails** (existante)
- **Bouton** : "Copier tous les emails"
- **Format** : `email1; email2; email3`
- **Exemple** : `jean.dupont@univ.be; marie.martin@univ.be`

## 💡 Cas d'usage

### **Pour les noms et prénoms :**
- 📋 **Listes de présence** : Créer des feuilles de présence
- 📄 **Documents officiels** : Rapports, procès-verbaux
- 📊 **Tableaux Excel** : Import dans des feuilles de calcul
- 🏷️ **Badges** : Création de badges nominatifs
- 📝 **Plannings** : Attribution des postes par nom

### **Pour les emails :**
- 📧 **Envoi groupé** : Consignes d'examen
- 📢 **Communications** : Informations importantes
- 🔔 **Rappels** : Notifications de dernière minute

## 🎨 Interface utilisateur

### **Apparence**
- **Noms** : Bouton avec contour (outline)
- **Emails** : Bouton plein (primary)
- **Feedback** : Icône ✓ et message "Copié !" temporaire

### **Organisation**
1. **Statistiques** : Nombre de surveillants actifs
2. **Liste détaillée** : Noms et emails côte à côte
3. **Zone copie noms** : Nouvelle section
4. **Zone copie emails** : Section existante améliorée
5. **Instructions** : Guide d'utilisation mis à jour

## 🔄 Logique de fonctionnement

### **Surveillants inclus :**
- ✅ Surveillants assignés à l'examen
- ✅ Surveillants remplaçants (nouveaux)
- ❌ Surveillants remplacés (anciens)

### **Tri et format :**
- **Noms** : Triés par ordre alphabétique, un par ligne
- **Emails** : Triés par ordre alphabétique, séparés par ";"
- **Séparateur noms** : Retour à la ligne (\n)
- **Séparateur emails** : Point-virgule + espace ("; ")

## 📱 Utilisation pratique

### **Étape 1 : Accès**
```
Examens → [Sélectionner examen] → Bouton "Emails"
```

### **Étape 2 : Copie des noms**
```
1. Cliquer "Copier tous les noms"
2. Voir confirmation "Copié !"
3. Coller dans votre document (Ctrl+V)
```

### **Étape 3 : Copie des emails**
```
1. Cliquer "Copier tous les emails"
2. Voir confirmation "Copié !"
3. Coller dans votre client email (Ctrl+V)
```

## 🎯 Exemples concrets

### **Feuille de présence Word/Excel**
```
Surveillants présents :

Jean Dupont
Marie Martin (Jobiste)
Pierre Durand  
Sophie Laurent (Jobiste)

Signatures :
_________________
_________________
_________________
_________________
```

### **Email groupé Outlook**
```
À: jean.dupont@univ.be; marie.martin@univ.be; pierre.durand@univ.be
Objet: Consignes examen WMED1234 - 15 janvier 2025
```

### **Rapport de surveillance**
```
Surveillants présents pour l'examen WMED1234 :
- Jean Dupont (Auditoire A)
- Marie Martin (Auditoire B)  
- Pierre Durand (Auditoire C)
```

## ⚡ Avantages

### **Gain de temps**
- ❌ **Avant** : Copier-coller un par un
- ✅ **Maintenant** : Copie en un clic

### **Réduction d'erreurs**
- ❌ **Avant** : Risque d'oubli ou de faute de frappe
- ✅ **Maintenant** : Données exactes de la base

### **Flexibilité**
- 📧 **Emails** : Pour la communication
- 👥 **Noms** : Pour la documentation

## 🔧 Détails techniques

### **Modifications apportées**
- Ajout de l'état `copiedNames`
- Fonction `handleCopyNames()`
- Génération de `namesString`
- Nouvelle section UI pour les noms
- Instructions mises à jour

### **Format de sortie**
```javascript
// Noms (un par ligne avec indication jobiste)
`Jean Dupont
Marie Martin (Jobiste)
Pierre Durand
Sophie Laurent (Jobiste)`

// Emails (séparés par ;)
"jean.dupont@univ.be; marie.martin@univ.be; pierre.durand@univ.be; sophie.laurent@univ.be"
```

## 📋 Checklist d'utilisation

- [ ] Ouvrir la modal "Emails des surveillants"
- [ ] Vérifier le nombre de surveillants actifs
- [ ] Copier les noms si besoin (nouveau bouton)
- [ ] Copier les emails si besoin (bouton existant)
- [ ] Utiliser les données copiées dans vos documents/emails
- [ ] Fermer la modal

Cette amélioration rend la gestion des surveillants plus efficace en permettant de récupérer facilement toutes les informations nécessaires en un clic.