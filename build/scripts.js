const electron = require('electron');
ipcRenderer = require('electron').ipcRenderer;

var pathInput = document.querySelector('#path');
var pathButton = document.querySelector('#getPath');
var urlInput = document.querySelector('#url');
var typeInput = document.querySelector('#type');
var watch = document.querySelector('#watch');
var stop = document.querySelector('#stop');

watch.onclick = function(e) {
  e.preventDefault();

  let path  = pathInput.value.replace(/^\/|\/$/g, '');
  let url   = urlInput.value;
  let files = typeInput.value.split(',');

  if (path === '') {
    pathInput.classList.add('error');
    pathInput.onfocus = function() {
      pathInput.classList.remove('error');
    };
    return;
  }

  if (url === '') {
    urlInput.classList.add('error');
    urlInput.onfocus = function() {
      urlInput.classList.remove('error');
    };
    return;
  }

  let extensions = [];

  for (let i = 0; i < files.length; i++) {
    let file = files[i].trim();
    if (file !== '') 
      extensions.push('/'+ path + '/**/*.'+ file);
  }

  if (extensions == '') extensions.push('/'+ path + '/**/*.*');

  let options = {};
  options.url = url;
  options.command = 'start';
  options.browser = 'google chrome'; // safari firefox
  options.files = extensions;

  ipcRenderer.send('server-start', options);
};

stop.onclick = function(e) {
  e.preventDefault();

  ipcRenderer.send('server-stop');
};

ipcRenderer.on('return-directory', function(event, dirname) {
  var path = dirname[0];
  pathInput.value = path;
});

pathButton.onclick = function() {
  ipcRenderer.send('select-directory', function(){});
};

ipcRenderer.on('server-reply', function(status, message, bs) {
  if (status === 'started') {
    console.log(message);
  } else if (status === 'stopped') {
    console.log(message);
  }
});