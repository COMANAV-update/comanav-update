const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const packageJson = require('./package.json');

async function createRelease() {
  console.log('🚀 Préparation de la release GitHub...');
  console.log(`📦 Version: ${packageJson.version}`);
  
  // 1. Construire l'application
  console.log('🔨 Construction de l\'application...');
  execSync('npm run full', { stdio: 'inherit' });
  
  // 2. Créer le dossier de release
  const releaseDir = `release/v${packageJson.version}`;
  await fs.ensureDir(releaseDir);
  
  // 3. Copier les fichiers de l'application
  const appDir = 'dist/Vessel Dossier-win32-x64';
  const portableFile = `dist/Vessel-Dossier-Portable-v${packageJson.version}.zip`;
  
  if (await fs.pathExists(appDir)) {
    await fs.copy(appDir, path.join(releaseDir, 'Vessel Dossier'));
    console.log('✅ Application copiée dans le dossier release');
  }
  
  if (await fs.pathExists(portableFile)) {
    await fs.copy(portableFile, path.join(releaseDir, path.basename(portableFile)));
    console.log('✅ Archive portable copiée');
  }
  
  // 4. Lire la taille et le hash du fichier ZIP pour latest.yml
  let fileSize = 0;
  let sha512 = '';
  
  if (await fs.pathExists(portableFile)) {
    const stat = await fs.stat(portableFile);
    fileSize = stat.size;
    
    // Calculer le hash SHA512 (nécessite Node.js crypto)
    const crypto = require('crypto');
    const fileBuffer = await fs.readFile(portableFile);
    const hash = crypto.createHash('sha512');
    hash.update(fileBuffer);
    sha512 = hash.digest('hex');
  }
  
  // 5. Créer le fichier latest.yml pour auto-update
  const latestYml = `version: ${packageJson.version}
releaseDate: ${new Date().toISOString()}
files:
  - url: Vessel-Dossier-Portable-v${packageJson.version}.zip
    sha512: ${sha512}
    size: ${fileSize}
path: Vessel-Dossier-Portable-v${packageJson.version}.zip
sha512: ${sha512}
releaseNotes: |
  Vessel Dossier v${packageJson.version}
  
  Nouveautés:
  - Première release stable
  - Auto-update activé
  - Génération de documents DOCX/PDF
  - Interface bilingue FR/EN
`;
  
  await fs.writeFile(path.join(releaseDir, 'latest.yml'), latestYml);
  console.log('📝 Fichier latest.yml créé');
  
  // 6. Créer un fichier release-info.json
  const releaseInfo = {
    version: packageJson.version,
    releaseDate: new Date().toISOString(),
    files: [
      {
        name: `Vessel-Dossier-Portable-v${packageJson.version}.zip`,
        type: 'portable',
        platform: 'win32-x64',
        size: fileSize,
        sha512: sha512
      }
    ],
    changelog: [
      `v${packageJson.version}: Première release stable avec auto-update`
    ]
  };
  
  await fs.writeJson(path.join(releaseDir, 'release-info.json'), releaseInfo, { spaces: 2 });
  
  console.log('🎉 Release préparée dans:', releaseDir);
  console.log('\n📋 Étapes manuelles pour GitHub:');
  console.log('1. Allez sur GitHub: https://github.com/COMANAV-update/comanav-update/releases/new');
  console.log(`2. Tag: v${packageJson.version}`);
  console.log(`3. Titre: Vessel Dossier v${packageJson.version}`);
  console.log('4. Description: Première release stable');
  console.log(`5. Glissez les deux fichiers depuis ${releaseDir} :`);
  console.log(`   - Vessel-Dossier-Portable-v${packageJson.version}.zip`);
  console.log(`   - latest.yml`);
  console.log('6. Publiez la release!');
}

createRelease().catch(console.error);