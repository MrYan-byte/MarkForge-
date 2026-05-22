import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("markforge", {
  openFiles: () => ipcRenderer.invoke("dialog:open-files") as Promise<string[]>,
  saveFileDialog: (defaultPath: string) => ipcRenderer.invoke("dialog:save-file", defaultPath) as Promise<string | null>,
  onMenuCommand: (handler: (command: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, command: string) => handler(command);
    ipcRenderer.on("menu-command", listener);
    return () => ipcRenderer.removeListener("menu-command", listener);
  }
});
