const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (msg) => ipcRenderer.send('send-message', msg),
  selectImageFile: () => ipcRenderer.invoke("select-image-file"),
  getImageFolder: () => ipcRenderer.invoke("get-image-folder"),
  isFileExist: (file) => ipcRenderer.invoke("is-file-exist", file),
  getVERSION: () => ipcRenderer.invoke("get-version"),
  
  // page storys
  getReadyStorys: () => ipcRenderer.invoke("get-ready-storys"),
  getIdStory: () => ipcRenderer.invoke("get-id-story"),
  getStory: () => ipcRenderer.invoke("get-story"),
  getChapters: () => ipcRenderer.invoke("get-chapters"),
  getChapter: () => ipcRenderer.invoke("get-chapter"),
  getIdChapter: () => ipcRenderer.invoke("get-id-chapter"),
  getButtons: () => ipcRenderer.invoke("get-buttons"),
  
  // page création d'histoire
  updateImageChapter: (value) =>ipcRenderer.invoke("update-image-chapter", value),
  getAllStorys: () => ipcRenderer.invoke("get-all-storys"),
  createStory: (value) => ipcRenderer.invoke("create-story", value),
  updateStory: (value) => ipcRenderer.invoke("update-story", value),
  updateStoryName: (value) => ipcRenderer.invoke("update-story-name", value),
  updateStoryReady: (value) => ipcRenderer.invoke("update-story-ready", value),
  deleteStory: (value) => ipcRenderer.invoke("delete-story", value),
  createChapter: () => ipcRenderer.invoke("create-chapter"),
  updateChapter: (value) => ipcRenderer.invoke("update-chapter", value),
  updateChapterName: (value) => ipcRenderer.invoke("update-chapter-name", value),
  updateChapterTexte: (value) => ipcRenderer.invoke("update-chapter-texte", value),
  deleteChapter: (value) => ipcRenderer.invoke("delete-chapter", value),
  createButton: () => ipcRenderer.invoke("create-button"),
  updateButton: (value) => ipcRenderer.invoke("update-button", value),
  updateButtonName: (value) => ipcRenderer.invoke("update-button-name", value),
  updateButtonType: (value) => ipcRenderer.invoke("update-button-type", value),
  updateButtonNextChapter: (value) => ipcRenderer.invoke("update-button-next-chapter", value),
  deleteButton: (value) => ipcRenderer.invoke("delete-button", value),

  // navigation
  navGlobal: (value) => ipcRenderer.invoke("nav-global", value),
  reloadPage: (callback) => ipcRenderer.on("reload-page", (event, data) => callback(data)),
  getPage: () => ipcRenderer.invoke("get-page"),
  
  // options
  open1Screen: () => ipcRenderer.send("open-1-screen"),
  open2Screens: () => ipcRenderer.send("open-2-screens"),
  openMobileScreenQrcode: () => ipcRenderer.send("open-mobile-screen-qrcode"),
  getQrcodeMobile: () => ipcRenderer.invoke("get-qrcode-mobile"),
  setVolume: (value) => ipcRenderer.invoke("set-volume", value),
  getVolume: () => ipcRenderer.invoke("get-volume"),
  setFullscreen: (value) => ipcRenderer.invoke("set-fullscreen", value),
  getFullscreen: () => ipcRenderer.invoke("get-fullscreen"),
  getModeScreen: () => ipcRenderer.invoke("get-mode-screen"),
  setWifiName: (value) => ipcRenderer.invoke("set-wifi-name", value),
  getWifiName: () => ipcRenderer.invoke("get-wifi-name"),
  quitApp: () => ipcRenderer.invoke("quit-app"),
});
