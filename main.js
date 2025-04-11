const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require("fs");
const path = require('path');

let mainWindow;
const configPath = path.join(app.getPath("userData"), "config.json");

ipcMain.handle("get-fullscreen", () => {
  return config.fullscreen;
});

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch {
    return { fullscreen: false };
  }
}

function saveConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config));
}

const config = loadConfig();

function createWindows() {
  mainWindow = new BrowserWindow({
    width: 1280,
    minWidth: 1024,
    height: 720,
    minHeight: 600,
    resizable: true,
    fullscreen: config.fullscreen,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets/favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });

  mainWindow.loadFile('renderer/main.html');

  ipcMain.handle("set-fullscreen", (event, value) => {
    mainWindow.setFullScreen(value);
    config.fullscreen = value;
    saveConfig(config);
  });

}

app.whenReady().then(createWindows);
