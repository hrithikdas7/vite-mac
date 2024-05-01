import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { dialog, app } from 'electron'

const isPackaged = app.isPackaged
const processes = {} // This will track each spawned process by type

let interactionTimestamps = []
let detectionStatus = false
export function getInteractionTimestamps() {
  return interactionTimestamps.slice()
}

// Helper function to check if the executable exists
function checkExecutableExists(executablePath) {
  if (!fs.existsSync(executablePath)) {
    dialog.showErrorBox('Error', `${executablePath}`)
    // dialog.showErrorBox("Error", `${path.basename(executablePath)} file not found.`);
    return false
  }
  return true
}

// Handles data from the process's stdout
function handleData(data, type) {
  if (data && detectionStatus) {
    const timestamp = new Date()
    const foridletimeChecker = timestamp.getTime()
    const newEntry = {
      time: foridletimeChecker,
      type: type // 'mouse' or 'keyboard'
    }

    interactionTimestamps.push(newEntry)
    console.log(interactionTimestamps, 'interaction timestamps')

    // You can re-enable and adjust this logic if needed
    // if (interactionTimestamps.length > idleCalctimeinSeconds) {
    //   interactionTimestamps.shift();
    // }
  }
}

// Main function to start detection
export function startDetection(detectionType) {
  detectionStatus = true
  const baseFilename =
    detectionType === 'mouse' ? 'resources/MouseTracker' : 'resources/Keyboardtracker'
  const macFilename = detectionType === 'mouse' ? './resources/mousemac' : './resources/keyboardmac'
  let executablePath

  if (isPackaged) {
    executablePath =
      process.platform === 'win32'
        ? path.join(process.resourcesPath, 'app.asar.unpacked', `${baseFilename}.exe`)
        : path.join(process.resourcesPath, macFilename)
  } else {
    executablePath = process.platform === 'win32' ? `./${baseFilename}.exe` : `./${macFilename}`
  }

  if (!checkExecutableExists(executablePath)) return

  processes[detectionType] = spawn(executablePath)

  processes[detectionType].stdout.on('data', (data) => handleData(data, detectionType))
  processes[detectionType].stderr.on('data', (data) => {
    console.error(`stderr: ${data}`)
    dialog.showErrorBox('Error', `${data}`)
  })
  processes[detectionType].on('close', (code) => {
    console.log(`${baseFilename} process exited with code ${code}`)
    delete processes[detectionType] // Remove the reference once the process has exited
  })
}

export function stopDetection(detectionType) {
  detectionStatus = false
  const process = processes[detectionType]
  if (process) {
    process.on('close', (code, signal) => {
      console.log(
        `${detectionType} detection process terminated with code ${code} and signal ${signal}`
      )
      delete processes[detectionType]
    })

    process.kill('SIGTERM')
    console.log(`Termination signal sent to ${detectionType} detection process.`)
  } else {
    console.log(`No active ${detectionType} detection process found.`)
  }
}
