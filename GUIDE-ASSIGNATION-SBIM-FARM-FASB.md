# Guide d'Assignation Automatique SBIM/FARM à FASB

## Vue d'ensemble

Ce guide explique comment assigner automatiquement les examens dont le code contient "SBIM" ou "FARM" au secrétariat FASB (Faculté de Pharmacie et Sciences Biomédicales).

## Problème résolu

Les examens avec des codes comme :
- **WSBIM2151** (contient SBIM)
- **WFARM1300** (contient FARM)
- Tous les autres codes contenant SBIM ou FARM

Doivent être automatiquement assignés à **FASB** pour utiliser les consignes de ce secrétariat.

## Solution implémentée

### ✅ Script d'assignation automatique

Le script `scripts/assign-sbim-farm-to-fasb.sql` :

1. **Identifie** tous les examens concernés
2. **Met à jour** leur secrétariat vers FASB
3. **Installe un trigger** pour automatiser les futurs examens
4. **Vérifie** que les consignes FASB sont disponibles

### ✅ Fonctionnalités

#### 1. Assignation immédiate
- Met à jour tous les examens existants avec SBIM/FARM
- Change leur `secretariat` vers `FASB`
- Préserve toutes les autres données

#### 2. Automatisation future
- **Trigger automatique** sur INSERT/UPDATE
- Tous les nouveaux examens SBIM/FARM → FASB automatiquement
- Pas d'intervention manuelle nécessaire

#### 3. Vérifications et rapports
- Liste des examens modifiés
- Vérification des consignes FASB
- Résumé complet des changements

## Utilisation

### 1. Exécuter le script d'assignation

```bash
# Appliquer les changements
psql -f scripts/assign-sbim-farm-to-fasb.sql
```

### 2. Vérifier les résultats

Le script affiche automatiquement :
- Nombre d'examens modifiés
- Liste détaillée des changements
- Confirmation que les consignes FASB sont disponibles

### 3. Test avec de nouveaux examens

Après l'installation, tous les nouveaux examens avec SBIM/FARM seront automatiquement assignés à FASB.

## Exemples d'examens concernés

### Codes SBIM
- `WSBIM2151` → FASB
- `LSBIM1234` → FASB
- `MSBIM5678` → FASB

### Codes FARM
- `WFARM1300` → FASB
- `LFARM2400` → FASB
- `MFARM3500` → FASB

## Consignes FASB appliquées

Une fois assignés à FASB, ces examens utiliseront :

### Consignes d'arrivée
- **Heure suggérée** : 08:15
- **Instructions** : "Veuillez vous présenter à l'accueil de la faculté."

### Consignes spécifiques
- Consignes de mise en place FASB
- Consignes générales FASB
- Toutes les instructions spécifiques au secrétariat

## Avantages

### ✅ Automatisation complète
- Plus besoin d'assigner manuellement
- Trigger automatique pour tous les futurs examens
- Cohérence garantie

### ✅ Consignes appropriées
- Les examens SBIM/FARM utilisent les bonnes consignes
- Instructions spécifiques à la Faculté de Pharmacie
- Heure d'arrivée adaptée

### ✅ Maintenance simplifiée
- Une seule exécution du script
- Fonctionne automatiquement ensuite
- Pas de configuration supplémentaire

## Vérification post-installation

### 1. Vérifier les examens existants
```sql
SELECT code_examen, secretariat 
FROM examens 
WHERE code_examen ILIKE '%SBIM%' OR code_examen ILIKE '%FARM%';
```

### 2. Tester avec un nouvel examen
```sql
INSERT INTO examens (session_id, code_examen, nom_examen) 
VALUES ('session-id', 'WSBIM9999', 'Test SBIM');
-- Devrait automatiquement avoir secretariat = 'FASB'
```

### 3. Vérifier les consignes
```sql
SELECT * FROM consignes_secretariat WHERE code_secretariat = 'FASB';
```

## Dépannage

### Problème : Examens non assignés
**Solution** : Réexécuter le script d'assignation

### Problème : Trigger ne fonctionne pas
**Solution** : Vérifier que le trigger existe
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trigger_auto_assign_sbim_farm';
```

### Problème : Consignes FASB manquantes
**Solution** : Vérifier la table consignes_secretariat
```sql
SELECT * FROM consignes_secretariat WHERE code_secretariat = 'FASB';
```

## Impact sur l'interface utilisateur

### Pages affectées
- **Liste des examens** : Affichage correct du secrétariat FASB
- **Planning public** : Consignes FASB affichées pour ces examens
- **Export planning** : Secrétariat FASB inclus dans les exports
- **Gestion des consignes** : Examens SBIM/FARM liés aux consignes FASB

### Fonctionnalités améliorées
- **Cohérence** : Tous les examens SBIM/FARM ont le bon secrétariat
- **Automatisation** : Plus d'erreurs d'assignation manuelle
- **Consignes appropriées** : Instructions spécifiques à la faculté

## Maintenance

### Surveillance recommandée
- **Mensuelle** : Vérifier que les nouveaux examens sont bien assignés
- **Semestrielle** : Contrôler la cohérence des assignations
- **Annuelle** : Réviser les consignes FASB si nécessaire

### Évolutions possibles
- Ajouter d'autres patterns de codes d'examens
- Créer des règles d'assignation pour d'autres facultés
- Automatiser d'autres aspects de la gestion des secrétariats

---

**Les examens SBIM et FARM sont maintenant automatiquement assignés à FASB avec les consignes appropriées !**