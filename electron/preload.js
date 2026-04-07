const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getServerPort: () => ipcRenderer.invoke('get-server-port'),

  // Window controls (frame: false)
  winMinimize: () => ipcRenderer.send('win-minimize'),
  winMaximize: () => ipcRenderer.send('win-maximize'),
  winClose: () => ipcRenderer.send('win-close'),
  winFullscreen: () => ipcRenderer.send('win-fullscreen'),

  // First launch
  getFirstLaunch: () => ipcRenderer.invoke('get-first-launch'),
  setFirstLaunchDone: () => ipcRenderer.invoke('set-first-launch-done'),

  // Server URL sync
  setServerUrl: (url) => ipcRenderer.invoke('set-server-url', url),

  // Auto-update
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (_e, data) => callback(data));
  },
  onUpdateProgress: (callback) => {
    ipcRenderer.on('update-download-progress', (_e, data) => callback(data));
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', (_e) => callback());
  },
});

// Set default server URL for file:// protocol
window.addEventListener('DOMContentLoaded', () => {
  if (window.location.protocol === 'file:' && !localStorage.getItem('pos_server_url')) {
    localStorage.setItem('pos_server_url', 'http://72.62.125.221:3000');
  }
});
