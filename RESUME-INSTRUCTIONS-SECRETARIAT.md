# Résumé : Intégration des Instructions du Secrétariat

## Modifications apportées

### 1. Page de déclaration de présence (`pages/public/TeacherPresencePage.tsx`)

#### Nouvelle bannière d'instructions
Ajout d'une bannière complète avec toutes les instructions du secrétariat :

- **Instructions générales** : Ce que les enseignants doivent communiquer
  - Nombre de surveillants
  - Noms et coordonnées des surveillants
  - Type d'examen
  - Durée si moins de 2h

- **Dates limites pour Médecine et Médecine Dentaire** :
  - Examens 8-19 déc 2025 → Dépôt avant 23 nov 2025
  - Examens 5-9 jan 2026 → Dépôt avant 26 nov 2025
  - Examens 12-16 jan 2026 → Dépôt avant 3 déc 2025
  - Examens 19-23 jan 2026 → Dépôt avant 10 déc 2025

- **Avertissement QCM Contest** : Mention que QCM Contest sera obsolète, alternative Gradescope

- **Contact** : Numéro de téléphone du secrétariat (02/436.16.89)

#### Nouveau champ : Durée de l'examen
- Case à cocher "Mon examen dure moins de 2 heures"
- Si coché : champ numérique pour la durée en minutes
- Affichage automatique en format heures/minutes
- Suggestions de durées courantes (30, 45, 60, 90 minutes)
- Valeur par défaut : 120 minutes (2h)

#### Amélioration du champ "Type d'examen"
- Placeholder amélioré pour le champ "Autre" : suggère "Oral, QROC avec Gradescope, etc."

### 2. API (`lib/teacherPresenceApi.ts`)

Ajout de la gestion des nouveaux champs :
- `duree_examen_moins_2h` : Boolean
- `duree_examen_minutes` : Integer (défaut 120)

### 3. Base de données

#### Nouvelle migration : `supabase/migrations/add_exam_duration_fields.sql`

```sql
ALTER TABLE presences_enseignants 
ADD COLUMN IF NOT EXISTS duree_examen_moins_2h BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS duree_examen_minutes INTEGER DEFAULT 120;

-- Contrainte de validation
ALTER TABLE presences_enseignants
ADD CONSTRAINT check_duree_examen_minutes 
CHECK (duree_examen_minutes >= 15 AND duree_examen_minutes <= 240);
```

### 4. Documentation

#### Nouveau guide : `TEACHER-PRESENCE-INSTRUCTIONS-GUIDE.md`
Documentation complète incluant :
- Vue d'ensemble des instructions
- Détails des types d'examens acceptés
- Explication de tous les champs du formulaire
- Fonctionnalités de coordination entre enseignants
- Informations techniques

## Fonctionnalités préservées

✅ Toutes les fonctionnalités existantes sont conservées :
- Recherche de cours
- Types de présence (complet, partiel, absent)
- Gestion des surveillants
- Coordination entre enseignants
- Historique des remarques
- Conservation des consignes

## Utilisation

### Pour les enseignants

1. Accéder à la page de déclaration de présence
2. Lire les instructions du secrétariat (bannière bleue)
3. Rechercher et sélectionner le cours
4. Remplir le formulaire incluant :
   - Informations personnelles
   - Type de présence
   - **Type d'examen** (écrit, QCM, autre)
   - **Durée de l'examen** (si moins de 2h)
   - Nombre de surveillants
   - Consignes/remarques
5. Soumettre

### Pour le secrétariat

Les informations collectées incluent maintenant :
- Type d'examen précis
- Durée exacte de l'examen
- Toutes les informations demandées dans les instructions

## Déploiement

### Étapes requises

1. **Appliquer la migration SQL** :
   ```bash
   # Exécuter dans Supabase
   supabase/migrations/add_exam_duration_fields.sql
   ```

2. **Déployer le code** :
   - Les modifications sont prêtes à être déployées
   - Aucune dépendance supplémentaire requise

3. **Vérification** :
   - Tester la page de déclaration de présence
   - Vérifier que les nouveaux champs s'affichent
   - Confirmer que les données sont bien enregistrées

## Notes importantes

- ⚠️ La date limite mentionnée dans les instructions originales (11 novembre 2025) n'a **pas** été incluse car vous avez précisé de ne pas l'inclure
- Les dates limites de dépôt des examens sont spécifiques à Médecine et Médecine Dentaire
- Le message sur l'obsolescence de QCM Contest est clairement affiché
- Les contraintes de validation garantissent des durées d'examen raisonnables (15-240 minutes)

## Améliorations futures possibles

1. Ajouter un système de rappel automatique pour les dates limites
2. Permettre l'upload de documents directement dans le formulaire
3. Générer automatiquement un PDF récapitulatif pour l'enseignant
4. Envoyer un email de confirmation automatique
