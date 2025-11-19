# 🔐 Système de Sauvegarde - SSS Surveillances

## 📚 Documentation

- **[QUICK-START-BACKUP.md](QUICK-START-BACKUP.md)** - Guide rapide pour démarrer
- **[GUIDE-SAUVEGARDES-DONNEES.md](GUIDE-SAUVEGARDES-DONNEES.md)** - Documentation complète

---

## ⚡ Commandes rapides

### Créer une sauvegarde
```bash
./scripts/backup-database.sh
```

### Vérifier les sauvegardes
```bash
./scripts/check-backups.sh
```

### Restaurer une sauvegarde
```bash
./scripts/restore-database.sh backups/backup_complet_YYYYMMDD_HHMMSS.dump.gz
```

---

## 🎯 Stratégie de sauvegarde

### 1. Sauvegardes automatiques (GitHub Actions)
- ✅ **Quotidiennes** à 2h du matin UTC
- ✅ Conservées 30 jours
- ✅ Stockées dans GitHub Artifacts
- ✅ Téléchargeables depuis l'onglet Actions

### 2. Sauvegardes manuelles (Avant modifications importantes)
- ✅ Avant chaque migration
- ✅ Avant import de données
- ✅ Fin de session d'examens

### 3. Sauvegardes Supabase (Plan Pro)
- ✅ Quotidiennes automatiques
- ✅ Conservées 7-30 jours selon le plan
- ✅ Accessibles via Dashboard Supabase

---

## 📊 Types de sauvegardes

| Type | Fichier | Taille | Usage |
|------|---------|--------|-------|
| **Complète** | `backup_complet_*.dump.gz` | ~10-50 MB | Restauration complète |
| **Données** | `backup_donnees_*.sql.gz` | ~5-20 MB | Restauration partielle |

---

## 🔧 Configuration requise

### Installation (une seule fois)
```bash
# macOS
brew install postgresql

# Vérifier
pg_dump --version
```

### Variables d'environnement (.env.local)
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_DB_PASSWORD=votre_mot_de_passe
```

---

## 🚨 En cas d'urgence

### Scénario 1 : Données corrompues
```bash
# 1. Identifier la dernière bonne sauvegarde
ls -lh backups/

# 2. Restaurer
./scripts/restore-database.sh backups/backup_complet_20241119_143000.dump.gz

# 3. Vérifier l'application
```

### Scénario 2 : Migration échouée
```bash
# 1. Restaurer la sauvegarde d'avant migration
./scripts/restore-database.sh backups/backup_complet_avant_migration.dump.gz

# 2. Corriger la migration
# 3. Créer une nouvelle sauvegarde
./scripts/backup-database.sh

# 4. Réessayer la migration
```

### Scénario 3 : Suppression accidentelle
```bash
# 1. Restaurer immédiatement
./scripts/restore-database.sh backups/backup_complet_LATEST.dump.gz

# 2. Vérifier les données manquantes
# 3. Documenter l'incident
```

---

## 📈 Monitoring

### Vérification quotidienne
```bash
# Ajouter au crontab pour vérification quotidienne
0 9 * * * cd /chemin/vers/projet && ./scripts/check-backups.sh
```

### Alertes
- ⚠️ Sauvegarde > 48h : Créer une nouvelle sauvegarde
- ❌ Aucune sauvegarde : Configurer le système
- ✅ Sauvegarde récente : OK

---

## 🎓 Bonnes pratiques

### ✅ À FAIRE
- Créer une sauvegarde avant chaque modification importante
- Tester régulièrement la restauration
- Conserver plusieurs versions de sauvegardes
- Documenter les sauvegardes importantes
- Vérifier l'âge des sauvegardes régulièrement

### ❌ À ÉVITER
- Ne jamais commiter les sauvegardes dans Git
- Ne pas restaurer sans confirmation
- Ne pas supprimer toutes les sauvegardes
- Ne pas oublier de sauvegarder avant une migration
- Ne pas ignorer les alertes de sauvegarde

---

## 📞 Support

### Problèmes courants

**"pg_dump: command not found"**
```bash
brew install postgresql
```

**"Connection refused"**
- Vérifier la connexion internet
- Vérifier l'URL Supabase dans .env.local

**"Authentication failed"**
- Vérifier le mot de passe dans .env.local
- Récupérer le mot de passe depuis Supabase Dashboard

### Ressources
- [Documentation Supabase Backups](https://supabase.com/docs/guides/database/backups)
- [PostgreSQL pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html)
- [GitHub Actions Artifacts](https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts)

---

## 📝 Checklist avant modification importante

- [ ] Créer une sauvegarde manuelle
- [ ] Vérifier que la sauvegarde est complète
- [ ] Noter la date et l'heure de la sauvegarde
- [ ] Documenter les modifications prévues
- [ ] Avoir un plan de rollback
- [ ] Tester sur un environnement de développement d'abord

---

## 🎯 Prochaines étapes

1. **Configuration initiale** (5 min)
   - Installer PostgreSQL client
   - Configurer .env.local
   - Tester une sauvegarde

2. **GitHub Actions** (10 min)
   - Configurer les secrets GitHub
   - Tester le workflow manuellement
   - Vérifier les artifacts

3. **Test de restauration** (15 min)
   - Créer une sauvegarde de test
   - Restaurer sur un environnement de test
   - Vérifier l'intégrité des données

---

**Dernière mise à jour** : 19 novembre 2024
