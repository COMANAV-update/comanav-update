const fs = require('fs-extra');

async function cleanDist() {
  if (fs.existsSync('dist')) {
    await fs.remove('dist');
    console.log('✅ Dossier dist nettoyé');
  } else {
    console.log('📁 Dossier dist non trouvé, rien à nettoyer');
  }
}

cleanDist().catch(console.error);