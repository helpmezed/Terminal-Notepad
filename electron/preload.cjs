const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  window: {
    close: () => ipcRenderer.send('window:close'),
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
  },
  updater: {
    onUpdateAvailable: (cb) => ipcRenderer.on('update:available', (_e, version) => cb(version)),
    onUpdateDownloading: (cb) => ipcRenderer.on('update:downloading', (_e, pct) => cb(pct)),
    onUpdateInstalling: (cb) => ipcRenderer.on('update:installing', cb),
    onUpdateError: (cb) => ipcRenderer.on('update:error', (_e, msg) => cb(msg)),
    installUpdate: () => ipcRenderer.send('update:install'),
  },
  file: {
    saveToDesktop: (filename, content) =>
      ipcRenderer.invoke('file:saveToDesktop', { filename, content }),
  },
});
