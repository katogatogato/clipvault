import {
  app,
  BrowserWindow,
  ipcMain,
  clipboard,
  nativeTheme,
} from "electron";
import * as path from "path";
import { startClipboardMonitor, stopClipboardMonitor } from "./clipboard";
import {
  getAllClips,
  deleteClip as deleteClipFromStore,
  togglePin as togglePinInStore,
  clearHistory as clearHistoryInStore,
  searchClips as searchClipsInStore,
} from "./store";
import { registerShortcuts, unregisterShortcuts } from "./shortcuts";

let mainWindow: BrowserWindow | null = null;

function createWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 500,
    show: false,
    frame: false,
    resizable: false,
    transparent: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#1a1a2e" : "#ffffff",
    webPreferences: {
      preload: path.join(__dirname, "..", "renderer", "app.js"),
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  mainWindow.loadFile(
    path.join(__dirname, "..", "renderer", "index.html")
  );

  mainWindow.on("blur", () => {
    if (mainWindow && mainWindow.isVisible()) {
      mainWindow.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  return mainWindow;
}

function setupIPC(): void {
  ipcMain.handle("get-clips", () => {
    return getAllClips();
  });

  ipcMain.handle("search-clips", (_event, query: string) => {
    return searchClipsInStore(query);
  });

  ipcMain.handle("copy-clip", (_event, id: string) => {
    const clips = getAllClips();
    const clip = clips.find((c) => c.id === id);
    if (clip) {
      clipboard.writeText(clip.content);
    }
    if (mainWindow) {
      mainWindow.hide();
    }
  });

  ipcMain.handle("delete-clip", (_event, id: string) => {
    return deleteClipFromStore(id);
  });

  ipcMain.handle("pin-clip", (_event, id: string) => {
    return togglePinInStore(id);
  });

  ipcMain.handle("clear-history", () => {
    return clearHistoryInStore();
  });

  ipcMain.handle("hide-window", () => {
    if (mainWindow) {
      mainWindow.hide();
    }
  });
}

app.whenReady().then(() => {
  const win = createWindow();
  setupIPC();

  startClipboardMonitor((updatedClips) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("clip-updated", updatedClips);
    }
  });

  registerShortcuts(win);
});

app.on("will-quit", () => {
  stopClipboardMonitor();
  unregisterShortcuts();
});

app.on("window-all-closed", () => {
  app.quit();
});
