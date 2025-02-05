import path from 'path'
import { exec } from 'child_process'
import { app, ipcMain } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'
const { autoUpdater } = require('electron-updater')
const log = require('electron-log');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
const isProd = process.env.NODE_ENV === 'production'

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
})
autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('Update available.');
})
autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('Update not available.');
})
autoUpdater.on('error', (err) => {
  sendStatusToWindow('Error in auto-updater. ' + err);
})
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  sendStatusToWindow(log_message);
})
autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('Update downloaded');
});

async function startProcess(event, value) {
  if (event) {
    /*
      'parentDir' is used to get this folder -> /Applications/<youApp>.app/Contents/ 
      so that we can run our .sh file which will also launch the Python or Rust script.
      So the script folder will be moved into parentDir/ in prod mode.
      Note: this will only work if the target mahcine have Python or Rust installed.
    */
    let scriptPath
    if (isProd) {
      const parentDir = path.dirname(path.dirname(path.dirname(__dirname)))
      scriptPath = path.join(parentDir, 'scripts/runner.sh')
    } else {
      scriptPath = path.join(__dirname, '../scripts/runner.sh')
    }
    // console.log(`DEBUG: scriptPath: ${scriptPath}`)
    const cmd = `sh "${scriptPath}" ${value}`

    exec(cmd, (error, stdout) => {
      if (error) {
        console.error(`ERROR: Error executing post-install script: ${error}`) // will be seen only dev mode, not in prod mode
        event.sender.send('log', error.message) // will be seen in both dev and prod mode (in the frontend)
        return
      }
      event.sender.send('log', 'Python script executed successfully')
      event.sender.send('message', stdout)
    })

    // ~/.yourApp.log will be helpfull to log process in production mode
  }
}

ipcMain.on('run-sh', async (event, value) => {
  console.log('DEBUG: starting process') // for dev mode
  event.sender.send('log', 'Running...') // for prod mode
  await startProcess(event, value)
})

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

app.on('ready', function () {
  autoUpdater.checkForUpdatesAndNotify()
})

;(async () => {
  await app.whenReady()

  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (isProd) {
    await mainWindow.loadURL('app://./home')
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/home`)
    mainWindow.webContents.openDevTools()

  }
})()

app.on('window-all-closed', () => {
  app.quit()
})
