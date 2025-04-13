const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require("fs");
const path = require('path');
const db = require("./database");

const configDefault = { 
  fullscreen: false,
  volume: 7
}

let currentPage = 0;
let mainWindow;
let secondaryWindow;
const configPath = path.join(app.getPath("userData"), "config.json");

ipcMain.on('toMain', (event, msg) => {
  console.log('Message recu du renderer:', msg);
});

ipcMain.on("open-1-screen", () => {
  const allWindows = BrowserWindow.getAllWindows();
  for (const win of allWindows) {
    if (win !== mainWindow) {
      win.close();
    }
  }
});

ipcMain.on("open-2-screens", () => {
  createWindow2();
});

ipcMain.handle("nav-global", (event, value) => {
  currentPage = value.page;

  switch (value.screen) {
    case 'page-main':
      if(secondaryWindow){
        secondaryWindow.webContents.send("reload-page", value);
      }
      break;

    case 'page-2':
        mainWindow.webContents.send("reload-page", value);
      break
  }

});


ipcMain.handle("create-story", async (event, value) => {
  try {
    let result = await db.createStory(value);
    return result
  }
  catch (error) {
    console.error("erreur:", err);
    return {error: err.message}
  }
});

ipcMain.handle("get-volume", () => {
  return config.volume;
});

ipcMain.handle("get-fullscreen", () => {
  return config.fullscreen;
});

ipcMain.handle("get-page", () => {
  return currentPage;
});

ipcMain.handle("quit-app", () =>{
  app.quit();
})

ipcMain.handle("get-all-stories", async () => {
  let info = await db.getAllStories();
  return await info;
});

ipcMain.handle("get-ready-stories", async () => {
  let info = await db.getReadyStories();
  console.log(info);
  return await info;
});

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch {
    saveConfig(configDefault);
    return configDefault;
  }
}

function saveConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config));
}

const config = loadConfig();

function createWindowMain() {
  mainWindow = new BrowserWindow({
    width: 1280,
    minWidth: 900,
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

  mainWindow.loadFile('renderer/page-main.html');

  ipcMain.handle("set-fullscreen", (event, value) => {
    mainWindow.setFullScreen(value);
    config.fullscreen = value;
    saveConfig(config);
  });

  ipcMain.handle("set-volume", (event, value) => {
    config.volume = value;
    saveConfig(config);
  });

  mainWindow.on('closed', () => {
    app.quit();
  });
}

function createWindow2() {
  if (secondaryWindow) {
    secondaryWindow.focus();
    return;
  }

  secondaryWindow = new BrowserWindow({
    width: 600,
    minWidth: 450,
    height: 600,
    minHeight: 600,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets/favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  secondaryWindow.loadFile("renderer/page-2.html");

  secondaryWindow.on("closed", () => {
    secondaryWindow = null;
  });
}

app.whenReady().then(() =>{
  db.initializeDatabase();
  createWindowMain();
});
