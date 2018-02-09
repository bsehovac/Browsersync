const electron = require('electron');
ipcRenderer = require('electron').ipcRenderer;

const pathInput = document.querySelector('#path');
const getPath = document.querySelector('#getPath');
const urlInput = document.querySelector('#url');
const typeInput = document.querySelector('#type');
const toggle = document.querySelector('#toggle');

(function() {
  pathInput.value = localStorage.getItem('path');
  urlInput.value = localStorage.getItem('url');
  typeInput.value = localStorage.getItem('extensions');
})();

let active = false;
let canSwitch = true;

toggle.onclick = function() {
  if (!canSwitch) return;
  canSwitch = false;
  active = !active;
  if (active) {
    startServer();
  } else {
    toggle.classList.remove('active');
    stopServer()
  }
}

function startServer() {
  let path  = pathInput.value.replace(/^\/|\/$/g, '');
  let url   = urlInput.value;
  let files = typeInput.value.split(',');
  let error = false;

  if (path === '') {
    pathInput.parentNode.classList.add('error');
    pathInput.onfocus = function() {
      pathInput.parentNode.classList.remove('error');
    };
    error = true;
  }

  localStorage.setItem('path', path);

  if (url === '') {
    urlInput.parentNode.classList.add('error');
    urlInput.onfocus = function() {
      urlInput.parentNode.classList.remove('error');
    };
    error = true;
  }

  localStorage.setItem('url', url);

  if (error) {
    canSwitch = true;
    return false;
  }

  let extensions = [];
  let filetypes = '';

  for (let i = 0; i < files.length; i++) {
    let file = files[i].trim();
    if (file !== '') {
      extensions.push('/'+ path + '/**/*.'+ file);
      filetypes += file + ', ';
    }
  }

  if (extensions == '')
    extensions.push('/'+ path + '/**/*.*');
  
  localStorage.setItem('extensions', filetypes);

  let options = {};
  options.url = url;
  options.command = 'start';
  options.browser = 'google chrome';
  options.files = extensions;

  ipcRenderer.send('server-start', options);
};

function stopServer() {
  ipcRenderer.send('server-stop');
};

ipcRenderer.on('return-directory', function(event, dirname) {
  if (!dirname) return;
  var path = dirname[0];
  pathInput.value = path;
});

getPath.onclick = function() {
  ipcRenderer.send('select-directory', function(){});
};

ipcRenderer.on('server-reply', function(event, status) {
  if (status === 'started') {
    toggle.classList.add('active');
  } else if (status === 'stopped') {
    toggle.classList.remove('active');
  }
  canSwitch = true;
});