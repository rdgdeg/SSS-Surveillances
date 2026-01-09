# Fix - Debug Sauvegarde Secrétariat

## 🐛 Problème identifié

La liste déroulante du secrétariat s'affiche correctement mais les modifications ne se sauvegardent pas.

## 🔍 Diagnostics ajoutés

### 1. Amélioration de la fonction `handleSaveEdit`

**Ajouts :**
- Log de debug pour voir les valeurs passées
- Traitement spécial pour le champ `secretariat` (ne pas convertir en `null`)
- Sauvegarde immédiate lors du changement de sélection

```tsx
// Pour le secrétariat, garder la valeur string même si vide
if (field === 'secretariat') {
  value = editValue; // Ne pas convertir en null si vide
}

console.log('Saving edit:', { examenId, field, editValue, value });
```

### 2. Sauvegarde immédiate

**Modification du `onChange` :**
```tsx
onChange={(e) => {
  setEditValue(e.target.value);
  // Sauvegarder immédiatement quand une option est sélectionnée
  setTimeout(() => handleSaveEdit(examen.id, 'secretariat'), 100);
}}
```

### 3. Script de diagnostic SQL

Créé `scripts/debug-secretariat-update.sql` pour :
- Vérifier la structure de la table `examens`
- Tester les permissions
- Identifier d'éventuels triggers ou contraintes
- Tester une mise à jour manuelle

## 🧪 Comment tester

### 1. Test dans l'interface
1. Ouvrir la console du navigateur (F12)
2. Cliquer sur une cellule secrétariat
3. Sélectionner une nouvelle valeur
4. Vérifier les logs dans la console

### 2. Test SQL direct
```sql
-- Exécuter le script de diagnostic
\i scripts/debug-secretariat-update.sql

-- Tester une mise à jour manuelle
UPDATE examens 
SET secretariat = 'MED' 
WHERE id = 'ID_EXAMEN_TEST';
```

## 🔧 Solutions possibles

### Si le problème persiste :

1. **Vérifier les permissions Supabase**
2. **Contrôler les RLS (Row Level Security)**
3. **Examiner les logs Supabase**
4. **Tester avec un autre champ pour isoler le problème**

### Commandes de diagnostic supplémentaires :

```sql
-- Vérifier les politiques RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'examens';

-- Vérifier si RLS est activé
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables 
WHERE tablename = 'examens';
```

## 📋 Checklist de debug

- [ ] Logs de console visibles lors de la modification
- [ ] Valeur correcte passée à l'API (`editValue` non vide)
- [ ] Pas d'erreur dans la console réseau (onglet Network)
- [ ] Toast de succès affiché
- [ ] Rafraîchissement de la liste (`refetch()` appelé)
- [ ] Permissions Supabase correctes
- [ ] RLS configuré correctement

## 🎯 Prochaines étapes

1. Tester avec les logs de debug
2. Vérifier la réponse de l'API dans l'onglet Network
3. Exécuter le script SQL de diagnostic
4. Si nécessaire, tester la mise à jour via d'autres moyens (modale d'édition)