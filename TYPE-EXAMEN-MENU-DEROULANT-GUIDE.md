# Guide - Menu déroulant pour le type d'examen

## Résumé des modifications

Le formulaire de déclaration de présence enseignant a été mis à jour pour remplacer les trois boutons de choix du type d'examen par un menu déroulant complet avec les options suivantes :

### Types d'examen disponibles

1. **QCM** - Questions à choix multiples
2. **QROC (correction manuelle)** - Questions à réponse ouverte courte avec correction manuelle
3. **QCM & QROC** - Combinaison des deux types
4. **Gradescope** - Examen via la plateforme Gradescope
5. **Oral** - Examen oral
6. **Travail** - Travail à rendre (avec champs spécifiques)
7. **Autre** - Autre type à préciser

### Champs spécifiques pour le type "Travail"

Lorsque l'enseignant sélectionne "Travail", des champs supplémentaires apparaissent :

- **Date limite de remise** (obligatoire) : Date à laquelle le travail doit être rendu
- **Travail en présentiel** (case à cocher) : Indique si le travail se fait en présentiel
- **Bureau** (obligatoire si présentiel) : Localisation du bureau pour le travail en présentiel

## Fichiers modifiés

### 1. `types.ts`

**Modifications :**
- Mise à jour du type `ExamType` avec les nouvelles valeurs
- Ajout de champs dans `PresenceEnseignant` pour les informations du travail :
  - `travail_date_depot?: string | null`
  - `travail_en_presentiel?: boolean | null`
  - `travail_bureau?: string | null`
- Mise à jour de `PresenceFormData` avec les mêmes champs

### 2. `supabase/migrations/update_exam_types_and_travail_fields.sql`

**Nouvelle migration SQL :**
- Suppression et recréation du type enum `exam_type` avec toutes les nouvelles valeurs
- Migration des données existantes (`ecrit` → `qroc_manuel`)
- Ajout de trois nouvelles colonnes dans `presences_enseignants` :
  - `travail_date_depot DATE`
  - `travail_en_presentiel BOOLEAN`
  - `travail_bureau TEXT`
- Création d'index pour optimiser les performances
- Ajout de commentaires pour la documentation

### 3. `pages/public/TeacherPresencePage.tsx`

**Modifications :**
- Remplacement des trois boutons par un menu déroulant `<select>`
- Ajout des nouveaux champs dans l'état du formulaire :
  - `travail_date_depot`
  - `travail_en_presentiel`
  - `travail_bureau`
- Ajout de la validation pour les champs du type "Travail"
- Affichage conditionnel des champs spécifiques au travail dans une section dédiée avec fond bleu
- Réinitialisation des champs spécifiques quand on change de type d'examen

### 4. `lib/teacherPresenceApi.ts`

**Modifications :**
- Ajout des trois nouveaux champs dans `presenceData` lors de la soumission :
  - `travail_date_depot`
  - `travail_en_presentiel`
  - `travail_bureau`

## Validation

Le formulaire valide maintenant :
- Que le type d'examen est sélectionné (obligatoire)
- Si "Autre" est sélectionné, qu'une précision est fournie
- Si "Travail" est sélectionné :
  - Que la date limite de dépôt est renseignée
  - Si "Dépôt en présentiel" est coché, que le bureau est renseigné

## Migration de la base de données

Pour appliquer les modifications à la base de données, exécutez la migration :

```bash
# Via Supabase CLI
supabase db push

# Ou via l'interface Supabase
# Copiez le contenu de supabase/migrations/update_exam_types_and_travail_fields.sql
# et exécutez-le dans l'éditeur SQL de Supabase
```

## Interface utilisateur

### Menu déroulant
Le menu déroulant remplace les trois boutons et offre une meilleure expérience utilisateur avec plus d'options visibles d'un coup d'œil.

### Section "Travail"
Quand "Travail" est sélectionné, une section avec fond bleu clair apparaît contenant :
1. Un champ de date pour la date limite
2. Une case à cocher pour indiquer si c'est en présentiel
3. Si présentiel, un champ texte pour le bureau

### Réactivité
- Les champs spécifiques au type "Travail" sont automatiquement réinitialisés si on change de type
- Les champs spécifiques à "Autre" sont également réinitialisés si on change de type
- La validation s'adapte au type sélectionné

## Notes importantes

- Les données existantes avec `type_examen = 'ecrit'` sont automatiquement migrées vers `'qroc_manuel'`
- Les nouveaux champs sont optionnels dans la base de données (nullable) mais obligatoires dans le formulaire si le type "Travail" est sélectionné
- L'interface est responsive et fonctionne sur mobile et desktop
- Le dark mode est supporté pour tous les nouveaux éléments
