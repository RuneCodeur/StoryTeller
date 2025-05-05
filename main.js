const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require("fs");
const path = require('path');
const db = require("./database");
const server = require('./server');
const QRCode = require('qrcode');
const VERSION = "1.0.1";

const configDefault = { 
  fullscreen: false,
  volume: 7,
  wifiName:'Mon Wifi',
}

let currentPage = 0;
let fileWindows = false;
let idStory = null;
let idChapter = null;
let mainWindow;
let secondaryWindow;
let mobileSocket = null;
let modScreen = 1;

const imageFolder = path.join(app.getPath("userData"), "images");
const audioFolder = path.join(app.getPath("userData"), "audio");
const configPath = path.join(app.getPath("userData"), "config.json");

const functionMap = {

  sendMessage: (msg) => {
    console.log('Message recu du renderer:', msg);
  },

  getVersion: () => {
    return VERSION;
  },

  getPage: () => {
    let value = {
      page: currentPage,
      story: idStory,
      chapter: idChapter
    }
    return value;
  },

  getModeScreen: () => {
    return modScreen;
  },

  getFullscreen: () => {
    return config.fullscreen;
  },

  getVolume: () => {
    return config.volume;
  },

  getWifiName: () => {
    return config.wifiName;
  },

  navGlobal: (value) => {
    currentPage = value.page;
    idStory = value.idStory;
    idChapter = value.idChapter;

    switch (value.screen) {
      case 'page-main':
        if(secondaryWindow){
          if (secondaryWindow && !secondaryWindow.isDestroyed()) {
            secondaryWindow.webContents.send("reload-page", value);
          }
        }
        if(mobileSocket){
          mobileSocket.emit('reload-page', value);
        }
        break;

      case 'page-2':
        mainWindow.webContents.send("reload-page", value);
        if(mobileSocket){
          mobileSocket.emit('reload-page', value);
        }
        break
      
      case 'page-mobile':
        mainWindow.webContents.send("reload-page", value);
        secondaryWindow.webContents.send("reload-page", value);
    }
  },

  setWifiName: (value) => {
    config.wifiName = value;
    saveConfig(config);
  },

  setVolume: (volume) => {
    config.volume = volume;
    saveConfig(config);
  },

  open1Screen: () => {
    const allWindows = BrowserWindow.getAllWindows();
    for (const win of allWindows) {
      if (win !== mainWindow) {
        modScreen = 1;
        win.close();
      }
    }
  },

  open2Screen: () => {
    modScreen = 2;
    createWindow2();
  },

  openMobileScreenQrcode: async () => {
    await createServer();
    createWindow2();
  },

  selectImageFile: async () => {
    if(!fileWindows){
      fileWindows = true;
      let result = await dialog.showOpenDialog({
        title: "Choisir une image",
        properties: ["openFile"],
        filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg"] }]
      });
      fileWindows = false;
  
      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }
    
      let filePath = result.filePaths[0];
      let fileName = path.basename(filePath);
    
      return { filePath, fileName };
    }
    else{
      return;
    }  
  },

  isFileExist: (file) => {
    if (fs.existsSync(file)) {
      return true;
    }
    return false;
  },

  deleteImageChapter: async (file) => {
    try {
      
      if (file) {
        let oldImage = path.join(imageFolder, file);
        if (fs.existsSync(oldImage)) {
            fs.unlinkSync(oldImage);
        }
      }
      await db.deleteImageChapter(file);
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  updateImageChapter: async (file) => {
    try {

      if (!file || !file.filePath || !file.fileName || !idChapter || !idStory ) {
        return;
      }
      
      let newFileName = idStory + "-" + idChapter + "-" + Date.now() + path.extname(file.fileName);
      let chapter = await db.getImageChapter(idChapter);
  
      let destination = path.join(imageFolder, newFileName);
      fs.copyFileSync(file.filePath, destination);
  
      let image = {
        imageLink: newFileName,
        idChapter: idChapter
      }

      if(chapter.imagelink){
        await functionMap.deleteImageChapter(chapter.imagelink);
      }

      let result = await db.updateImageChapter(image);
      return result
  
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  createStory: async (name) => {
    try {
      let result = await db.createStory(name);
      return result
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  updateStory: async (story) => {
    try {
      let result = await db.updateStory(story);
      return result
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  updateStoryName: async (name) => {
    try {
      let value = {
        name: name,
        idStory: idStory
      }
      let result = await db.updateStoryName(value);
      return result
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },
  
  updateStoryReady: async (ready) => {
    try {
      let value = {
        isReady: ready,
        idStory: idStory
      }
      let result = await db.updateStoryReady(value);
      return result
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  deleteStory: async (value) => {
    try {

      let chapters = await db.getChapters(value);
  
      for (let i = 0; i < chapters.length; i++) {
        if(chapters[i].imagelink){
          await functionMap.deleteImageChapter(chapters[i].imagelink);
        }
      }
  
      let result = await db.deleteStory(value);
      return result
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  createChapter: async () => {
    try {
      let result = await db.createChapter(idStory);
      return result
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  updateChapter: async (value) => {
    try {
      let result = await db.updateChapter(value);
      return result
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  updateChapterName: async (name) => {
    try {
      let value = {
        name: name,
        idChapter: idChapter
      }
      let result = await db.updateChapterName(value);
      return result
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  updateChapterTexte: async (texte) => {
    try {
      let value = {
        texte: texte,
        idChapter: idChapter
      }
      let result = await db.updateChapterTexte(value);
      return result
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  deleteChapter: async (value) => {
    try {
      let chapter = await db.getImageChapter(value);
      if(chapter.imagelink){
        await functionMap.deleteImageChapter(chapter.imagelink);
      }

      let result = await db.deleteChapter(value);
      return result
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  createButton: async () => {
    try {
      let value = {
        idStory: idStory,
        idChapter: idChapter
      }
      let result = await db.createButton(value);
      return result
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  updateButton: async (value) => {
    try {
      let result = await db.updateButton(value);
      return result
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  updateButtonName: async (value) => {
    try {
      let result = await db.updateButtonName(value);
      return result
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  updateButtonType: async (value) => {
    try {
      let result = await db.updateButtonType(value);
      return result
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  updateButtonNextChapter: async (value) => {
    try {
      let result = await db.updateButtonNextChapter(value);
      return result
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  deleteButton: async (value) => {
    try {
      let result = await db.deleteButton(value);
      return result
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  getImageFolder: async () => {
    return imageFolder;
  },

  getQrcodeMobile: async () => {
    if(modScreen == 3){
      const url = server.getLocalIpAddress() + '/mobile';
      try {
          const qrDataURL = await QRCode.toDataURL(url);
          return qrDataURL;
      } catch (err) {
          console.error("Erreur QR Code :", err);
          return null;
      }
    }
    return '';
  },

  getIdStory: async () => {
    return idStory;
  },

  getIdChapter: async () => {
    return idChapter;
  },

  getStory: async () => {
    let info = await db.getStory(idStory);
    return info;
  },

  getChapters: async () => {
    let info = await db.getChapters(idStory);
    return info;
  },

  getChapter: async () => {
    let info = await db.getChapter(idChapter);
    return info;
  },

  getButtons: async () => {
    let info = await db.getButtons(idChapter);
    return info;
  },

  quitApp: async () => {
    let allWindows = BrowserWindow.getAllWindows();
    for (let win of allWindows) {
      win.removeAllListeners('close');
      win.close();
    }
    setTimeout(() => {
      app.quit(); 
    }, 200);
  },

  getAllStorys: async () => {
    let info = await db.getAllStorys();
    return await info;
  },

  getReadyStorys: async () => {
    let info = await db.getReadyStorys();
    return await info;
  },

  setFullscreen: async (value) => {
    mainWindow.setFullScreen(value);
    config.fullscreen = value;
    saveConfig(config);
  },
}

ipcMain.on('send-message', (event, msg) => {
  functionMap.sendMessage(msg);
});

ipcMain.on("open-1-screen", () => {
  functionMap.open1Screen();
});

ipcMain.on("open-2-screens", () => {
  functionMap.open2Screen();
});

ipcMain.handle("get-version", () => {
  return functionMap.getVersion();
})

ipcMain.on('open-mobile-screen-qrcode', async () => {
  await functionMap.openMobileScreenQrcode();
});

ipcMain.handle("nav-global", (event, value) => {
  functionMap.navGlobal(value);
});

ipcMain.handle("select-image-file", async () => {
  return functionMap.selectImageFile();
});

ipcMain.handle("is-file-exist", async (event, file) => {
  return functionMap.isFileExist(file);
});


ipcMain.handle("update-image-chapter", async (event, file) => {
  return functionMap.updateImageChapter(file);
});

ipcMain.handle("create-story", async (event, value) => {
  return functionMap.createStory(value);
});

ipcMain.handle("update-story", async (event, value) => {
  return functionMap.updateStory(value);
});

ipcMain.handle("update-story-name", async (event, name) => {
  return functionMap.updateStoryName(name);
});

ipcMain.handle("update-story-ready", async (event, ready) => {
  return functionMap.updateStoryReady(ready);
});

ipcMain.handle("delete-story", async (event, value) => {
  return functionMap.deleteStory(value);
});

ipcMain.handle("create-chapter", async () => {
  return functionMap.createChapter();
});

ipcMain.handle("update-chapter", async (event, value) => {
  return functionMap.updateChapter(value);
});

ipcMain.handle("update-chapter-name", async (event, name) => {
  return functionMap.updateChapterName(name);
});

ipcMain.handle("update-chapter-texte", async (event, texte) => {
  return functionMap.updateChapterTexte(texte);
});

ipcMain.handle("delete-chapter", async (event, value) => {
  return functionMap.deleteChapter(value);
});

ipcMain.handle("create-button", async () => {
  return functionMap.createButton();
});

ipcMain.handle("update-button", async (event, value) => {
  return functionMap.updateButton(value);
});

ipcMain.handle("update-button-name", async (event, value) => {
  return functionMap.updateButtonName(value);
});

ipcMain.handle("update-button-type", async (event, value) => {
  return functionMap.updateButtonType(value);
});

ipcMain.handle("update-button-next-chapter", async (event, value) => {
  return functionMap.updateButtonNextChapter(value);
});

ipcMain.handle("delete-button", async (event, value) => {
  return functionMap.deleteButton(value);
});

ipcMain.handle("get-image-folder", () => {
  return functionMap.getImageFolder();
});

ipcMain.handle("get-qrcode-mobile", async () => {
  return functionMap.getQrcodeMobile();
});

ipcMain.handle("get-volume", () => {
  return functionMap.getVolume();
});

ipcMain.handle("get-wifi-name", () => {
  return functionMap.getWifiName();
});

ipcMain.handle("get-fullscreen", () => {
  return functionMap.getFullscreen();
});

ipcMain.handle("get-page", () => {
  return functionMap.getPage();
});

ipcMain.handle("get-id-story", () => {
  return functionMap.getIdStory();
});

ipcMain.handle("get-id-chapter", () => {
  return functionMap.getIdChapter();
});

ipcMain.handle("get-story", async () => {
  return functionMap.getStory();
});

ipcMain.handle("get-chapters", async () => {
  return functionMap.getChapters();
});

ipcMain.handle("get-chapter", async () => {
  return functionMap.getChapter();
});

ipcMain.handle("get-buttons", async () => {
  return functionMap.getButtons();
});

ipcMain.handle("get-mode-screen", () => {
  return functionMap.getModeScreen();
});

ipcMain.handle("quit-app", () =>{
  return functionMap.quitApp();
})

ipcMain.handle("get-all-storys", async () => {
  return functionMap.getAllStorys();
});

ipcMain.handle("get-ready-storys", async () => {
  return functionMap.getReadyStorys();
});

ipcMain.handle("set-fullscreen", (event, value) => {
  return functionMap.setFullscreen(value);
});

ipcMain.handle("set-wifi-name", (event, value) => {
  functionMap.setWifiName(value);
});

ipcMain.handle("set-volume", (event, value) => {
  functionMap.setVolume(value);
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

if (!fs.existsSync(imageFolder)) {
  fs.mkdirSync(imageFolder);
}

function createWindowMain() {
  mainWindow = new BrowserWindow({
    width: 1280,
    minWidth: 900,
    height: 720,
    minHeight: 620,
    resizable: true,
    fullscreen: config.fullscreen,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets/favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      webSecurity: false
    }
  });

  mainWindow.loadFile('renderer/page-main.html');

  

  mainWindow.on('close', (e) => {
    e.preventDefault();
    const allWindows = BrowserWindow.getAllWindows();
    for (const win of allWindows) {
      win.removeAllListeners('close');
      win.close();
    }
    setTimeout(() => {
      app.quit(); 
    }, 200);
  });
}

function createWindow2() {
  if (secondaryWindow) {
    secondaryWindow.focus();
    return;
  }

  secondaryWindow = new BrowserWindow({
    width: 600,
    minWidth: 475,
    height: 600,
    minHeight: 600,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets/favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      webSecurity: false
    },
  });

  secondaryWindow.loadFile("renderer/page-2.html");

  secondaryWindow.on("closed", () => {

    if(modScreen == 3){
      server.stopServer();
    }

    modScreen = 1;
    secondaryWindow = null;

    let value = {
      page: currentPage,
      idStory: idStory,
      idChapter: idChapter,
    }
    mainWindow.webContents.send("reload-page", value);
  });
}

function createServer(){

  if(modScreen !== 3){
    server.startServer();
    modScreen = 3;
  }

  server.io.on('connection', (socket) => {
    mobileSocket = socket;

    socket.on('fromMobile', async (data, callback) => {

      mainWindow.focus();
      const { route, value} = data;
      if (typeof functionMap[route] === 'function') {
        try {
          const result = await functionMap[route](value);

          if (callback) {
            callback({ success: true, result });
          }
        }
        catch (err) {
          console.error('Erreur pendant l\'execution de la fonction :', err);

          if (callback) {
            callback({ success: false, error: err.message });
          }
        }
      }

      else {
        console.warn(`Fonction "${route}" non trouvee.`);
        if (callback) {
          callback({ success: false, error: 'Fonction inconnue' });
        }
      }
    });

    socket.emit('fromServer', { message: 'Connexion OK' });
  });
}

app.whenReady().then(() =>{
  db.initializeDatabase();
  createWindowMain();
});
