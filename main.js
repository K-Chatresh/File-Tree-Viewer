const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    autoHideMenuBar: true, // Hides the menu bar (press Alt to show if needed)
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('tree_viewer.html');


  // Loads your HTML file in a standalone window
  win.loadFile('tree_viewer.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
