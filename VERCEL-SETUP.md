# Configuration Vercel - Variables d'Environnement

## 🚨 Problème Actuel

L'application affiche une page blanche car les variables d'environnement ne sont pas configurées sur Vercel.

## ✅ Solution : Configurer les Variables sur Vercel

### Étape 1 : Accéder aux Paramètres Vercel

1. Aller sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionner votre projet : **sss-surveillances**
3. Cliquer sur **Settings** (Paramètres)
4. Cliquer sur **Environment Variables** dans le menu de gauche

### Étape 2 : Ajouter les Variables

Ajouter les variables suivantes :

#### Variable 1 : VITE_SUPABASE_URL
- **Name** : `VITE_SUPABASE_URL`
- **Value** : `https://budffopdzqjfkbgbpbml.supabase.co`
- **Environment** : Cocher **Production**, **Preview**, et **Development**

#### Variable 2 : VITE_SUPABASE_ANON_KEY
- **Name** : `VITE_SUPABASE_ANON_KEY`
- **Value** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZGZmb3BkenFqZmtiZ2JwYm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NDI1NjQsImV4cCI6MjA3ODQxODU2NH0.Ru5gB0wr0mkBgKtG0CUHRqsOytUQF5xz6cKfn0yIYDw`
- **Environment** : Cocher **Production**, **Preview**, et **Development**

#### Variable 3 : VITE_APP_ENV (Optionnel)
- **Name** : `VITE_APP_ENV`
- **Value** : `production`
- **Environment** : Cocher **Production** uniquement

#### Variable 4 : VITE_DEBUG (Optionnel)
- **Name** : `VITE_DEBUG`
- **Value** : `false`
- **Environment** : Cocher **Production** uniquement

### Étape 3 : Redéployer

Après avoir ajouté les variables :

1. Cliquer sur **Save** pour chaque variable
2. Aller dans l'onglet **Deployments**
3. Cliquer sur les **trois points** du dernier déploiement
4. Cliquer sur **Redeploy**
5. Attendre que le déploiement se termine (~2 minutes)

### Étape 4 : Vérifier

1. Ouvrir https://sss-surveillances.vercel.app/
2. L'application devrait maintenant s'afficher correctement
3. Ouvrir la console du navigateur (F12) pour vérifier qu'il n'y a pas d'erreurs

---

## 🔧 Alternative : Utiliser Vercel CLI

Si vous préférez la ligne de commande :

```bash
# Installer Vercel CLI si pas déjà fait
npm i -g vercel

# Se connecter
vercel login

# Ajouter les variables
vercel env add VITE_SUPABASE_URL production
# Coller la valeur : https://budffopdzqjfkbgbpbml.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# Coller la clé

vercel env add VITE_APP_ENV production
# Valeur : production

vercel env add VITE_DEBUG production
# Valeur : false

# Redéployer
vercel --prod
```

---

## 📋 Checklist de Vérification

- [ ] Variables ajoutées sur Vercel Dashboard
- [ ] Redéploiement effectué
- [ ] Application accessible sur https://sss-surveillances.vercel.app/
- [ ] Pas d'erreurs dans la console du navigateur
- [ ] Fonctionnalités testées (navigation, formulaires, etc.)

---

## 🐛 Si le Problème Persiste

### Vérifier les Logs Vercel

1. Aller sur Vercel Dashboard
2. Cliquer sur votre projet
3. Aller dans **Deployments**
4. Cliquer sur le dernier déploiement
5. Consulter les **Build Logs** et **Function Logs**

### Erreurs Communes

**Erreur : "Missing environment variables"**
- Solution : Vérifier que les variables sont bien ajoutées et que le redéploiement a été fait

**Erreur : "Invalid Supabase URL"**
- Solution : Vérifier que l'URL commence par `https://` et contient `.supabase.co`

**Page blanche sans erreur**
- Solution : Ouvrir la console du navigateur (F12) pour voir les erreurs JavaScript

---

## 💡 Bonnes Pratiques

### Sécurité
- ✅ Les clés `anon` de Supabase sont publiques (safe pour le frontend)
- ✅ Ne jamais exposer les clés `service_role` dans le frontend
- ✅ Utiliser Row Level Security (RLS) sur Supabase

### Organisation
- Utiliser des variables différentes pour Preview et Production si nécessaire
- Documenter toutes les variables dans `.env.example`
- Ne jamais committer `.env.local` ou `.env.production`

---

## 📞 Support

Si le problème persiste après avoir suivi ces étapes :

1. Vérifier les logs Vercel
2. Vérifier la console du navigateur
3. Tester en local avec `npm run build && npm run preview`
4. Contacter le support Vercel si nécessaire

---

**Note** : Les modifications du code ont été faites pour que l'application ne plante pas complètement en production si les variables manquent, mais elle ne fonctionnera pas correctement sans elles.
