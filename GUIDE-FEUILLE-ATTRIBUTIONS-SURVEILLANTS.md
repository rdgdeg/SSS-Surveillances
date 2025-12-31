# Guide - Feuille "Attributions Surveillants"

## 🎯 Vue d'ensemble

La feuille "Attributions Surveillants" est la **nouveauté majeure** de l'export de sécurité. Elle fournit une vue détaillée ligne par ligne de toutes les attributions de surveillants avec leurs informations complètes.

## 📊 Structure des Données

### Une Ligne = Un Surveillant Attribué
Chaque ligne représente **un surveillant attribué à un auditoire** pour un examen spécifique, avec toutes ses informations personnelles et d'attribution.

### Colonnes Principales

#### 🗓️ Informations Temporelles
- **Date examen** : Date de l'examen (DD-MM-YYYY)
- **Heure début** : Heure de début de l'examen
- **Heure fin** : Heure de fin de l'examen

#### 📋 Informations Examen
- **Code examen** : Code unique de l'examen
- **Nom examen** : Intitulé complet de l'examen
- **Auditoire** : Auditoire spécifique d'attribution
- **Position** : Position du surveillant dans l'auditoire (1, 2, 3...)

#### 👤 Informations Surveillant
- **Surveillant ID** : Identifiant unique du surveillant
- **Nom surveillant** : Nom de famille
- **Prénom surveillant** : Prénom
- **Email surveillant** : Adresse email de contact
- **Type surveillant** : assistant, pat, jobiste, autre
- **Téléphone** : Numéro de téléphone
- **Faculté** : Affectation faculté/institut
- **Statut** : Actif/Inactif
- **Dispensé** : Oui/Non (dispense de surveillance)

#### 🔄 Gestion des Remplacements
- **Est remplaçant** : Oui/Non (ce surveillant remplace quelqu'un)
- **Remplace** : Nom complet de la personne remplacée
- **Date remplacement** : Date et heure du remplacement
- **Raison remplacement** : Motif du remplacement

#### 📈 Informations d'Attribution
- **Mode attribution** : auditoire/secrétariat
- **Nb requis auditoire** : Nombre de surveillants requis
- **Nb attribués auditoire** : Nombre de surveillants attribués
- **Remarques auditoire** : Remarques spécifiques
- **Secrétariat** : Secrétariat responsable

## 🔍 Cas d'Usage Spécifiques

### 1. Identification des Attributions Manquantes
```
Nom surveillant = "*** NON ATTRIBUÉ ***"
Position = 0
Surveillant ID = vide
```
Ces lignes indiquent des auditoires où des surveillants sont requis mais non attribués.

### 2. Suivi des Remplacements
```
Est remplaçant = "Oui"
Remplace = "Jean Dupont"
Date remplacement = "31-12-2025 14:30:25"
Raison remplacement = "Maladie"
```
Permet de tracer tous les remplacements avec leur historique.

### 3. Contact Direct des Surveillants
```
Email surveillant = "marie.martin@univ.be"
Téléphone = "+32 2 123 45 67"
```
Informations de contact pour communication directe.

### 4. Analyse par Type de Surveillant
```
Type surveillant = "assistant"
Faculté = "Sciences"
```
Permet d'analyser la répartition par type et faculté.

## 📋 Utilisation Pratique

### Communication avec les Surveillants
1. **Filtrer par examen** : Sélectionner un examen spécifique
2. **Extraire les contacts** : Emails et téléphones des surveillants
3. **Préparer les messages** : Informations complètes disponibles

### Gestion des Remplacements
1. **Identifier les remplaçants** : Colonne "Est remplaçant"
2. **Vérifier les raisons** : Colonne "Raison remplacement"
3. **Contrôler les dates** : Colonne "Date remplacement"

### Contrôle Qualité
1. **Vérifier les attributions** : Comparer requis vs attribués
2. **Identifier les manques** : Lignes "NON ATTRIBUÉ"
3. **Contrôler les contacts** : Emails et téléphones renseignés

### Reporting et Statistiques
1. **Compter par type** : Répartition assistant/pat/jobiste
2. **Analyser par faculté** : Distribution géographique
3. **Mesurer les remplacements** : Taux de remplacement

## 🛠️ Techniques d'Analyse Excel

### Filtres Recommandés
```excel
- Date examen : Filtrer par période
- Code examen : Sélectionner un examen
- Auditoire : Voir un auditoire spécifique
- Type surveillant : Analyser par catégorie
- Est remplaçant : Voir uniquement les remplacements
- Nom surveillant : Exclure "NON ATTRIBUÉ"
```

### Tableaux Croisés Dynamiques
```excel
Lignes : Type surveillant, Faculté
Colonnes : Date examen
Valeurs : Nombre de surveillants
```

### Formules Utiles
```excel
=COUNTIF(K:K,"*** NON ATTRIBUÉ ***")  // Compter attributions manquantes
=COUNTIF(N:N,"Oui")                   // Compter remplacements
=COUNTIF(L:L,"assistant")             // Compter assistants
```

## 🚨 Points d'Attention

### Données Sensibles
- **Emails et téléphones** : Données personnelles à protéger
- **Accès restreint** : Limiter aux administrateurs
- **Confidentialité** : Respecter le RGPD

### Cohérence des Données
- **Vérifier les totaux** : Nb attribués = somme des positions
- **Contrôler les remplacements** : Dates cohérentes
- **Valider les contacts** : Emails et téléphones corrects

### Mise à Jour
- **Export régulier** : Données évoluent avec les attributions
- **Horodatage** : Vérifier la fraîcheur des données
- **Comparaison** : Comparer avec exports précédents

## 📈 Avantages de cette Feuille

### Visibilité Complète
- **Vue détaillée** : Chaque attribution visible
- **Informations complètes** : Tout en un endroit
- **Traçabilité** : Historique des remplacements

### Efficacité Opérationnelle
- **Communication directe** : Contacts disponibles
- **Gestion simplifiée** : Toutes les infos en un clic
- **Contrôle qualité** : Identification rapide des problèmes

### Flexibilité d'Analyse
- **Filtrage avancé** : Multiples critères
- **Statistiques** : Analyses personnalisées
- **Export sélectif** : Extraction de sous-ensembles

## 🔧 Intégration avec Autres Feuilles

### Complémentarité
- **Planning Examens** : Vue d'ensemble → Vue détaillée
- **Surveillants** : Référence → Attribution
- **Métadonnées** : Statistiques globales

### Cohérence
- **Nombres concordants** : Totaux cohérents entre feuilles
- **Références croisées** : IDs surveillants identiques
- **Horodatage unique** : Même moment d'export

---

**💡 Conseil** : Cette feuille est votre outil principal pour la gestion opérationnelle des surveillances. Utilisez-la pour tous les contacts directs avec les surveillants et le suivi détaillé des attributions.