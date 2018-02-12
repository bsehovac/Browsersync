/*jshint esversion: 6 */

window.onfocus = function() {
  document.body.classList.remove('blur');
};

window.onblur = function() {
  document.body.classList.add('blur');
};

const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;

const pathInput = document.querySelector('#path');
const getPath = document.querySelector('#getPath');
const urlInput = document.querySelector('#url');
const typeInput = document.querySelector('#type');
const toggle = document.querySelector('#toggle');
const ipField = document.querySelector('#ip');
const tags = document.querySelectorAll('.tags');

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
    toggle.classList.add('active');
    startServer();
  } else {
    toggle.classList.remove('active');
    stopServer();
  }
};

function startServer() {
  let path  = pathInput.value.replace(/^\/|\/$/g, '');
  let proxyurl   = urlInput.value;
  let files = typeInput.value.split(',');
  let error = false;
  let proxy = false;

  if (path === '') {
    pathInput.parentNode.classList.add('error');
    pathInput.onfocus = function() {
      pathInput.parentNode.classList.remove('error');
    };
    error = true;
  }

  localStorage.setItem('path', path);

  /*if (proxyurl === '') {
    urlInput.parentNode.classList.add('error');
    urlInput.onfocus = function() {
      urlInput.parentNode.classList.remove('error');
    };
    error = true;
  }*/

  localStorage.setItem('proxyurl', proxyurl);
  if (proxyurl !== '') proxy = true;

  if (error) {
    canSwitch = true;
    return false;
  }

  let extensions = [];

  for (let i = 0; i < files.length; i++) {
    let file = files[i].trim();
    if (file !== '') {
      extensions.push('/'+ path + '/**/*.'+ file);
    }
  }

  if (extensions == '')
    extensions.push('/'+ path + '/**/*.*');
  
  localStorage.setItem('extensions', typeInput.value);

  let options = {};
  options.proxy = (proxy) ? proxyurl : false;
  options.server = (proxy) ? false : '/'+ path +'/';
  options.command = 'start';
  options.browser = 'google chrome';
  options.files = extensions;

  //console.log(options);

  ipcRenderer.send('server-start', options);
}

function stopServer() {
  ipcRenderer.send('server-stop');
}

ipcRenderer.on('return-directory', function(event, dirname) {
  if (!dirname) return;
  var path = dirname[0];
  pathInput.value = path;
  localStorage.setItem('path', path);
});

getPath.onclick = function() {
  ipcRenderer.send('select-directory', function(){});
};

ipcRenderer.on('server-reply', function(event, status) {
  if (status === 'started') {
    toggle.classList.add('active');
    ipcRenderer.send('get-ip');
  } else if (status === 'stopped') {
    toggle.classList.remove('active');
  }
  canSwitch = true;
});

ipcRenderer.on('return-ip', function(event, ip) {
  if (ip) ipField.innerHTML = ip + ':3000';
});

ipField.onclick = function() {
  var range = window.getSelection().getRangeAt(0);
  range.selectNode(ipField);
  window.getSelection();
  document.execCommand("copy");
  window.getSelection().removeAllRanges();
};

ipcRenderer.send('get-ip');

each(tags, function(holder, i) {
  const alltags = [];
  const allspans = [];
  const mainInput = holder.querySelector('input');
  const input = document.createElement('input');
  input.setAttribute('type', 'text');
  input.setAttribute('class', 'taginput');
  holder.appendChild(input);
  mainInput.style.display = 'none';
  document.body.appendChild(mainInput);

  if (mainInput.value == '') mainInput.value = 'css,png,jpg,svg';
  const current = mainInput.value.split(',');
  each(current, function(tag, i) {
    if (tag != '') addTag(tag);
  });
  mainInput.value = '';

  function addOutput() {
    let output = '';
    each(alltags, function(tag, i) {
      if (i != 0) output += ',';
      output += tag;
    });
    mainInput.value = output;
    localStorage.setItem('extensions', typeInput.value);
  }

  function addTag(value) {
    const tag = document.createElement('span');
    tag.innerHTML = value.toUpperCase();
    tag.setAttribute('title', 'Remove');
    alltags.push(value);
    allspans.push(tag);
    holder.insertBefore(tag, input);
    addOutput();
    tag.onclick = function() {
      const index = allspans.indexOf(this);
      holder.removeChild(this);
      allspans.splice(index, 1);
      alltags.splice(index, 1);
      addOutput();
    };
  }

  input.onkeydown = function(e) {
    const key = e.keyCode;
    if (key == 188 || key == 13 || key == 9) {
      e.preventDefault();
      const value = input.value.trim().replace(',', '');
      input.value = '';
      addTag(value);
    }
    if (key == 8 && input.value == '' && alltags.length > 0) {
      holder.removeChild(allspans[alltags.length-1]);
      alltags.pop();
      allspans.pop();
      addOutput();
    }
  };

  input.onblur = function() {
    const value = input.value.trim().replace(',', '');
    if (value == '') return;
    input.value = '';
    addTag(value);
  };
});

function each(a, cb) {
  if (a.length < 1) return false;
  for (var i = 0; i < a.length; i++) {
    cb(a[i], i);
  }
}