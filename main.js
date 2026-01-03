const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const fs = require('fs-extra');
const fse = require('fs-extra');
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");

const OUTPUT_ROOT = path.join(__dirname, "output");
const TEMPLATES_DIR = path.join(__dirname, "dossier", "templates");
const CACHE_FILE = path.join(__dirname, "vessel_cache.json");
const LANG_FILE = path.join(__dirname, "lang.json");

// Configuration auto-updater - DÉSACTIVÉ TEMPORAIREMENT
// autoUpdater.autoDownload = false;
// autoUpdater.autoInstallOnAppQuit = true;

// Cache setup
fs.ensureFileSync(CACHE_FILE);
let vesselCache = {};
try { vesselCache = fs.readJsonSync(CACHE_FILE); } catch { vesselCache = {}; }

ipcMain.handle("get-translations", async () => {
  try { return await fs.readJson(LANG_FILE); } catch (err) { return {}; }
});

// ======================
// GESTIONNAIRE IMO SÉCURISÉ
// ======================
const handleLookup = async (event, imo) => {
  if (vesselCache[imo]) return vesselCache[imo];

  try {
    const response = await fetch(`https://vessel-api-s85s.onrender.com/vessel-full/${imo}`);
    
    if (!response.ok) throw new Error("Erreur serveur");

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      if (data && (data.vessel_name || data.name)) {
        const result = {
          vessel_name: data.vessel_name || data.name,
          flag: data.flag || "",
          grt: data.grt || data.gross_tonnage || "",
          dwt: data.dwt || data.deadweight || "",
          loa: data.loa || data.length || "",
          owner: data.owner || ""
        };
        vesselCache[imo] = result;
        fs.writeJsonSync(CACHE_FILE, vesselCache);
        return result;
      }
    }
  } catch (err) { 
    console.error("Erreur API IMO:", err.message); 
  }

  throw new Error("Navire non trouvé ou API indisponible");
};

ipcMain.handle("lookup-vessel", handleLookup);
ipcMain.handle("vessel:lookup", handleLookup);

// ======================
// GÉNÉRATION DOSSIER
// ======================
ipcMain.handle("generate-dossier", async (ev, payload) => {
  try {
    const folderPath = path.join(OUTPUT_ROOT, payload.vesselName || "Export");
    await fs.ensureDir(folderPath);
    const fmt = d => d ? new Date(d).toLocaleDateString('fr-FR') : "";
    
    const data = {
      ...payload,
      ARRIVAL_DATE: fmt(payload.arrivalDate),
      BERTHING_DATE: fmt(payload.berthingDate),
      SAILING_DATE: fmt(payload.sailingDate),
      VESSEL_NAME: (payload.vesselName || "").toUpperCase(),
      REMORQUAGE_OPT: payload.remorquageText || ""
    };

    const port = (payload.currentPort || "").toUpperCase();
    const operation = (payload.operationType || "Import").toLowerCase();
    let templatesToLoad = [];

    if (port === "DAKHLA") {
        templatesToLoad.push("tva mm dakhla.docx", "tva anp dakhla.docx", "BON PILOT DAKHLA.docx");
    } else if (port === "LAAYOUNE") {
        templatesToLoad.push("tva anp eun.docx", "tva mm eun.docx");
    } else if (port === "TAN TAN") {
        templatesToLoad.push("tva tantan.docx");
    }

    if (operation === "import") {
      templatesToLoad.push("manifest sortie.docx", "manifeste entree.docx");
    } else {
      templatesToLoad.push("manifest entree  exp.docx", "manifeste sortie  exp.docx");
    }

    templatesToLoad.push("TIME SHIT.docx", "peage.docx", "gardiennage Laayoune.docx");
    templatesToLoad = templatesToLoad.filter(f => fs.existsSync(path.join(TEMPLATES_DIR, f)));

    for (const file of templatesToLoad) {
      const content = fs.readFileSync(path.join(TEMPLATES_DIR, file), "binary");
      const doc = new Docxtemplater(new PizZip(content), { delimiters: { start: "[[", end: "]]" } });
      doc.render(data);
      fs.writeFileSync(path.join(folderPath, file), doc.getZip().generate({ type: "nodebuffer" }));
    }
    return folderPath;
  } catch (err) { throw err; }
});

ipcMain.handle("dossier:print-to-pdf", async (event, vesselName) => {
    // Votre code PDF existant ici...
});

ipcMain.handle("open-output-folder", (event, vesselName) => {
  const specificPath = vesselName ? path.join(OUTPUT_ROOT, vesselName) : OUTPUT_ROOT;
  fs.ensureDirSync(specificPath);
  shell.openPath(specificPath);
});

// ======================
// GESTION DES MISES À JOUR - DÉSACTIVÉES
// ======================
ipcMain.handle("check-for-updates", async () => {
  return new Promise((resolve, reject) => {
    autoUpdater.checkForUpdates()
      .then(() => resolve())
      .catch(err => {
        console.error('Erreur lors de la vérification des mises à jour:', err);
        reject(err);
      });
  });
});

ipcMain.handle("download-update", async () => {
  return new Promise((resolve, reject) => {
    // autoUpdater.downloadUpdate() // DÉSACTIVÉ
    //   .then(() => resolve())
    //   .catch(err => reject(err));
    dialog.showMessageBox({
      type: 'info',
      title: 'Mises à jour',
      message: 'La fonctionnalité de mise à jour automatique n\'est pas encore configurée.',
      buttons: ['OK']
    });
    resolve();
  });
});

ipcMain.handle("quit-and-install", () => {
  // autoUpdater.quitAndInstall(); // DÉSACTIVÉ
});

// DÉSACTIVER TOUS LES ÉVÉNEMENTS AUTO-UPDATER
// autoUpdater.on('checking-for-update', () => {
//   console.log('Checking for update...');
// });

// ... COMMENTEZ TOUS LES AUTRES ÉVÉNEMENTS autoUpdater.on ...

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  
  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
  
  // NE PAS vérifier les mises à jour au démarrage
  // autoUpdater.checkForUpdatesAndNotify(); // DÉSACTIVÉ
}

app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});