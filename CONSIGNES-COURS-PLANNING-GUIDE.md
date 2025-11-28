# Affichage des Consignes de Cours dans le Planning Public

## Vue d'ensemble

Le planning public des examens affiche maintenant les consignes spécifiques aux cours en plus des consignes des secrétariats. Cela permet aux surveillants de voir les instructions particulières liées à chaque cours directement dans le planning.

## Hiérarchie d'affichage des consignes

Le système utilise une **priorité en cascade** pour déterminer quelles consignes afficher :

### 1. Consignes spécifiques à l'examen (priorité maximale)
Si l'administrateur a activé `utiliser_consignes_specifiques` pour un examen :
- Affiche les consignes spécifiques d'arrivée
- Affiche les consignes de mise en place
- Affiche les consignes générales
- **Aucune autre consigne n'est affichée**

### 2. Consignes du cours (priorité intermédiaire)
Si l'examen est lié à un cours ET que ce cours a des consignes :
- Affiche le code du cours
- Affiche les consignes du cours
- **Les consignes du secrétariat ne sont pas affichées**

### 3. Consignes du secrétariat (priorité par défaut)
Si aucune consigne spécifique ou de cours n'existe :
- Affiche le nom du secrétariat
- Affiche les consignes d'arrivée du secrétariat
- Affiche les consignes de mise en place du secrétariat
- Affiche les consignes générales du secrétariat

## Exemple d'affichage

### Cas 1 : Consignes spécifiques à l'examen
```
📋 Consignes pour les surveillants
Consignes spécifiques pour cet examen

Arriver 45 minutes avant le début de l'examen
Mise en place : Distribuer les calculatrices fournies par le secrétariat
Examen avec surveillance renforcée - 1 surveillant pour 15 étudiants
```

### Cas 2 : Consignes du cours
```
📋 Consignes pour les surveillants
Consignes du cours LEDPH1001

Les étudiants peuvent utiliser une calculatrice non programmable.
Aucun document autorisé.
Prévoir des feuilles de brouillon supplémentaires.
```

### Cas 3 : Consignes du secrétariat
```
📋 Consignes pour les surveillants
Faculté de Pharmacie et Sciences Biomédicales

Consignes d'arrivée : Arriver 30 minutes avant le début de l'examen
Consignes de mise en place : Vérifier l'identité des étudiants
Consignes générales : Pas de téléphone portable pendant la surveillance
```

## Gestion des consignes de cours

### Pour les administrateurs

#### 1. Accéder à la gestion des cours
- Menu Admin > Enseignants > Cours
- Liste de tous les cours avec indication des consignes existantes

#### 2. Ajouter/Modifier des consignes
- Cliquer sur un cours dans la liste
- Remplir le champ "Consignes pour les surveillants"
- Sauvegarder

#### 3. Lier un cours à un examen
- Menu Admin > Examens
- Modifier un examen
- Sélectionner le cours dans le menu déroulant "Cours lié"
- Sauvegarder

### Bonnes pratiques

1. **Consignes de cours** : Utiliser pour les instructions spécifiques et récurrentes
   - Matériel autorisé/interdit
   - Particularités du cours
   - Instructions de distribution

2. **Consignes spécifiques** : Utiliser pour les cas exceptionnels
   - Examen avec modalités inhabituelles
   - Instructions ponctuelles pour une session

3. **Consignes de secrétariat** : Utiliser pour les instructions générales
   - Heure d'arrivée standard
   - Procédures communes à tous les examens
   - Règles générales de surveillance

## Avantages

### Pour les surveillants
- Information contextuelle directement dans le planning
- Pas besoin de chercher les consignes ailleurs
- Instructions claires et spécifiques au cours

### Pour les enseignants
- Possibilité de communiquer des instructions spécifiques
- Réduction des questions le jour de l'examen
- Standardisation des consignes pour leurs cours

### Pour les administrateurs
- Gestion centralisée des consignes
- Flexibilité dans l'organisation
- Hiérarchie claire des priorités

## Modifications techniques

### Fichiers modifiés
- `pages/public/ExamSchedulePage.tsx` : Ajout de la logique d'affichage des consignes de cours

### Structure de données
```typescript
interface Examen {
  // ... autres champs
  cours: {
    code: string;
    intitule_complet: string;
    consignes: string | null;  // ← Nouveau champ récupéré
  } | null;
}
```

### Requête Supabase
```typescript
.select(`
  id,
  date_examen,
  heure_debut,
  heure_fin,
  auditoires,
  code_examen,
  nom_examen,
  secretariat,
  cours:cours_id (
    code,
    intitule_complet,
    consignes  // ← Ajouté
  )
`)
```

## Prochaines améliorations possibles

1. **Historique des consignes** : Tracer les modifications des consignes de cours
2. **Notifications** : Alerter les surveillants en cas de changement de consignes
3. **Templates** : Créer des modèles de consignes réutilisables
4. **Validation** : Vérifier que tous les cours ont des consignes définies
5. **Export** : Générer un PDF avec toutes les consignes pour impression

## Notes

- Les consignes de cours sont stockées dans la table `cours`
- Le champ `consignes` est de type TEXT (illimité)
- Les consignes supportent les retours à la ligne (whitespace-pre-wrap)
- Les consignes sont publiques (visibles sans authentification)
