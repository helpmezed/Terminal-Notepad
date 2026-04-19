const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 500,
    icon: path.join(__dirname, '../assets/icon256.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    titleBarStyle: 'hidden',
    frame: false,
    backgroundColor: '#08090a',
  });

  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
}

// Save note to Desktop
ipcMain.handle('file:saveToDesktop', async (_, { filename, content }) => {
  const safe = filename.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim() || 'Untitled';
  const dest = path.join(app.getPath('desktop'), safe + '.txt');
  try {
    fs.writeFileSync(dest, content, 'utf8');
    return { success: true, path: dest };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Window controls
ipcMain.on('window:close', () => mainWindow?.close());
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

// Auto updater
function setupUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-downloaded', () => {
    // silent=true means no installer UI, true=relaunch after install
    autoUpdater.quitAndInstall(true, true);
  });

  // Check on launch, then every 4 hours
  autoUpdater.checkForUpdates().catch(() => {});
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 4 * 60 * 60 * 1000);
}

app.whenReady().then(() => {
  createWindow();
  // Only run updater in packaged app, not dev
  if (app.isPackaged) {
    setupUpdater();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
