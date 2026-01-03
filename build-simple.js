const packager = require('electron-packager');
const fs = require('fs-extra');
const path = require('path');

async function buildApp() {
  console.log('🚀 Démarrage de la construction...');
  
  // Nettoyer le dossier dist
  if (fs.existsSync('dist')) {
    await fs.remove('dist');
    console.log('📁 Dossier dist nettoyé');
  }
  
  const options = {
    dir: '.',
    out: 'dist',
    overwrite: true,
    platform: 'win32',
    arch: 'x64',
    icon: 'assets/icon.ico',
    prune: true,
    asar: false, // Désactiver asar pour faciliter le débogage
    name: 'Vessel Dossier',
    appVersion: '1.0.0',
    appCopyright: '© 2024 COMANAV - ASMAHRI Abderrahman',
    win32metadata: {
      CompanyName: 'COMANAV',
      FileDescription: 'Vessel Dossier - Gestion des escales portuaires',
      OriginalFilename: 'VesselDossier.exe',
      ProductName: 'Vessel Dossier',
      InternalName: 'VesselDossier'
    }
  };
  
  try {
    console.log('📦 Empaquetage de l\'application...');
    const appPaths = await packager(options);
    console.log('✅ Build terminé avec succès !');
    console.log('📁 Application créée dans :', appPaths[0]);
    
    // Copier les assets manquants (si nécessaire)
    const appDir = appPaths[0];
    await fs.copy('assets', path.join(appDir, 'assets'));
    await fs.copy('locales', path.join(appDir, 'locales'));
    await fs.copy('templates', path.join(appDir, 'templates'));
    console.log('📁 Assets copiés');
    
    return appDir;
  } catch (err) {
    console.error('❌ Erreur lors du build:', err);
    process.exit(1);
  }
}

buildApp();