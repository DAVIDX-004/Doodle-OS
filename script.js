


let zIndex = 100;
let windowCount = 0;
let activeWindows = {};


if (sessionStorage.getItem('doodle_logged_in') === 'yes') {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('welcome-screen').classList.remove('hidden');
}


function doLogin() {
  let pw = document.getElementById('login-password').value;
  if (pw === 'doodle') {
    sessionStorage.setItem('doodle_logged_in', 'yes');
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('welcome-screen').classList.remove('hidden');
  } else {
    alert('Wrong password! Try "doodle"');
    document.getElementById('login-password').value = '';
  }
}


function enterDesktop() {
  document.getElementById('welcome-screen').classList.add('hidden');
  document.getElementById('desktop').classList.remove('hidden');
  startClock();
  renderCalendar();
}


function startClock() {
  function tick() {
    let now = new Date();
    let h = now.getHours();
    let m = now.getMinutes();
    let ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    m = m < 10 ? '0' + m : m;
    document.getElementById('clock').textContent = h + ':' + m + ' ' + ampm;
  }
  tick();
  setInterval(tick, 1000);
}


function toggleStartMenu() {
  let menu = document.getElementById('start-menu');
  if (menu.classList.contains('hidden')) {
    menu.classList.remove('hidden');
  } else {
    menu.classList.add('hidden');
  }
}


function toggleCalendar() {
  let cal = document.getElementById('calendar-popup');
  if (cal.classList.contains('hidden')) {
    cal.classList.remove('hidden');
    renderCalendar();
  } else {
    cal.classList.add('hidden');
  }
}

function renderCalendar() {
  let now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  let day = now.getDate();

  let months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  document.getElementById('cal-header').textContent = months[month] + ' ' + year;

  let firstDay = new Date(year, month, 1).getDay();
  let daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = '';
  let weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  for (let i = 0; i < weekdays.length; i++) {
    html += '<div class="cal-cell header">' + weekdays[i] + '</div>';
  }

  for (let i = 0; i < firstDay; i++) {
    html += '<div class="cal-cell"></div>';
  }

  for (let d = 1; d <= daysInMonth; d++) {
    let cls = 'cal-cell';
    if (d === day) cls += ' today';
    html += '<div class="' + cls + '">' + d + '</div>';
  }

  document.getElementById('cal-grid').innerHTML = html;
}


function openApp(appName) {
  windowCount++;
  let winId = 'window-' + windowCount;
  zIndex++;

  let titles = {
    notepad: 'Notepad',
    terminal: 'Terminal',
    calculator: 'Calculator',
    files: 'File Manager',
    snake: 'Snake Game',
    browser: 'Browser',
    settings: 'Settings'
  };

  let w = 500, h = 350;
  if (appName === 'calculator') { w = 260; h = 380; }
  if (appName === 'snake') { w = 370; h = 450; }
  if (appName === 'settings') { w = 350; h = 300; }
  if (appName === 'browser') { w = 550; h = 350; }

  let offset = (windowCount % 6) * 25;
  let left = Math.min(window.innerWidth - w - 20, 100 + offset);
  let top = Math.min(window.innerHeight - h - 60, 40 + offset);

  let win = document.createElement('div');
  win.className = 'window';
  win.id = winId;
  win.style.width = w + 'px';
  win.style.height = h + 'px';
  win.style.left = left + 'px';
  win.style.top = top + 'px';
  win.style.zIndex = zIndex;

   win.innerHTML = ''
    + '<div class="window-header" onmousedown="startDrag(event, \'' + winId + '\')">'
    + '  <span class="window-title">' + titles[appName] + '</span>'
    + '  <div class="window-controls">'
    + '    <button class="btn-minimize" onclick="minimizeWindow(\'' + winId + '\')" title="Minimize">−</button>'
    + '    <button class="btn-maximize" onclick="maximizeWindow(\'' + winId + '\')" title="Maximize">□</button>'
    + '    <button class="btn-close" onclick="closeWindow(\'' + winId + '\')" title="Close">×</button>'
    + '  </div>'
    + '</div>'
    + '<div class="window-body" id="' + winId + '-body"></div>';

  document.getElementById('windows-container').appendChild(win);

  
  let tb = document.createElement('div');
  tb.className = 'taskbar-app active';
  tb.id = 'tb-' + winId;
  tb.textContent = titles[appName];
  tb.onclick = function() {
    let w = document.getElementById(winId);
    if (w.style.display === 'none') {
      w.style.display = 'flex';
      tb.classList.add('active');
      bringToFront(winId);
    } else if (tb.classList.contains('active')) {
      minimizeWindow(winId);
    } else {
      bringToFront(winId);
    }
  };
  document.getElementById('taskbar-apps').appendChild(tb);

  activeWindows[winId] = { app: appName, maximized: false };

  
  win.addEventListener('mousedown', function() {
    bringToFront(winId);
  });

  
  let body = document.getElementById(winId + '-body');
  if (appName === 'notepad') mountNotepad(body, winId);
  if (appName === 'terminal') mountTerminal(body, winId);
  if (appName === 'calculator') mountCalculator(body, winId);
  if (appName === 'files') mountFiles(body, winId);
  if (appName === 'snake') mountSnake(body, winId);
  if (appName === 'browser') mountBrowser(body, winId);
  if (appName === 'settings') mountSettings(body, winId);

  
  document.getElementById('start-menu').classList.add('hidden');
}

function bringToFront(winId) {
  zIndex++;
  document.getElementById(winId).style.zIndex = zIndex;
  document.querySelectorAll('.taskbar-app').forEach(function(b) {
    b.classList.remove('active');
  });
  let tb = document.getElementById('tb-' + winId);
  if (tb) tb.classList.add('active');
}

function closeWindow(winId) {
  let win = document.getElementById(winId);
  if (win) win.remove();
  let tb = document.getElementById('tb-' + winId);
  if (tb) tb.remove();
  delete activeWindows[winId];
}

function minimizeWindow(winId) {
  document.getElementById(winId).style.display = 'none';
  let tb = document.getElementById('tb-' + winId);
  if (tb) tb.classList.remove('active');
}

function maximizeWindow(winId) {
  let win = document.getElementById(winId);
  let data = activeWindows[winId];
  if (!data.maximized) {
    data.prevWidth = win.style.width;
    data.prevHeight = win.style.height;
    data.prevLeft = win.style.left;
    data.prevTop = win.style.top;
    win.style.width = '100vw';
    win.style.height = 'calc(100vh - 42px)';
    win.style.left = '0px';
    win.style.top = '0px';
    data.maximized = true;
  } else {
    win.style.width = data.prevWidth;
    win.style.height = data.prevHeight;
    win.style.left = data.prevLeft;
    win.style.top = data.prevTop;
    data.maximized = false;
  }
}


let dragWin = null;
let dragOffX = 0;
let dragOffY = 0;

function startDrag(e, winId) {
  if (e.target.closest('.window-controls')) return;
  let win = document.getElementById(winId);
  if (activeWindows[winId] && activeWindows[winId].maximized) return;
  dragWin = win;
  dragOffX = e.clientX - win.offsetLeft;
  dragOffY = e.clientY - win.offsetTop;
  bringToFront(winId);
}

document.addEventListener('mousemove', function(e) {
  if (!dragWin) return;
  dragWin.style.left = (e.clientX - dragOffX) + 'px';
  dragWin.style.top = (e.clientY - dragOffY) + 'px';
});

document.addEventListener('mouseup', function() {
  dragWin = null;
});



function mountNotepad(body, winId) {
  body.innerHTML = ''
    + '<div class="notepad-bar">'
    + '  <button onclick="notepadNew(\'' + winId + '\')">New</button>'
    + '  <button onclick="notepadSave(\'' + winId + '\')">Save</button>'
    + '  <select id="' + winId + '-files" onchange="notepadOpen(\'' + winId + '\')">'
    + '    <option value="">Open...</option>'
    + '  </select>'
    + '</div>'
    + '<textarea class="notepad-area" id="' + winId + '-text" placeholder="Type here..."></textarea>';

  notepadRefreshFiles(winId);
}

function notepadNew(winId) {
  document.getElementById(winId + '-text').value = '';
}

function notepadSave(winId) {
  let name = prompt('File name:', 'note.txt');
  if (!name) return;
  let text = document.getElementById(winId + '-text').value;
  let files = JSON.parse(localStorage.getItem('doodle_files') || '{}');
  files[name] = text;
  localStorage.setItem('doodle_files', JSON.stringify(files));
  notepadRefreshFiles(winId);
  alert('Saved!');
}

function notepadOpen(winId) {
  let sel = document.getElementById(winId + '-files');
  let name = sel.value;
  if (!name) return;
  let files = JSON.parse(localStorage.getItem('doodle_files') || '{}');
  document.getElementById(winId + '-text').value = files[name] || '';
}

function notepadRefreshFiles(winId) {
  let sel = document.getElementById(winId + '-files');
  let files = JSON.parse(localStorage.getItem('doodle_files') || '{}');
  let html = '<option value="">Open...</option>';
  for (let name in files) {
    html += '<option value="' + name + '">' + name + '</option>';
  }
  sel.innerHTML = html;
}

function mountTerminal(body, winId) {
  body.innerHTML = '<div class="terminal-box" id="' + winId + '-term"></div>';
  let term = document.getElementById(winId + '-term');
  term.innerHTML = '<div class="terminal-line">Doodle OS Shell v1.0</div>';
  term.innerHTML += '<div class="terminal-line">Type "help" for commands.</div>';
  addPrompt(term, winId);
}

function addPrompt(term, winId) {
  let line = document.createElement('div');
  line.className = 'terminal-input-line';
  line.innerHTML = '<span class="terminal-prompt">$</span>'
    + '<input type="text" class="terminal-input" id="' + winId + '-input">';
  term.appendChild(line);
  term.scrollTop = term.scrollHeight;

  let inp = document.getElementById(winId + '-input');
  inp.focus();
  inp.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      let cmd = inp.value.trim();
      inp.disabled = true;
      runCommand(term, winId, cmd);
    }
  });
}

function runCommand(term, winId, cmd) {
  let out = '';
  let lower = cmd.toLowerCase();

  if (lower === 'help') {
    out = 'Commands: help, date, clear, echo [text], whoami, reboot, ls, cat [file]';
  } else if (lower === 'date') {
    out = new Date().toString();
  } else if (lower === 'clear') {
    term.innerHTML = '';
    addPrompt(term, winId);
    return;
  } else if (lower === 'whoami') {
    out = 'user (admin)';
  } else if (lower === 'reboot') {
    out = 'Rebooting...';
    setTimeout(function() { location.reload(); }, 500);
  } else if (lower === 'ls') {
    let files = JSON.parse(localStorage.getItem('doodle_files') || '{}');
    let names = Object.keys(files);
    out = names.length ? names.join('  ') : 'No files.';
  } else if (lower.indexOf('cat ') === 0) {
    let name = cmd.slice(4).trim();
    let files = JSON.parse(localStorage.getItem('doodle_files') || '{}');
    out = files.hasOwnProperty(name) ? files[name] : 'File not found: ' + name;
  } else if (lower.indexOf('echo ') === 0) {
    out = cmd.slice(5);
  } else if (cmd === '') {
    out = '';
  } else {
    out = 'Unknown command: ' + cmd;
  }

  if (out) {
    let div = document.createElement('div');
    div.className = 'terminal-line';
    div.textContent = out;
    term.appendChild(div);
  }
  addPrompt(term, winId);
}

function mountCalculator(body, winId) {
  body.innerHTML = ''
    + '<div class="calc-screen" id="' + winId + '-screen">0</div>'
    + '<div class="calc-buttons" id="' + winId + '-btns">'
    + '  <button onclick="calcInput(\'' + winId + '\', \'C\')">C</button>'
    + '  <button onclick="calcInput(\'' + winId + '\', \'/\')">/</button>'
    + '  <button onclick="calcInput(\'' + winId + '\', \'*\')">*</button>'
    + '  <button onclick="calcInput(\'' + winId + '\', \'⌫\')">⌫</button>'
    + '  <button onclick="calcInput(\'' + winId + '\', \'7\')">7</button>'
    + '  <button onclick="calcInput(\'' + winId + '\', \'8\')">8</button>'
    + '  <button onclick="calcInput(\'' + winId + '\', \'9\')">9</button>'
    + '  <button onclick="calcInput(\'' + winId + '\', \'-\')">-</button>'
    + '  <button onclick="calcInput(\'' + winId + '\', \'4\')">4</button>'
    + '  <button onclick="calcInput(\'' + winId + '\', \'5\')">5</button>'
    + '  <button onclick="calcInput(\'' + winId + '\', \'6\')">6</button>'
    + '  <button onclick="calcInput(\'' + winId + '\', \'+\')">+</button>'
    + '  <button onclick="calcInput(\'' + winId + '\', \'1\')">1</button>'
    + '  <button onclick="calcInput(\'' + winId + '\', \'2\')">2</button>'
    + '  <button onclick="calcInput(\'' + winId + '\', \'3\')">3</button>'
    + '  <button class="equals" onclick="calcInput(\'' + winId + '\', \'=\')">=</button>'
    + '  <button onclick="calcInput(\'' + winId + '\', \'0\')" style="width:48%">0</button>'
    + '  <button onclick="calcInput(\'' + winId + '\', \'.\')">.</button>'
    + '</div>';

  calcData[winId] = { current: '0', expr: '' };
}

let calcData = {};

function calcInput(winId, key) {
  let d = calcData[winId];
  let screen = document.getElementById(winId + '-screen');

  if (key === 'C') {
    d.current = '0';
    d.expr = '';
  } else if (key === '⌫') {
    d.current = d.current.length > 1 ? d.current.slice(0, -1) : '0';
  } else if (key === '=') {
    try {
      
      let e = d.expr + d.current;
      e = e.replace(/×/g, '*').replace(/÷/g, '/');
      let res = eval(e);
      d.current = String(res);
      d.expr = '';
    } catch (err) {
      d.current = 'Error';
      d.expr = '';
    }
  } else if ('+-*/'.indexOf(key) >= 0) {
    d.expr = d.expr + d.current + key;
    d.current = '0';
  } else {
    if (d.current === '0' && key !== '.') {
      d.current = key;
    } else {
      if (key === '.' && d.current.indexOf('.') >= 0) {
        
      } else {
        d.current += key;
      }
    }
  }

  screen.textContent = d.current;
}

function mountFiles(body, winId) {
  body.innerHTML = ''
    + '<div style="margin-bottom:8px;">'
    + '  <button onclick="refreshFiles(\'' + winId + '\')">Refresh</button>'
    + '</div>'
    + '<div class="fm-list" id="' + winId + '-list"></div>';
  refreshFiles(winId);
}

function refreshFiles(winId) {
  let list = document.getElementById(winId + '-list');
  let files = JSON.parse(localStorage.getItem('doodle_files') || '{}');
  let names = Object.keys(files);

  if (names.length === 0) {
    list.innerHTML = '<p style="color:#999;">No files yet. Save something in Notepad!</p>';
    return;
  }

  let html = '';
  for (let i = 0; i < names.length; i++) {
    let name = names[i];
    html += ''
      + '<div class="fm-file">'
      + '  <span>📄 ' + name + '</span>'
      + '  <div>'
      + '    <button onclick="viewFile(\'' + name + '\')">View</button>'
      + '    <button onclick="deleteFile(\'' + name + '\', \'' + winId + '\')">Delete</button>'
      + '  </div>'
      + '</div>';
  }
  list.innerHTML = html;
}

function viewFile(name) {
  let files = JSON.parse(localStorage.getItem('doodle_files') || '{}');
  alert('File: ' + name + '\n\n' + (files[name] || '(empty)'));
}

function deleteFile(name, winId) {
  if (confirm('Delete "' + name + '"?')) {
    let files = JSON.parse(localStorage.getItem('doodle_files') || '{}');
    delete files[name];
    localStorage.setItem('doodle_files', JSON.stringify(files));
    refreshFiles(winId);
  }
}

function mountSnake(body, winId) {
  body.innerHTML = ''
    + '<div class="snake-score">Score: <span id="' + winId + '-score">0</span></div>'
    + '<canvas class="snake-canvas" id="' + winId + '-canvas" width="340" height="340"></canvas>'
    + '<div class="snake-controls"><button onclick="startSnake(\'' + winId + '\')">Start / Restart</button></div>';

  startSnake(winId);
}

let snakeIntervals = {};

function startSnake(winId) {
  if (snakeIntervals[winId]) clearInterval(snakeIntervals[winId]);

  let canvas = document.getElementById(winId + '-canvas');
  let ctx = canvas.getContext('2d');
  let scoreEl = document.getElementById(winId + '-score');

  let gs = 17;
  let tc = canvas.width / gs;

  let snake = [{x: 10, y: 10}];
  let food = {x: 5, y: 5};
  let vx = 1, vy = 0;
  let score = 0;
  let dead = false;

  function draw() {
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'green';
    ctx.fillRect(food.x * gs + 2, food.y * gs + 2, gs - 4, gs - 4);

    for (let i = 0; i < snake.length; i++) {
      ctx.fillStyle = i === 0 ? '#333' : '#666';
      ctx.fillRect(snake[i].x * gs + 1, snake[i].y * gs + 1, gs - 2, gs - 2);
    }

    if (dead) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.font = '14px Arial';
      ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 20);
    }
  }

  function step() {
    if (dead) return;
    let head = {x: snake[0].x + vx, y: snake[0].y + vy};

    if (head.x < 0 || head.x >= tc || head.y < 0 || head.y >= tc) {
      dead = true;
      clearInterval(snakeIntervals[winId]);
      draw();
      return;
    }

    for (let i = 0; i < snake.length; i++) {
      if (snake[i].x === head.x && snake[i].y === head.y) {
        dead = true;
        clearInterval(snakeIntervals[winId]);
        draw();
        return;
      }
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += 10;
      scoreEl.textContent = score;
      food = {
        x: Math.floor(Math.random() * tc),
        y: Math.floor(Math.random() * tc)
      };
    } else {
      snake.pop();
    }

    draw();
  }

  function onKey(e) {
    if (dead) return;
    if (e.key === 'ArrowUp' && vy === 0) { vx = 0; vy = -1; e.preventDefault(); }
    if (e.key === 'ArrowDown' && vy === 0) { vx = 0; vy = 1; e.preventDefault(); }
    if (e.key === 'ArrowLeft' && vx === 0) { vx = -1; vy = 0; e.preventDefault(); }
    if (e.key === 'ArrowRight' && vx === 0) { vx = 1; vy = 0; e.preventDefault(); }
  }

  canvas.setAttribute('tabindex', '0');
  canvas.focus();
  canvas.addEventListener('keydown', onKey);

  draw();
  snakeIntervals[winId] = setInterval(step, 120);
}

function mountBrowser(body, winId) {
  body.innerHTML = ''
    + '<div class="browser-bar">'
    + '  <input type="text" id="' + winId + '-url" placeholder="Enter URL or search...">'
    + '  <button onclick="browse(\'' + winId + '\')">Go</button>'
    + '</div>'
    + '<div class="browser-msg">Enter a website above to open it in a new tab</div>';

  document.getElementById(winId + '-url').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') browse(winId);
  });
}

function browse(winId) {
  let val = document.getElementById(winId + '-url').value.trim();
  if (!val) return;
  let url = val;
  if (url.indexOf('http') !== 0) {
    if (url.indexOf('.') > 0 && url.indexOf(' ') < 0) {
      url = 'https://' + url;
    } else {
      url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
    }
  }
  window.open(url, '_blank');
}

function mountSettings(body, winId) {
  let currentTheme = localStorage.getItem('doodle_theme') || 'light';

  body.innerHTML = ''
    + '<div class="settings-row">'
    + '  <label>Sound Effects</label>'
    + '  <input type="checkbox" id="' + winId + '-sound" checked>'
    + '</div>'
    + '<div class="settings-row">'
    + '  <label>Theme</label>'
    + '  <select id="' + winId + '-theme" onchange="changeTheme(this.value)">'
    + '    <option value="light"' + (currentTheme === 'light' ? ' selected' : '') + '>Light</option>'
    + '    <option value="dark"' + (currentTheme === 'dark' ? ' selected' : '') + '>Dark</option>'
    + '  </select>'
    + '</div>'
    + '<p style="margin-top:12px;font-size:12px;color:#999;">Wallpaper changes automatically with theme.</p>';

  
  changeTheme(currentTheme);
}

function changeTheme(theme) {
  localStorage.setItem('doodle_theme', theme);
  document.body.setAttribute('data-theme', theme);
}

function shutdown() {
  sessionStorage.removeItem('doodle_logged_in');
  document.body.innerHTML = ''
    + '<div style="height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;background:#2c3e50;color:white;">'
    + '  <div style="font-size:48px;margin-bottom:16px;">⏻</div>'
    + '  <h2>Doodle OS Shut Down</h2>'
    + '  <p style="margin-top:8px;color:#aaa;">You can safely close this tab.</p>'
    + '</div>';
}


document.addEventListener('click', function(e) {
  if (!e.target.closest('#start-btn') && !e.target.closest('#start-menu')) {
    document.getElementById('start-menu').classList.add('hidden');
  }
  if (!e.target.closest('#calendar-btn') && !e.target.closest('#calendar-popup')) {
    document.getElementById('calendar-popup').classList.add('hidden');
  }
});
