const { app, BrowserWindow, ipcMain, dialog, powerSaveBlocker } = require('electron');
const JSZip = require("jszip");
const fs = require("fs");
const path = require('path');
const db = require("./database");
const server = require('./server');
const QRCode = require('qrcode');
const VERSION = "2.1.1";
const id = powerSaveBlocker.start('prevent-display-sleep');

const configDefault = { 
  fullscreen: false,
  volume: 7,
  wifiName:'Mon Wifi',
  version: VERSION 
}

let currentPage = 0;
let fileWindows = false;
let idStory = null;
let idChapter = null;
let mainWindow;
let secondaryWindow;
let mobileSocket = null;
let modScreen = 1;
let inventory = [];
let life = 0;
let messageStory = '';

const imageFolder = path.join(app.getPath("userData"), "images");
const audioFolder = path.join(app.getPath("userData"), "audio");
const configPath = path.join(app.getPath("userData"), "config.json");
const bddPath = path.join(app.getPath("userData", "storyteller.db"));

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

    // maj du nb de point de vie
    if(value.life != undefined ){
      life = value.life;
    }

    // ajoute l'objet
    if(value.giveObject){
      functionMap.insertInvetory(value.giveObject);
    }

    // supprime l'objet
    if(value.deleteObject){
      functionMap.deleteInvetory(value.deleteObject);
    }

    if(value.messageStory){
      messageStory = value.messageStory;
    }

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

  initInventory: () => {
    inventory = [];
    return;
  },

  setLife: async (value) => {
      life = value;
    return;
  },

  insertInvetory: (value) =>{
    if(inventory.includes(value)){
      return inventory;
    }
    else{
      inventory.push(value);
    }
    return inventory;
  },

  updateButtonMessage: async (value) => {
     try {
      let result = await db.updateButtonMessage(value);
      return result;
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  deleteInvetory: (value) =>{
    let i = inventory.indexOf(value);
    if (i !== -1) {
      inventory.splice(i, 1);
    }
    return inventory;
  },

  getInventory: () =>{
    return inventory;
  },

  getLife: () =>{
    return life;
  },

  getMessageStory: () =>{
    return messageStory;
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

  selectStoryFile: async () =>{

    if(!fileWindows){
      fileWindows = true;
      let result = await dialog.showOpenDialog({
        title: "Importer une histoire",
        properties: ["openFile"],
        filters: [{ name: "Fichier StoryTeller", extensions: ["st"] }]
      });
      fileWindows = false;
  
      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }
    
      let filePath = result.filePaths[0];
      return filePath;
    }
    else{
      return;
    }
  },

  sanitizeNameST: async (title) =>{
    title = title.normalize("NFD");
    title = title.replace(/[\u0300-\u036f]/g, '');
    title = title.replace(/[^a-zA-Z0-9]/g, '_');
    title = title.replace(/_+/g, '_');
    title = title.replace(/^_|_$/g, '');
    title = title.toLowerCase();
    return title;
  },

  importStory: async () => {
    let filePath = await functionMap.selectStoryFile();
    if(filePath){
      const data = fs.readFileSync(filePath);
      const zip = await JSZip.loadAsync(data);
      const storyFile = zip.file('story.json');
      let storyData = null;
      let chaptersKey = {};
      let imagesKey = {};
      let objectsKey = {};

      if(storyFile) {
        const jsonContent = await storyFile.async('string');
        storyData = JSON.parse(jsonContent);

        let value = {
          name: storyData.title,
          rpgmode : 0,
        }

        if(storyData.type){
          value.rpgmode = storyData.type
        }
        
        if(storyData.rpgmode){
          value.rpgmode = storyData.rpgmode
        }

        let idStoryImport = await functionMap.createStory(value);
        idStory = idStoryImport;

        if(storyData.life != undefined){
          await functionMap.updateLifeStory(storyData.life);
        }

        // importation des objets
        if(storyData.objects){
          for (const key of Object.keys(storyData.objects)){
            if(storyData.objects[key]){
              
              let idObject = await functionMap.createObject(); ////////////// -> mettre en clé relationnel
              objectsKey[key] = idObject;

              let object = {
                name: storyData.objects[key].name,
                description: storyData.objects[key].description, 
                type: storyData.objects[key].type,
                idObject: idObject
              }
              await functionMap.updateObject(object);
            }
          }
        }
        
        // insertion des chapitres
        let init = true;
        for (const key of Object.keys(storyData.chapters)){
          let idChapterImport = 0;
          if(init){
            init = false;
            let chapters = await functionMap.getChapters();
            idChapterImport = chapters[0].idchapter;
          }
          else{
            idChapterImport = await functionMap.createChapter();
          }
          idChapter = idChapterImport;
          storyData.chapters[key].newId = idChapter;

          chaptersKey[key] = idChapter;
          let chapter = {
            name: storyData.chapters[key].name,
            texte: storyData.chapters[key].texte,
            idChapter: idChapter
          }
          await functionMap.updateChapter(chapter);
          
          if(storyData.chapters[key].imagelink){
            let newFileName = idStory + "-" + idChapter + "-" + Date.now() + path.extname(storyData.chapters[key].imagelink);
            
            imagesKey[storyData.chapters[key].imagelink] = {
              imagelink :newFileName,
              idChapter : idChapter
            }
            await db.updateImageChapter(imagesKey[storyData.chapters[key].imagelink]);
          }
        }

        // insertion des boutons
        for (const key of Object.keys(storyData.chapters)){
          idChapter = chaptersKey[key];
          for (let i = 0; i <  storyData.chapters[key].buttons.length; i++) {
            let idButton = await functionMap.createButton(idChapter);

            let button = {
              name : storyData.chapters[key].buttons[i].name,
              type : storyData.chapters[key].buttons[i].type,
              filelink : storyData.chapters[key].buttons[i].filelink,
              giveobject: null,
              requireobject: null,
              lostlife : 0,
              message: '',
              idButton : idButton
            }

            if(storyData.chapters[key].buttons[i].giveobject != undefined){
              let idGiveobject = null;
              if(objectsKey[storyData.chapters[key].buttons[i].giveobject]){
                idGiveobject = objectsKey[storyData.chapters[key].buttons[i].giveobject];
              }
              button.giveobject = idGiveobject;
            }
            
            if(storyData.chapters[key].buttons[i].requireobject != undefined){
              let idRequireobject = null;

              if(objectsKey[storyData.chapters[key].buttons[i].requireobject]){
                idRequireobject = objectsKey[storyData.chapters[key].buttons[i].requireobject];
              }
              button.requireobject = idRequireobject;
            }
            
            if(storyData.chapters[key].buttons[i].lostlife != undefined){
              button.lostlife = storyData.chapters[key].buttons[i].lostlife;
            }

            if(storyData.chapters[key].buttons[i].message != undefined){
              button.message = storyData.chapters[key].buttons[i].message;
            }

            if(chaptersKey[storyData.chapters[key].buttons[i].nextchapter]){
              button.nextChapter = chaptersKey[storyData.chapters[key].buttons[i].nextchapter]
            }

            await functionMap.updateButton(button);
          }
        }
        
        // insertion des texteffects
        for (const key of Object.keys(storyData.chapters)){
          idChapter = chaptersKey[key];
          if(storyData.chapters[key].texteffects){
            
            for (let i = 0; i <  storyData.chapters[key].texteffects.length; i++) {
              let idTexteffect = await functionMap.createTexteffect();

              let idObject = null;
              if(objectsKey[storyData.chapters[key].texteffects[i].idobject]){
                idObject = objectsKey[storyData.chapters[key].texteffects[i].idobject];
              }

              let texteffect = {
                texte : storyData.chapters[key].texteffects[i].texte,
                positive : storyData.chapters[key].texteffects[i].positive,
                idObject : idObject,
                idTexteffect : idTexteffect
              }

              await functionMap.updateTexteffect(texteffect);
            }
          }
        }

        // insertion des images
        let imagesFolder = await functionMap.getImageFolder();

        const imageFiles = Object.keys(zip.files).filter(filename =>
          filename.startsWith('images/') && !zip.files[filename].dir
        );

        for (const filename of imageFiles) {
          const file = zip.files[filename];
          const imageBuffer = await file.async('nodebuffer');
          const baseName = path.basename(filename);
          if(imagesKey[baseName]){
            const newFileName = imagesKey[baseName].imagelink;
            const destPath = path.join(imagesFolder, newFileName);

            fs.writeFileSync(destPath, imageBuffer);
            let value = {
              imageLink: newFileName,
              idChapter: imagesKey[baseName].idChapter
            }
            await db.updateImageChapter(value)
            console.log(`Image enregistrée : ${destPath}`);

          }
        }
      }
    }
    return;
  },

  exportStory : async (id) => {
    const zip = new JSZip();
    let story = await db.getStory(id);
    let imageFolder = await functionMap.getImageFolder();

    let histoire = {
      title: '',
      chapters : {},
      rpgmode : 0,
      life: 1
    };

    if(story){
      let fileName = await functionMap.sanitizeNameST(story.name);
      histoire.title = story.name;

      let chapters = await db.getAllChapters(id);

      if(story.rpgmode){
        let objects = await db.getObjects(id);
        histoire.rpgmode = story.rpgmode;
        histoire.life = story.life;
        histoire.objects = [];

        for (let i = 0; i < objects.length; i++) {
          histoire.objects[objects[i].idobject] = {};
          histoire.objects[objects[i].idobject].name = objects[i].name;
          histoire.objects[objects[i].idobject].description = objects[i].description;
          histoire.objects[objects[i].idobject].type = objects[i].type;
        }
      }
    
      for (let i = 0; i < chapters.length; i++) {
        let buttons = await db.getButtons(chapters[i].idchapter);

        histoire.chapters[chapters[i].idchapter] = {}
        histoire.chapters[chapters[i].idchapter].name = chapters[i].name;
        histoire.chapters[chapters[i].idchapter].texte = chapters[i].texte;
        histoire.chapters[chapters[i].idchapter].imagelink = chapters[i].imagelink;

        histoire.chapters[chapters[i].idchapter].buttons = [];
        for (let ib = 0; ib < buttons.length; ib++) {
          histoire.chapters[chapters[i].idchapter].buttons.push({
            name: buttons[ib].name,
            type: buttons[ib].type,
            filelink: buttons[ib].filelink,
            idchapter: buttons[ib].idchapter,
            nextchapter: buttons[ib].nextchapter,
            giveobject: buttons[ib].giveobject,
            requireobject: buttons[ib].requireobject,
            lostlife: buttons[ib].lostlife,
            message: buttons[ib].message
          });
        }

        if(story.rpgmode){
          let texteffects = await db.getTexteffects(chapters[i].idchapter);
            histoire.chapters[chapters[i].idchapter].texteffects = [];
           for (let it = 0; it < texteffects.length; it++) {
              histoire.chapters[chapters[i].idchapter].texteffects.push({
              texte: texteffects[it].texte,
              idobject: texteffects[it].idobject,
              positive: texteffects[it].positive,
            });
          }
        }

        if(chapters[i].imagelink){
          let imagePath = path.join(imageFolder, chapters[i].imagelink);
          let imageBuffer = fs.readFileSync(imagePath);
          zip.file("images/" + chapters[i].imagelink, imageBuffer);
        }
      }

      // histoire + chapitres + boutons
      zip.file("story.json", JSON.stringify(histoire, null, 2));

      // fenetre d'exportation
      const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        title: "Exporter l'histoire",
        defaultPath: fileName + '.st',
        filters: [
          { name: 'Fichier StoryTeller', extensions: ['st'] }
        ]
      });

      if (canceled || !filePath) {
        return;
      }

      const content = await zip.generateAsync({ type: "nodebuffer" });
      fs.writeFileSync(filePath, content);
      console.log("Fichier enregistré :", filePath);
    }
  },

  createStory: async (value) => {
    try {
      let result = await db.createStory(value);
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

  updateModeStory: async (mode) => {
    try {
      let value = {
        mode: mode,
        idStory: idStory
      }
      let result = await db.updateModeStory(value);
      return result
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  updateLifeStory: async (life) => {
    try {
      let value = {
        life: life,
        idStory: idStory
      }
      let result = await db.updateLifeStory(value);
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

  deleteObject: async (value) => {
    try {
      let result = await db.deleteObject(value);
      return result
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  createObject: async () => {
    try {
      let result = await db.createObject(idStory);
      return result
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  createTexteffect: async () => {
    try {
      let value= {
        idStory: idStory,
        idChapter: idChapter
      }
      let result = await db.createTexteffect(value);
      return result
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  updateTexteTexteffect: async (value) => {
    try {
      let result = await db.updateTexteTexteffect(value);
      return result
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  updatePositiveTexteffect: async (value) => {
    try {
      let result = await db.updatePositiveTexteffect(value);
      return result
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  updateObjectTexteffect: async (value) => {
    try {
      let result = await db.updateObjectTexteffect(value);
      return result
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  deleteTexteffect: async (idTexteffect) => {
    try {
      let result = await db.deleteTexteffect(idTexteffect);
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

  updateObjectDescription: async (value) => {
    try {
      let result = await db.updateObjectDescription(value);
      return result
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  updateObjectType: async (value) => {
    try {
      let result = await db.updateObjectType(value);
      return result
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  updateObjectName: async (value) => {
    try {
      let result = await db.updateObjectName(value);
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

  createButton: async (value) => {
    try {
      let button = {
        idStory: idStory,
        idChapter: idChapter,
        nextchapter: value
      }
      let result = await db.createButton(button);
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

  updateTexteffect: async (value) => {
    try {
      let result = await db.updateTexteffect(value);
      return result
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  updateObject : async (value) => {
    try {
      let result = await db.updateObject(value);
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

  updateButtonLostLife: async (value) => {
    try {
      let result = await db.updateButtonLostLife(value);
      return result
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  updateButtonRequireObject: async (value) => {
    try {
      let result = await db.updateButtonRequireObject(value);
      return result
    }
    catch (err) {
      console.error("erreur:", err);
      return {error: err.message}
    }
  },

  updateButtonGiveObject: async (value) => {
    try {
      let result = await db.updateButtonGiveObject(value);
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
    fs.mkdirSync(imageFolder, { recursive: true });
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

  getTexteffects: async () => {
    let info = await db.getTexteffects(idChapter);
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

  getButton: async (value) => {
    let info = await db.getButton(value);
    return info;
  },

  getObjects: async () => {
    let info = await db.getObjects(idStory);
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

ipcMain.handle("init-inventory", async () => {
  return functionMap.initInventory();
});

ipcMain.handle("set-life", async (event, value) => {
  return functionMap.setLife(value);
});

ipcMain.handle("get-inventory", async () => {
  return functionMap.getInventory();
});

ipcMain.handle("get-life", async () => {
  return functionMap.getLife();
});

ipcMain.handle("get-message-story", async () => {
  return functionMap.getMessageStory();
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


ipcMain.handle('import-story', async () => {
  await functionMap.importStory();
  return;
});

ipcMain.handle('export-story', () => {
  if(idStory){
    functionMap.exportStory(idStory);
  }
  return;
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

ipcMain.handle("update-life-story", async (event, life) => {
  return functionMap.updateLifeStory(life);
});

ipcMain.handle("update-mode-story", async (event, mode) => {
  return functionMap.updateModeStory(mode);
});

ipcMain.handle("update-story-ready", async (event, ready) => {
  return functionMap.updateStoryReady(ready);
});

ipcMain.handle("delete-story", async (event, value) => {
  return functionMap.deleteStory(value);
});

ipcMain.handle("delete-object", async (event, value) => {
  return functionMap.deleteObject(value);
});

ipcMain.handle("create-object", async () => {
  return functionMap.createObject();
});

ipcMain.handle("create-texteffect", async () => {
  return functionMap.createTexteffect();
});

ipcMain.handle("update-texte-texteffect", async (event, value) => {
  return functionMap.updateTexteTexteffect(value);
});

ipcMain.handle("update-positive-texteffect", async (event, value) => {
  return functionMap.updatePositiveTexteffect(value);
});

ipcMain.handle("update-object-texteffect", async (event, value) => {
  return functionMap.updateObjectTexteffect(value);
});

ipcMain.handle("delete-texteffect", async (event, value) => {
  return functionMap.deleteTexteffect(value);
});

ipcMain.handle("create-chapter", async () => {
  return functionMap.createChapter();
});

ipcMain.handle("update-chapter", async (event, value) => {
  return functionMap.updateChapter(value);
});

ipcMain.handle("update-object-description", async (event, value) => {
  return functionMap.updateObjectDescription(value);
});

ipcMain.handle("update-object-type", async (event, value) => {
  return functionMap.updateObjectType(value);
});

ipcMain.handle("update-object-name", async (event, value) => {
  return functionMap.updateObjectName(value);
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

ipcMain.handle("create-button", async (event, value) => {
  return functionMap.createButton(value);
});

ipcMain.handle("update-button-message", async (event, value) => {
  return functionMap.updateButtonMessage(value);
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

ipcMain.handle("update-button-lostlife", async (event, value) => {
  return functionMap.updateButtonLostLife(value);
});

ipcMain.handle("update-button-requireobject", async (event, value) => {
  return functionMap.updateButtonRequireObject(value);
});

ipcMain.handle("update-button-giveobject", async (event, value) => {
  return functionMap.updateButtonGiveObject(value);
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

ipcMain.handle("get-texteffects", async () => {
  return functionMap.getTexteffects();
});


ipcMain.handle("get-chapter", async () => {
  return functionMap.getChapter();
});

ipcMain.handle("get-buttons", async () => {
  return functionMap.getButtons();
});

ipcMain.handle("get-button", async (event, value) => {
  return functionMap.getButton(value);
});

ipcMain.handle("get-objects", async () => {
  return functionMap.getObjects();
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
  if(!config || !config.version || config.version != configDefault.version){

    db.MAJDATAbase();
    config.version = configDefault.version;
    saveConfig(config)
  }

  db.initializeDatabase();
  createWindowMain();
});
