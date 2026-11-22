const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const dataDir = () => app.getPath('userData');
const dataFile = () => path.join(dataDir(), 'figuras.json');
const winFile = () => path.join(dataDir(), 'ventana.json');

function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function writeJSON(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

let win;

function createWindow() {
  const saved = readJSON(winFile(), {});
  win = new BrowserWindow({
    width: saved.width || 420,
    height: saved.height || 680,
    x: saved.x,
    y: saved.y,
    minWidth: 320,
    minHeight: 400,
    frame: false,
    alwaysOnTop: saved.alwaysOnTop !== false,
    backgroundColor: '#14141a',
    title: 'Mis Figuras',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  // 'floating' keeps it above normal windows; 'screen-saver' level also over fullscreen apps on macOS
  if (win.isAlwaysOnTop()) win.setAlwaysOnTop(true, 'floating');
  if (saved.opacity) win.setOpacity(saved.opacity);

  win.loadFile(path.join(__dirname, 'src', 'index.html'));

  const persist = () => {
    if (!win || win.isDestroyed()) return;
    const b = win.getBounds();
    writeJSON(winFile(), { ...b, alwaysOnTop: win.isAlwaysOnTop(), opacity: win.getOpacity() });
  };
  win.on('moved', persist);
  win.on('resized', persist);
  win.on('close', persist);
}

ipcMain.handle('data:load', () => readJSON(dataFile(), null));
ipcMain.handle('data:save', (_e, data) => { writeJSON(dataFile(), data); return true; });

ipcMain.handle('win:getPin', () => win.isAlwaysOnTop());
ipcMain.handle('win:setPin', (_e, on) => {
  win.setAlwaysOnTop(!!on, 'floating');
  writeJSON(winFile(), { ...win.getBounds(), alwaysOnTop: !!on, opacity: win.getOpacity() });
  return win.isAlwaysOnTop();
});
ipcMain.handle('win:getOpacity', () => win.getOpacity());
ipcMain.handle('win:setOpacity', (_e, v) => {
  win.setOpacity(Math.min(1, Math.max(0.3, Number(v) || 1)));
  writeJSON(winFile(), { ...win.getBounds(), alwaysOnTop: win.isAlwaysOnTop(), opacity: win.getOpacity() });
});
ipcMain.on('win:minimize', () => win.minimize());
ipcMain.on('win:close', () => win.close());

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
