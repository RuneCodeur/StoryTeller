const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (msg) => ipcRenderer.send('toMain', msg),
  
  
  navGlobal: (value) => ipcRenderer.invoke("nav-global", value),
  reloadPage: (callback) => ipcRenderer.on("reload-page", (event, data) => callback(data)),
  getPage: () => ipcRenderer.invoke("get-page"),
  
  open1Screen: () => ipcRenderer.send("open-1-screen"),
  open2Screens: () => ipcRenderer.send("open-2-screens"),
  setVolume: (value) => ipcRenderer.invoke("set-volume", value),
  getVolume: () => ipcRenderer.invoke("get-volume"),
  setFullscreen: (value) => ipcRenderer.invoke("set-fullscreen", value),
  getFullscreen: () => ipcRenderer.invoke("get-fullscreen"),
  quitApp: () => ipcRenderer.invoke("quit-app"),
});
