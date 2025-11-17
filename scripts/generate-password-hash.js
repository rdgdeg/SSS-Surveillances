#!/usr/bin/env node

/**
 * Script pour générer des hash de mots de passe bcrypt
 * Usage: node scripts/generate-password-hash.js <password>
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/generate-password-hash.js <password>');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log('\nPassword:', password);
console.log('Hash:', hash);
console.log('\nUtilisez ce hash dans votre migration SQL ou pour mettre à jour un utilisateur.\n');
