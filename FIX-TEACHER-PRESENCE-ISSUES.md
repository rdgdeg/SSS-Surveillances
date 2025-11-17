# Corrections des problèmes de déclaration de présence enseignant

## Problèmes identifiés

1. **Message "connexion revenue"** : Message erroné qui apparaît lors de l'enregistrement
2. **Données non rechargées** : Les présences et accompagnants déjà encodés ne sont pas affichés lors du retour sur un cours
3. **Addition des données** : Les données s'additionnent au lieu de se remplacer

## Corrections apportées

### 1. Fonction `performSubmit` manquante (TeacherPresencePage.tsx)

**Problème** : La fonction `performSubmit` était déclarée mais jamais définie, causant des erreurs lors de la soumission.

**Solution** : 
- Réorganisation du code pour définir correctement `performSubmit`
- Séparation de la logique de confirmation et de soumission
- Ajout d'un message différent pour modification vs création

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  // ... validations ...
  
  // Si d'autres enseignants ont déjà soumis et qu'on n'a pas encore confirmé
  // ET que ce n'est pas une modification (existingPresence)
  if (existingSubmissionsStats.count > 0 && !showConfirmation && !existingPresence) {
    setShowConfirmation(true);
    return;
  }

  await performSubmit();
};

const performSubmit = async () => {
  // ... logique de soumission ...
  toast.success(existingPresence ? 'Présence modifiée avec succès' : 'Présence enregistrée avec succès');
};
```

### 2. Champs manquants dans l'API (teacherPresenceApi.ts)

**Problème** : Les nouveaux champs `type_presence`, `type_examen` et `type_examen_autre` n'étaient pas envoyés à la base de données.

**Solution** : Ajout de ces champs dans l'objet `presenceData` :

```typescript
const presenceData = {
  cours_id: coursId,
  session_id: sessionId,
  enseignant_email: data.enseignant_email.toLowerCase(),
  enseignant_nom: data.enseignant_nom,
  enseignant_prenom: data.enseignant_prenom,
  est_present: data.est_present,
  type_presence: data.type_presence,           // ✅ Ajouté
  type_examen: data.type_examen,               // ✅ Ajouté
  type_examen_autre: data.type_examen_autre || null, // ✅ Ajouté
  nb_surveillants_accompagnants: data.nb_surveillants_accompagnants,
  noms_accompagnants: data.noms_accompagnants || null,
  remarque: data.remarque || null
};
```

### 3. Type TypeScript incomplet (types.ts)

**Problème** : L'interface `PresenceFormData` ne contenait pas les nouveaux champs.

**Solution** : Mise à jour de l'interface :

```typescript
export interface PresenceFormData {
  enseignant_email: string;
  enseignant_nom: string;
  enseignant_prenom: string;
  est_present: boolean;
  type_presence: 'present_full' | 'present_partial' | 'absent';  // ✅ Ajouté
  type_examen: 'ecrit' | 'qcm' | 'autre' | null;                 // ✅ Ajouté
  type_examen_autre?: string;                                     // ✅ Ajouté
  nb_surveillants_accompagnants: number;
  noms_accompagnants?: string;
  remarque?: string;
}
```

## Fonctionnalités maintenant opérationnelles

### ✅ Rechargement des données existantes

Quand un enseignant revient sur un cours pour lequel il a déjà fait une déclaration :
- Tous les champs sont pré-remplis avec les données existantes
- Le type de présence est restauré
- Le type d'examen est restauré
- Le nombre de surveillants et leurs noms sont affichés
- Les remarques précédentes sont affichées

### ✅ Modification sans duplication

- Les données sont mises à jour (UPDATE) au lieu d'être ajoutées (INSERT)
- Pas de duplication des surveillants
- Message de confirmation adapté : "Présence modifiée avec succès"

### ✅ Alerte de coordination

Quand d'autres enseignants ont déjà déclaré des surveillants :
- Affichage d'un avertissement avec le détail des déclarations existantes
- Calcul du total de surveillants après ajout
- Demande de confirmation avant soumission
- **Exception** : Pas de confirmation demandée lors d'une modification (l'enseignant modifie sa propre déclaration)

## Tests recommandés

1. **Test de création** :
   - Sélectionner un cours sans déclaration existante
   - Remplir tous les champs
   - Vérifier l'enregistrement

2. **Test de modification** :
   - Revenir sur un cours déjà déclaré
   - Vérifier que tous les champs sont pré-remplis
   - Modifier des valeurs
   - Vérifier que la modification est bien enregistrée (pas de duplication)

3. **Test de coordination** :
   - Avoir plusieurs enseignants qui déclarent des surveillants pour le même cours
   - Vérifier que l'alerte s'affiche avec le bon total
   - Vérifier que la confirmation est demandée
   - Vérifier qu'en mode modification, pas de confirmation demandée

4. **Test des types d'examen** :
   - Tester les 3 types : écrit, QCM, autre
   - Vérifier que le champ "autre" apparaît et est requis
   - Vérifier que les données sont bien sauvegardées

## Migration de base de données

La migration `supabase/migrations/add_presence_enseignant_fields.sql` doit être appliquée si ce n'est pas déjà fait :

```bash
# Vérifier si la migration est appliquée
# Dans Supabase Dashboard > SQL Editor, exécuter :
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'presences_enseignants' 
AND column_name IN ('type_presence', 'type_examen', 'type_examen_autre');

# Si les colonnes n'existent pas, appliquer la migration
```

## Notes importantes

- Le champ `est_present` est conservé pour la compatibilité mais est maintenant dérivé de `type_presence`
- L'historique des remarques est géré automatiquement par un trigger PostgreSQL
- Les consignes sont également ajoutées à la table `cours` pour être réutilisées dans les sessions futures
