# Guide - Export de Sécurité du Planning

## Vue d'ensemble

L'export de sécurité du planning permet de créer une sauvegarde complète et horodatée de toutes les données du planning en cas de problème sur le site. Cette fonctionnalité garantit qu'aucune information ne soit perdue.

## Fonctionnalités

### 🛡️ Export Complet avec Horodatage
- **Fichier Excel multi-feuilles** avec toutes les données
- **Horodatage précis** dans le nom du fichier (date + heure)
- **Métadonnées complètes** de la session
- **Données de référence** (surveillants, créneaux, disponibilités)

### 📊 Contenu de l'Export

#### Feuille "Métadonnées"
- Informations de la session (nom, période, année)
- Date et heure d'export précises
- Statistiques générales (nombre d'examens, surveillants, etc.)
- Statut de la session (active, verrouillée, etc.)

#### Feuille "Planning Examens"
- **Informations temporelles** : Date, heure début/fin, durée
- **Détails examen** : Code, nom, cours associé, enseignants
- **Attribution surveillants** : Détail par auditoire avec nombres requis/attribués
- **Consignes complètes** : Secrétariat + spécifiques + cours
- **Mode d'attribution** : Auditoire ou secrétariat
- **Statut validation** et informations de création

#### Feuille "Surveillants"
- Liste complète des surveillants avec toutes leurs informations
- Types, affectations, quotas, statuts
- Données de contact (téléphone)

#### Feuille "Créneaux"
- Tous les créneaux de surveillance
- Dates, heures, types, capacités requises

#### Feuille "Disponibilités"
- Soumissions de disponibilités (limitées à 1000 pour Excel)
- Historique des modifications

## Utilisation

### 1. Accès à la Fonctionnalité

Le bouton "Export sécurité" est disponible dans :
- **Page Dashboard Admin** : Export rapide de la session active
- **Page Examens** : Export du planning de la session courante
- **Page Sessions** : Export de n'importe quelle session

### 2. Déclenchement de l'Export

```typescript
// Utilisation du composant
<PlanningSecurityExportButton 
  sessionId={session.id}
  sessionName={session.name}
  variant="outline"
  size="md"
/>

// Utilisation du hook directement
const { exportPlanningComplet } = useExport();
await exportPlanningComplet(sessionId, sessionName);
```

### 3. Format du Fichier Généré

**Nom du fichier** :
```
Planning_Complet_[SessionName]_[YYYY-MM-DD]_[HHhMMhSS].xlsx
```

**Exemple** :
```
Planning_Complet_Janvier_2026_2025-12-31_14h30h25.xlsx
```

## Cas d'Usage

### 🚨 Situations d'Urgence
- **Panne du site** : Récupération des données depuis l'export
- **Problème de base de données** : Référence pour la restauration
- **Corruption de données** : Comparaison avec la dernière sauvegarde

### 📋 Gestion Administrative
- **Archive de session** : Conservation des plannings finalisés
- **Audit et contrôle** : Vérification des attributions
- **Communication externe** : Partage avec les secrétariats

### 🔄 Continuité de Service
- **Travail hors ligne** : Consultation du planning sans connexion
- **Backup préventif** : Avant modifications importantes
- **Migration de données** : Support pour changements de système

## Bonnes Pratiques

### 📅 Fréquence d'Export
- **Quotidien** pendant les périodes d'attribution active
- **Avant modifications importantes** (import massif, réattributions)
- **Après finalisation** d'une session
- **En cas de problème technique** détecté

### 💾 Stockage et Organisation
- **Nommage cohérent** : Le système génère automatiquement
- **Stockage sécurisé** : Serveur local ou cloud sécurisé
- **Rétention** : Conserver au moins 3 mois après la session
- **Accès contrôlé** : Limiter aux administrateurs

### 🔍 Vérification de l'Export
- **Contrôler les métadonnées** : Vérifier date/heure d'export
- **Compter les examens** : S'assurer que tous sont présents
- **Vérifier les attributions** : Contrôler les surveillants attribués
- **Tester l'ouverture** : S'assurer que le fichier n'est pas corrompu

## Sécurité et Confidentialité

### 🔒 Protection des Données
- **Données personnelles** : Emails, téléphones des surveillants
- **Informations sensibles** : Attributions, disponibilités
- **Accès restreint** : Administrateurs uniquement

### 📋 Conformité
- **RGPD** : Respect des règles de protection des données
- **Rétention** : Durée de conservation limitée
- **Traçabilité** : Log des exports dans le système

## Dépannage

### ❌ Problèmes Courants

**Export vide ou incomplet**
- Vérifier que la session contient des données
- Contrôler les permissions d'accès à la base de données
- Vérifier la connectivité réseau

**Fichier corrompu**
- Réessayer l'export
- Vérifier l'espace disque disponible
- Contrôler les paramètres du navigateur (téléchargements)

**Performance lente**
- Sessions avec beaucoup de données (>1000 examens)
- Limiter l'export aux données essentielles
- Exporter par parties si nécessaire

### 🔧 Solutions Techniques

**Limite Excel atteinte**
- Les disponibilités sont limitées à 1000 entrées
- Utiliser l'export CSV pour les gros volumes
- Diviser en plusieurs exports si nécessaire

**Problème de format de date**
- Les dates sont formatées en français (DD-MM-YYYY)
- Compatible avec Excel français
- Ajuster les paramètres régionaux si nécessaire

## Support

### 📞 Contact
- **Support technique** : Administrateur système
- **Questions fonctionnelles** : Responsable planning
- **Urgences** : Procédure d'escalade définie

### 📚 Documentation Associée
- `GUIDE-SAUVEGARDES-DONNEES.md` : Stratégie globale de sauvegarde
- `QUICK-START-BACKUP.md` : Procédures rapides de sauvegarde
- `README-BACKUPS.md` : Configuration des sauvegardes automatiques

---

**Note** : Cette fonctionnalité est essentielle pour la continuité de service. Assurez-vous de former tous les administrateurs à son utilisation et d'établir des procédures claires pour les situations d'urgence.