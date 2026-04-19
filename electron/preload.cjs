const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  window: {
    close: () => ipcRenderer.send('window:close'),
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
  },
  updater: {
    onUpdateAvailable: (cb) => ipcRenderer.on('update:available', cb),
    onUpdateDownloaded: (cb) => ipcRenderer.on('update:downloaded', cb),
    installUpdate: () => ipcRenderer.send('update:install'),
  },
  file: {
    saveToDesktop: (filename, content) =>
      ipcRenderer.invoke('file:saveToDesktop', { filename, content }),
  },
});
