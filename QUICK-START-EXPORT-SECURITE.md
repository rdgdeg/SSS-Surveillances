# Quick Start - Export de Sécurité du Planning

## 🚀 Démarrage Rapide

### Accès Immédiat
1. **Dashboard Admin** → Section "Actions rapides" → Bouton "Export sécurité"
2. **Page Examens** → En-tête → Bouton "Export sécurité" 
3. **Clic unique** → Téléchargement automatique

### Fichier Généré
```
Planning_Complet_[Session]_[Date]_[Heure].xlsx
```

## 📊 Contenu de l'Export

### 5 Feuilles Excel
- **Métadonnées** : Infos session + horodatage
- **Planning Examens** : Planning complet avec attributions
- **Surveillants** : Liste complète des surveillants
- **Créneaux** : Tous les créneaux de surveillance
- **Disponibilités** : Soumissions (max 1000)

### Données Clés
- ✅ **Attributions complètes** par auditoire
- ✅ **Consignes détaillées** (secrétariat + spécifiques)
- ✅ **Remplacements** appliqués automatiquement
- ✅ **Horodatage précis** (date + heure d'export)
- ✅ **Métadonnées** de session complètes

## 🛡️ Cas d'Usage Urgents

### Panne du Site
```bash
1. Ouvrir le dernier export Excel
2. Consulter la feuille "Planning Examens"
3. Communiquer les attributions aux secrétariats
4. Utiliser les consignes détaillées
```

### Problème de Base de Données
```bash
1. Comparer avec le dernier export
2. Identifier les données manquantes/corrompues
3. Utiliser comme référence pour la restauration
```

### Travail Hors Ligne
```bash
1. Export préventif avant déconnexion
2. Consultation complète du planning
3. Préparation des communications
```

## ⚡ Bonnes Pratiques

### Fréquence Recommandée
- **Quotidien** : Pendant l'attribution active
- **Avant** : Modifications importantes
- **Après** : Finalisation de session
- **En cas** : Problème technique détecté

### Vérification Rapide
```bash
✓ Nom du fichier contient date/heure
✓ Feuille "Métadonnées" remplie
✓ Nombre d'examens cohérent
✓ Attributions présentes
```

### Stockage Sécurisé
- 📁 Dossier dédié par session
- 🔒 Accès administrateur uniquement
- 📅 Rétention 3 mois minimum
- ☁️ Sauvegarde cloud recommandée

## 🔧 Utilisation Technique

### Intégration dans le Code
```typescript
import PlanningSecurityExportButton from './components/shared/PlanningSecurityExportButton';

<PlanningSecurityExportButton
  sessionId={session.id}
  sessionName={session.name}
  size="sm"
  variant="outline"
/>
```

### Hook Direct
```typescript
import { useExport } from './hooks/useExport';

const { exportPlanningComplet } = useExport();
await exportPlanningComplet(sessionId, sessionName);
```

## 🚨 Situations d'Urgence

### Procédure Express (< 2 minutes)
1. **Aller** → Dashboard Admin
2. **Cliquer** → "Export sécurité"
3. **Attendre** → Téléchargement (30-60s)
4. **Vérifier** → Fichier téléchargé
5. **Ouvrir** → Feuille "Planning Examens"
6. **Communiquer** → Données aux équipes

### Checklist Urgence
- [ ] Export réussi (fichier téléchargé)
- [ ] Date/heure dans le nom du fichier
- [ ] Feuille "Planning Examens" accessible
- [ ] Nombre d'examens cohérent
- [ ] Attributions visibles
- [ ] Consignes présentes

## 📞 Support Express

### Auto-Diagnostic (30 secondes)
```bash
Problème : Export ne fonctionne pas
1. Rafraîchir la page (F5)
2. Vérifier la connexion internet
3. Essayer depuis une autre page (Examens)
4. Vider le cache navigateur
```

### Escalade Rapide
- **Technique** : Administrateur système
- **Fonctionnel** : Responsable planning
- **Urgence** : Procédure d'escalade définie

---

**⚠️ Important** : Cette fonctionnalité est votre filet de sécurité. Utilisez-la régulièrement et assurez-vous que tous les administrateurs savent l'utiliser en situation d'urgence.