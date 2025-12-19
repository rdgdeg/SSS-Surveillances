import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuration Supabase
const supabaseUrl = 'https://budffopdzqjfkbgbpbml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZGZmb3BkenFqZmtiZ2JwYm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NDI1NjQsImV4cCI6MjA3ODQxODU2NH0.Ru5gB0wr0mkBgKtG0CUHRqsOytUQF5xz6cKfn0yIYDw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    try {
        console.log('🚀 Début de la migration des demandes de modification...');

        // Lire le fichier SQL
        const sqlContent = fs.readFileSync('scripts/apply-demandes-modification-migration.sql', 'utf8');
        
        // Diviser en commandes individuelles (approximatif)
        const commands = sqlContent
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd && !cmd.startsWith('--') && cmd !== 'SELECT \'Migration des demandes de modification appliquée avec succès!\' as message');

        console.log(`📝 Exécution de ${commands.length} commandes SQL...`);

        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            if (command) {
                console.log(`⏳ Commande ${i + 1}/${commands.length}...`);
                
                const { error } = await supabase.rpc('exec_sql', { 
                    sql_query: command + ';' 
                });
                
                if (error) {
                    console.error(`❌ Erreur sur la commande ${i + 1}:`, error);
                    // Continuer avec les autres commandes
                } else {
                    console.log(`✅ Commande ${i + 1} exécutée avec succès`);
                }
            }
        }

        // Vérifier que la table a été créée
        const { data, error } = await supabase
            .from('demandes_modification')
            .select('count(*)')
            .limit(1);

        if (error) {
            console.error('❌ Erreur lors de la vérification:', error);
        } else {
            console.log('✅ Table demandes_modification créée avec succès!');
        }

        console.log('🎉 Migration terminée!');

    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
    }
}

runMigration();