# Guide des Instructions du Secrétariat - Déclaration de Présence Enseignant

## Vue d'ensemble

Ce guide documente les instructions du secrétariat intégrées dans le formulaire de déclaration de présence des enseignants pour la session d'examens.

## Informations affichées aux enseignants

### 1. Instructions générales

Les enseignants sont invités à communiquer :

- **Nombre de surveillants** : Le nombre total de surveillants qu'ils mettront à disposition pour leur examen (le nombre nécessaire est indiqué entre parenthèses)
- **Noms et coordonnées** : Si possible, les noms et coordonnées des surveillants
- **Type d'examen** : Le type d'examen organisé (QCM, QROC avec ou sans Gradescope, Oral ou autre)
- **Durée de l'examen** : Si l'examen dure moins de 2 heures, préciser la durée exacte

### 2. Dates limites de dépôt des examens (Médecine et Médecine Dentaire)

| Période d'examens | Date limite de dépôt |
|-------------------|---------------------|
| 8 au 19 décembre 2025 | Dimanche 23 novembre 2025 |
| 5 au 9 janvier 2026 | Mercredi 26 novembre 2025 |
| 12 au 16 janvier 2026 | Mercredi 3 décembre 2025 |
| 19 au 23 janvier 2026 | Mercredi 10 décembre 2025 |

### 3. Types d'examens acceptés

#### QCM Contest
- Remettre le questionnaire en PDF sans réponses apparentes
- Fournir la déclaration dûment complétée nécessaire à la création du QCM
- Documents requis :
  - Document Excel de Déclaration
  - En cas de séries multiples : document Word expliquant le mélange des questions
  - Modèle pour la première page du questionnaire

⚠️ **Important** : QCM Contest deviendra obsolète l'année prochaine. L'alternative sera un QCM via Gradescope.

#### QROC manuel
- Remettre le questionnaire en PDF sans réponses apparentes
- Préciser les critères spécifiques d'impression (Recto-verso, papier de couleurs différentes, etc.)

#### Gradescope
Documents à remettre en PDF :
- Un questionnaire complet avec les questions et les encadrés prévus pour les réponses
- OU un formulaire question et un formulaire réponse (canevas disponibles)
- La pondération par question et/ou par sous-questions

## Champs du formulaire

### Informations personnelles
- Prénom *
- Nom *
- Email * (génération automatique UCLouvain disponible)

### Type de présence
1. **Présent pour surveillance complète** : L'enseignant sera présent pour la surveillance et la mise en place de l'examen (un surveillant peut être retiré)
2. **Présent partiellement** : L'enseignant sera présent mais n'assurera pas toute la surveillance (il faut compter un surveillant)
3. **Absent** : L'enseignant ne sera pas présent mais peut indiquer des surveillants

### Type d'examen *
- Examen écrit
- QCM
- Autre (à préciser : Oral, QROC avec Gradescope, etc.)

### Durée de l'examen
- Case à cocher : "Mon examen dure moins de 2 heures"
- Si coché : champ pour préciser la durée en minutes
- Durées courantes suggérées : 30min, 45min, 60min (1h), 90min (1h30)

### Surveillants
- **Nombre total de surveillants** : Nombre total nécessaire pour le cours
  - Si présent pour surveillance complète : en plus de l'enseignant
  - Si présent partiellement : enseignant compris
  - Si absent : nombre total nécessaire
- **Noms des surveillants** : Liste des noms (optionnel)

### Consignes / Remarques
- Champ libre pour les consignes particulières
- Ces consignes sont conservées et affichées pour les prochaines sessions
- Historique des remarques précédentes affiché si disponible

## Fonctionnalités spéciales

### Coordination entre enseignants
- Si d'autres enseignants ont déjà soumis pour le même cours, un avertissement s'affiche
- Le nombre total de surveillants déjà déclarés est affiché
- Le champ "Nombre de surveillants" est pré-rempli avec le total actuel
- Une confirmation est demandée avant la soumission

### Conservation des consignes
- Les remarques ajoutées sont conservées dans le cours
- Elles sont automatiquement affichées pour les prochaines sessions
- Un historique des remarques est maintenu avec dates et auteurs

### Notification au secrétariat
- Chaque soumission crée automatiquement un message pour l'administration
- Le message contient toutes les informations déclarées

## Contact

Pour toute question : **02/436.16.89**

## Dates importantes (Médecine et Médecine Dentaire)

- **Remise des notes** : Mercredi 28 janvier 2026
- **Délibérations** : Vendredi 30 janvier 2026

## Base de données

### Nouveaux champs ajoutés

```sql
-- Table presences_enseignants
duree_examen_moins_2h BOOLEAN DEFAULT false
duree_examen_minutes INTEGER DEFAULT 120
```

### Migration

Le fichier de migration `supabase/migrations/add_exam_duration_fields.sql` ajoute ces champs avec :
- Valeur par défaut : 120 minutes (2 heures)
- Contrainte : durée entre 15 et 240 minutes
- Documentation des champs

## Utilisation

1. L'enseignant recherche son cours par code ou nom
2. Il remplit le formulaire avec toutes les informations demandées
3. Le système vérifie s'il y a déjà des soumissions pour ce cours
4. Si oui, il affiche un avertissement et pré-remplit le nombre de surveillants
5. L'enseignant confirme et soumet
6. Les données sont enregistrées et le secrétariat est notifié

## Notes techniques

- Les emails sont automatiquement convertis en minuscules
- La génération automatique d'email UCLouvain est disponible (prenom.nom@uclouvain.be)
- Les consignes sont ajoutées au cours pour être réutilisées
- Un historique des remarques est maintenu en JSONB
