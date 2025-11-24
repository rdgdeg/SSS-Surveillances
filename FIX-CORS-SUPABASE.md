# Fix CORS - Configuration Supabase

## Problème

Les requêtes depuis Vercel (`https://sss-surveillances.vercel.app`) sont bloquées par la politique CORS de Supabase.

## Solution : Configurer CORS dans Supabase Dashboard

### Étape 1 : Accéder aux paramètres API

1. Allez sur : **https://supabase.com/dashboard/project/budffopdzqjfkbgbpbml/settings/api**
2. Faites défiler jusqu'à la section **"CORS Configuration"** ou **"API Settings"**

### Étape 2 : Ajouter les origines autorisées

Dans le champ **"Additional Allowed Origins"** ou **"Allowed Origins"**, ajoutez :

```
https://sss-surveillances.vercel.app
```

**Important** : 
- Pas de slash `/` à la fin
- Utilisez `https://` (pas `http://`)
- Ajoutez une ligne par domaine

Si vous voulez autoriser tous les sous-domaines Vercel (preview, etc.) :

```
https://sss-surveillances.vercel.app
https://*.vercel.app
```

### Étape 3 : Sauvegarder

1. Cliquez sur **"Save"** ou **"Update"**
2. Attendez 1-2 minutes que les changements se propagent

---

## Alternative : Configuration via Authentication Settings

Si vous ne trouvez pas l'option CORS dans API Settings :

1. Allez sur : **https://supabase.com/dashboard/project/budffopdzqjfkbgbpbml/auth/url-configuration**
2. Dans **"Site URL"**, mettez : `https://sss-surveillances.vercel.app`
3. Dans **"Redirect URLs"**, ajoutez :
   ```
   https://sss-surveillances.vercel.app/**
   ```
4. Sauvegardez

---

## Vérification des Headers

Pour vérifier que CORS est bien configuré, vous pouvez tester avec curl :

```bash
curl -I -X OPTIONS \
  -H "Origin: https://sss-surveillances.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  https://budffopdzqjfkbgbpbml.supabase.co/rest/v1/surveillants
```

Vous devriez voir dans la réponse :
```
Access-Control-Allow-Origin: https://sss-surveillances.vercel.app
```

---

## Si le problème persiste

### Option 1 : Vérifier la clé API

Assurez-vous que vous utilisez la bonne clé API (anon key) dans `.env.local` :

```env
VITE_SUPABASE_URL=https://budffopdzqjfkbgbpbml.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Option 2 : Vérifier les variables d'environnement Vercel

1. Allez sur : https://vercel.com/dashboard
2. Sélectionnez votre projet **sss-surveillances**
3. Allez dans **Settings** > **Environment Variables**
4. Vérifiez que ces variables existent :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Si elles sont manquantes, ajoutez-les et redéployez

### Option 3 : Désactiver temporairement RLS

**⚠️ ATTENTION : À utiliser uniquement pour tester, pas en production !**

```sql
-- Désactiver RLS temporairement pour tester
ALTER TABLE surveillants DISABLE ROW LEVEL SECURITY;
ALTER TABLE examen_auditoires DISABLE ROW LEVEL SECURITY;

-- Après le test, réactivez-le !
ALTER TABLE surveillants ENABLE ROW LEVEL SECURITY;
ALTER TABLE examen_auditoires ENABLE ROW LEVEL SECURITY;
```

### Option 4 : Créer des policies permissives

Si RLS est activé mais bloque les requêtes :

```sql
-- Pour la table surveillants
DROP POLICY IF EXISTS "Enable read access for all users" ON surveillants;
CREATE POLICY "Enable read access for all users" 
ON surveillants FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON surveillants;
CREATE POLICY "Enable all operations for authenticated users" 
ON surveillants FOR ALL 
USING (true) 
WITH CHECK (true);

-- Pour la table examen_auditoires
DROP POLICY IF EXISTS "Enable read access for all users" ON examen_auditoires;
CREATE POLICY "Enable read access for all users" 
ON examen_auditoires FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON examen_auditoires;
CREATE POLICY "Enable all operations for authenticated users" 
ON examen_auditoires FOR ALL 
USING (true) 
WITH CHECK (true);
```

---

## Checklist de dépannage

- [ ] CORS configuré dans Supabase Dashboard (API Settings)
- [ ] Site URL configuré dans Auth Settings
- [ ] Variables d'environnement présentes dans Vercel
- [ ] Redéploiement effectué après changement des variables
- [ ] Attente de 2-3 minutes après changement CORS
- [ ] Cache du navigateur vidé (Ctrl+Shift+R)
- [ ] Policies RLS vérifiées et permissives

---

## Test rapide

Après avoir configuré CORS, testez avec cette commande dans la console du navigateur (F12) :

```javascript
fetch('https://budffopdzqjfkbgbpbml.supabase.co/rest/v1/surveillants?select=*&limit=1', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZGZmb3BkenFqZmtiZ2JwYm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NDI1NjQsImV4cCI6MjA3ODQxODU2NH0.Ru5gB0wr0mkBgKtG0CUHRqsOytUQF5xz6cKfn0yIYDw',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZGZmb3BkenFqZmtiZ2JwYm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NDI1NjQsImV4cCI6MjA3ODQxODU2NH0.Ru5gB0wr0mkBgKtG0CUHRqsOytUQF5xz6cKfn0yIYDw'
  }
})
.then(r => r.json())
.then(d => console.log('✓ CORS fonctionne !', d))
.catch(e => console.error('✗ CORS bloqué', e));
```

Si vous voyez "✓ CORS fonctionne !", le problème est résolu !

---

## Contact Support Supabase

Si rien ne fonctionne, contactez le support Supabase :
- Dashboard : https://supabase.com/dashboard/support
- Discord : https://discord.supabase.com

Donnez-leur ces informations :
- Project ID : `budffopdzqjfkbgbpbml`
- Domaine bloqué : `https://sss-surveillances.vercel.app`
- Erreur : "No 'Access-Control-Allow-Origin' header"
