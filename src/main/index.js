import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { dialog } from 'electron';

const isPackaged = app.isPackaged;
let mainWindow

function createWindow() {
  // Create the browser window.
   mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      devTools: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    mainWindow.webContents.openDevTools();
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  startMouseMovementDetectionwin()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
let mouseDetectionWin;
function startMouseMovementDetectionwin() {
  console.log(isPackaged);
  
  let pythonScriptPath;

  if (isPackaged) {
    pythonScriptPath = process.platform === "win32" 
    ? path.join(process.resourcesPath, 'extraResources', 'MouseTracker.exe')
    : path.join(process.resourcesPath, 'mousemac'); 
  } else {
    pythonScriptPath = process.platform === "win32"
      ? "./MouseTracker.exe"
      : "./resources/mousemac";
  }

  if (!fs.existsSync(pythonScriptPath)) {
    dialog.showErrorBox("Error", "MouseTracker.exe file not found.");
    return;
  }

  mouseDetectionWin = spawn(pythonScriptPath);

  mouseDetectionWin.stdout.on("data", (data) => {
    if (data && mouseDetectionWin) {
      console.log("Mouse move detected.");
      mainWindow.webContents.send("idletime", Date.now());
    }
  });

  mouseDetectionWin.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
    handleStderr(data);
  });

  mouseDetectionWin.on("close", (code) => {
    console.log(`Child process exited with code ${code}`);
    if (code !== 0) {
      handleExitCode(code);
    }
  });
}

function handleStderr(data) {
  const errorMessage = data.toString();
  if (errorMessage.includes("This process is not trusted")) {
    const detailedMessage = "Please grant accessibility permissions to this app in your system settings under 'Security & Privacy'.";
    dialog.showErrorBox("Accessibility Permission Needed", detailedMessage);
    openSystemPreferences();
  } else {
    dialog.showErrorBox("Mouse Tracker Error", `Error detected: ${errorMessage}`);
  }
  logErrorToFile(errorMessage);
}

function openSystemPreferences() {
  // Command to open System Preferences directly to the Accessibility pane
  const { exec } = require('child_process');
  exec('open "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"', (err) => {
    if (err) {
      console.error('Failed to open system preferences:', err);
    }
  });
}


function handleExitCode(code) {
  dialog.showErrorBox("Error", `Mouse Tracker exited unexpectedly with code ${code}`);
  // Trigger cleanup or restart based on exit code
}

function logErrorToFile(message) {
  const fs = require('fs');
  const path = require('path');
  const logFilePath = path.join(__dirname, 'error.log');
  fs.appendFile(logFilePath, `${new Date().toISOString()}: ${message}\n`, (err) => {
    if (err) console.error('Failed to log error:', err);
  });
}
