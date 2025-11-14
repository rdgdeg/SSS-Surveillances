# Guide d'import des examens par session

## Vue d'ensemble

Le système d'import a été amélioré pour supporter l'import d'examens par session avec une gestion séparée des cours et des consignes.

## Nouvelles fonctionnalités

### 1. Boutons de rafraîchissement

Des boutons de rafraîchissement ont été ajoutés sur toutes les pages principales :
- **Page Examens** : Bouton en haut à droite pour rafraîchir toutes les données
- **Page Présences Enseignants** : Bouton "Rafraîchir" à côté du bouton "Exporter CSV"
- **Onglet "Lier aux cours"** : Bouton "Rafraîchir" pour recharger la liste des examens sans cours

### 2. Import par session

#### Principe
- **Une liste d'examens par session** : Chaque session a sa propre liste d'examens avec dates et horaires
- **Une liste unique de cours** : Les cours sont partagés entre toutes les sessions
- **Consignes au niveau des cours** : Les remarques et consignes sont attachées aux cours, pas aux examens

#### Format du fichier CSV

Le fichier CSV doit contenir les colonnes suivantes (séparées par point-virgule `;`) :

1. **Date** : Format DD-MM-YY ou DD/MM/YY (ex: 09-01-26)
2. **Jour** : Texte libre (ex: Vendredi) - ignoré lors de l'import
3. **Durée** : Format HHhMM (ex: 02h00)
4. **Heure début** : Format HHhMM ou HH:MM (ex: 09h00 ou 09:00)
5. **Heure fin** : Format HHhMM ou HH:MM (ex: 11h00 ou 11:00)
6. **Activité/Code** : Code de l'examen (ex: WMDS2221=E)
7. **Nom de l'examen** : Intitulé complet
8. **Auditoires** : Liste des salles (ex: 51 A, 51 B, 51 C)
9. **Enseignants** : Emails ou noms séparés par virgules
10. **Secrétariat** : Code du secrétariat (ex: MED, FARM)

#### Exemple de ligne CSV

```csv
09-01-26;Vendredi;02h00;09h00;11h00;WMDS2221=E;SECTEUR HÉMATOLOGIE;51 A, 51 B;prof1@univ.be,prof2@univ.be;MED
```

### 3. Workflow d'import complet

#### Étape 1 : Importer les examens
1. Aller dans **Gestion des examens** > **Import**
2. Sélectionner l'onglet **"Import par session (Recommandé)"**
3. Choisir le fichier CSV de la session
4. Cliquer sur **"Importer"**
5. Vérifier les résultats :
   - Nombre d'examens créés
   - Nombre d'examens mis à jour
   - Avertissements (cours non trouvés)
   - Erreurs éventuelles

#### Étape 2 : Créer ou gérer les cours
1. Aller dans l'onglet **"Lier aux cours"**
2. Pour chaque examen sans cours lié :
   - **Option A** : Accepter la suggestion automatique si elle existe
   - **Option B** : Choisir manuellement un cours existant
   - **Option C** : Créer un nouveau cours avec le bouton **"Créer cours"**

#### Étape 3 : Ajouter les consignes
1. Les consignes sont gérées au niveau des cours, pas des examens
2. Aller dans la gestion des cours pour ajouter les consignes
3. Les consignes seront automatiquement disponibles pour tous les examens liés à ce cours

## Avantages du nouveau système

### Séparation des préoccupations
- **Examens** : Informations spécifiques à une session (date, horaire, auditoires)
- **Cours** : Informations permanentes (code, intitulé, consignes)

### Réutilisation des données
- Un cours créé une fois peut être lié à plusieurs examens
- Les consignes n'ont pas besoin d'être ressaisies à chaque session

### Flexibilité
- Import rapide des examens avec dates et horaires
- Liaison aux cours en différé
- Mise à jour facile des consignes au niveau des cours

## Migration depuis l'ancien format

Si vous avez des fichiers dans l'ancien format :
1. Utilisez l'onglet **"Import simple (Ancien format)"**
2. Le système continuera à fonctionner comme avant
3. Vous pouvez migrer progressivement vers le nouveau format

## Bonnes pratiques

### Préparation du fichier CSV
1. Vérifier que toutes les dates sont au bon format
2. S'assurer que les codes d'examen sont cohérents
3. Vérifier les emails des enseignants

### Après l'import
1. Utiliser le bouton **"Rafraîchir"** pour voir les dernières données
2. Vérifier les avertissements pour les cours non liés
3. Créer les cours manquants avant de lier les examens

### Gestion des consignes
1. Créer d'abord tous les cours nécessaires
2. Ajouter les consignes au niveau des cours
3. Les consignes seront automatiquement disponibles pour tous les examens

## Dépannage

### Problème : "Aucun cours correspondant trouvé"
**Solution** : Créer le cours dans l'onglet "Lier aux cours" puis lier l'examen

### Problème : "Date invalide"
**Solution** : Vérifier le format de la date (DD-MM-YY ou DD/MM/YY)

### Problème : "Horaire invalide"
**Solution** : Vérifier le format des heures (HHhMM ou HH:MM)

### Problème : Les données ne se rafraîchissent pas
**Solution** : Utiliser le bouton "Rafraîchir" en haut de la page

## Support

Pour toute question ou problème, consulter les autres guides :
- `COURSE-INSTRUCTIONS-GUIDE.md` : Gestion des consignes de cours
- `EMAIL-MANUAL-GUIDE.md` : Notifications manuelles
- `GUIDE-SUIVI-SOUMISSIONS.md` : Suivi des soumissions
