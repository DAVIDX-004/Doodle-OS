// ========== AUDIO / SOUND EFFECTS ==========
let audioCtx = null;
let soundEnabled = localStorage.getItem('doodleOS_sound') !== 'false';

function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playTone(freq, type, duration) {
    if (!soundEnabled || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (duration || 0.1));
    osc.stop(audioCtx.currentTime + (duration || 0.1));
}

function playPop() { initAudio(); playTone(520, 'sine', 0.08); }
function playOpen() { initAudio(); playTone(440, 'sine', 0.1); setTimeout(function() { playTone(660, 'sine', 0.12); }, 70); }
function playClose() { initAudio(); playTone(500, 'sine', 0.1); setTimeout(function() { playTone(300, 'sine', 0.12); }, 70); }
function playClick() { initAudio(); playTone(800, 'triangle', 0.05); }
function playError() { initAudio(); playTone(180, 'sawtooth', 0.18); }

// ========== FILE SYSTEM ==========
const FileSystem = {
    files: {},
    load() {
        const saved = localStorage.getItem('doodleOS_files');
        if (saved) this.files = JSON.parse(saved);
    },
    save() {
        localStorage.setItem('doodleOS_files', JSON.stringify(this.files));
    },
    create(name, content) {
        this.files[name] = content;
        this.save();
    },
    delete(name) {
        delete this.files[name];
        this.save();
    },
    list() {
        return Object.keys(this.files);
    }
};
FileSystem.load();

// ========== WALLPAPER ==========
function setWallpaper(name) {
    document.getElementById('desktop').setAttribute('data-wallpaper', name || 'dots');
    localStorage.setItem('doodleOS_wallpaper', name || 'dots');
}

const savedWallpaper = localStorage.getItem('doodleOS_wallpaper');
if (savedWallpaper) setWallpaper(savedWallpaper);

// ========== THEME ==========
function setTheme(theme) {
    document.getElementById('desktop').setAttribute('data-theme', theme);
    localStorage.setItem('doodleOS_theme', theme);
}

const savedTheme = localStorage.getItem('doodleOS_theme');
if (savedTheme) {
    document.getElementById('desktop').setAttribute('data-theme', savedTheme);
}

// ========== WELCOME SCREEN ==========
const welcomeScreen = document.getElementById('welcome-screen');
const enterBtn = document.getElementById('enter-btn');
const desktop = document.getElementById('desktop');

enterBtn.addEventListener('click', function() {
    playOpen();
    welcomeScreen.classList.add('fade-out');
    setTimeout(function() {
        welcomeScreen.style.display = 'none';
        desktop.classList.remove('hidden');
    }, 600);
});

// ========== LOGIN SYSTEM (DECLARED AFTER welcomeScreen) ==========
const loginScreen = document.getElementById('login-screen');
const loginPassword = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');

function checkLogin() {
    if (sessionStorage.getItem('doodleOS_loggedIn') === 'true') {
        loginScreen.style.display = 'none';
        welcomeScreen.classList.remove('hidden');
    }
}
checkLogin();

loginBtn.addEventListener('click', function() {
    if (loginPassword.value === 'doodle') {
        playOpen();
        sessionStorage.setItem('doodleOS_loggedIn', 'true');
        loginScreen.classList.add('fade-out');
        setTimeout(function() {
            loginScreen.style.display = 'none';
            welcomeScreen.classList.remove('hidden');
        }, 600);
    } else {
        playError();
        loginPassword.style.borderColor = '#f5b7b1';
        loginPassword.value = '';
        loginPassword.placeholder = 'Wrong password!';
        setTimeout(function() {
            loginPassword.style.borderColor = '#2d2d2d';
            loginPassword.placeholder = 'Password';
        }, 1000);
    }
});

loginPassword.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') loginBtn.click();
});

// ========== CALENDAR WIDGET ==========
const calendarBtn = document.getElementById('calendar-btn');
const calendarPopup = document.getElementById('calendar-popup');

calendarBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    playClick();
    calendarPopup.classList.toggle('hidden');
    if (!calendarPopup.classList.contains('hidden')) renderCalendar();
});

document.addEventListener('click', function(e) {
    if (!calendarPopup.contains(e.target) && e.target !== calendarBtn) {
        calendarPopup.classList.add('hidden');
    }
});

function renderCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    document.getElementById('cal-month-year').textContent = monthNames[month] + ' ' + year;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = now.getDate();
    
    let html = '<div class="cal-day-name">Su</div><div class="cal-day-name">Mo</div><div class="cal-day-name">Tu</div><div class="cal-day-name">We</div><div class="cal-day-name">Th</div><div class="cal-day-name">Fr</div><div class="cal-day-name">Sa</div>';
    
    for (let i = 0; i < firstDay; i++) html += '<div class="cal-day empty"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
        const cls = d === today ? 'cal-day today' : 'cal-day';
        html += '<div class="' + cls + '">' + d + '</div>';
    }
    document.getElementById('cal-days').innerHTML = html;
}

// ========== CLOCK ==========
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
    document.getElementById('clock').textContent = timeString;
}
setInterval(updateClock, 1000);
updateClock();

// ========== START MENU ==========
const startBtn = document.getElementById('start-btn');
const startMenu = document.getElementById('start-menu');

startBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    playClick();
    startMenu.classList.toggle('hidden');
});

document.addEventListener('click', function(e) {
    if (!startMenu.contains(e.target) && e.target !== startBtn) {
        startMenu.classList.add('hidden');
    }
});

// ========== WINDOW MANAGER ==========
let windowCount = 0;
let zIndexCounter = 100;
const windowsContainer = document.getElementById('windows-container');
const taskbarApps = document.getElementById('taskbar-apps');

const apps = {
    notepad: {
        title: '📝 Notepad',
        width: 560,
        height: 420,
        content: ''
    },
    terminal: {
        title: '💻 Terminal',
        width: 520,
        height: 320,
        content: ''
    },
    calculator: {
        title: '🧮 Calculator',
        width: 320,
        height: 440,
        content: ''
    },
    filemanager: {
        title: '🗂️ Files',
        width: 500,
        height: 380,
        content: ''
    },
    snake: {
        title: '🐍 Snake',
        width: 420,
        height: 500,
        content: ''
    },
    browser: {
        title: '🌐 Browser',
        width: 600,
        height: 440,
        content: ''
    },
    settings: {
        title: '⚙️ Settings',
        width: 420,
        height: 400,
        content: '<div style="padding:14px;"><h3 style="margin-bottom:14px;">Doodle OS Settings</h3><div style="margin-bottom:12px;"><label style="display:flex;align-items:center;gap:8px;cursor:pointer;"><input type="checkbox" id="settings-sound" checked> 🔊 Sound Effects</label></div><div style="margin-bottom:12px;"><label style="display:block;margin-bottom:6px;">🎨 Theme:</label><select id="theme-select" style="font-family:inherit;padding:4px;border:2px solid #2d2d2d;border-radius:6px;width:100%;"><option>Doodle Light</option><option>Doodle Dark</option></select></div><div style="margin-bottom:12px;"><label style="display:block;margin-bottom:6px;">🖼️ Wallpaper:</label><div class="wp-options"><button class="wp-btn" data-wp="dots" style="background:#fef6e4;">Dots</button><button class="wp-btn" data-wp="grid" style="background:#fff;">Grid</button><button class="wp-btn" data-wp="lines" style="background:#e8f6f3;">Lines</button><button class="wp-btn" data-wp="crosses" style="background:#fae1dd;">Cross</button><button class="wp-btn" data-wp="stars" style="background:#8bd3dd;">Stars</button></div></div><p style="margin-top:16px;color:#666;font-size:0.95rem;">More settings coming soon! 🎨</p></div>'
    }
};

function openApp(appName) {
    const app = apps[appName];
    if (!app) return;

    windowCount++;
    const winId = 'win-' + windowCount;
    
    const win = document.createElement('div');
    win.className = 'window';
    win.id = winId;
    win.style.width = app.width + 'px';
    win.style.height = app.height + 'px';
    win.style.left = (80 + windowCount * 25) + 'px';
    win.style.top = (40 + windowCount * 25) + 'px';
    win.style.zIndex = ++zIndexCounter;

    let bodyContent = app.content;
    
    if (appName === 'notepad') {
        const npId = 'np-' + winId;
        bodyContent = 
            '<div style="display:flex;flex-direction:column;height:100%;">' +
                '<div class="np-toolbar">' +
                    '<button class="np-btn" onclick="notepadNew(\'' + npId + '\')">🆕 New</button>' +
                    '<button class="np-btn" onclick="notepadSave(\'' + npId + '\')">💾 Save</button>' +
                    '<select class="np-btn" id="' + npId + '-files" onchange="notepadOpen(\'' + npId + '\', this.value)">' +
                        '<option value="">📂 Open...</option>' +
                    '</select>' +
                    '<span class="np-status" id="' + npId + '-status"></span>' +
                '</div>' +
                '<textarea id="' + npId + '" class="notepad-textarea" placeholder="Start doodling your thoughts here..." style="flex:1;"></textarea>' +
            '</div>';
    } else if (appName === 'terminal') {
        bodyContent = '<div class="terminal-body" id="term-' + winId + '"><div>Welcome to Doodle Terminal v1.0</div><div>Type \'help\' for available commands.</div><br><div class="terminal-input-line"><span class="terminal-prompt">doodle@os:~$</span><input type="text" class="terminal-input" autofocus></div></div>';
    } else if (appName === 'calculator') {
        const calcId = 'calc-' + winId;
        bodyContent = '<div id="' + calcId + '" class="calc-container"><div class="calc-display">0</div><div class="calc-buttons">' +
            '<button class="calc-btn calc-clear">C</button><button class="calc-btn calc-op">÷</button><button class="calc-btn calc-op">×</button><button class="calc-btn calc-del">⌫</button>' +
            '<button class="calc-btn">7</button><button class="calc-btn">8</button><button class="calc-btn">9</button><button class="calc-btn calc-op">-</button>' +
            '<button class="calc-btn">4</button><button class="calc-btn">5</button><button class="calc-btn">6</button><button class="calc-btn calc-op">+</button>' +
            '<button class="calc-btn">1</button><button class="calc-btn">2</button><button class="calc-btn">3</button><button class="calc-btn calc-eq">=</button>' +
            '<button class="calc-btn calc-zero">0</button><button class="calc-btn">.</button>' +
        '</div></div>';
    } else if (appName === 'filemanager') {
        bodyContent = '<div id="fm-' + winId + '" class="fm-container"><div class="fm-toolbar"><button class="fm-btn" onclick="fmRefresh(\'' + winId + '\')">🔄 Refresh</button><span class="fm-count" id="fm-count-' + winId + '">0 files</span></div><div class="fm-grid" id="fm-grid-' + winId + '"></div></div>';
    } else if (appName === 'snake') {
        const snakeId = 'snake-' + winId;
        bodyContent = '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:10px;"><div style="font-family:Baloo 2,cursive;font-size:1.2rem;">Score: <span id="snake-score-' + winId + '">0</span></div><canvas id="' + snakeId + '" width="360" height="360" style="border:3px solid #2d2d2d;border-radius:8px;background:#fffef7;"></canvas><button class="np-btn" onclick="initSnake(\'' + winId + '\')">▶️ Start / Restart</button></div>';
    } else if (appName === 'browser') {
        bodyContent = '<div style="display:flex;flex-direction:column;height:100%;"><div style="display:flex;gap:8px;padding:8px;border-bottom:2px solid #2d2d2d;background:#fef6e4;"><button class="np-btn" onclick="window.open(\'https://google.com\', \'_blank\')" style="padding:4px 10px;">🏠</button><input type="text" id="browser-input-' + winId + '" placeholder="Type URL or search and press Enter..." style="flex:1;font-family:inherit;border:2px solid #2d2d2d;border-radius:6px;padding:4px 10px;"><button class="np-btn" onclick="browserGo(\'' + winId + '\')" style="padding:4px 10px;">Go</button></div><div style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;color:#999;"><div style="font-size:3rem;">🌐</div><div>Type a URL or search above</div><div style="font-size:0.9rem;">Opens in your real browser tab</div></div></div>';
    }

    win.innerHTML = 
        '<div class="window-header" data-win="' + winId + '">' +
            '<span class="window-title">' + app.title + '</span>' +
            '<div class="window-controls">' +
                '<button class="window-btn btn-minimize" data-action="minimize" data-win="' + winId + '">−</button>' +
                '<button class="window-btn btn-maximize" data-action="maximize" data-win="' + winId + '">□</button>' +
                '<button class="window-btn btn-close" data-action="close" data-win="' + winId + '">×</button>' +
            '</div>' +
        '</div>' +
        '<div class="window-body">' + bodyContent + '</div>';

    windowsContainer.appendChild(win);
    
    win.addEventListener('mousedown', function() {
        win.style.zIndex = ++zIndexCounter;
    });

    makeDraggable(win);

    const taskItem = document.createElement('div');
    taskItem.className = 'taskbar-item active';
    taskItem.textContent = app.title.split(' ')[1] || app.title;
    taskItem.dataset.win = winId;
    taskItem.onclick = function() {
        if (win.classList.contains('minimized')) {
            win.classList.remove('minimized');
            win.style.display = 'flex';
            taskItem.classList.add('active');
        } else {
            win.style.zIndex = ++zIndexCounter;
        }
    };
    taskbarApps.appendChild(taskItem);

    if (appName === 'notepad') {
        setTimeout(function() { notepadRefreshFiles('np-' + winId); }, 10);
    } else if (appName === 'terminal') {
        setTimeout(function() { setupTerminal(win); }, 10);
    } else if (appName === 'calculator') {
        setTimeout(function() { initCalculator(winId); }, 10);
    } else if (appName === 'filemanager') {
        setTimeout(function() { fmRefresh(winId); }, 10);
    } else if (appName === 'snake') {
        setTimeout(function() { initSnake(winId); }, 10);
    } else if (appName === 'browser') {
        setTimeout(function() {
            const inp = document.getElementById('browser-input-' + winId);
            if (inp) inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') browserGo(winId); });
        }, 10);
    } else if (appName === 'settings') {
        setTimeout(function() {
            const themeSelect = win.querySelector('#theme-select');
            if (themeSelect) {
                const current = document.getElementById('desktop').getAttribute('data-theme');
                themeSelect.value = current === 'dark' ? 'Doodle Dark' : 'Doodle Light';
                themeSelect.addEventListener('change', function(e) {
                    const theme = e.target.value === 'Doodle Dark' ? 'dark' : 'light';
                    setTheme(theme);
                });
            }
            const soundCheck = win.querySelector('#settings-sound');
            if (soundCheck) {
                soundCheck.checked = soundEnabled;
                soundCheck.addEventListener('change', function(e) {
                    soundEnabled = e.target.checked;
                    localStorage.setItem('doodleOS_sound', soundEnabled);
                });
            }
            win.querySelectorAll('.wp-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    setWallpaper(btn.dataset.wp);
                    playClick();
                });
            });
        }, 10);
    }

    playOpen();
    startMenu.classList.add('hidden');
}

// Window controls event delegation
windowsContainer.addEventListener('click', function(e) {
    const btn = e.target.closest('.window-btn');
    if (!btn) return;
    const action = btn.dataset.action;
    const winId = btn.dataset.win;
    if (action === 'close') closeWindow(winId);
    if (action === 'minimize') minimizeWindow(winId);
    if (action === 'maximize') maximizeWindow(winId);
});

function closeWindow(winId) {
    const win = document.getElementById(winId);
    if (!win) return;
    playClose();
    win.style.transform = 'scale(0.9)';
    win.style.opacity = '0';
    setTimeout(function() {
        win.remove();
        const taskItem = document.querySelector('.taskbar-item[data-win="' + winId + '"]');
        if (taskItem) taskItem.remove();
        if (snakeGames[winId]) {
            clearInterval(snakeGames[winId]);
            delete snakeGames[winId];
        }
    }, 200);
}

function minimizeWindow(winId) {
    const win = document.getElementById(winId);
    const taskItem = document.querySelector('.taskbar-item[data-win="' + winId + '"]');
    if (win) {
        win.style.display = 'none';
        win.classList.add('minimized');
        if (taskItem) taskItem.classList.remove('active');
    }
}

function maximizeWindow(winId) {
    const win = document.getElementById(winId);
    if (!win) return;
    
    if (win.dataset.maximized === 'true') {
        win.style.width = win.dataset.prevWidth;
        win.style.height = win.dataset.prevHeight;
        win.style.left = win.dataset.prevLeft;
        win.style.top = win.dataset.prevTop;
        win.dataset.maximized = 'false';
    } else {
        win.dataset.prevWidth = win.style.width;
        win.dataset.prevHeight = win.style.height;
        win.dataset.prevLeft = win.style.left;
        win.dataset.prevTop = win.style.top;
        win.style.width = '100vw';
        win.style.height = 'calc(100vh - 52px)';
        win.style.left = '0';
        win.style.top = '0';
        win.dataset.maximized = 'true';
    }
}

function makeDraggable(win) {
    const header = win.querySelector('.window-header');
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    header.addEventListener('mousedown', function(e) {
        if (win.dataset.maximized === 'true') return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = win.offsetLeft;
        initialTop = win.offsetTop;
        win.style.zIndex = ++zIndexCounter;
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        win.style.left = (initialLeft + dx) + 'px';
        win.style.top = (initialTop + dy) + 'px';
    });

    document.addEventListener('mouseup', function() {
        isDragging = false;
    });
}

// ========== DESKTOP ICONS ==========
const desktopIconsContainer = document.querySelector('.desktop-icons');
if (desktopIconsContainer) {
    desktopIconsContainer.addEventListener('click', function(e) {
        const icon = e.target.closest('.desktop-icon');
        if (!icon) return;
        playClick();
        document.querySelectorAll('.desktop-icon').forEach(function(i) { i.classList.remove('selected'); });
        icon.classList.add('selected');
    });
    
    desktopIconsContainer.addEventListener('dblclick', function(e) {
        const icon = e.target.closest('.desktop-icon');
        if (!icon) return;
        openApp(icon.dataset.app);
    });
}

// ========== START MENU ITEMS ==========
document.querySelectorAll('.start-item[data-app]').forEach(function(item) {
    item.addEventListener('click', function() {
        openApp(item.dataset.app);
    });
});

// ========== SHUTDOWN ==========
document.getElementById('shutdown-btn').addEventListener('click', function() {
    playClose();
    sessionStorage.removeItem('doodleOS_loggedIn');
    document.body.innerHTML = 
        '<div style="height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:20px;background:#2d2d2d;color:#fae1dd;font-family:Baloo 2,cursive;">' +
            '<div style="font-size:3rem;">👋</div>' +
            '<div style="font-size:1.5rem;">See you later, Muhammad!</div>' +
            '<div style="font-size:1rem;opacity:0.7;margin-top:10px;">Doodle OS is shutting down...</div>' +
        '</div>';
});

// ========== NOTEPAD FILE SYSTEM ==========
function notepadRefreshFiles(id) {
    const select = document.getElementById(id + '-files');
    if (!select) return;
    const files = FileSystem.list();
    select.innerHTML = '<option value="">📂 Open...</option>';
    files.forEach(function(f) {
        const opt = document.createElement('option');
        opt.value = f;
        opt.textContent = f;
        select.appendChild(opt);
    });
}

function notepadNew(id) {
    playClick();
    const ta = document.getElementById(id);
    if (ta) ta.value = '';
    const status = document.getElementById(id + '-status');
    if (status) status.textContent = 'New file';
}

function notepadSave(id) {
    playPop();
    const ta = document.getElementById(id);
    if (!ta) return;
    const name = prompt('Save as:', 'untitled.txt');
    if (!name) return;
    FileSystem.create(name, ta.value);
    notepadRefreshFiles(id);
    const status = document.getElementById(id + '-status');
    if (status) status.textContent = 'Saved: ' + name;
}

function notepadOpen(id, filename) {
    if (!filename) return;
    playClick();
    const ta = document.getElementById(id);
    if (ta) ta.value = FileSystem.files[filename] || '';
    const status = document.getElementById(id + '-status');
    if (status) status.textContent = 'Opened: ' + filename;
}

// ========== TERMINAL LOGIC ==========
function setupTerminal(win) {
    const termBody = win.querySelector('.terminal-body');
    if (!termBody) return;

    function handleCommand(input, cmd) {
        input.disabled = true;
        let response = '';
        const c = cmd.toLowerCase();
        
        if (c === 'help') {
            response = 'Available commands: help, date, clear, echo, whoami, reboot, ls';
        } else if (c === 'date') {
            response = new Date().toString();
        } else if (c === 'clear') {
            termBody.innerHTML = '';
            addInputLine();
            return;
        } else if (c === 'whoami') {
            response = 'muhammad_dawood (admin)';
        } else if (c === 'reboot') {
            response = 'Rebooting Doodle OS...';
            setTimeout(function() { location.reload(); }, 1000);
        } else if (c === 'ls') {
            const files = FileSystem.list();
            response = files.length ? files.join('  ') : 'No files yet.';
        } else if (c === '') {
            response = '';
        } else if (c.startsWith('echo ')) {
            response = cmd.slice(5);
        } else {
            response = 'Command not found: ' + cmd + ". Type 'help' for available commands.";
        }
        
        if (response) {
            const respLine = document.createElement('div');
            respLine.textContent = response;
            termBody.appendChild(respLine);
        }
        termBody.scrollTop = termBody.scrollHeight;
        addInputLine();
    }

    function addInputLine() {
        const line = document.createElement('div');
        line.className = 'terminal-input-line';
        line.innerHTML = '<span class="terminal-prompt">doodle@os:~$</span><input type="text" class="terminal-input" autofocus>';
        termBody.appendChild(line);
        const input = line.querySelector('.terminal-input');
        input.focus();
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                handleCommand(input, input.value.trim());
            }
        });
    }
    
    const firstInput = termBody.querySelector('.terminal-input');
    if (firstInput) {
        firstInput.focus();
        firstInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                handleCommand(firstInput, firstInput.value.trim());
            }
        });
    }
}

// ========== BROWSER ==========
function browserGo(winId) {
    const input = document.getElementById('browser-input-' + winId);
    if (!input) return;
    let url = input.value.trim();
    if (!url) return;
    if (!url.match(/^https?:\/\//i)) {
        if (url.includes('.') && !url.includes(' ')) {
            url = 'https://' + url;
        } else {
            url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
        }
    }
    window.open(url, '_blank');
}

// ========== CALCULATOR ==========
function initCalculator(winId) {
    const container = document.getElementById('calc-' + winId);
    if (!container) return;
    const display = container.querySelector('.calc-display');
    let current = '0';
    let prev = null;
    let op = null;
    let resetNext = false;

    function update() { display.textContent = current; }
    
    container.querySelectorAll('.calc-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            playClick();
            const val = btn.textContent;
            if (val === 'C') {
                current = '0'; prev = null; op = null;
            } else if (val === '⌫') {
                current = current.length > 1 ? current.slice(0, -1) : '0';
            } else if (val === '+' || val === '-' || val === '×' || val === '÷') {
                prev = parseFloat(current);
                op = val;
                resetNext = true;
            } else if (val === '=') {
                if (op && prev !== null) {
                    const curr = parseFloat(current);
                    if (op === '+') current = String(prev + curr);
                    if (op === '-') current = String(prev - curr);
                    if (op === '×') current = String(prev * curr);
                    if (op === '÷') current = curr === 0 ? 'Error' : String(prev / curr);
                    op = null; prev = null; resetNext = true;
                }
            } else {
                if (current === '0' || resetNext) { current = val; resetNext = false; }
                else current += val;
            }
            update();
        });
    });
}

// ========== FILE MANAGER ==========
function fmRefresh(winId) {
    const grid = document.getElementById('fm-grid-' + winId);
    const count = document.getElementById('fm-count-' + winId);
    if (!grid) return;
    const files = FileSystem.list();
    if (count) count.textContent = files.length + ' file' + (files.length !== 1 ? 's' : '');
    
    if (files.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#999;padding:40px;">No files yet.<br>Create some in Notepad!</div>';
        return;
    }
    
    grid.innerHTML = '';
    files.forEach(function(name) {
        const item = document.createElement('div');
        item.className = 'fm-item';
        item.innerHTML = '<div class="fm-icon">📄</div><div class="fm-name">' + name + '</div><div class="fm-actions"><button class="fm-action-btn" onclick="fmView(\'' + winId + '\',\'' + name + '\')">👁️</button><button class="fm-action-btn" onclick="fmDelete(\'' + winId + '\',\'' + name + '\')">🗑️</button></div>';
        grid.appendChild(item);
    });
}

function fmView(winId, name) {
    playClick();
    const content = FileSystem.files[name] || '';
    alert('📄 ' + name + '\n\n' + content.substring(0, 500) + (content.length > 500 ? '...' : ''));
}

function fmDelete(winId, name) {
    if (confirm('Delete "' + name + '"?')) {
        FileSystem.delete(name);
        fmRefresh(winId);
        playClose();
    }
}

// ========== SNAKE GAME ==========
const snakeGames = {};

function initSnake(winId) {
    const canvas = document.getElementById('snake-' + winId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('snake-score-' + winId);
    
    const gridSize = 20;
    const tileCount = canvas.width / gridSize;
    
    let snake = [{x: 10, y: 10}];
    let food = {x: 15, y: 15};
    let dx = 0;
    let dy = 0;
    let score = 0;
    let gameOver = false;
    let interval = null;
    
    if (snakeGames[winId]) clearInterval(snakeGames[winId]);
    
    function draw() {
        ctx.fillStyle = '#fffef7';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#f5b7b1';
        ctx.beginPath();
        ctx.arc((food.x * gridSize) + gridSize/2, (food.y * gridSize) + gridSize/2, gridSize/2 - 2, 0, Math.PI*2);
        ctx.fill();
        
        snake.forEach(function(seg, i) {
            ctx.fillStyle = i === 0 ? '#abebc6' : '#8bd3dd';
            ctx.fillRect(seg.x * gridSize + 1, seg.y * gridSize + 1, gridSize - 2, gridSize - 2);
            ctx.strokeStyle = '#2d2d2d';
            ctx.lineWidth = 1;
            ctx.strokeRect(seg.x * gridSize + 1, seg.y * gridSize + 1, gridSize - 2, gridSize - 2);
        });
        
        if (gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#2d2d2d';
            ctx.font = 'bold 24px Baloo 2';
            ctx.textAlign = 'center';
            ctx.fillText('Game Over!', canvas.width/2, canvas.height/2);
            ctx.font = '16px Patrick Hand';
            ctx.fillText('Score: ' + score, canvas.width/2, canvas.height/2 + 30);
        }
    }
    
    function update() {
        if (gameOver) return;
        const head = {x: snake[0].x + dx, y: snake[0].y + dy};
        
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
            gameOver = true; playError(); draw(); return;
        }
        
        for (let i = 0; i < snake.length; i++) {
            if (snake[i].x === head.x && snake[i].y === head.y) {
                gameOver = true; playError(); draw(); return;
            }
        }
        
        snake.unshift(head);
        
        if (head.x === food.x && head.y === food.y) {
            score += 10;
            if (scoreEl) scoreEl.textContent = score;
            playPop();
            food = {x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount)};
        } else {
            snake.pop();
        }
        
        draw();
    }
    
    function keyHandler(e) {
        if (gameOver) return;
        switch(e.key) {
            case 'ArrowUp': if (dy === 0) { dx = 0; dy = -1; } break;
            case 'ArrowDown': if (dy === 0) { dx = 0; dy = 1; } break;
            case 'ArrowLeft': if (dx === 0) { dx = -1; dy = 0; } break;
            case 'ArrowRight': if (dx === 0) { dx = 1; dy = 0; } break;
        }
    }
    
    canvas.tabIndex = 0;
    canvas.focus();
    canvas.addEventListener('keydown', keyHandler);
    
    dx = 1; dy = 0;
    interval = setInterval(update, 120);
    snakeGames[winId] = interval;
    draw();
}
