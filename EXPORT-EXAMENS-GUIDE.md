# Guide d'export des examens

## Vue d'ensemble

L'export des examens permet de télécharger tous les examens (selon les filtres appliqués) au format Excel ou CSV.

## Fonctionnalités

### 1. Export complet
- **Tous les examens** : exporte tous les examens correspondant aux filtres, pas seulement la page en cours
- **Respect des filtres** : seuls les examens filtrés sont exportés
- **Deux formats** : Excel (.xlsx) et CSV

### 2. Formats disponibles

#### Excel (.xlsx) - Recommandé
- Format natif Microsoft Excel
- Colonnes avec largeurs optimisées
- Prêt à l'emploi dans Excel, LibreOffice, Google Sheets
- Meilleure présentation visuelle

#### CSV (.csv)
- Format texte universel
- Compatible avec tous les tableurs
- Encodage UTF-8 avec BOM (compatible Excel)
- Plus léger

## Utilisation

### Étape 1 : Appliquer les filtres (optionnel)

Avant d'exporter, vous pouvez filtrer les examens :
- **Recherche** : par code ou nom d'examen
- **Date** : période spécifique
- **Secrétariat** : faculté (ex: MED, FASB, EPL)
- **Statut** : déclaré ou en attente
- **Cours lié** : avec ou sans cours lié
- **Surveillants** : avec ou sans nombre défini

### Étape 2 : Choisir le format

Deux boutons sont disponibles en haut de la liste :
- **Exporter Excel** : télécharge un fichier .xlsx
- **CSV** : télécharge un fichier .csv

### Étape 3 : Téléchargement

Le fichier est téléchargé automatiquement avec le nom :
```
examens_YYYY-MM-DD.xlsx
ou
examens_YYYY-MM-DD.csv
```

## Colonnes exportées

| Colonne | Description |
|---------|-------------|
| **Code** | Code de l'examen (ex: WMDS2221) |
| **Nom** | Nom complet de l'examen |
| **Date** | Date de l'examen (YYYY-MM-DD) |
| **Heure début** | Heure de début (HH:MM) |
| **Heure fin** | Heure de fin (HH:MM) |
| **Durée (min)** | Durée en minutes |
| **Auditoires** | Liste des auditoires |
| **Secrétariat** | Faculté/secrétariat (ex: FASB, MED) |
| **Surveillants requis** | Nombre de surveillants nécessaires |
| **Enseignants présents** | Nombre d'enseignants présents |
| **Accompagnants** | Nombre de personnes apportées |
| **Statut déclarations** | "Déclaré" ou "En attente" |

## Exemples d'utilisation

### Export de tous les examens
1. Ne pas appliquer de filtre
2. Cliquer sur "Exporter Excel"
3. Tous les examens de la session sont exportés

### Export des examens d'une faculté
1. Filtrer par secrétariat : "MED"
2. Cliquer sur "Exporter Excel"
3. Seuls les examens de médecine sont exportés

### Export des examens sans déclaration
1. Filtrer par statut : "En attente"
2. Cliquer sur "Exporter Excel"
3. Seuls les examens sans déclaration sont exportés

### Export d'une période
1. Filtrer par date de début : "2025-01-15"
2. Filtrer par date de fin : "2025-01-31"
3. Cliquer sur "Exporter Excel"
4. Seuls les examens de cette période sont exportés

## Traitement dans Excel

### Ouvrir le fichier Excel
1. Double-cliquer sur le fichier .xlsx
2. Le fichier s'ouvre directement dans Excel

### Fonctionnalités Excel disponibles
- **Tri** : cliquer sur les en-têtes de colonnes
- **Filtres** : activer les filtres automatiques
- **Tableaux croisés dynamiques** : analyser les données
- **Graphiques** : créer des visualisations
- **Formules** : calculer des statistiques

### Exemple de formule
```excel
=SOMME(I:I)  // Total des surveillants requis
=NB.SI(L:L;"Déclaré")  // Nombre d'examens avec déclarations
```

## Traitement du CSV

### Ouvrir dans Excel
1. Ouvrir Excel
2. Fichier > Ouvrir
3. Sélectionner le fichier .csv
4. Excel détecte automatiquement l'encodage UTF-8

### Ouvrir dans LibreOffice Calc
1. Ouvrir LibreOffice Calc
2. Fichier > Ouvrir
3. Sélectionner le fichier .csv
4. Choisir :
   - Encodage : UTF-8
   - Séparateur : Virgule
   - Délimiteur de texte : Guillemets

### Ouvrir dans Google Sheets
1. Aller sur Google Sheets
2. Fichier > Importer
3. Glisser-déposer le fichier .csv
4. Choisir "Remplacer la feuille de calcul"

## Performance

### Temps d'export

| Nombre d'examens | Temps estimé |
|------------------|--------------|
| < 100 | < 1 seconde |
| 100-500 | 1-2 secondes |
| 500-1000 | 2-5 secondes |
| > 1000 | 5-10 secondes |

### Limite
- Maximum : 10 000 examens par export
- Si vous avez plus, utilisez des filtres pour diviser l'export

## Dépannage

### Le fichier ne se télécharge pas
1. Vérifier que les pop-ups ne sont pas bloquées
2. Vérifier l'espace disque disponible
3. Essayer avec un autre navigateur

### Le fichier est vide
1. Vérifier qu'il y a des examens correspondant aux filtres
2. Réinitialiser les filtres
3. Rafraîchir la page

### Erreur lors de l'export
1. Vérifier la connexion internet
2. Rafraîchir la page
3. Réessayer l'export

### Excel n'ouvre pas le fichier
1. Vérifier que Microsoft Excel est installé
2. Essayer d'ouvrir avec LibreOffice ou Google Sheets
3. Utiliser le format CSV à la place

## Différences entre Excel et CSV

| Critère | Excel (.xlsx) | CSV (.csv) |
|---------|---------------|------------|
| **Taille fichier** | Plus gros | Plus petit |
| **Formatage** | Colonnes ajustées | Aucun |
| **Compatibilité** | Excel, LibreOffice, Google Sheets | Universel |
| **Ouverture** | Direct | Nécessite import |
| **Recommandé pour** | Analyse dans Excel | Import dans d'autres systèmes |

## Bonnes pratiques

✅ **Filtrer avant d'exporter** : pour obtenir uniquement les données nécessaires
✅ **Utiliser Excel** : pour une meilleure présentation
✅ **Nommer les fichiers** : ajouter un suffixe descriptif si nécessaire
✅ **Sauvegarder régulièrement** : pour garder un historique

## Automatisation future

Fonctionnalités prévues :
- [ ] Export planifié automatique
- [ ] Envoi par email
- [ ] Export avec graphiques intégrés
- [ ] Templates personnalisés
- [ ] Export multi-sessions

## Support

En cas de problème :
1. Vérifier la console navigateur (F12)
2. Vérifier les logs Supabase
3. Contacter le support technique
