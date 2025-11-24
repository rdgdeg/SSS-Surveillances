# TODO : Implémentation du Verrouillage des Disponibilités

## ✅ Fait

1. Migration SQL créée (`add_lock_submissions_to_sessions.sql`)
   - Ajout de `lock_submissions` (boolean)
   - Ajout de `lock_message` (text)
   - Index créé

2. Documentation créée (`GUIDE-VERROUILLAGE-DISPONIBILITES.md`)

## 📋 À faire

### 1. Exécuter la migration SQL
- Aller dans Supabase SQL Editor
- Exécuter `supabase/migrations/add_lock_submissions_to_sessions.sql`

### 2. Modifier le type Session dans types.ts
```typescript
export interface Session {
  id: string;
  name: string;
  year: number;
  period: 1 | 2 | 3 | 4 | 5;
  is_active: boolean;
  lock_submissions?: boolean;  // AJOUTER
  lock_message?: string;        // AJOUTER
  created_at?: string;
}
```

### 3. Modifier le formulaire de disponibilités
Fichier : `components/public/AvailabilityForm.tsx`

- Vérifier `session.lock_submissions` avant d'afficher le formulaire
- Si verrouillé, afficher un message avec :
  - Icône de cadenas
  - Message expliquant que c'est fermé
  - Coordonnées du secrétariat (02/436.16.89)
  - Suggestion d'échange avec collègue
- Désactiver tous les boutons de soumission

### 4. Créer une interface admin pour gérer le verrouillage
Fichier : `pages/admin/SessionsPage.tsx` (à créer ou modifier)

- Afficher le statut de verrouillage pour chaque session
- Bouton "Verrouiller" / "Déverrouiller"
- Champ optionnel pour message personnalisé
- Confirmation avant verrouillage

### 5. Ajouter la vérification côté serveur
Fichier : `lib/submissionService.ts`

- Vérifier `session.lock_submissions` avant d'accepter une soumission
- Retourner une erreur claire si verrouillé
- Permettre aux admins de contourner (optionnel)

### 6. Tester

- [ ] Verrouiller une session via SQL
- [ ] Vérifier que le formulaire affiche le message
- [ ] Vérifier qu'on ne peut pas soumettre
- [ ] Déverrouiller et vérifier que ça fonctionne à nouveau
- [ ] Tester avec l'interface admin une fois créée

## 🎯 Priorité

**Haute** : Étapes 1, 2, 3, 5 (fonctionnalité de base)
**Moyenne** : Étape 4 (interface admin confortable)
**Basse** : Étape 6 (tests complets)

## 📝 Notes

- Le verrouillage est par session, pas global
- Les admins peuvent toujours modifier via l'interface admin
- Le message par défaut est dans le code, mais peut être personnalisé
- Penser à communiquer la date limite aux surveillants avant de verrouiller
