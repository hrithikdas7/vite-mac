import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { startDetection, stopDetection, getInteractionTimestamps, resetInteractionTimeStampsForActivity } from './InputDetection'
import takeScreenshot from './CronJobs'
import cron from 'node-cron'
import { calculateActivityPercentage, calculateIdleTime } from './ActivityAnalyser'
import Dialog from 'electron-dialog';

const isPackaged = app.isPackaged
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
    mainWindow.webContents.openDevTools()
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

  // startMouseMovementDetectionwin()

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

//Logicss

const handleScreenshot = async () => {
  try {
    const dataURL = await takeScreenshot()
    // console.log('Screenshot taken:', dataURL);
  } catch (error) {
    console.error('Failed to take screenshot:', error)
  }
}

let Cronjob


ipcMain.on('startdetection', () => {
  startDetection('mouse')
  startDetection('keyboard')
  Cronjob =  cron.schedule('* * * * *', () => {
    console.log('running a task every minute')
    const activityArr = getInteractionTimestamps()
    const currenttimestamp = Date.now()
    const idleTime = calculateIdleTime(activityArr?.interactionTimestamps, currenttimestamp)
    idleTime > 0 ? dialog.showMessageBox({
      title: 'Hello',
      message: 'idle alert',
      buttons: ['OK']
    }) :
    console.log(idleTime, "idletime")
    const activityPersent = calculateActivityPercentage(activityArr?.interactionActivityTimestamps, 60)
    console.log(activityPersent, "activity persentage")
    handleScreenshot()
    resetInteractionTimeStampsForActivity()
  })
})

ipcMain.on('stopdetection', () => {
  Cronjob.stop()
  stopDetection('mouse')
  stopDetection('keyboard')
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
