const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

async function createPortable() {
  console.log('🗜️  Création de l\'archive portable...');
  
  const appDir = 'dist/Vessel Dossier-win32-x64';
  const outputFile = 'dist/Vessel-Dossier-Portable.zip';
  
  if (!fs.existsSync(appDir)) {
    console.log('❌ Dossier application introuvable. Exécutez d\'abord le build.');
    return;
  }
  
  const output = fs.createWriteStream(outputFile);
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  output.on('close', () => {
    console.log(`✅ Portable créé: ${outputFile} (${archive.pointer()} octets)`);
  });
  
  archive.on('error', (err) => {
    throw err;
  });
  
  archive.pipe(output);
  
  // Ajouter tout le contenu du dossier
  archive.directory(appDir, false);
  
  await archive.finalize();
}

createPortable().catch(console.error);