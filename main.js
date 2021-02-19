// env vars
require("dotenv").config();

const { app, BrowserWindow, screen, nativeImage, shell } = require("electron");
const SCREEN_WIDTH = 600;
process.openExternal = shell.openExternal;

function createWindow() {
	const win = new BrowserWindow({
		width: SCREEN_WIDTH,
		height: 300,
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
	win.setPosition(width - SCREEN_WIDTH, 0);
   win.loadFile("index.html");

   // DEBUGGING - dev tools
   win.webContents.openDevTools()
}

// set icon for mac
const image = nativeImage
   .createFromPath(app.getAppPath() + "/build/icon.png");
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