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

      switch (arg){
         case "initial":
            win.setPosition(width - SCREEN_WIDTH , 0, true);
            win.setSize(SCREEN_WIDTH, SCREEN_WIDTH, true);
            break;
         case "swipped":
            win.setSize(SCREEN_WIDTH, height, true);
            win.setPosition(width - 20 , 0, true);
            break;
         case "side":
            win.setSize(SCREEN_WIDTH, height, true);
            win.setPosition(width - SCREEN_WIDTH , 0, true);
            break;
         case "corner":
            win.setSize(203, 24, true);
            win.setPosition(width - 21 , 150, true);
            break;
         default: console.warning( "DEFAULTED switch on main.js:42")
      }

    })
    
   win.loadFile("index.html");

   // DEBUGGING - dev tools
   win.webContents.openDevTools()
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
