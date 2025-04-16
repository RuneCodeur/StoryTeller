const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (msg) => ipcRenderer.send('toMain', msg),
  
  // page storys
  getReadyStorys: () => ipcRenderer.invoke("get-ready-storys"),
  getStory: (value) => ipcRenderer.invoke("get-story", value),
  getChapters: () => ipcRenderer.invoke("get-chapters"),
  getIdStory:() => ipcRenderer.invoke("get-id-story"),
  getIdChapter:() => ipcRenderer.invoke("get-id-chapter", value),
  
  // page création d'histoire
  getAllStorys: () => ipcRenderer.invoke("get-all-storys"),
  createStory: (value) => ipcRenderer.invoke("create-story", value),
  updateStory: (value) => ipcRenderer.invoke("update-story", value),
  deleteStory: (value) => ipcRenderer.invoke("delete-story", value),
  createChapter: () => ipcRenderer.invoke("create-chapter"),
  updateChapter: (value) => ipcRenderer.invoke("update-chapter", value),
  deleteChapter: (value) => ipcRenderer.invoke("delete-chapter", value),

  // navigation
  navGlobal: (value) => ipcRenderer.invoke("nav-global", value),
  reloadPage: (callback) => ipcRenderer.on("reload-page", (event, data) => callback(data)),
  getPage: () => ipcRenderer.invoke("get-page"),
  
  // options
  open1Screen: () => ipcRenderer.send("open-1-screen"),
  open2Screens: () => ipcRenderer.send("open-2-screens"),
  setVolume: (value) => ipcRenderer.invoke("set-volume", value),
  getVolume: () => ipcRenderer.invoke("get-volume"),
  setFullscreen: (value) => ipcRenderer.invoke("set-fullscreen", value),
  getFullscreen: () => ipcRenderer.invoke("get-fullscreen"),
  quitApp: () => ipcRenderer.invoke("quit-app"),
});
