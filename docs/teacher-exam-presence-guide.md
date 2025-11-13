# Guide d'utilisation - Gestion de la présence des enseignants aux examens

## Table des matières

1. [Introduction](#introduction)
2. [Guide Enseignant](#guide-enseignant)
3. [Guide Administrateur](#guide-administrateur)
4. [Format CSV pour l'import](#format-csv-pour-limport)
5. [FAQ](#faq)

---

## Introduction

Cette fonctionnalité permet aux enseignants de déclarer leur présence aux examens et d'indiquer le nombre de surveillants qu'ils amènent. L'administration peut ensuite consulter ces informations pour calculer les besoins réels en surveillants.

### Avantages

- **Pour les enseignants** : Déclaration simple et rapide de leur présence
- **Pour l'administration** : Vue d'ensemble des besoins en surveillants
- **Pour tous** : Meilleure planification des ressources

---

## Guide Enseignant

### Accéder à la déclaration de présence

1. Connectez-vous à l'application
2. Accédez à la page "Déclaration de présence"
3. Vous verrez un champ de recherche pour trouver votre examen

### Rechercher votre examen

1. **Tapez au moins 2 caractères** dans le champ de recherche
2. Entrez le **code de l'examen** (ex: MATH101) ou le **nom de l'examen**
3. Les résultats s'affichent en temps réel
4. Cliquez sur votre examen dans la liste

### Déclarer votre présence

Une fois l'examen sélectionné :

1. **Vérifiez les informations** de l'examen affichées (code, nom, date, horaire)
2. **Remplissez le formulaire** :
   - Email (obligatoire)
   - Nom et prénom (obligatoires)
   - Présence : Oui ou Non
   - Si présent : nombre de surveillants que vous amenez (0 si aucun)
   - Remarque (optionnel)
3. **Cliquez sur "Soumettre"**
4. **Confirmez** votre déclaration dans la fenêtre de confirmation

### Modifier une déclaration existante

Si vous avez déjà soumis une déclaration :

1. Recherchez à nouveau votre examen
2. Le formulaire sera pré-rempli avec vos informations
3. Modifiez les champs souhaités
4. Cliquez sur "Mettre à jour"

### Saisir un examen manuellement

Si votre examen n'apparaît pas dans la recherche :

1. Cliquez sur **"Examen non trouvé ? Saisir manuellement"**
2. Remplissez le formulaire :
   - Code d'examen (obligatoire, max 50 caractères)
   - Nom d'examen (obligatoire, max 500 caractères)
   - Date (optionnel, format YYYY-MM-DD)
   - Heure de début (optionnel, format HH:MM)
   - Heure de fin (optionnel, format HH:MM)
3. Cliquez sur **"Créer l'examen"**
4. Votre examen sera créé avec le statut "En attente de validation"
5. Un administrateur vérifiera et validera votre saisie
6. Vous pourrez ensuite déclarer votre présence

---

## Guide Administrateur

### Accéder à la gestion des examens

1. Connectez-vous avec vos identifiants administrateur
2. Accédez à la page "Gestion des examens"
3. Vous verrez 3 onglets : Présences, Import, Notifications

### Onglet "Présences" - Consulter les déclarations

#### Vue d'ensemble

- **Statistiques** : Total examens, déclarés, en attente, saisie manuelle
- **Filtres** : Tous / Déclarés / En attente / Manuels
- **Tri** : Par date, code ou statut

#### Tableau des examens

Pour chaque examen, vous verrez :
- Code et nom de l'examen
- Date et horaire
- Statut (badge coloré)
- Nombre de présences déclarées / total enseignants
- Nombre de surveillants accompagnants

#### Calcul des besoins

Le nombre de surveillants accompagnants vous aide à calculer les besoins réels :
- Si un enseignant est présent avec 2 surveillants : vous avez 3 personnes disponibles
- Si un enseignant est absent : vous devez prévoir tous les surveillants nécessaires

### Onglet "Import" - Importer des examens

#### Préparer votre fichier CSV

Voir la section [Format CSV](#format-csv-pour-limport) ci-dessous.

#### Procédure d'import

1. Cliquez sur **"Choisir un fichier"**
2. Sélectionnez votre fichier CSV
3. Vérifiez les informations du fichier (nom, taille)
4. Cliquez sur **"Importer"**
5. Une barre de progression s'affiche
6. À la fin, vous verrez un résumé :
   - Nombre d'examens créés
   - Nombre d'examens mis à jour
   - Avertissements (si des données optionnelles sont invalides)
   - Erreurs (si des lignes n'ont pas pu être importées)

#### Gestion des erreurs

- **Erreurs de format** : Les lignes avec des erreurs sont ignorées
- **Avertissements** : Les données optionnelles invalides sont ignorées (dates, heures)
- **Examens existants** : Ils sont mis à jour avec les nouvelles informations

### Onglet "Notifications" - Gérer les examens saisis manuellement

#### Vue des notifications

- **Badge rouge** : Nombre de notifications non lues
- **Liste** : Toutes les notifications avec détails
- **Filtre** : Afficher/masquer les notifications archivées

#### Actions disponibles

Pour chaque notification d'examen saisi manuellement :

1. **Marquer comme lu** (icône ✓) : Marque la notification comme lue
2. **Valider** (bouton vert) : Valide l'examen et le rend disponible
3. **Supprimer** (bouton rouge) : Supprime l'examen (action irréversible)
4. **Archiver** (icône archive) : Archive la notification

#### Workflow recommandé

1. Consultez les nouvelles notifications
2. Vérifiez les informations de l'examen
3. Si correct : **Validez** l'examen
4. Si incorrect : **Supprimez** l'examen et contactez l'enseignant
5. La notification est automatiquement archivée après validation/suppression

---

## Format CSV pour l'import

### Structure du fichier

Le fichier CSV doit utiliser le **point-virgule (;)** comme séparateur.

### En-têtes obligatoires

```
Code Examen;Nom Examen;Enseignants;Date;Heure Début;Heure Fin
```

### Colonnes

| Colonne | Obligatoire | Format | Exemple |
|---------|-------------|--------|---------|
| Code Examen | ✅ Oui | Texte (max 50 car.) | MATH101 |
| Nom Examen | ✅ Oui | Texte (max 500 car.) | Mathématiques I |
| Enseignants | ✅ Oui | Emails séparés par virgules | prof1@univ.be,prof2@univ.be |
| Date | ❌ Non | YYYY-MM-DD | 2025-01-15 |
| Heure Début | ❌ Non | HH:MM | 09:00 |
| Heure Fin | ❌ Non | HH:MM | 12:00 |

### Exemple de fichier CSV

```csv
Code Examen;Nom Examen;Enseignants;Date;Heure Début;Heure Fin
MATH101;Mathématiques I;prof1@univ.be,prof2@univ.be;2025-01-15;09:00;12:00
PHYS201;Physique II;prof3@univ.be;2025-01-16;14:00;17:00
CHEM301;Chimie organique;prof4@univ.be,prof5@univ.be,prof6@univ.be;2025-01-17;09:00;11:00
INFO102;Informatique de base;prof7@univ.be;;
```

### Règles de validation

#### Champs obligatoires
- **Code Examen** : Ne peut pas être vide, max 50 caractères
- **Nom Examen** : Ne peut pas être vide, max 500 caractères
- **Enseignants** : Au moins un email valide

#### Champs optionnels
- **Date** : Si fournie, doit être au format YYYY-MM-DD
- **Heure Début** : Si fournie, doit être au format HH:MM (00:00 à 23:59)
- **Heure Fin** : Si fournie, doit être au format HH:MM (00:00 à 23:59)

#### Emails
- Format valide : `utilisateur@domaine.extension`
- Plusieurs emails séparés par des virgules (sans espaces)
- Exemple valide : `prof1@univ.be,prof2@univ.be`
- Exemple invalide : `prof1@univ.be, prof2@univ.be` (espace après la virgule)

### Comportement lors de l'import

- **Examens existants** : Si un examen avec le même code existe déjà pour la session, il sera **mis à jour**
- **Nouveaux examens** : Créés avec le statut "Validé"
- **Lignes avec erreurs** : Ignorées, mais listées dans le rapport d'erreurs
- **Données optionnelles invalides** : Ignorées avec un avertissement

### Limites

- **Taille maximale du fichier** : 10 MB
- **Formats acceptés** : .csv, .txt
- **Encodage recommandé** : UTF-8

---

## FAQ

### Questions Enseignants

**Q: Puis-je modifier ma déclaration après l'avoir soumise ?**  
R: Oui, vous pouvez modifier votre déclaration à tout moment en recherchant à nouveau votre examen.

**Q: Que se passe-t-il si je saisis un examen manuellement ?**  
R: Votre examen sera créé avec le statut "En attente de validation". Un administrateur le vérifiera et le validera. Vous recevrez une confirmation une fois validé.

**Q: Dois-je déclarer ma présence pour chaque examen ?**  
R: Oui, vous devez faire une déclaration pour chaque examen où vous êtes responsable.

**Q: Que signifie "nombre de surveillants accompagnants" ?**  
R: C'est le nombre de personnes (assistants, collègues, etc.) que vous amenez avec vous pour surveiller l'examen. Indiquez 0 si vous venez seul.

### Questions Administrateurs

**Q: Comment savoir combien de surveillants je dois prévoir ?**  
R: Consultez le tableau des présences. Pour chaque examen, vous verrez le nombre d'enseignants présents et le nombre de surveillants accompagnants. Soustrayez ces nombres de votre besoin total.

**Q: Que faire si un enseignant saisit un examen avec des erreurs ?**  
R: Vous pouvez soit supprimer l'examen et demander à l'enseignant de le ressaisir, soit le valider et le corriger manuellement dans la base de données.

**Q: Les examens importés écrasent-ils les déclarations de présence existantes ?**  
R: Non, l'import met à jour uniquement les informations de l'examen (code, nom, enseignants, horaires). Les déclarations de présence sont préservées.

**Q: Puis-je importer plusieurs fois le même fichier ?**  
R: Oui, les examens existants seront simplement mis à jour avec les nouvelles informations.

---

## Support

Pour toute question ou problème :
- Contactez l'administrateur système
- Consultez la documentation technique dans `/docs/technical-architecture.md`
