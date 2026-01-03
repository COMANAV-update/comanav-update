/**
 * PortCallApp v1.0.0
 * (c) 2025 ASMAHRI Abderrahman, Comanav
 * Email: eun.aasmahri@cma-cgm.com
 * All rights reserved.
 */

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("PortCallAPI", {
  lookupVessel: (query) => ipcRenderer.invoke("vessel:lookup", query),
  generateDossier: (payload) => ipcRenderer.invoke("generate-dossier", payload),
  openOutputFolder: (vesselName) => ipcRenderer.invoke("open-output-folder", vesselName),
  printToPdf: (vesselName) => ipcRenderer.invoke("dossier:print-to-pdf", vesselName),
  getTranslations: () => ipcRenderer.invoke("get-translations"),
  
  // Auto-updater désactivé temporairement
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  downloadUpdate: () => ipcRenderer.invoke("download-update"),
  quitAndInstall: () => ipcRenderer.invoke("quit-and-install"),
  
  // Événements de mise à jour (désactivés)
  onUpdateAvailable: (callback) => {
    // ipcRenderer.on('update-available', callback); // Désactivé
  },
  onUpdateNotAvailable: (callback) => {
    // ipcRenderer.on('update-not-available', callback); // Désactivé
  },
  onUpdateError: (callback) => {
    // ipcRenderer.on('update-error', callback); // Désactivé
  },
  onDownloadProgress: (callback) => {
    // ipcRenderer.on('download-progress', callback); // Désactivé
  },
  onUpdateDownloaded: (callback) => {
    // ipcRenderer.on('update-downloaded', callback); // Désactivé
  },
  
  // Nettoyer les listeners
  removeUpdateListeners: () => {
    // Désactivé
  }
});