# Démarrage Rapide - Système d'Héritage des Consignes

## Installation

1. **Exécuter le script d'installation** :
   ```sql
   \i scripts/setup-consignes-heritage.sql
   ```

2. **Vérifier l'installation** :
   ```sql
   \i scripts/test-consignes-heritage.sql
   ```

## Utilisation Basique

### 1. Créer un Nouvel Examen

Dans le modal d'édition d'examen :
- Sélectionnez le **secrétariat** (BAC11, DENT, FASB, FSP, MED)
- Laissez le champ **"Consignes générales"** vide pour hériter du secrétariat
- Ou saisissez des consignes spécifiques si nécessaire

### 2. Modifier les Consignes d'un Examen

**Option A : Via le Modal d'Édition**
- Ouvrez l'examen à modifier
- Modifiez le champ "Consignes générales"
- Sauvegardez

**Option B : Via le Composant Dédié**
- Utilisez `ExamenConsignesEditor` pour une gestion avancée
- Visualisez les consignes héritées vs personnalisées
- Initialisez, modifiez ou revenez aux consignes du secrétariat

### 3. Affichage Public

Les consignes effectives apparaissent automatiquement dans le planning public :
- Consignes du secrétariat par défaut
- Consignes personnalisées si définies
- Indicateur visuel pour les consignes personnalisées

## Fonctions Utiles

### Consulter les Consignes d'un Examen
```sql
SELECT * FROM get_consignes_examen('uuid-de-l-examen');
```

### Initialiser des Consignes Spécifiques
```sql
SELECT initialiser_consignes_specifiques('uuid-de-l-examen');
```

### Revenir aux Consignes du Secrétariat
```sql
SELECT utiliser_consignes_secretariat('uuid-de-l-examen');
```

### Voir les Statistiques
```sql
SELECT * FROM stats_consignes_examens;
```

## Cas d'Usage Courants

### Examen Standard
✅ **Action** : Aucune - l'héritage est automatique  
✅ **Résultat** : L'examen utilise les consignes de son secrétariat

### Examen avec Consignes Spéciales
✅ **Action** : Saisir des consignes dans le champ "Consignes générales"  
✅ **Résultat** : Les consignes spécifiques sont affichées dans le planning

### Changement de Secrétariat
✅ **Action** : Modifier le secrétariat de l'examen  
✅ **Résultat** : Nouvelles consignes héritées automatiquement (si pas de consignes spécifiques)

### Standardisation d'un Examen
✅ **Action** : Utiliser `utiliser_consignes_secretariat()`  
✅ **Résultat** : Retour aux consignes standardisées du secrétariat

## Vérifications Rapides

### Examens avec Consignes Personnalisées
```sql
SELECT code_examen, secretariat, utiliser_consignes_specifiques
FROM examens 
WHERE utiliser_consignes_specifiques = true;
```

### Consignes Effectives d'un Examen
```sql
SELECT code_examen, consignes_generales_effectives, 
       CASE WHEN consignes_generales_personnalisees THEN 'Personnalisées' ELSE 'Secrétariat' END as source
FROM examens_with_consignes 
WHERE code_examen = 'CODE_EXAMEN';
```

### Taux de Personnalisation par Secrétariat
```sql
SELECT secretariat, pourcentage_personnalises || '%' as taux_personnalisation
FROM stats_consignes_examens
ORDER BY pourcentage_personnalises DESC;
```

## Dépannage

### Problème : Consignes Vides
**Cause** : Secrétariat sans consignes définies  
**Solution** : Configurer les consignes dans `consignes_secretariat`

### Problème : Consignes Non Mises à Jour
**Cause** : Examen utilise des consignes spécifiques  
**Solution** : Utiliser `utiliser_consignes_secretariat()` pour revenir à l'héritage

### Problème : Fonction Non Trouvée
**Cause** : Script d'installation non exécuté  
**Solution** : Exécuter `scripts/setup-consignes-heritage.sql`

## Support

- **Documentation complète** : `CONSIGNES-HERITAGE-GUIDE.md`
- **Tests** : `scripts/test-consignes-heritage.sql`
- **Installation** : `scripts/setup-consignes-heritage.sql`