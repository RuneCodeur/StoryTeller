const { app, BrowserWindow } = require('electron');
const path = require('path');
const { ipcMain } = require('electron');

ipcMain.on('toMain', (event, msg) => {
  console.log('Message reçu du renderer:', msg);
});

function createWindows() {
  const mainWindow = new BrowserWindow({
    show: false,
    width: 1280,
    height: 720,
    resizable: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });

  mainWindow.loadFile('renderer/main.html');
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  })
  mainWindow.setMinimumSize(1024, 600);
}

app.whenReady().then(createWindows);
