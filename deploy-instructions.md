# Instructions de déploiement

## Étapes à suivre :

1. Créez un repository GitHub : https://github.com/new
   - Nom : exam-supervision-management
   - Description : Système de gestion des surveillances d'examens UCLouvain

2. Exécutez ces commandes (remplacez YOUR_USERNAME) :

```bash
git remote add origin https://github.com/YOUR_USERNAME/exam-supervision-management.git
git branch -M main
git push -u origin main
```

3. Allez sur Vercel : https://vercel.com/new
   - Connectez votre compte GitHub
   - Sélectionnez le repository exam-supervision-management
   - Vercel détectera automatiquement Vite
   - Cliquez "Deploy"

## Variables d'environnement Vercel (optionnel)

Si vous avez des variables d'environnement, ajoutez-les dans Vercel :
- GEMINI_API_KEY (si utilisé)

## URL de déploiement

Une fois déployé, Vercel vous donnera une URL comme :
https://exam-supervision-management.vercel.app