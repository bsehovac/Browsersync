const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const os = require('os');
const interfaces = os.networkInterfaces();

const bs = require('browser-sync').create();

const path = require('path');
const url = require('url');

const Menu = electron.Menu;

const template = [
  {
    label: 'Edit',
    submenu: [
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectall' },
    ]
  },
  {
    label: 'Window',
    submenu: [
      { role: 'minimize'},
      { role: 'close'},
    ]
  },
];

if (process.platform === 'darwin') {
  const name = app.getName()
  template.unshift({
    label: name,
    submenu: [
      {
        role: 'about'
      },
      {
        type: 'separator'
      },
      {
        role: 'services',
        submenu: []
      },
      {
        type: 'separator'
      },
      {
        role: 'hide'
      },
      {
        role: 'hideothers'
      },
      {
        role: 'unhide'
      },
      {
        type: 'separator'
      },
      {
        role: 'quit'
      }
    ]
  })
  // Edit menu.
  template[1].submenu.push(
    {
      type: 'separator'
    },
    {
      label: 'Speech',
      submenu: [
        {
          role: 'startspeaking'
        },
        {
          role: 'stopspeaking'
        }
      ]
    }
  )
  // Window menu.
  template[2].submenu = [
    {
      label: 'Close',
      accelerator: 'CmdOrCtrl+W',
      role: 'close'
    },
    {
      label: 'Minimize',
      accelerator: 'CmdOrCtrl+M',
      role: 'minimize'
    },
    {
      label: 'Zoom',
      role: 'zoom'
    },
    {
      type: 'separator'
    },
    {
      label: 'Bring All to Front',
      role: 'front'
    }
  ]
}

const menu = Menu.buildFromTemplate(template);

let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({ width: 400, height: 400, resizable: false, titleBarStyle: 'hiddenInset' });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  Menu.setApplicationMenu(menu);
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (bs.active) { bs.exit(); }
  app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const ipcMain = electron.ipcMain;
const dialog = electron.dialog;

ipcMain.on('select-directory', function(event) {
  dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  }, function(dirname) {
    if (dirname) event.sender.send('return-directory', dirname);
  });
});

ipcMain.on('server-start', function(event, options) {
  if (!bs.active && options.command == 'start') {
    bs.init({
      proxy: options.url,
      browser: options.browser,
      files: options.files,
      logPrefix: '',
      port: 3000,
      reloadOnRestart: false,
      notify: false,
      open: 'local',
      https: false,
      ghostMode: false,
    }, function(err, bs) {
      event.sender.send('server-reply', 'started');
    });
  }
});

ipcMain.on('server-stop', function(event, options) {
  if (bs.active) {
    bs.exit();
    event.sender.send('server-reply', 'stopped');
  }
});

ipcMain.on('get-ip', function(event) {
  for (let k in interfaces) {
    for (let k2 in interfaces[k]) {
      let address = interfaces[k][k2];
      if (address.family === 'IPv4' && !address.internal) {
        event.sender.send('return-ip', address.address);
      }
    }
  }
});