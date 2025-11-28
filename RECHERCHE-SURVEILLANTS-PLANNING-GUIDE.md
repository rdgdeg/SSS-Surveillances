# Recherche et Filtre des Surveillants dans le Planning

## Vue d'ensemble

Le planning public des examens permet maintenant aux surveillants de trouver rapidement leurs surveillances grâce à :
1. **Recherche globale** : Recherche par nom complet (nom et prénom)
2. **Filtre dédié** : Filtre par nom de famille uniquement

## Fonctionnalités

### 1. Recherche globale (barre de recherche)

La barre de recherche principale permet de rechercher dans :
- Code du cours
- Nom du cours
- Code de l'examen
- Nom de l'examen
- Auditoires
- **Noms des surveillants (nom ET prénom)** ← NOUVEAU

#### Exemples d'utilisation
```
"Dupont" → Trouve tous les examens avec un surveillant nommé Dupont
"Marie" → Trouve tous les examens avec un surveillant prénommé Marie
"Dupont Marie" → Trouve les examens avec Marie Dupont
"LEDPH" → Trouve tous les examens du cours LEDPH
"Socrate" → Trouve les examens dans l'auditoire Socrate
```

### 2. Filtre par nom de famille

Un nouveau filtre dédié "Surveillant" affiche uniquement les **noms de famille** des surveillants.

#### Avantages
- Liste alphabétique des noms de famille
- Recherche rapide sans taper
- Évite les doublons de prénoms
- Interface claire et organisée

#### Fonctionnement
Le filtre extrait automatiquement le premier mot du nom complet (qui est généralement le nom de famille dans le format "Nom Prénom").

#### Exemple
Si les surveillants sont :
- Dupont Marie
- Dupont Jean
- Martin Sophie
- Durand Paul

Le filtre affichera :
- Dupont
- Durand
- Martin

En sélectionnant "Dupont", vous verrez tous les examens surveillés par Marie Dupont ET Jean Dupont.

## Interface utilisateur

### Disposition des filtres

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Rechercher par cours, surveillant, local...              │
└─────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ 📅 Date      │ Secrétariat  │ Créneau      │ 👥 Surveillant│
│ [Toutes]  ▼  │ [Tous]    ▼  │ [Tous]    ▼  │ [Tous]     ▼ │
└──────────────┴──────────────┴──────────────┴──────────────┘

45 examens trouvés
```

### Responsive
- **Desktop** : 4 filtres sur une ligne
- **Tablette** : 2 filtres par ligne
- **Mobile** : 1 filtre par ligne

## Cas d'usage

### Pour un surveillant

**Scénario 1 : Recherche rapide par nom**
1. Ouvrir le planning public
2. Taper son nom dans la barre de recherche
3. Voir immédiatement tous ses examens

**Scénario 2 : Utilisation du filtre**
1. Ouvrir le planning public
2. Cliquer sur le filtre "Surveillant"
3. Sélectionner son nom de famille
4. Voir tous les examens assignés

**Scénario 3 : Combinaison de filtres**
1. Sélectionner son nom dans le filtre "Surveillant"
2. Sélectionner une date spécifique
3. Voir uniquement ses surveillances pour ce jour

### Pour un administrateur

**Vérifier les attributions d'un surveillant**
1. Utiliser le filtre "Surveillant"
2. Sélectionner le nom de famille
3. Vérifier la répartition des surveillances

**Rechercher un surveillant spécifique**
1. Taper le nom complet dans la recherche
2. Voir tous les examens assignés
3. Vérifier les auditoires et horaires

## Implémentation technique

### Récupération des données

```typescript
// Fetch surveillants for all examens
const { data: auditoires } = useQuery({
  queryKey: ['all-auditoires-surveillants', activeSession?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('v_examen_auditoires_with_surveillants')
      .select('*')
      .in('examen_id', examenIds);
    
    return data;
  },
});
```

### Enrichissement des examens

```typescript
// Enrich examens with surveillants names
const examensWithSurveillants = useMemo(() => {
  return examens.map(examen => {
    const examenAuditoires = auditoires.filter(a => a.examen_id === examen.id);
    const surveillantsNoms = examenAuditoires.flatMap(a => a.surveillants_noms || []);
    
    return {
      ...examen,
      surveillants_noms: surveillantsNoms,
    };
  });
}, [examens, auditoires]);
```

### Extraction des noms de famille

```typescript
const uniqueSurveillants = useMemo(() => {
  const allSurveillants = examensWithSurveillants.flatMap(e => e.surveillants_noms || []);
  
  // Extract last names (first word)
  const lastNames = allSurveillants
    .map(nom => nom.trim().split(/\s+/)[0])
    .filter(Boolean);
  
  return [...new Set(lastNames)].sort((a, b) => a.localeCompare(b, 'fr'));
}, [examensWithSurveillants]);
```

### Filtrage

```typescript
// Search includes surveillants
const surveillantsText = (examen.surveillants_noms || []).join(' ').toLowerCase();
const matchesSearch = surveillantsText.includes(search);

// Filter by last name
if (selectedSurveillant) {
  const hasSurveillant = (examen.surveillants_noms || []).some(nom => 
    nom.toLowerCase().startsWith(selectedSurveillant.toLowerCase())
  );
}
```

## Avantages

### Pour les surveillants
- ✅ Recherche instantanée de leurs surveillances
- ✅ Pas besoin de parcourir tout le planning
- ✅ Deux méthodes de recherche (recherche libre ou filtre)
- ✅ Combinaison possible avec d'autres filtres (date, horaire)

### Pour l'organisation
- ✅ Réduction des questions "Quand dois-je surveiller ?"
- ✅ Autonomie des surveillants
- ✅ Meilleure communication
- ✅ Moins de charge administrative

### Technique
- ✅ Utilisation de la vue existante `v_examen_auditoires_with_surveillants`
- ✅ Pas de modification de la base de données
- ✅ Performance optimisée avec React Query
- ✅ Mise en cache des données

## Limitations et notes

### Format des noms
Le système suppose que les noms sont au format "Nom Prénom". Si le format est différent, l'extraction du nom de famille peut être incorrecte.

### Homonymes
Si plusieurs surveillants ont le même nom de famille, le filtre affichera tous les examens de ces personnes. Utiliser la recherche globale avec le prénom pour plus de précision.

### Performance
- Les données des surveillants sont chargées une seule fois
- Mise en cache avec React Query
- Filtrage côté client pour une réponse instantanée

## Prochaines améliorations possibles

1. **Recherche avancée** : Recherche par prénom uniquement
2. **Tri personnalisé** : Trier par nombre de surveillances
3. **Export personnel** : Exporter uniquement ses surveillances
4. **Notifications** : Alertes pour les surveillances à venir
5. **Calendrier personnel** : Vue calendrier des surveillances d'un surveillant
6. **Statistiques** : Nombre total de surveillances par surveillant

## Documentation associée

- `INTEGRATION-SURVEILLANTS-GUIDE.md` : Intégration des surveillants dans le système
- `SURVEILLANTS-PAR-AUDITOIRE-GUIDE.md` : Gestion des surveillants par auditoire
- `CONSIGNES-SECRETARIAT-FEATURE.md` : Affichage des consignes dans le planning
