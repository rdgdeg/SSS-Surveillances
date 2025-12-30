# Guide du Système de Versioning

## Vue d'ensemble

Le système de versioning permet de :
- **Tracer** toutes les modifications des données critiques
- **Comparer** différentes versions d'un enregistrement
- **Restaurer** des versions antérieures en cas de problème
- **Auditer** les changements avec détails utilisateur et timestamp
- **Prévenir** la perte de données accidentelle

## Architecture

### Base de données

#### Tables principales
- `data_versions` : Historique complet des modifications
- `version_snapshots` : Snapshots pour restauration rapide
- `versioning_metadata` : Configuration par table

#### Triggers automatiques
- Capture automatique des INSERT/UPDATE/DELETE
- Enregistrement des valeurs avant/après
- Tracking de l'utilisateur et du contexte

### API et Services

#### `versioningService.ts`
- Fonctions de base pour l'historique
- Comparaison et restauration
- Export et nettoyage

#### `versioningApi.ts`
- Wrapper pour opérations CRUD versionnées
- APIs spécialisées par table
- Gestion des erreurs

#### `useVersioning.ts`
- Hook React pour intégration facile
- Gestion d'état automatique
- Callbacks de restauration

## Utilisation

### 1. Accès Admin

La page de versioning est accessible uniquement aux admins complets (RaphD) :
```
/admin/versioning
```

### 2. Intégration dans les composants

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

// Insertion avec versioning
await insert(newExamen, 'Création nouvel examen');

// Modification avec versioning
await update(examen.id, changes, 'Mise à jour horaires');

// Suppression avec versioning
await deleteRecord(examen.id, 'Examen annulé', true); // soft delete
```

#### Panneau d'historique complet
```tsx
import VersionHistoryPanel from '../components/admin/VersionHistoryPanel';

<VersionHistoryPanel
  tableName="sessions"
  recordId={session.id}
  onRestore={() => {
    toast.success('Session restaurée');
    refetchData();
  }}
/>
```

### 3. Configuration par table

#### Tables versionnées par défaut
- `sessions` : 730 jours, 50 versions max
- `creneaux` : 365 jours, 30 versions max
- `examens` : 730 jours, 50 versions max
- `presences_enseignants` : 365 jours, 20 versions max
- `examen_auditoires` : 365 jours, 30 versions max
- `consignes_secretariat` : 730 jours, 20 versions max
- `soumissions_disponibilites` : 365 jours, 10 versions max
- `demandes_modification` : 365 jours, 20 versions max
- `surveillants` : 730 jours, 30 versions max
- `admin_users` : 730 jours, 10 versions max

#### Champs exclus par défaut
- `updated_at`
- `last_modified`
- `last_accessed`

## Fonctionnalités

### 1. Historique des versions

#### Informations trackées
- **Timestamp** exact de la modification
- **Utilisateur** qui a effectué le changement
- **Type d'opération** (INSERT/UPDATE/DELETE/RESTORE)
- **Valeurs avant/après** la modification
- **Champs modifiés** spécifiquement
- **Raison** du changement (optionnel)

#### Affichage
- Timeline chronologique
- Badges colorés par type d'opération
- Détails des champs modifiés
- Informations utilisateur et date

### 2. Comparaison de versions

#### Fonctionnalités
- Sélection de 2 versions à comparer
- Diff visuel champ par champ
- Mise en évidence des différences
- Export des comparaisons

#### Interface
- Cases à cocher pour sélection
- Bouton "Comparer" automatique
- Modal avec vue côte à côte
- Couleurs rouge/vert pour les changements

### 3. Restauration

#### Processus
1. Sélection de la version à restaurer
2. Confirmation utilisateur
3. Restauration des données
4. Création d'une nouvelle version "RESTORE"
5. Notification de succès

#### Sécurité
- Confirmation obligatoire
- Logging de la restauration
- Impossibilité de restaurer les suppressions
- Audit trail complet

### 4. Export et rapports

#### Formats supportés
- **JSON** : Structure complète avec métadonnées
- **CSV** : Format tabulaire pour analyse

#### Contenu exporté
- Historique complet ou filtré
- Métadonnées de versioning
- Comparaisons de versions
- Rapports de changements

### 5. Nettoyage automatique

#### Politiques de rétention
- Par table selon configuration
- Nettoyage automatique des anciennes versions
- Conservation des snapshots critiques
- Logs de nettoyage

## Cas d'usage

### 1. Récupération après erreur

**Scénario** : Modification accidentelle d'un examen
```
1. Aller sur /admin/versioning
2. Chercher la table "examens"
3. Trouver l'enregistrement modifié
4. Voir l'historique des versions
5. Sélectionner la version correcte
6. Cliquer "Restaurer"
```

### 2. Audit des modifications

**Scénario** : Vérifier qui a modifié une session
```
1. Accéder à l'historique de la session
2. Voir la timeline des changements
3. Identifier l'utilisateur et la date
4. Examiner les champs modifiés
5. Exporter le rapport si nécessaire
```

### 3. Comparaison de configurations

**Scénario** : Comparer deux versions d'une consigne
```
1. Ouvrir l'historique des consignes
2. Sélectionner 2 versions à comparer
3. Cliquer "Comparer"
4. Analyser les différences
5. Décider de la version à conserver
```

### 4. Prévention des pertes

**Scénario** : Développement d'une nouvelle fonctionnalité
```
1. Avant déploiement : Export complet des données
2. Déploiement avec versioning activé
3. Test des nouvelles fonctionnalités
4. Si problème : Restauration rapide
5. Si succès : Conservation des changements
```

## Bonnes pratiques

### 1. Utilisation quotidienne

- **Toujours** fournir une raison lors des modifications importantes
- **Vérifier** l'historique avant les modifications critiques
- **Exporter** régulièrement les données importantes
- **Nettoyer** périodiquement les anciennes versions

### 2. Gestion des erreurs

- **Confirmer** avant toute restauration
- **Tester** après restauration
- **Documenter** les incidents et solutions
- **Former** les utilisateurs aux procédures

### 3. Performance

- **Limiter** le nombre de versions conservées
- **Exclure** les champs non critiques
- **Nettoyer** régulièrement les anciennes données
- **Monitorer** l'espace disque utilisé

### 4. Sécurité

- **Restreindre** l'accès aux admins uniquement
- **Logger** toutes les opérations de versioning
- **Sauvegarder** les données de versioning
- **Auditer** régulièrement les accès

## Dépannage

### Problèmes courants

#### 1. Versioning non activé
```sql
-- Vérifier la configuration
SELECT * FROM versioning_metadata WHERE table_name = 'ma_table';

-- Activer si nécessaire
UPDATE versioning_metadata SET is_enabled = true WHERE table_name = 'ma_table';
```

#### 2. Triggers manquants
```sql
-- Vérifier les triggers
SELECT * FROM information_schema.triggers WHERE trigger_name LIKE 'trigger_version_%';

-- Recréer si nécessaire (voir migration)
```

#### 3. Erreur de restauration
- Vérifier que l'enregistrement existe
- Contrôler les permissions
- Examiner les logs d'erreur
- Tester avec un autre utilisateur admin

#### 4. Performance lente
- Vérifier les index sur data_versions
- Nettoyer les anciennes versions
- Réduire la rétention si nécessaire
- Optimiser les requêtes

### Logs et monitoring

#### Emplacements des logs
- Console navigateur : Erreurs client
- Logs Supabase : Erreurs serveur
- Table audit_log : Actions utilisateur
- Table data_versions : Historique complet

#### Métriques à surveiller
- Nombre de versions par table
- Taille de la table data_versions
- Fréquence des restaurations
- Erreurs de versioning

## Migration et mise à jour

### Installation initiale
```bash
# Appliquer la migration
psql -f supabase/migrations/create_versioning_system.sql

# Vérifier l'installation
SELECT COUNT(*) FROM versioning_metadata;
```

### Ajout d'une nouvelle table
```typescript
import { initializeVersioningForTable } from '../lib/versioningApi';

await initializeVersioningForTable('nouvelle_table', {
  retentionDays: 365,
  maxVersions: 30,
  excludeFields: ['updated_at', 'last_seen']
});
```

### Mise à jour de configuration
```typescript
import { updateVersioningConfig } from '../lib/versioningService';

await updateVersioningConfig('ma_table', {
  retention_days: 730,
  max_versions_per_record: 50
});
```

## Support et maintenance

### Maintenance régulière
- **Hebdomadaire** : Vérifier les métriques
- **Mensuelle** : Nettoyer les anciennes versions
- **Trimestrielle** : Exporter les données critiques
- **Annuelle** : Réviser la configuration

### Contact support
- Développeur principal : RaphD
- Documentation : Ce guide
- Logs : /admin/versioning
- Tests : Environnement de développement

---

**Version du guide** : 1.0  
**Dernière mise à jour** : 2025-01-01  
**Auteur** : Système de versioning automatique