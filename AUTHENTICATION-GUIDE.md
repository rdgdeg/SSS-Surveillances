# Guide d'authentification et d'audit

## Vue d'ensemble

Un système d'authentification simple a été ajouté pour tracer qui effectue les modifications dans l'administration.

## Utilisateurs prédéfinis

Les utilisateurs suivants ont été créés avec le mot de passe par défaut `admin123`:

- **CelineG** - Céline G.
- **CarmenP** - Carmen P.
- **RomaneV** - Romane V.
- **GuillaumeA** - Guillaume A.
- **MaximeD** - Maxime D.

## Connexion

1. Accédez à `/login`
2. Entrez votre nom d'utilisateur (ex: CelineG)
3. Entrez le mot de passe: `admin123`
4. Vous serez redirigé vers l'administration

## Fonctionnalités

### Audit Trail
Toutes les modifications sont enregistrées avec:
- L'utilisateur qui a effectué l'action
- La date et l'heure
- Le type d'action (création, modification, suppression)
- Les anciennes et nouvelles valeurs

### Pagination
La liste des examens affiche maintenant **10 examens par page** au lieu de 25.

### Modifications tracées
Les actions suivantes sont enregistrées dans l'audit log:
- Création d'un examen
- Modification d'un examen (inline ou via modal)
- Suppression d'un examen

## Historique des modifications

Accédez à `/admin/audit-log` pour voir l'historique complet des modifications.

## Migration de la base de données

Pour activer le système, exécutez la migration:

```bash
# Appliquer la migration
supabase db push

# Ou si vous utilisez directement SQL
psql -h <your-host> -U <your-user> -d <your-db> -f supabase/migrations/create_admin_users_and_audit.sql
```

## Sécurité

⚠️ **Important**: Le mot de passe par défaut `admin123` doit être changé en production!

Pour changer un mot de passe:

```sql
-- Générer un nouveau hash bcrypt (utilisez un outil en ligne ou bcrypt CLI)
-- Exemple avec Node.js:
-- const bcrypt = require('bcryptjs');
-- const hash = bcrypt.hashSync('nouveau_mot_de_passe', 10);

UPDATE admin_users 
SET password_hash = '$2a$10$...' -- Votre nouveau hash
WHERE username = 'CelineG';
```

## Installation des dépendances

Le système nécessite bcryptjs:

```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

## Structure des tables

### admin_users
- `id`: UUID
- `username`: Nom d'utilisateur unique
- `display_name`: Nom d'affichage
- `password_hash`: Hash bcrypt du mot de passe
- `is_active`: Statut actif/inactif
- `created_at`: Date de création
- `last_login_at`: Dernière connexion

### audit_log
- `id`: UUID
- `user_id`: Référence à admin_users
- `username`: Nom d'utilisateur (dénormalisé pour historique)
- `action`: Type d'action (create, update, delete)
- `table_name`: Table concernée
- `record_id`: ID de l'enregistrement
- `old_values`: Anciennes valeurs (JSONB)
- `new_values`: Nouvelles valeurs (JSONB)
- `created_at`: Date de l'action

## Intégration dans l'application

### Protéger une route

```tsx
import { ProtectedRoute } from './components/auth/ProtectedRoute';

<Route path="/admin/*" element={
  <ProtectedRoute>
    <AdminLayout />
  </ProtectedRoute>
} />
```

### Utiliser l'utilisateur connecté

```tsx
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { user, logout } = useAuth();
  
  return (
    <div>
      <p>Connecté en tant que: {user?.display_name}</p>
      <button onClick={logout}>Déconnexion</button>
    </div>
  );
}
```

### Logger une action

```tsx
import { logAudit } from './lib/auth';

await logAudit(
  userId,
  username,
  'update',
  'examens',
  examenId,
  oldValues,
  newValues
);
```
