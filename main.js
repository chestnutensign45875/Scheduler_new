const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile("index.html");
  // win.webContents.openDevTools(); // Optional: Keep for debug
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("run-scheduler", async (event, { slots, waitlist }) => {
  return new Promise((resolve, reject) => {
    const jsonInput = JSON.stringify({ slots, waitlist });

    let command;
    let args;

    // CHECK IF PACKAGED (Production vs Development)
    if (app.isPackaged) {
      // PRODUCTION: Use the compiled executable in the 'bin' folder
      // Determine executable name based on OS
      const execName =
        process.platform === "win32"
          ? "scheduler_bridge.exe"
          : "scheduler_bridge";

      // 'process.resourcesPath' points to the app's resources folder
      command = path.join(process.resourcesPath, "bin", execName);
      args = [jsonInput];
    } else {
      // DEVELOPMENT: Use python script directly
      command = "python3"; // Ensure python3 is in your PATH
      // On Windows dev, might need just 'python'
      if (process.platform === "win32") command = "python";
      args = ["scheduler_bridge.py", jsonInput];
    }

    console.log(`Running: ${command} with args len: ${args.length}`);

    const pythonProcess = spawn(command, args);

    let resultData = "";
    let errorData = "";

    pythonProcess.stdout.on("data", (data) => {
      resultData += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorData += data.toString();
      console.error(`Backend Log: ${data}`);
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        reject(`Process failed (Code ${code}): ${errorData}`);
      } else {
        try {
          resolve(JSON.parse(resultData));
        } catch (e) {
          reject(`Parse error: ${e.message} | Raw: ${resultData}`);
        }
      }
    });
  });
});
