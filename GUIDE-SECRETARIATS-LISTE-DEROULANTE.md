# Guide des Secrétariats avec Liste Déroulante

## Vue d'ensemble

Ce guide explique la configuration complète des secrétariats avec une liste déroulante standardisée pour la modification des examens.

## Secrétariats configurés

### ✅ Liste complète des secrétariats

1. **BAC11** - BAC 11
2. **DENT** - Faculté de Médecine Dentaire  
3. **FASB** - Faculté de Pharmacie et Sciences Biomédicales
4. **FSP** - Faculté de Santé Publique
5. **MED** - Faculté de Médecine

## Assignation automatique

### 🔄 Règles d'assignation intelligente

Le système applique ces règles dans l'ordre de priorité :

#### Priorité 1 : Codes spéciaux
- **SBIM** ou **FARM** → **FASB** (automatique)
- Exemples : `WSBIM2151`, `WFARM1300` → FASB

#### Priorité 2 : Secrétariat déjà défini
- Si un secrétariat valide est déjà assigné → **conservé**
- Validation : doit être dans {BAC11, DENT, FASB, FSP, MED}

#### Priorité 3 : Assignation par code
- **MED** ou **MEDE** → **MED**
- **DENT** → **DENT**  
- **FSP** → **FSP**
- **W + 8 caractères** → **BAC11** (par défaut)

## Interface utilisateur

### 📋 Liste déroulante standardisée

#### Composant `SecretariatSelect`
- **Chargement dynamique** depuis la base de données
- **Fallback** avec les 5 secrétariats par défaut
- **Format d'affichage** : "CODE - Nom complet"
- **Validation** intégrée

#### Utilisation dans ExamEditModal
```tsx
<SecretariatSelect
  value={formData.secretariat}
  onChange={(value) => setFormData({ ...formData, secretariat: value })}
  placeholder="Sélectionner un secrétariat"
/>
```

#### Fonctionnalités
- ✅ **Chargement automatique** des secrétariats actifs
- ✅ **Indication visuelle** pour SBIM/FARM → FASB
- ✅ **Validation** des valeurs sélectionnées
- ✅ **Gestion d'erreurs** avec fallback

## Configuration de la base de données

### 🗄️ Script de configuration

Le script `scripts/setup-secretariats-complets.sql` :

1. **Configure tous les secrétariats** avec consignes complètes
2. **Installe le trigger intelligent** d'assignation
3. **Crée une fonction** pour récupérer les secrétariats actifs
4. **Fournit des statistiques** de répartition

### 📊 Consignes par secrétariat

#### BAC11
- **Arrivée** : "Veuillez vous présenter à l'accueil du BAC 11."
- **Heure** : 08:15
- **Mise en place** : Instructions du responsable de surveillance

#### DENT
- **Arrivée** : "Veuillez vous présenter à l'accueil de la Faculté de Médecine Dentaire."
- **Heure** : 08:15
- **Spécificités** : Équipements dentaires et hygiène

#### FASB
- **Arrivée** : "Veuillez vous présenter à l'accueil de la Faculté de Pharmacie et Sciences Biomédicales."
- **Heure** : 08:15
- **Spécificités** : Protocoles de sécurité des laboratoires

#### FSP
- **Arrivée** : "Veuillez vous présenter à l'accueil de la Faculté de Santé Publique."
- **Heure** : 08:15
- **Spécificités** : Consignes spécifiques aux examens de santé publique

#### MED
- **Arrivée** : "Veuillez vous présenter à l'accueil de la Faculté de Médecine."
- **Heure** : 08:15
- **Spécificités** : Consignes médicales et d'hygiène

## Installation et utilisation

### 1. Configurer la base de données
```bash
# Exécuter le script de configuration
psql -f scripts/setup-secretariats-complets.sql
```

### 2. Vérifier l'interface
- Aller sur la page d'administration des examens
- Modifier un examen existant ou créer un nouveau
- Vérifier que la liste déroulante affiche les 5 secrétariats

### 3. Tester l'assignation automatique
- Créer un examen avec code contenant "SBIM" → doit être assigné à FASB
- Créer un examen avec code contenant "FARM" → doit être assigné à FASB
- Modifier manuellement le secrétariat → doit être conservé

## Avantages de cette approche

### ✅ Cohérence garantie
- **Liste standardisée** dans toute l'application
- **Validation** des valeurs sélectionnées
- **Pas d'erreurs de saisie** (plus de champ texte libre)

### ✅ Automatisation intelligente
- **SBIM/FARM** automatiquement vers FASB
- **Assignation par défaut** basée sur les codes
- **Respect des choix manuels** existants

### ✅ Maintenance simplifiée
- **Configuration centralisée** dans la base de données
- **Ajout facile** de nouveaux secrétariats
- **Consignes spécifiques** par secrétariat

### ✅ Expérience utilisateur améliorée
- **Sélection rapide** avec liste déroulante
- **Indication visuelle** pour les assignations automatiques
- **Pas de confusion** sur les codes à utiliser

## Pages affectées

### Interface d'administration
- **ExamEditModal** : Liste déroulante pour modification
- **ExamList** : Affichage cohérent des secrétariats
- **Statistiques** : Répartition par secrétariat

### Interface publique
- **ExamSchedulePage** : Filtre par secrétariat (déjà fonctionnel)
- **Planning** : Affichage des consignes appropriées
- **Export** : Secrétariats corrects dans les exports

## Maintenance

### Ajouter un nouveau secrétariat
```sql
INSERT INTO consignes_secretariat (
    code_secretariat, nom_secretariat, 
    consignes_arrivee, heure_arrivee_suggeree
) VALUES (
    'NOUVEAU', 'Nouveau Secrétariat',
    'Consignes d''arrivée...', '08:15'
);
```

### Modifier les consignes
```sql
UPDATE consignes_secretariat 
SET consignes_arrivee = 'Nouvelles consignes...'
WHERE code_secretariat = 'FASB';
```

### Désactiver un secrétariat
```sql
UPDATE consignes_secretariat 
SET is_active = false 
WHERE code_secretariat = 'ANCIEN';
```

## Dépannage

### Problème : Liste déroulante vide
**Solution** : Vérifier que les secrétariats sont actifs
```sql
SELECT * FROM consignes_secretariat WHERE is_active = true;
```

### Problème : Assignation automatique ne fonctionne pas
**Solution** : Vérifier le trigger
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trigger_auto_assign_secretariat';
```

### Problème : Secrétariat non reconnu
**Solution** : Ajouter le secrétariat manquant dans la table

---

**Les secrétariats sont maintenant standardisés avec une liste déroulante cohérente et une assignation automatique intelligente !**