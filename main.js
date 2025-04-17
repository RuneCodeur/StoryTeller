const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require("fs");
const path = require('path');
const db = require("./database");

const configDefault = { 
  fullscreen: false,
  volume: 7
}

let currentPage = 0;
let fileWindows = false;
let idStory = null;
let idChapter = null;
let mainWindow;
let secondaryWindow;
let modScreen = 1;

const imageFolder = path.join(app.getPath("userData"), "images");
const audioFolder = path.join(app.getPath("userData"), "audio");
const configPath = path.join(app.getPath("userData"), "config.json");

ipcMain.on('toMain', (event, msg) => {
  console.log('Message recu du renderer:', msg);
});

ipcMain.on("open-1-screen", () => {
  const allWindows = BrowserWindow.getAllWindows();
  for (const win of allWindows) {
    if (win !== mainWindow) {
      modScreen = 1;
      win.close();
    }
  }
});

ipcMain.on("open-2-screens", () => {
  modScreen = 2;
  createWindow2();
});

ipcMain.handle("nav-global", (event, value) => {
  currentPage = value.page;
  idStory = value.idStory;
  idChapter = value.idChapter;

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

ipcMain.handle("select-image-file", async () => {
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
  
});

ipcMain.handle("is-file-exist", async (event, file) => {
  if (fs.existsSync(file)) {
    return true;
  }
  return false;
});

ipcMain.handle("delete-image-chapter", async (event, value) => {
  try {
    await deleteImageChapter(idChapter);
    await db.deleteImageChapter(value);
  }
  catch (err) {
    console.error("erreur:", err);
    return {error: err.message}
  }
});

ipcMain.handle("update-image-chapter", async (event, file) => {
  try {

    if (!file || !file.filePath || !file.fileName || !idChapter || !idStory ) {
      return;
    }
    
    let newFileName = idStory + "-" + idChapter + "-" + Date.now() + path.extname(file.fileName);

    let destination = path.join(imageFolder, newFileName);
    fs.copyFileSync(file.filePath, destination);

    let value = {
      imageLink: newFileName,
      idChapter: idChapter
    }
    let result = await db.updateImageChapter(value);
    return result

  }
  catch (err) {
    console.error("erreur:", err);
    return {error: err.message}
  }
});

ipcMain.handle("create-story", async (event, value) => {
  try {
    let result = await db.createStory(value);
    return result
  }
  catch (err) {
    console.error("erreur:", err);
    return {error: err.message}
  }
});

ipcMain.handle("update-story", async (event, value) => {
  try {
    let result = await db.updateStory(value);
    return result
  }
  catch (err) {
    console.error("erreur:", err);
    return {error: err.message}
  }
});

ipcMain.handle("update-story-name", async (event, name) => {
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
});

ipcMain.handle("update-story-ready", async (event, ready) => {
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
});

ipcMain.handle("delete-story", async (event, value) => {
  try {

    let chapters = await db.getChapters(value);

    for (let i = 0; i < chapters.length; i++) {
      await deleteImageChapter(chapters[i].idchapter);
    }

    let result = await db.deleteStory(value);
    return result
  }
  catch (err) {
    console.error("erreur:", err);
    return {error: err.message}
  }
});

ipcMain.handle("create-chapter", async () => {
  try {
    let result = await db.createChapter(idStory);
    return result
  }
  catch (err) {
    console.error("erreur:", err);
    return {error: err.message}
  }
});

ipcMain.handle("update-chapter", async (event, value) => {
  try {
    let result = await db.updateChapter(value);
    return result
  }
  catch (err) {
    console.error("erreur:", err);
    return {error: err.message}
  }
});

ipcMain.handle("update-chapter-name", async (event, name) => {
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
});

ipcMain.handle("update-chapter-texte", async (event, texte) => {
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
});

ipcMain.handle("delete-chapter", async (event, value) => {
  try {
    let result = await db.deleteChapter(value);
    return result
  }
  catch (err) {
    console.error("erreur:", err);
    return {error: err.message}
  }
});

ipcMain.handle("create-button", async () => {
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
});

ipcMain.handle("update-button", async (event, value) => {
  try {
    let result = await db.updateButton(value);
    return result
  }
  catch (err) {
    console.error("erreur:", err);
    return {error: err.message}
  }
});

ipcMain.handle("update-button-name", async (event, value) => {
  try {
    let result = await db.updateButtonName(value);
    return result
  }
  catch (err) {
    console.error("erreur:", err);
    return {error: err.message}
  }
});

ipcMain.handle("update-button-type", async (event, value) => {
  try {
    let result = await db.updateButtonType(value);
    return result
  }
  catch (err) {
    console.error("erreur:", err);
    return {error: err.message}
  }
});

ipcMain.handle("update-button-next-chapter", async (event, value) => {
  try {
    let result = await db.updateButtonNextChapter(value);
    return result
  }
  catch (err) {
    console.error("erreur:", err);
    return {error: err.message}
  }
});

ipcMain.handle("delete-button", async (event, value) => {
  try {
    let result = await db.deleteButton(value);
    return result
  }
  catch (err) {
    console.error("erreur:", err);
    return {error: err.message}
  }
});

ipcMain.handle("get-image-folder", () => {
  return imageFolder;
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

ipcMain.handle("get-id-story", () => {
  return idStory;
});

ipcMain.handle("get-id-chapter", () => {
  return idChapter;
});

ipcMain.handle("get-story", async () => {
  let info = await db.getStory(idStory);
  return await info;
});

ipcMain.handle("get-chapters", async () => {
  let info = await db.getChapters(idStory);
  return await info;
});

ipcMain.handle("get-chapter", async () => {
  let info = await db.getChapter(idChapter);
  return await info;
});

ipcMain.handle("get-buttons", async () => {
  let info = await db.getButtons(idChapter);
  return await info;
});

ipcMain.handle("get-mode-screen", () => {
  return modScreen;
});

ipcMain.handle("quit-app", () =>{
  app.quit();
})

ipcMain.handle("get-all-storys", async () => {
  let info = await db.getAllStorys();
  return await info;
});

ipcMain.handle("get-ready-storys", async () => {
  let info = await db.getReadyStorys();
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

async function deleteImageChapter(idChapter){
  let chapter = await db.getImageChapter(idChapter);
    
  if (chapter.imagelink) {
    let oldImage = path.join(imageFolder, chapter.imagelink);
    if (fs.existsSync(oldImage)) {
        fs.unlinkSync(oldImage);
    }
  }
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

app.whenReady().then(() =>{
  db.initializeDatabase();
  createWindowMain();
});
