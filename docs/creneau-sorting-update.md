# Mise à jour du tri des créneaux de surveillance

## Objectif
Assurer que les créneaux de surveillance sont toujours affichés dans l'ordre chronologique : d'abord par date, puis par heure de début.

## Modifications effectuées

### 1. API - `lib/api.ts`

#### Fonction `getActiveSessionWithCreneaux()`
Ajout du tri lors de la récupération des créneaux pour la session active (utilisé par le formulaire public) :

```typescript
const { data: creneaux, error: creneauxError } = await supabase
    .from('creneaux')
    .select('*')
    .eq('session_id', activeSession.id)
    .order('date_surveillance', { ascending: true })
    .order('heure_debut_surveillance', { ascending: true });
```

#### Fonctions déjà triées
Les fonctions suivantes avaient déjà le tri correct :
- `getCreneauxBySession()` - Utilisée par la page admin Créneaux
- `getDisponibilitesData()` - Utilisée par la page admin Disponibilités
- `getCreneauxWithStats()` - Utilisée pour les statistiques de capacité

### 2. Composant - `components/public/AvailabilityForm.tsx`

#### Fonction `groupCreneauxByDate()`
Ajout du tri par heure de début dans chaque groupe de date :

```typescript
const groupCreneauxByDate = (creneaux: Creneau[]) => {
    const grouped = creneaux.reduce((acc, creneau) => {
        if (creneau.date_surveillance) {
            const date = creneau.date_surveillance;
            if (!acc[date]) acc[date] = [];
            acc[date].push(creneau);
        }
        return acc;
    }, {} as Record<string, Creneau[]>);
    
    // Trier les créneaux par heure de début dans chaque groupe
    Object.keys(grouped).forEach(date => {
        grouped[date].sort((a, b) => {
            const timeA = a.heure_debut_surveillance || '';
            const timeB = b.heure_debut_surveillance || '';
            return timeA.localeCompare(timeB);
        });
    });
    
    return grouped;
};
```

## Impact

### Formulaire public de disponibilités
- Les créneaux sont maintenant affichés dans l'ordre chronologique correct
- Facilite la saisie pour les surveillants
- Améliore l'expérience utilisateur

### Pages admin
- Toutes les pages admin affichaient déjà les créneaux dans le bon ordre
- Aucun changement visible pour les administrateurs

## Tests recommandés

1. **Formulaire public** :
   - Vérifier que les créneaux sont affichés par date croissante
   - Vérifier que dans chaque date, les créneaux sont triés par heure de début
   - Tester avec des créneaux ayant des heures variées (matin, après-midi, soir)

2. **Pages admin** :
   - Vérifier que le tri reste correct dans la page Créneaux
   - Vérifier que le tri reste correct dans la page Disponibilités
   - Vérifier que les statistiques de capacité affichent les créneaux dans le bon ordre

## Notes techniques

- Le tri est effectué à deux niveaux :
  1. **Base de données** : Tri SQL avec `.order()` pour les requêtes directes
  2. **Client** : Tri JavaScript pour les données groupées par date

- Le tri utilise `localeCompare()` pour les heures, ce qui fonctionne correctement avec le format HH:MM

- Les créneaux sans date ou sans heure de début sont gérés correctement (chaînes vides)

## Date de mise à jour
2025-01-13
