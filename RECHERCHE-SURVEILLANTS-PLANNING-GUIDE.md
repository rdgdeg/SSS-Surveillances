# Recherche et Filtre des Surveillants dans le Planning

## Vue d'ensemble

Le planning public des examens permet maintenant aux surveillants de trouver rapidement leurs surveillances grâce à :
1. **Recherche globale** : Recherche par nom complet (nom et prénom)
2. **Filtre avec autocomplétion** : Saisie intelligente avec suggestions en temps réel

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

### 2. Filtre avec autocomplétion

Un nouveau filtre dédié "Surveillant" avec **autocomplétion intelligente**.

#### Avantages
- ✅ Saisie libre avec suggestions en temps réel
- ✅ Affiche les noms complets (nom ET prénom)
- ✅ Limite à 50 suggestions pour la performance
- ✅ Bouton de réinitialisation (✕) pour effacer rapidement
- ✅ Recherche sur le nom complet (nom OU prénom)

#### Fonctionnement
1. Commencez à taper quelques lettres dans le champ "Surveillant"
2. Les suggestions apparaissent automatiquement
3. Cliquez sur un nom pour le sélectionner
4. Le filtre s'applique immédiatement
5. Cliquez sur ✕ pour réinitialiser

#### Exemples
**Recherche par nom de famille :**
Tapez "Dup" → Suggestions :
- Dupont Marie
- Dupont Jean
- Dupuis Sophie

**Recherche par prénom :**
Tapez "Marie" → Suggestions :
- Dupont Marie
- Martin Marie
- Durand Marie-Claire

**Recherche partielle :**
Tapez "ont" → Suggestions :
- Dupont Marie
- Dupont Jean
- Lemont Paul

## Interface utilisateur

### Disposition des filtres

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Rechercher par cours, surveillant, local...              │
└─────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ 📅 Date      │ Secrétariat  │ Créneau      │ 👥 Surveillant│
│ [Toutes]  ▼  │ [Tous]    ▼  │ [Tous]    ▼  │ [Taper...]   │
└──────────────┴──────────────┴──────────────┴──────────────┘
                                                    ↓
                                        ┌──────────────────┐
                                        │ Dupont Marie     │
                                        │ Dupont Jean      │
                                        │ Dupuis Sophie    │
                                        └──────────────────┘

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

**Scénario 2 : Utilisation du filtre avec autocomplétion**
1. Ouvrir le planning public
2. Cliquer dans le champ "Surveillant"
3. Taper les premières lettres de son nom
4. Sélectionner son nom dans les suggestions
5. Voir tous les examens assignés

**Scénario 3 : Combinaison de filtres**
1. Utiliser le filtre "Surveillant" pour se sélectionner
2. Sélectionner une date spécifique
3. Voir uniquement ses surveillances pour ce jour

### Pour un administrateur

**Vérifier les attributions d'un surveillant**
1. Utiliser le filtre "Surveillant" avec autocomplétion
2. Taper le nom du surveillant
3. Vérifier la répartition des surveillances

**Rechercher un surveillant spécifique**
1. Taper le nom complet dans la recherche ou le filtre
2. Voir tous les examens assignés
3. Vérifier les auditoires et horaires

## Implémentation technique

### États React

```typescript
const [selectedSurveillant, setSelectedSurveillant] = useState<string>('');
const [surveillantInput, setSurveillantInput] = useState<string>('');
const [showSurveillantSuggestions, setShowSurveillantSuggestions] = useState(false);
```

### Récupération des surveillants

```typescript
// Get unique surveillants (full names)
const uniqueSurveillants = useMemo(() => {
  if (!examensWithSurveillants) return [];
  
  const allSurveillants = examensWithSurveillants.flatMap(e => e.surveillants_noms || []);
  
  return [...new Set(allSurveillants)]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'fr'));
}, [examensWithSurveillants]);
```

### Filtrage des suggestions

```typescript
// Filter surveillants based on input
const filteredSurveillants = useMemo(() => {
  if (!surveillantInput.trim()) return uniqueSurveillants;
  
  const search = surveillantInput.toLowerCase();
  return uniqueSurveillants.filter(nom => 
    nom.toLowerCase().includes(search)
  );
}, [uniqueSurveillants, surveillantInput]);
```

### Composant d'autocomplétion

```typescript
<input
  type="text"
  placeholder="Taper un nom..."
  value={surveillantInput}
  onChange={(e) => {
    setSurveillantInput(e.target.value);
    setShowSurveillantSuggestions(true);
    if (!e.target.value.trim()) {
      setSelectedSurveillant('');
    }
  }}
  onFocus={() => setShowSurveillantSuggestions(true)}
  onBlur={() => setTimeout(() => setShowSurveillantSuggestions(false), 200)}
/>

{/* Suggestions dropdown */}
{showSurveillantSuggestions && filteredSurveillants.length > 0 && (
  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
    {filteredSurveillants.slice(0, 50).map((nom) => (
      <button
        key={nom}
        onClick={() => {
          setSurveillantInput(nom);
          setSelectedSurveillant(nom);
          setShowSurveillantSuggestions(false);
        }}
      >
        {nom}
      </button>
    ))}
  </div>
)}
```

## Avantages

### Pour les surveillants
- ✅ Recherche instantanée de leurs surveillances
- ✅ Autocomplétion intelligente (pas besoin de taper le nom complet)
- ✅ Recherche flexible (par nom OU prénom)
- ✅ Interface intuitive et rapide
- ✅ Combinaison possible avec d'autres filtres

### Pour l'organisation
- ✅ Réduction des questions "Quand dois-je surveiller ?"
- ✅ Autonomie totale des surveillants
- ✅ Meilleure communication
- ✅ Moins de charge administrative

### Technique
- ✅ Utilisation de la vue existante `v_examen_auditoires_with_surveillants`
- ✅ Pas de modification de la base de données
- ✅ Performance optimisée (limite à 50 suggestions)
- ✅ Mise en cache avec React Query
- ✅ Filtrage côté client pour une réponse instantanée

## Limitations et notes

### Performance
- Limite de 50 suggestions affichées simultanément
- Si plus de 50 résultats, un message invite à affiner la recherche
- Filtrage côté client pour une réponse instantanée

### Format des noms
- Affiche les noms complets tels qu'enregistrés dans la base
- La recherche fonctionne sur le nom complet (insensible à la casse)
- Supporte les noms composés et les accents

### UX
- Délai de 200ms sur le `onBlur` pour permettre le clic sur une suggestion
- Bouton ✕ pour réinitialiser rapidement
- Suggestions masquées automatiquement après sélection

## Prochaines améliorations possibles

1. **Recherche floue** : Tolérance aux fautes de frappe
2. **Mise en évidence** : Surligner les lettres correspondantes dans les suggestions
3. **Raccourcis clavier** : Navigation avec flèches haut/bas et Enter
4. **Historique** : Mémoriser les dernières recherches
5. **Export personnel** : Exporter uniquement ses surveillances
6. **Notifications** : Alertes pour les surveillances à venir
7. **Statistiques** : Nombre total de surveillances par surveillant

## Documentation associée

- `INTEGRATION-SURVEILLANTS-GUIDE.md` : Intégration des surveillants dans le système
- `SURVEILLANTS-PAR-AUDITOIRE-GUIDE.md` : Gestion des surveillants par auditoire
- `CONSIGNES-SECRETARIAT-FEATURE.md` : Affichage des consignes dans le planning
