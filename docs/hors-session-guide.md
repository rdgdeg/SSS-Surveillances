# Guide des Sessions Hors-Session

## Vue d'ensemble

En plus des sessions régulières (Janvier, Juin, Août/Septembre), le système supporte maintenant des sessions "Hors-Session" pour gérer les surveillances en dehors des périodes d'examens officielles.

## Types de périodes

### Périodes régulières

1. **Janvier** (period = 1)
   - Session d'examens de janvier
   - Période principale

2. **Juin** (period = 2)
   - Session d'examens de juin
   - Période principale

3. **Août/Septembre** (period = 3)
   - Session d'examens de fin d'été
   - Période principale

### Périodes hors-session

4. **Hors-Session Janvier** (period = 4)
   - Surveillances en dehors de la session officielle de janvier
   - Exemples : rattrapages, examens spéciaux, tests

5. **Hors-Session Juin** (period = 5)
   - Surveillances en dehors de la session officielle de juin
   - Exemples : rattrapages, examens spéciaux, tests

## Utilisation

### Créer une session hors-session

1. Aller dans **Admin > Sessions**
2. Cliquer sur **Nouvelle Session**
3. Remplir les informations :
   - **Nom** : Ex. "Rattrapages Janvier 2025"
   - **Année** : 2025
   - **Période** : Sélectionner "Hors-Session Janvier" ou "Hors-Session Juin"
   - **Activer** : Cocher si vous voulez la rendre immédiatement visible
4. Cliquer sur **Sauvegarder**

### Cas d'usage

#### Rattrapages

```
Nom: Rattrapages Janvier 2025
Année: 2025
Période: Hors-Session Janvier
```

#### Examens spéciaux

```
Nom: Examens Spéciaux Juin 2025
Année: 2025
Période: Hors-Session Juin
```

#### Tests de placement

```
Nom: Tests de Placement Janvier 2025
Année: 2025
Période: Hors-Session Janvier
```

## Différences avec les sessions régulières

### Sessions régulières
- Périodes d'examens officielles
- Grande quantité de créneaux
- Tous les surveillants mobilisés
- Planning établi longtemps à l'avance

### Sessions hors-session
- Examens ponctuels ou rattrapages
- Nombre limité de créneaux
- Surveillants volontaires ou désignés
- Planning plus flexible

## Gestion des disponibilités

Les surveillants peuvent soumettre leurs disponibilités pour les sessions hors-session exactement de la même manière que pour les sessions régulières :

1. Accéder au formulaire de disponibilités
2. La session active (régulière ou hors-session) s'affiche
3. Sélectionner les créneaux disponibles
4. Soumettre

## Bonnes pratiques

### Nommage

Utilisez des noms clairs et descriptifs :
- ✅ "Rattrapages Janvier 2025"
- ✅ "Examens Spéciaux - Médecine - Juin 2025"
- ✅ "Tests de Placement Septembre 2025"
- ❌ "Session 4"
- ❌ "Hors-session"

### Activation

- N'activez qu'une seule session à la fois (régulière ou hors-session)
- Désactivez la session précédente avant d'en activer une nouvelle
- Communiquez clairement aux surveillants quelle session est active

### Planning

- Créez les créneaux suffisamment à l'avance
- Laissez un délai raisonnable pour la soumission des disponibilités
- Envoyez des rappels si nécessaire

## Migration SQL

Pour activer les sessions hors-session dans votre base de données :

```bash
psql -h db.xxx.supabase.co -U postgres -d postgres -f supabase-add-hors-session-periods.sql
```

Cette migration :
- Met à jour la contrainte CHECK pour accepter les périodes 4 et 5
- Ajoute un commentaire documentant les valeurs

## Vérification

Après la migration, vérifiez que tout fonctionne :

```sql
-- Vérifier la contrainte
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'sessions_period_check';

-- Tester la création d'une session hors-session
INSERT INTO sessions (name, year, period, is_active)
VALUES ('Test Hors-Session', 2025, 4, false);

-- Vérifier
SELECT * FROM sessions WHERE period IN (4, 5);

-- Nettoyer le test
DELETE FROM sessions WHERE name = 'Test Hors-Session';
```

## Support

Pour toute question sur les sessions hors-session :
- 📧 Email : admin@institution.edu
- 📞 Téléphone : +32 XX XX XX XX

## Exemples de configuration

### Exemple 1 : Rattrapages de janvier

```
Session régulière Janvier 2025
├── Période: Janvier (1)
├── Dates: 6-24 janvier 2025
└── Créneaux: 150

Session Hors-Session Janvier 2025
├── Période: Hors-Session Janvier (4)
├── Dates: 27-31 janvier 2025
└── Créneaux: 15 (rattrapages uniquement)
```

### Exemple 2 : Examens spéciaux de juin

```
Session régulière Juin 2025
├── Période: Juin (2)
├── Dates: 2-20 juin 2025
└── Créneaux: 200

Session Hors-Session Juin 2025
├── Période: Hors-Session Juin (5)
├── Dates: 23-27 juin 2025
└── Créneaux: 10 (examens spéciaux)
```

## Notes techniques

### Base de données

Les périodes sont stockées comme des entiers dans la colonne `period` :
- 1 = Janvier
- 2 = Juin
- 3 = Août/Septembre
- 4 = Hors-Session Janvier
- 5 = Hors-Session Juin

### Code TypeScript

```typescript
import { Session } from './types';
import { getPeriodLabel, isHorsSession } from './lib/sessionUtils';

const session: Session = {
  id: '...',
  name: 'Rattrapages Janvier 2025',
  year: 2025,
  period: 4, // Hors-Session Janvier
  is_active: true
};

console.log(getPeriodLabel(session.period)); 
// "Hors-Session Janvier"

console.log(isHorsSession(session)); 
// true
```

### Utilitaires disponibles

Le fichier `lib/sessionUtils.ts` fournit des fonctions helper :
- `getPeriodLabel(period)` : Label complet
- `getPeriodShortLabel(period)` : Label court
- `formatSessionName(session)` : Nom formaté
- `isHorsSession(session)` : Vérifier si hors-session
- `getAvailablePeriods()` : Liste toutes les périodes
