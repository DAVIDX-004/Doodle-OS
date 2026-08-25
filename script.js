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

enterBtn.addEventListener('click', () => {
    welcomeScreen.classList.add('fade-out');
    setTimeout(() => {
        welcomeScreen.style.display = 'none';
        desktop.classList.remove('hidden');
    }, 600);
});

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

startBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    startMenu.classList.toggle('hidden');
});

document.addEventListener('click', (e) => {
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
    settings: {
        title: '⚙️ Settings',
        width: 400,
        height: 300,
        content: '<div style="padding:10px;"><h3 style="margin-bottom:12px;">Doodle OS Settings</h3><label style="display:block;margin-bottom:8px;"><input type="checkbox" checked> Show desktop icons</label><label style="display:block;margin-bottom:8px;"><input type="checkbox" checked> Play sounds</label><label style="display:block;margin-bottom:8px;">Theme:<select id="theme-select" style="font-family:inherit;padding:4px;border:2px solid #2d2d2d;border-radius:6px;"><option>Doodle Light</option><option>Doodle Dark</option></select></label><p style="margin-top:20px;color:#666;">More settings coming soon!</p></div>'
    },
    browser: {
        title: '🌐 Browser',
        width: 600,
        height: 400,
        content: '<div style="display:flex;flex-direction:column;height:100%;"><div style="display:flex;gap:8px;padding:8px;border-bottom:2px solid #2d2d2d;background:#fef6e4;"><button style="font-family:inherit;border:2px solid #2d2d2d;border-radius:6px;padding:4px 10px;background:#fff;cursor:pointer;">←</button><button style="font-family:inherit;border:2px solid #2d2d2d;border-radius:6px;padding:4px 10px;background:#fff;cursor:pointer;">→</button><input type="text" value="https://doodle.os/home" style="flex:1;font-family:inherit;border:2px solid #2d2d2d;border-radius:6px;padding:4px 10px;" readonly></div><div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:1.3rem;color:#999;">🚧 Browser under construction!<br><small style="font-size:0.9rem;">(It is just a doodle for now)</small></div></div>'
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
    win.style.left = (100 + windowCount * 30) + 'px';
    win.style.top = (60 + windowCount * 30) + 'px';
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
    
    win.addEventListener('mousedown', () => {
        win.style.zIndex = ++zIndexCounter;
    });

    makeDraggable(win);

    const taskItem = document.createElement('div');
    taskItem.className = 'taskbar-item active';
    taskItem.textContent = app.title.split(' ')[1] || app.title;
    taskItem.dataset.win = winId;
    taskItem.onclick = () => {
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
        setTimeout(() => notepadRefreshFiles('np-' + winId), 10);
    } else if (appName === 'terminal') {
        setTimeout(() => setupTerminal(win), 10);
    } else if (appName === 'settings') {
        setTimeout(() => {
            const themeSelect = win.querySelector('#theme-select');
            if (themeSelect) {
                const current = document.getElementById('desktop').getAttribute('data-theme');
                themeSelect.value = current === 'dark' ? 'Doodle Dark' : 'Doodle Light';
                themeSelect.addEventListener('change', (e) => {
                    const theme = e.target.value === 'Doodle Dark' ? 'dark' : 'light';
                    setTheme(theme);
                });
            }
        }, 10);
    }

    startMenu.classList.add('hidden');
}

// Window controls event delegation
windowsContainer.addEventListener('click', (e) => {
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
    win.style.transform = 'scale(0.9)';
    win.style.opacity = '0';
    setTimeout(() => {
        win.remove();
        const taskItem = document.querySelector('.taskbar-item[data-win="' + winId + '"]');
        if (taskItem) taskItem.remove();
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

    header.addEventListener('mousedown', (e) => {
        if (win.dataset.maximized === 'true') return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = win.offsetLeft;
        initialTop = win.offsetTop;
        win.style.zIndex = ++zIndexCounter;
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        win.style.left = (initialLeft + dx) + 'px';
        win.style.top = (initialTop + dy) + 'px';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

// ========== DESKTOP ICONS (Event Delegation) ==========
const desktopIconsContainer = document.querySelector('.desktop-icons');
if (desktopIconsContainer) {
    desktopIconsContainer.addEventListener('click', (e) => {
        const icon = e.target.closest('.desktop-icon');
        if (!icon) return;
        document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
        icon.classList.add('selected');
    });
    
    desktopIconsContainer.addEventListener('dblclick', (e) => {
        const icon = e.target.closest('.desktop-icon');
        if (!icon) return;
        openApp(icon.dataset.app);
    });
}

// ========== START MENU ITEMS ==========
document.querySelectorAll('.start-item[data-app]').forEach(item => {
    item.addEventListener('click', () => {
        openApp(item.dataset.app);
    });
});

// ========== SHUTDOWN ==========
document.getElementById('shutdown-btn').addEventListener('click', () => {
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
    const ta = document.getElementById(id);
    if (ta) ta.value = '';
    const status = document.getElementById(id + '-status');
    if (status) status.textContent = 'New file';
}

function notepadSave(id) {
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
            setTimeout(() => location.reload(), 1000);
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
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleCommand(input, input.value.trim());
            }
        });
    }
    
    const firstInput = termBody.querySelector('.terminal-input');
    if (firstInput) {
        firstInput.focus();
        firstInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleCommand(firstInput, firstInput.value.trim());
            }
        });
    }
}
