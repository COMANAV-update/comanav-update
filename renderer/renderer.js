let allTranslations = {};
let currentLang = 'fr';

// Auto-update variables
let updateCheckInterval = null;
const UPDATE_CHECK_INTERVAL = 3600000; // 1 heure en millisecondes

async function initI18n() {
  allTranslations = await window.PortCallAPI.getTranslations();
  changeLang('fr');
  
  // Start auto-update check
  initAutoUpdate();
}

window.changeLang = (lang) => {
  currentLang = lang;
  const strings = allTranslations[lang];
  if (!strings) return;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (strings[key]) el.textContent = strings[key];
  });
};

function log(key, val = "") {
  const el = document.getElementById("logConsole");
  const msg = (allTranslations[currentLang] && allTranslations[currentLang][key]) ? allTranslations[currentLang][key] : key;
  el.textContent += "\n> " + msg + " " + val;
  el.scrollTop = el.scrollHeight;
}

// === SECTION : RÉCUPÉRATION AUTO IMO ===
document.getElementById("imo").addEventListener("input", async (e) => {
  const imo = e.target.value.trim();
  if (imo.length === 7) {
    log("Recherche du navire IMO:", imo);
    try {
      const data = await window.PortCallAPI.lookupVessel(imo);
      if (data) {
        document.getElementById("vesselName").value = data.vessel_name || "";
        document.getElementById("flag").value = data.flag || "";
        document.getElementById("grt").value = data.grt || "";
        document.getElementById("dwt").value = data.dwt || "";
        document.getElementById("loa").value = data.loa || "";
        document.getElementById("owner").value = data.owner || "";
        log("Données navire récupérées avec succès.");
      }
    } catch (err) {
      log("Navire non trouvé.");
    }
  }
});

// Affichage dynamique Dakhla
document.getElementById("currentPort").addEventListener("change", (e) => {
  document.getElementById("extraDakhla").style.display = (e.target.value === "DAKHLA") ? "grid" : "none";
});

let cargoList = [];
document.getElementById("btnAddCargo").addEventListener("click", () => {
  const desc = document.getElementById("cargoDesc").value.trim();
  const qty = document.getElementById("cargoQty").value.trim();
  const unit = document.getElementById("cargoUnit").value.trim() || "MT";
  if (!desc || !qty) return;
  cargoList.push(`${desc} - ${qty} ${unit}`);
  renderCargoList();
});

function renderCargoList() {
  const div = document.getElementById("cargoList");
  div.innerHTML = "";
  cargoList.forEach((item, index) => {
    div.innerHTML += `<div class="cargo-item"><span>${item}</span><button class="delete-btn" onclick="deleteCargoItem(${index})">X</button></div>`;
  });
}
window.deleteCargoItem = (i) => { cargoList.splice(i, 1); renderCargoList(); };

// === BOUTONS IMPORT / EXPORT ===
let operationType = "Import";
const btnImport = document.getElementById("btnImport");
const btnExport = document.getElementById("btnExport");

function updateOperationMode(mode) {
  operationType = mode;
  if (mode === "Import") {
    btnImport.classList.add("btn-active");
    btnExport.classList.remove("btn-active");
    log("Mode sélectionné : Importation");
  } else {
    btnExport.classList.add("btn-active");
    btnImport.classList.remove("btn-active");
    log("Mode sélectionné : Exportation");
  }
}

btnImport.addEventListener("click", () => updateOperationMode("Import"));
btnExport.addEventListener("click", () => updateOperationMode("Export"));

// Initialisation par défaut
updateOperationMode("Import");

// === GÉNÉRATION ===
document.getElementById("btnGenerate").addEventListener("click", async () => {
  const payload = {
    vesselName: document.getElementById("vesselName").value,
    imo: document.getElementById("imo").value,
    flag: document.getElementById("flag").value,
    grt: document.getElementById("grt").value,
    dwt: document.getElementById("dwt").value,
    loa: document.getElementById("loa").value,
    tva: document.getElementById("tva").value,
    owner: document.getElementById("owner").value,
    portFrom: document.getElementById("portFrom").value,
    portTo: document.getElementById("portTo").value,
    currentPort: document.getElementById("currentPort").value,
    arrivalDate: document.getElementById("arrivalDate").value,
    berthingDate: document.getElementById("berthingDate").value,
    sailingDate: document.getElementById("sailingDate").value,
    shipper: document.getElementById("shipper").value,
    receiver: document.getElementById("receiver").value,
    all_cargo: cargoList,
    operationType,
    watchDay: document.getElementById("watchDay").value,
    watchNight: document.getElementById("watchNight").value,
    remorquageText: document.getElementById("includeRemorquage").checked ? "ET REMORQUAGE" : ""
  };

  log("log_gen_docx");
  try {
    await window.PortCallAPI.generateDossier(payload);
    log("log_docx_ready");
  } catch (e) { log("log_docx_err"); }
});

document.getElementById("btnPdf").addEventListener("click", async () => {
  const name = document.getElementById("vesselName").value;
  if (name) await window.PortCallAPI.printToPdf(name);
});

document.getElementById("btnFolder").addEventListener("click", () => {
  window.PortCallAPI.openOutputFolder(document.getElementById("vesselName").value);
});

// Boutons Clear (Menu et UI)
const clearAction = () => { location.reload(); };
document.getElementById("btnClear").addEventListener("click", clearAction);
document.getElementById("menuClear").addEventListener("click", clearAction);

// Menu Fichier - Ouvrir dossier
document.getElementById("menuOpenFolder").addEventListener("click", () => {
  window.PortCallAPI.openOutputFolder("");
});

// === FONCTIONS AUTO-UPDATE ===
function initAutoUpdate() {
  // Check for updates on startup
  checkForUpdates();
  
  // Set up periodic update checks
  updateCheckInterval = setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL);
  
  // Listen for update events from main process
  window.PortCallAPI.onUpdateAvailable((info) => {
    log("update_available", info.version);
    showUpdateNotification(info);
  });
  
  window.PortCallAPI.onUpdateDownloaded((info) => {
    log("update_downloaded", info.version);
    showUpdateReadyNotification(info);
  });
  
  window.PortCallAPI.onUpdateError((error) => {
    log("update_error", error);
  });
}

function checkForUpdates() {
  log("checking_updates");
  window.PortCallAPI.checkForUpdates();
}

function showUpdateNotification(info) {
  const updateNotification = document.getElementById('updateNotification');
  if (!updateNotification) return;
  
  const updateVersion = document.getElementById('updateVersion');
  const updateChangelog = document.getElementById('updateChangelog');
  
  if (updateVersion) updateVersion.textContent = `v${info.version}`;
  if (updateChangelog) updateChangelog.textContent = info.releaseNotes || 'Nouvelle version disponible';
  
  updateNotification.style.display = 'block';
}

function showUpdateReadyNotification(info) {
  const updateReadyNotification = document.getElementById('updateReadyNotification');
  if (!updateReadyNotification) return;
  
  const updateReadyVersion = document.getElementById('updateReadyVersion');
  if (updateReadyVersion) updateReadyVersion.textContent = `v${info.version}`;
  
  updateReadyNotification.style.display = 'block';
}

// Update notification handlers
window.downloadUpdate = () => {
  window.PortCallAPI.downloadUpdate();
  const updateNotification = document.getElementById('updateNotification');
  if (updateNotification) updateNotification.style.display = 'none';
};

window.installUpdate = () => {
  window.PortCallAPI.quitAndInstall();
};

window.dismissUpdate = () => {
  const updateNotification = document.getElementById('updateNotification');
  if (updateNotification) updateNotification.style.display = 'none';
  log("update_dismissed");
};

window.dismissUpdateReady = () => {
  const updateReadyNotification = document.getElementById('updateReadyNotification');
  if (updateReadyNotification) updateReadyNotification.style.display = 'none';
  log("update_install_dismissed");
};

// === FONCTIONS POPUP AIDE ===
window.showHelp = () => {
  document.getElementById("helpModal").style.display = "block";
};
window.closeHelp = () => {
  document.getElementById("helpModal").style.display = "none";
};
window.onclick = (event) => {
  let modal = document.getElementById("helpModal");
  if (event.target == modal) closeHelp();
};

initI18n();

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
  }
});