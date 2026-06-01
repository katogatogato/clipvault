import { globalShortcut, BrowserWindow } from "electron";

export function registerShortcuts(mainWindow: BrowserWindow): void {
  const accelerator = process.platform === "darwin"
    ? "Cmd+Shift+V"
    : "Ctrl+Shift+V";

  const success = globalShortcut.register(accelerator, () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send("clip-updated", []);
    }
  });

  if (!success) {
    console.error(`Failed to register global shortcut: ${accelerator}`);
  }
}

export function unregisterShortcuts(): void {
  globalShortcut.unregisterAll();
}
