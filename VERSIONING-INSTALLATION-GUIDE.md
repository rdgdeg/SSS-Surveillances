# Guide d'Installation du Système de Versioning

## Vue d'ensemble

Le système de versioning que je viens de créer vous permet de :

✅ **Tracer toutes les modifications** des données critiques  
✅ **Restaurer des versions antérieures** en cas de problème  
✅ **Comparer différentes versions** d'un enregistrement  
✅ **Auditer les changements** avec utilisateur et timestamp  
✅ **Prévenir la perte de données** accidentelle  

## Installation

### 1. Migration de base de données

Exécutez la migration dans Supabase SQL Editor :

```sql
-- Copier et exécuter le contenu de :
-- supabase/migrations/create_versioning_system.sql
```

Ou utilisez le script d'installation :

```sql
-- Exécuter dans Supabase SQL Editor :
\i scripts/apply-versioning-migration.sql
```

### 2. Test de l'installation

Vérifiez que tout fonctionne :

```sql
-- Exécuter dans Supabase SQL Editor :
\i scripts/test-versioning-system.sql
```

### 3. Redémarrage de l'application

Redémarrez votre application React pour charger les nouveaux composants.

## Utilisation

### 1. Accès admin

Connectez-vous en tant que **RaphD** (admin complet) et accédez à :
```
/admin/versioning
```

### 2. Interface de versioning

L'interface vous permet de :

- **Voir l'historique** de toutes les tables versionnées
- **Comparer des versions** côte à côte
- **Restaurer des versions** antérieures
- **Exporter l'historique** en JSON/CSV
- **Configurer le versioning** par table
- **Nettoyer les anciennes versions**

### 3. Intégration dans vos pages

#### Bouton d'historique simple
```tsx
import VersioningButton from '../components/shared/VersioningButton';

<VersioningButton
  tableName="examens"
  recordId={examen.id}
  onRestore={() => window.location.reload()}
/>
```

#### Hook pour opérations CRUD
```tsx
import { useVersionedCRUD } from '../hooks/useVersioning';

const { insert, update, delete: deleteRecord } = useVersionedCRUD('examens');

// Toutes les opérations sont automatiquement versionnées
await update(examen.id, changes, 'Mise à jour horaires');
```

## Tables versionnées

Le système track automatiquement ces tables critiques :

| Table | Rétention | Max Versions | Description |
|-------|-----------|--------------|-------------|
| `sessions` | 730 jours | 50 | Sessions d'examens |
| `examens` | 730 jours | 50 | Examens et planification |
| `creneaux` | 365 jours | 30 | Créneaux de surveillance |
| `presences_enseignants` | 365 jours | 20 | Présences déclarées |
| `examen_auditoires` | 365 jours | 30 | Attribution surveillants |
| `consignes_secretariat` | 730 jours | 20 | Consignes par secrétariat |
| `soumissions_disponibilites` | 365 jours | 10 | Disponibilités surveillants |
| `demandes_modification` | 365 jours | 20 | Demandes de modification |
| `surveillants` | 730 jours | 30 | Données surveillants |
| `admin_users` | 730 jours | 10 | Utilisateurs admin |

## Fonctionnalités clés

### 1. Tracking automatique

Toutes les modifications (INSERT/UPDATE/DELETE) sont automatiquement enregistrées avec :
- Timestamp exact
- Utilisateur qui a fait le changement
- Valeurs avant/après
- Champs modifiés
- Raison du changement (optionnel)

### 2. Restauration sécurisée

- Confirmation obligatoire avant restauration
- Création d'une nouvelle version "RESTORE"
- Impossibilité de restaurer les suppressions
- Audit trail complet

### 3. Comparaison visuelle

- Sélection de 2 versions à comparer
- Diff visuel champ par champ
- Mise en évidence des différences
- Export des comparaisons

### 4. Nettoyage automatique

- Politique de rétention par table
- Nettoyage automatique des anciennes versions
- Conservation des snapshots critiques
- Logs de nettoyage

## Cas d'usage pratiques

### Récupération après erreur
1. Aller sur `/admin/versioning`
2. Chercher la table et l'enregistrement
3. Voir l'historique des versions
4. Sélectionner la version correcte
5. Cliquer "Restaurer"

### Audit des modifications
1. Accéder à l'historique d'un enregistrement
2. Voir qui a fait quoi et quand
3. Examiner les champs modifiés
4. Exporter le rapport si nécessaire

### Prévention avant déploiement
1. Export complet des données avant déploiement
2. Déploiement avec versioning activé
3. Test des nouvelles fonctionnalités
4. Restauration rapide si problème

## Sécurité

- **Accès restreint** : Seuls les admins complets (RaphD) peuvent accéder
- **RLS activé** : Row Level Security sur toutes les tables de versioning
- **Audit complet** : Toutes les opérations sont loggées
- **Sauvegarde** : Les données de versioning sont sauvegardées

## Maintenance

### Hebdomadaire
- Vérifier les métriques dans `/admin/versioning`
- Contrôler l'espace disque utilisé

### Mensuelle
- Nettoyer les anciennes versions si nécessaire
- Vérifier les performances

### Trimestrielle
- Exporter les données critiques
- Réviser la configuration de rétention

## Support

- **Documentation complète** : `VERSIONING-SYSTEM-GUIDE.md`
- **Interface admin** : `/admin/versioning`
- **Tests** : `scripts/test-versioning-system.sql`
- **Logs** : Console navigateur + Supabase logs

## Avantages

✅ **Sécurité** : Impossible de perdre des données définitivement  
✅ **Traçabilité** : Audit complet de tous les changements  
✅ **Récupération** : Restauration rapide en cas de problème  
✅ **Transparence** : Visibilité sur qui fait quoi  
✅ **Prévention** : Anticipation des problèmes avant déploiement  

## Prochaines étapes

1. **Installer** : Exécuter les migrations SQL
2. **Tester** : Vérifier avec le script de test
3. **Explorer** : Accéder à `/admin/versioning`
4. **Intégrer** : Ajouter des boutons de versioning dans vos pages
5. **Former** : Expliquer le système à votre équipe

Le système est maintenant prêt à protéger vos données et vous donner un contrôle total sur l'évolution de votre application ! 🚀