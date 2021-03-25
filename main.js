require('dotenv').config({path:__dirname+'/build/.env'})

const { app, BrowserWindow, screen, nativeImage, ipcMain } = require("electron");
const SCREEN_WIDTH = 385;
let visibility = true;

function createWindow() { 
	const win = new BrowserWindow({
		width: SCREEN_WIDTH,
		height: SCREEN_WIDTH,
      title: "slack overlay",
		transparent: true,
		alwaysOnTop: true,
      frame: false,
      shadow: false,
      hasShadow: false,
      name: "slack overlay",
		zoomToPageWidth: true,
      // roundedCorners: false,
      // border: 10,
		webPreferences: {
			nodeIntegration: true,
		},
	});

   const { width, height } = screen.getPrimaryDisplay().size;
   
   windowWidth  = width;
   windowHeight = height;

   // get displays
   let displays = screen.getAllDisplays()
   externalDisplay = displays.find((display) => {
     return display.bounds.x !== 0 || display.bounds.y !== 0
   })

   if (externalDisplay) { 
      visiblePositioning = () => win.setPosition(externalDisplay.size.width -SCREEN_WIDTH, windowHeight , true);
      hiddenPositioning = () => win.setPosition(externalDisplay.size.width - 8, windowHeight , true);
   } 
   else { 
      visiblePositioning = () => win.setPosition(width - SCREEN_WIDTH, 0, true);
      hiddenPositioning = () => win.setSize(SCREEN_WIDTH, SCREEN_WIDTH, true);
   }
      

	visiblePositioning()

   ipcMain.on('collapse', (event, arg) => {
      visibility = !visibility;
      visibility 
         ? visiblePositioning()
         : hiddenPositioning();
      

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
