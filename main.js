require('dotenv').config({path:__dirname+'/build/.env'})

const { app, BrowserWindow, screen, nativeImage, ipcMain } = require("electron");
const SCREEN_WIDTH = 385;
function createWindow() { 
	const win = new BrowserWindow({
		width: SCREEN_WIDTH,
		height: SCREEN_WIDTH,
      title: "slack overlay",
		transparent: true,
		// titleBarStyle: "dark",
		alwaysOnTop: true,
      frame: false,
      name: "slack overlay",
      shadow: false,
      hasShadow: false,
		zoomToPageWidth: true,
      // border: 10,
		webPreferences: {
			nodeIntegration: true,
		},
	});

	const { width, height } = screen.getPrimaryDisplay().workAreaSize;
	win.setPosition(width - SCREEN_WIDTH, 0, true);

   ipcMain.on('collapse', (event, arg) => {

      if (arg){
         win.setPosition(width - SCREEN_WIDTH , 0, true);
         win.setSize(SCREEN_WIDTH, SCREEN_WIDTH, true);
      } else {
         win.setSize(SCREEN_WIDTH, height, true);
         win.setPosition(width - 20 , 0, true);
      }
    })
    
   win.loadFile("index.html");

   // DEBUGGING - dev tools
   // win.webContents.openDevTools()
}

// set icon for mac
const image = nativeImage.createFromPath(app.getAppPath() + "/build/icon.png");
app.dock.setIcon(image);
   
app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});
