const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');
const { autoUpdater } = require('electron-updater');

const SERVER_PORT = 3000;
const VPS_URL = 'http://72.62.125.221:3000';
const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';

let mainWindow;
let serverProcess = null;
let useEmbeddedServer = false;

// ─── Simple JSON store in userData ──────────────────────────────
function getStorePath() {
  return path.join(app.getPath('userData'), 'app-state.json');
}

function loadStore() {
  try {
    return JSON.parse(fs.readFileSync(getStorePath(), 'utf-8'));
  } catch {
    return {};
  }
}

function saveStore(data) {
  const current = loadStore();
  fs.writeFileSync(getStorePath(), JSON.stringify({ ...current, ...data }, null, 2));
}

// ─── Window ─────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../assets/icon.ico'),
    title: 'TOKO FARZAN',
    // Linux: hide menu bar since we use custom titlebar
    autoHideMenuBar: true,
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── Embedded Server ────────────────────────────────────────────
function getServerPaths() {
  if (app.isPackaged) {
    const serverDir = path.join(process.resourcesPath, 'server');
    return { script: path.join(serverDir, 'src', 'app.js'), cwd: serverDir };
  }
  const serverDir = path.join(__dirname, '..', '..', 'server');
  return { script: path.join(serverDir, 'src', 'app.js'), cwd: serverDir };
}

function startEmbeddedServer() {
  const { script, cwd } = getServerPaths();

  // Check if server files exist before trying to spawn
  if (!fs.existsSync(script)) {
    console.log(`[Server] Server script not found at ${script}, using VPS: ${VPS_URL}`);
    useEmbeddedServer = false;
    return;
  }

  const nodeExe = process.platform === 'win32' ? 'node.exe' : 'node';

  try {
    serverProcess = spawn(nodeExe, [script], {
      cwd,
      env: { ...process.env, PORT: String(SERVER_PORT) },
      stdio: 'pipe',
    });

    serverProcess.stdout.on('data', (d) => console.log(`[Server] ${d.toString().trim()}`));
    serverProcess.stderr.on('data', (d) => console.error(`[Server Error] ${d.toString().trim()}`));
    serverProcess.on('error', (err) => {
      console.error(`[Server] Failed to start: ${err.message}`);
      useEmbeddedServer = false;
      serverProcess = null;
    });
    serverProcess.on('close', (code) => {
      console.log(`[Server] exited ${code}`);
      serverProcess = null;
    });

    useEmbeddedServer = true;
  } catch (err) {
    console.error(`[Server] spawn failed: ${err.message}`);
    useEmbeddedServer = false;
  }
}

function stopEmbeddedServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

function waitForServer(maxMs = 15000) {
  const interval = 500;
  let elapsed = 0;
  return new Promise((resolve) => {
    const check = () => {
      const req = http.get(`http://localhost:${SERVER_PORT}/api/health`, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        elapsed += interval;
        if (elapsed >= maxMs) resolve();
        else setTimeout(check, interval);
      });
      req.end();
    };
    check();
  });
}

// ─── Auto Update (GitHub Releases via electron-updater) ────────
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on('update-available', (info) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-available', {
      hasUpdate: true,
      version: info.version,
      releaseNotes: info.releaseNotes || '',
    });
  }
});

autoUpdater.on('download-progress', (progress) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-download-progress', {
      percent: Math.round(progress.percent),
    });
  }
});

autoUpdater.on('update-downloaded', () => {
  if (mainWindow) mainWindow.webContents.send('update-downloaded');
});

autoUpdater.on('error', (err) => {
  console.error('[Updater] Error:', err.message);
});

function checkForUpdates() {
  if (!app.isPackaged) return;
  autoUpdater.checkForUpdates().catch((err) => {
    console.error('[Updater] Check failed:', err.message);
  });
}

// ─── IPC Handlers ───────────────────────────────────────────────
// Window controls
ipcMain.on('win-minimize', () => mainWindow?.minimize());
ipcMain.on('win-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on('win-close', () => mainWindow?.close());

// App info
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-server-port', () => SERVER_PORT);

// First launch store
ipcMain.handle('get-first-launch', () => {
  const store = loadStore();
  return store.firstLaunchDone !== true;
});
ipcMain.handle('set-first-launch-done', () => {
  saveStore({ firstLaunchDone: true });
  return true;
});

// Server URL sync (renderer → main)
ipcMain.handle('set-server-url', (_e, url) => {
  if (url && typeof url === 'string') saveStore({ serverUrl: url });
  return true;
});

// Manual update check
ipcMain.handle('check-for-updates', () => {
  checkForUpdates();
  return true;
});

// Download & install update
ipcMain.handle('download-update', () => {
  autoUpdater.downloadUpdate();
  return true;
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
  return true;
});

// Fullscreen toggle
ipcMain.on('win-fullscreen', () => {
  if (mainWindow) mainWindow.setFullScreen(!mainWindow.isFullScreen());
});

// ─── Lifecycle ──────────────────────────────────────────────────
app.whenReady().then(async () => {
  startEmbeddedServer();

  // Only wait for embedded server if it's actually running
  if (useEmbeddedServer) {
    await waitForServer();
  }

  createWindow();

  // Auto-check for updates 5 seconds after launch
  setTimeout(checkForUpdates, 5000);

  // F11 fullscreen global shortcut
  globalShortcut.register('F11', () => {
    if (mainWindow) mainWindow.setFullScreen(!mainWindow.isFullScreen());
  });
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  stopEmbeddedServer();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
