# Installation des Demandes de Modification

## Étapes d'installation

### 1. Créer la table dans Supabase

1. Connectez-vous à votre dashboard Supabase : https://supabase.com/dashboard
2. Allez dans votre projet : `budffopdzqjfkbgbpbml`
3. Cliquez sur "SQL Editor" dans le menu de gauche
4. Copiez et collez le contenu du fichier `scripts/create-demandes-table-simple.sql`
5. Cliquez sur "Run" pour exécuter la requête

### 2. Vérifier la création

Après l'exécution, vérifiez que :
- La table `demandes_modification` apparaît dans l'onglet "Table Editor"
- Les politiques RLS sont activées
- Les index sont créés

### 3. Test de fonctionnement

1. Lancez l'application en mode développement
2. Allez sur la page d'accueil
3. Cliquez sur le bouton orange "Demande de modification" dans le header
4. Remplissez et soumettez une demande de test
5. Connectez-vous en tant qu'admin et vérifiez que la demande apparaît dans `/admin/demandes-modification`

## Résolution des problèmes

### Erreur "relation does not exist"
- Vérifiez que la table a bien été créée dans Supabase
- Assurez-vous d'être dans le bon projet Supabase

### Erreur de permissions
- Vérifiez que les politiques RLS sont correctement configurées
- Assurez-vous que RLS est activé sur la table

### Le bouton n'apparaît pas
- Vérifiez que les composants ont été correctement modifiés
- Redémarrez le serveur de développement

## Fichiers modifiés

Les fichiers suivants ont été créés ou modifiés :

### Nouveaux fichiers :
- `supabase/migrations/create_demandes_modification.sql`
- `components/shared/DemandeModificationModal.tsx`
- `pages/admin/DemandesModificationPage.tsx`
- `scripts/create-demandes-table-simple.sql`
- `GUIDE-DEMANDES-MODIFICATION.md`

### Fichiers modifiés :
- `components/layouts/MainLayout.tsx` - Ajout du bouton dans le header
- `components/layouts/AdminLayout.tsx` - Ajout du lien dans le menu admin
- `App.tsx` - Ajout de la route d'administration

## Structure de la table

```sql
demandes_modification (
    id UUID PRIMARY KEY,
    nom_examen TEXT NOT NULL,
    date_examen DATE NOT NULL,
    heure_examen TIME NOT NULL,
    type_demande TEXT NOT NULL, -- 'permutation', 'modification', 'message'
    surveillant_remplacant TEXT,
    surveillance_reprise_date DATE,
    surveillance_reprise_heure TIME,
    description TEXT NOT NULL,
    nom_demandeur TEXT NOT NULL,
    email_demandeur TEXT,
    telephone_demandeur TEXT,
    statut TEXT DEFAULT 'en_attente', -- 'en_attente', 'en_cours', 'traitee', 'refusee'
    reponse_admin TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    traite_at TIMESTAMP WITH TIME ZONE
)
```