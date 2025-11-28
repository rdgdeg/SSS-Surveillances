# Résumé : Affichage des Consignes de Cours dans le Planning

## ✅ Fonctionnalité implémentée

Le planning public affiche maintenant les consignes des cours en plus des consignes des secrétariats.

## 🎯 Hiérarchie d'affichage

1. **Consignes spécifiques à l'examen** (si activées)
2. **Consignes du cours** (si le cours est lié et a des consignes)
3. **Consignes du secrétariat** (par défaut)

## 📝 Modifications apportées

### `pages/public/ExamSchedulePage.tsx`
- Ajout du champ `consignes` dans l'interface `Examen.cours`
- Récupération des consignes du cours dans la requête Supabase
- Logique d'affichage avec priorité : Spécifiques > Cours > Secrétariat
- Affichage formaté avec `whitespace-pre-wrap` pour les retours à la ligne

## 💡 Utilisation

### Pour les administrateurs
1. Aller dans **Admin > Enseignants > Cours**
2. Modifier un cours et remplir le champ "Consignes"
3. Lier le cours à un examen dans **Admin > Examens**

### Pour les surveillants
- Les consignes s'affichent automatiquement dans le planning public
- Indication claire de la source (examen, cours, ou secrétariat)

## 📄 Documentation

Voir `CONSIGNES-COURS-PLANNING-GUIDE.md` pour la documentation complète.

## ✨ Avantages

- Instructions contextuelles directement dans le planning
- Flexibilité : consignes générales (secrétariat) ou spécifiques (cours/examen)
- Réduction des questions le jour de l'examen
- Gestion centralisée et facile à maintenir
