import { app, BrowserWindow, dialog, ipcMain, Menu, nativeTheme } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import isDev from "electron-is-dev";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;

function sendCommand(command: string) {
  mainWindow?.webContents.send("menu-command", command);
}

function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "文件",
      submenu: [
        { label: "新建", accelerator: "CommandOrControl+N", click: () => sendCommand("file:new") },
        { label: "打开", accelerator: "CommandOrControl+O", click: () => sendCommand("file:open") },
        { label: "保存", accelerator: "CommandOrControl+S", click: () => sendCommand("file:save") },
        { label: "另存为", accelerator: "CommandOrControl+Shift+S", click: () => sendCommand("file:save-as") },
        { type: "separator" },
        { label: "关闭文档", accelerator: "CommandOrControl+W", click: () => sendCommand("file:close") },
        { role: "quit", label: "退出" }
      ]
    },
    {
      label: "编辑",
      submenu: [
        { role: "undo", label: "撤销" },
        { role: "redo", label: "重做" },
        { type: "separator" },
        { label: "查找", accelerator: "CommandOrControl+F", click: () => sendCommand("search:find") },
        { label: "替换", accelerator: "CommandOrControl+H", click: () => sendCommand("search:replace") },
        { type: "separator" },
        { role: "cut", label: "剪切" },
        { role: "copy", label: "复制" },
        { role: "paste", label: "粘贴" }
      ]
    },
    {
      label: "视图",
      submenu: [
        { label: "源码模式", accelerator: "CommandOrControl+/", click: () => sendCommand("view:source") },
        { label: "专注模式", accelerator: "F8", click: () => sendCommand("view:focus") },
        { label: "打字机模式", accelerator: "F9", click: () => sendCommand("view:typewriter") },
        { label: "大纲", accelerator: "CommandOrControl+Shift+1", click: () => sendCommand("view:outline") },
        { type: "separator" },
        { role: "togglefullscreen", label: "全屏" },
        { role: "reload", label: "重新载入" },
        { role: "toggleDevTools", label: "开发者工具" }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function createWindow() {
  nativeTheme.themeSource = "light";
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1040,
    minHeight: 680,
    backgroundColor: "#f6f7fb",
    title: "MarkForge",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    await mainWindow.loadURL("http://127.0.0.1:5173");
  } else {
    await mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  createMenu();
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) void createWindow();
});

ipcMain.handle("dialog:open-files", async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: "导入 Markdown 或 PDF",
    properties: ["openFile", "multiSelections"],
    filters: [
      { name: "支持的文件", extensions: ["md", "markdown", "pdf"] },
      { name: "Markdown", extensions: ["md", "markdown"] },
      { name: "PDF", extensions: ["pdf"] }
    ]
  });

  return result.canceled ? [] : result.filePaths;
});

ipcMain.handle("dialog:save-file", async (_event, defaultPath: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    title: "另存为",
    defaultPath,
    filters: [
      { name: "Markdown", extensions: ["md"] },
      { name: "所有文件", extensions: ["*"] }
    ]
  });

  return result.canceled ? null : result.filePath;
});
