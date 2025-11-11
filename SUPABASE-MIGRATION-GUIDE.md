# Guide de Migration Supabase

## 📋 Informations de connexion

**Nouvelle base de données Supabase :**
- **Project ID:** budffopdzqjfkbgbpbml
- **URL:** https://budffopdzqjfkbgbpbml.supabase.co
- **Anon Key (Public):** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZGZmb3BkenFqZmtiZ2JwYm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NDI1NjQsImV4cCI6MjA3ODQxODU2NH0.Ru5gB0wr0mkBgKtG0CUHRqsOytUQF5xz6cKfn0yIYDw`
- **Service Role Key (Secret):** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZGZmb3BkenFqZmtiZ2JwYm1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg0MjU2NCwiZXhwIjoyMDc4NDE4NTY0fQ.BiOolmG2h8KBBDtAnFirSYNpHAw2r1Uo0zhOc-suUoQ`

## 🚀 Étapes d'installation

### 1. Accéder à votre projet Supabase

1. Connectez-vous à [https://supabase.com](https://supabase.com)
2. Sélectionnez votre projet **budffopdzqjfkbgbpbml**

### 2. Créer la structure de la base de données

1. Dans le menu de gauche, cliquez sur **SQL Editor**
2. Cliquez sur **New query**
3. Copiez tout le contenu du fichier `supabase-setup.sql`
4. Collez-le dans l'éditeur SQL
5. Cliquez sur **Run** (ou appuyez sur Ctrl+Enter)

Le script va créer :
- ✅ 5 tables principales (sessions, surveillants, creneaux, soumissions_disponibilites, messages)
- ✅ Tous les index nécessaires pour les performances
- ✅ Les politiques de sécurité RLS (Row Level Security)
- ✅ Des données de test (optionnel)
- ✅ Des fonctions et vues utilitaires

### 3. Vérifier la création des tables

1. Dans le menu de gauche, cliquez sur **Table Editor**
2. Vous devriez voir les 5 tables suivantes :
   - `sessions`
   - `surveillants`
   - `creneaux`
   - `soumissions_disponibilites`
   - `messages`

### 4. Configuration de l'authentification (optionnel)

Si vous souhaitez ajouter une authentification admin :

1. Allez dans **Authentication** > **Providers**
2. Activez **Email** provider
3. Créez un compte admin via **Authentication** > **Users** > **Add user**

### 5. Tester la connexion

Le fichier `lib/supabaseClient.ts` a déjà été mis à jour avec vos nouvelles credentials.

Pour tester :
```bash
npm run dev
```

Puis accédez à l'application et vérifiez que :
- La page publique de soumission des disponibilités fonctionne
- Les données de test apparaissent (si vous les avez créées)

## 📊 Structure de la base de données

### Table `sessions`
Gère les sessions d'examens (Janvier, Juin, Août)
- `id` : UUID (clé primaire)
- `name` : Nom de la session
- `year` : Année
- `period` : 1=Janvier, 2=Juin, 3=Août
- `is_active` : Session active ou non
- `created_at` : Date de création

### Table `surveillants`
Liste des surveillants
- `id` : UUID (clé primaire)
- `email` : Email unique
- `nom` : Nom de famille
- `prenom` : Prénom
- `type` : assistant | pat | jobiste | autre
- `affectation_faculte` : Faculté d'affectation
- `etp` : Équivalent temps plein (0.00 à 1.00)
- `quota_defaut` : Quota par défaut
- `is_active` : Actif ou non

### Table `creneaux`
Créneaux de surveillance
- `id` : UUID (clé primaire)
- `session_id` : Référence à la session
- `examen_id` : Identifiant de l'examen
- `date_surveillance` : Date
- `heure_debut_surveillance` : Heure de début
- `heure_fin_surveillance` : Heure de fin
- `type_creneau` : PRINCIPAL | RESERVE

### Table `soumissions_disponibilites`
Soumissions des disponibilités
- `id` : UUID (clé primaire)
- `session_id` : Référence à la session
- `surveillant_id` : Référence au surveillant (nullable)
- `email` : Email du soumissionnaire
- `nom` : Nom
- `prenom` : Prénom
- `type_surveillant` : Type de surveillant
- `remarque_generale` : Remarques
- `historique_disponibilites` : JSONB array de `{creneau_id, est_disponible}`
- `submitted_at` : Date de soumission

### Table `messages`
Messages et remarques
- `id` : UUID (clé primaire)
- `session_id` : Référence à la session (nullable)
- `expediteur_email` : Email de l'expéditeur
- `expediteur_nom` : Nom
- `expediteur_prenom` : Prénom
- `sujet` : Sujet du message
- `contenu` : Contenu
- `lu` : Lu ou non
- `archive` : Archivé ou non
- `priorite` : basse | normale | haute | urgente
- `created_at` : Date de création

## 🔒 Sécurité (RLS)

Les politiques de sécurité Row Level Security sont configurées pour :
- Permettre la lecture publique des sessions actives
- Permettre la lecture publique des surveillants actifs
- Permettre la lecture publique des créneaux des sessions actives
- Permettre l'insertion et la mise à jour publique des soumissions
- Permettre l'insertion publique des messages

⚠️ **Important :** Pour l'administration, vous devrez utiliser la Service Role Key ou configurer des politiques RLS supplémentaires avec authentification.

## 🔧 Configuration des variables d'environnement (optionnel)

Si vous préférez utiliser des variables d'environnement :

1. Créez un fichier `.env` à la racine du projet :
```env
VITE_SUPABASE_URL=https://budffopdzqjfkbgbpbml.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZGZmb3BkenFqZmtiZ2JwYm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NDI1NjQsImV4cCI6MjA3ODQxODU2NH0.Ru5gB0wr0mkBgKtG0CUHRqsOytUQF5xz6cKfn0yIYDw
```

2. Modifiez `lib/supabaseClient.ts` :
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

## 📝 Migration des données existantes (si nécessaire)

Si vous avez des données dans l'ancienne base :

1. Exportez les données depuis l'ancien projet Supabase
2. Utilisez le SQL Editor pour importer les données
3. Ou utilisez l'API Supabase pour migrer programmatiquement

## ✅ Checklist finale

- [ ] Script SQL exécuté avec succès
- [ ] 5 tables créées et visibles dans Table Editor
- [ ] Politiques RLS activées
- [ ] Configuration dans `lib/supabaseClient.ts` mise à jour
- [ ] Application testée et fonctionnelle
- [ ] Données de test créées (optionnel)
- [ ] Variables d'environnement configurées (optionnel)

## 🆘 Dépannage

### Erreur "relation does not exist"
- Vérifiez que le script SQL s'est exécuté sans erreur
- Vérifiez que vous êtes dans le bon projet Supabase

### Erreur "permission denied"
- Vérifiez les politiques RLS
- Utilisez la Service Role Key pour les opérations admin

### Erreur de connexion
- Vérifiez l'URL et la clé API dans `lib/supabaseClient.ts`
- Vérifiez que le projet Supabase est actif

## 📞 Support

Pour toute question, consultez la documentation Supabase : https://supabase.com/docs
