# Tests - Gestion de la présence des enseignants aux examens

## Structure des tests

```
__tests__/
├── integration/
│   └── teacher-exam-presence.test.tsx  # Tests d'intégration des flows complets
└── README.md

lib/__tests__/
├── examenCsvParser.test.ts             # Tests unitaires du parser CSV
└── examenApi.test.ts                   # Tests unitaires des fonctions API
```

## Exécuter les tests

### Tous les tests

```bash
npm test
```

### Tests unitaires uniquement

```bash
npm test -- lib/__tests__
```

### Tests d'intégration uniquement

```bash
npm test -- __tests__/integration
```

### Tests avec couverture

```bash
npm test -- --coverage
```

### Mode watch (développement)

```bash
npm test -- --watch
```

## Tests unitaires

### Parser CSV (`examenCsvParser.test.ts`)

Tests couverts :
- ✅ Parsing de CSV valide avec tous les champs
- ✅ Parsing avec champs obligatoires uniquement
- ✅ Gestion de plusieurs emails
- ✅ Validation des champs obligatoires
- ✅ Validation du format des emails
- ✅ Validation du format des dates (YYYY-MM-DD)
- ✅ Validation du format des heures (HH:MM)
- ✅ Validation des longueurs maximales
- ✅ Gestion des caractères spéciaux (point-virgule dans le nom)
- ✅ Trim des espaces
- ✅ Validation de la taille du fichier
- ✅ Validation du type de fichier

### API Functions (`examenApi.test.ts`)

Tests couverts :
- ✅ Recherche d'examens
- ✅ Validation des données de présence
- ✅ Normalisation des emails (lowercase)
- ✅ Gestion du nombre de surveillants (0 si absent)
- ✅ Structure des notifications
- ✅ Validation des formats (email, date, heure)
- ✅ Logique métier (calcul des besoins en surveillants)

## Tests d'intégration

### Flow Enseignant (`teacher-exam-presence.test.tsx`)

Tests couverts :
- ✅ Recherche d'examen
  - Affichage du champ de recherche
  - Bouton de saisie manuelle
- ✅ Saisie manuelle
  - Affichage de tous les champs
  - Validation des champs obligatoires
  - Message d'information sur la validation
- ✅ Déclaration de présence
  - Affichage des informations de l'examen
  - Tous les champs du formulaire
  - Affichage conditionnel du champ surveillants
  - Validation de l'email
- ✅ Flow complet (recherche → déclaration)
- ✅ Flow complet (saisie manuelle → déclaration)

### Flow Admin

Tests couverts :
- ✅ Import CSV avec progression
- ✅ Gestion des erreurs d'import
- ✅ Validation d'examen saisi manuellement
- ✅ Suppression d'examen
- ✅ Filtrage et tri des examens
- ✅ Calcul des besoins en surveillants

## Mocks

Les tests utilisent des mocks pour :
- Supabase client (`supabaseClient`)
- React Query hooks (`useExamens`)
- Composants externes

## Assertions principales

### Parser CSV
```typescript
expect(result.examens).toHaveLength(2);
expect(result.errors).toHaveLength(0);
expect(result.examens[0].code_examen).toBe('MATH101');
```

### Validation
```typescript
expect(emailRegex.test(email)).toBe(true);
expect(dateRegex.test(date)).toBe(true);
expect(timeRegex.test(time)).toBe(true);
```

### Composants
```typescript
expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
expect(screen.getByText(/créer l'examen/i)).toBeInTheDocument();
```

## Couverture attendue

- **Parser CSV** : ~95% (toutes les branches principales)
- **API Functions** : ~80% (logique métier et validations)
- **Composants** : ~70% (flows principaux et validations)

## Ajouter de nouveaux tests

### Test unitaire

```typescript
import { describe, it, expect } from 'vitest';

describe('Ma fonctionnalité', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Test d'intégration

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

it('should interact with component', async () => {
  render(<MyComponent />, { wrapper: createWrapper() });
  
  const button = screen.getByText(/click me/i);
  fireEvent.click(button);
  
  await waitFor(() => {
    expect(screen.getByText(/success/i)).toBeInTheDocument();
  });
});
```

## Dépendances de test

- `vitest` : Framework de test
- `@testing-library/react` : Utilitaires pour tester React
- `@testing-library/user-event` : Simulation d'interactions utilisateur

## Notes

- Les tests sont exécutés en parallèle par défaut
- Les mocks sont réinitialisés avant chaque test (`beforeEach`)
- Les tests d'intégration utilisent un QueryClient isolé
- Les tests ne font pas d'appels réseau réels (tout est mocké)
