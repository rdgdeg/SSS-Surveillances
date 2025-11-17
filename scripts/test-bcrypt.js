#!/usr/bin/env node

/**
 * Script pour tester bcrypt
 */

import bcrypt from 'bcryptjs';

const password = 'admin123';
const hash = '$2b$10$vFBLAdauAkRrsZ4h1yt1GeZHD1LzTTH5UCUFfdFea27jAm2CN21.u';

console.log('Testing bcrypt...');
console.log('Password:', password);
console.log('Hash:', hash);

const isValid = bcrypt.compareSync(password, hash);
console.log('Is valid:', isValid);

if (isValid) {
  console.log('✅ Le hash correspond au mot de passe!');
} else {
  console.log('❌ Le hash ne correspond PAS au mot de passe!');
}

// Test avec async
bcrypt.compare(password, hash).then(result => {
  console.log('\nAsync test result:', result);
  if (result) {
    console.log('✅ Async: Le hash correspond au mot de passe!');
  } else {
    console.log('❌ Async: Le hash ne correspond PAS au mot de passe!');
  }
});
