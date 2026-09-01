/**
 * @fileoverview Doodle OS — Core Desktop Simulation Architecture
 * A modern, modular desktop environment built with pure vanilla ES6+.
 *
 * Subsystems:
 * - StorageManager: Safe storage access with quota error handling.
 * - SoundSystem: Synthesizes system audio using the Web Audio API.
 * - VirtualDisk: File store persisted via localStorage.
 * - WindowManager: Dynamic window creation, dragging, layering, and tab sync.
 * - AppControllers: Native application logic (Notepad, Terminal, Calculator, etc.).
 * - DesktopEnvironment: Shell orchestration, start menu, calendar, and auth flow.
 */

'use strict';

(() => {
  // =========================================================================
  // 1. CONFIGURATION & CONSTANTS
  // =========================================================================

  const STORAGE_KEYS = Object.freeze({
    SOUND: 'doodleOS_sound',
    FILES: 'doodleOS_files',
    WALLPAPER: 'doodleOS_wallpaper',
    THEME: 'doodleOS_theme',
    SESSION: 'doodleOS_session'
  });

  const AUTH_CONFIG = Object.freeze({
    PASSWORD: 'doodle',
    USER_NAME: 'Muhammad Dawood',
    USER_ROLE: 'Administrator'
  });

  const APP_CONFIGS = Object.freeze({
    notepad: {
      title: 'Notepad',
      width: 560,
      height: 400
    },
    terminal: {
      title: 'Terminal',
      width: 540,
      height: 340
    },
    calculator: {
      title: 'Calculator',
      width: 320,
      height: 420
    },
    filemanager: {
      title: 'File Manager',
      width: 520,
      height: 380
    },
    snake: {
      title: 'Snake Game',
      width: 400,
      height: 480
    },
    browser: {
      title: 'Web Browser',
      width: 620,
      height: 420
    },
    settings: {
      title: 'Settings',
      width: 440,
      height: 380
    }
  });

  // =========================================================================
  // 2. STORAGE MANAGER (Resilient I/O)
  // =========================================================================

  /**
   * Safe storage access wrapper that guards against quota and privacy mode exceptions.
   */
  class StorageManager {
    /**
     * @param {string} key
     * @param {string|null} fallback
     * @returns {string|null}
     */
    static getLocal(key, fallback = null) {
      try {
        const item = localStorage.getItem(key);
        return item !== null ? item : fallback;
      } catch (err) {
        console.warn(`[StorageManager] Read error on key "${key}":`, err);
        return fallback;
      }
    }

    /**
     * @param {string} key
     * @param {string} value
     */
    static setLocal(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch (err) {
        console.warn(`[StorageManager] Write error on key "${key}":`, err);
      }
    }

    /**
     * @param {string} key
     * @param {string|null} fallback
     * @returns {string|null}
     */
    static getSession(key, fallback = null) {
      try {
        const item = sessionStorage.getItem(key);
        return item !== null ? item : fallback;
      } catch (err) {
        console.warn(`[StorageManager] Session read error on key "${key}":`, err);
        return fallback;
      }
    }

    /**
     * @param {string} key
     * @param {string} value
     */
    static setSession(key, value) {
      try {
        sessionStorage.setItem(key, value);
      } catch (err) {
        console.warn(`[StorageManager] Session write error on key "${key}":`, err);
      }
    }

    /**
     * @param {string} key
     */
    static removeSession(key) {
      try {
        sessionStorage.removeItem(key);
      } catch (err) {
        console.warn(`[StorageManager] Session remove error on key "${key}":`, err);
      }
    }
  }

  // =========================================================================
  // 3. SOUND SYNTHESIZER (Pure Web Audio)
  // =========================================================================

  /**
   * Lightweight audio synthesizer creating subtle UI feedback tones without external files.
   */
  class SoundSystem {
    constructor() {
      /** @type {AudioContext|null} */
      this.ctx = null;
      this.enabled = StorageManager.getLocal(STORAGE_KEYS.SOUND, 'true') !== 'false';
    }

    /**
     * Lazy-initializes AudioContext on the first genuine user gesture.
     */
    initContext() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioClass();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    /**
     * Generates a single envelope-modulated tone.
     * @param {number} freq - Pitch frequency in Hz
     * @param {OscillatorType} type - Waveform type
     * @param {number} duration - Tone duration in seconds
     * @param {number} volume - Master gain peak
     */
    playTone(freq, type = 'sine', duration = 0.08, volume = 0.05) {
      if (!this.enabled) return;
      this.initContext();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (err) {
        console.warn('[SoundSystem] Playback error:', err);
      }
    }

    playClick() {
      this.playTone(700, 'triangle', 0.04, 0.03);
    }

    playOpen() {
      this.playTone(480, 'sine', 0.08, 0.05);
      setTimeout(() => this.playTone(680, 'sine', 0.1, 0.05), 50);
    }

    playClose() {
      this.playTone(560, 'sine', 0.08, 0.05);
      setTimeout(() => this.playTone(380, 'sine', 0.1, 0.04), 50);
    }

    playSuccess() {
      this.playTone(520, 'sine', 0.06, 0.06);
      setTimeout(() => this.playTone(780, 'sine', 0.1, 0.06), 60);
    }

    playError() {
      this.playTone(220, 'sawtooth', 0.14, 0.08);
    }

    /**
     * @param {boolean} isEnabled
     */
    setEnabled(isEnabled) {
      this.enabled = isEnabled;
      StorageManager.setLocal(STORAGE_KEYS.SOUND, String(isEnabled));
    }
  }

  const sound = new SoundSystem();

  // =========================================================================
  // 4. VIRTUAL FILE SYSTEM
  // =========================================================================

  /**
   * Key-value file storage backed by localStorage.
   */
  class VirtualDisk {
    constructor() {
      /** @type {Record<string, string>} */
      this.files = {};
      this.load();
    }

    load() {
      const data = StorageManager.getLocal(STORAGE_KEYS.FILES);
      if (data) {
        try {
          this.files = JSON.parse(data);
        } catch (e) {
          console.error('[VirtualDisk] Parse failure:', e);
          this.files = {};
        }
      }
    }

    save() {
      StorageManager.setLocal(STORAGE_KEYS.FILES, JSON.stringify(this.files));
    }

    /**
     * @param {string} filename
     * @param {string} content
     */
    write(filename, content) {
      this.files[filename] = content;
      this.save();
    }

    /**
     * @param {string} filename
     * @returns {string|null}
     */
    read(filename) {
      return Object.prototype.hasOwnProperty.call(this.files, filename) ? this.files[filename] : null;
    }

    /**
     * @param {string} filename
     */
    remove(filename) {
      delete this.files[filename];
      this.save();
    }

    /**
     * @returns {string[]}
     */
    list() {
      return Object.keys(this.files);
    }
  }

  const disk = new VirtualDisk();

  // =========================================================================
  // 5. WINDOW MANAGER
  // =========================================================================

  /**
   * Manages desktop window spawning, dragging, stacking, and taskbar synchronization.
   */
  class WindowManager {
    constructor() {
      this.container = document.getElementById('windows-container');
      this.taskbarApps = document.getElementById('taskbar-apps');
      this.windowCount = 0;
      this.topZIndex = 100;

      /** @type {Map<string, Function>} Cleanup callbacks registered per window */
      this.cleanups = new Map();

      this.initWindowControls();
    }

    /**
     * Event delegation for window header control buttons.
     */
    initWindowControls() {
      this.container.addEventListener('click', (e) => {
        const btn = e.target.closest('.window-btn');
        if (!btn) return;

        const action = btn.dataset.action;
        const winId = btn.dataset.win;

        if (action === 'close') this.closeWindow(winId);
        if (action === 'minimize') this.minimizeWindow(winId);
        if (action === 'maximize') this.maximizeWindow(winId);
      });
    }

    /**
     * Open an application window.
     * @param {string} appKey
     */
    openWindow(appKey) {
      const config = APP_CONFIGS[appKey];
      if (!config) return;

      this.windowCount += 1;
      const windowId = `win-${this.windowCount}`;
      this.topZIndex += 1;

      // 1. Build window shell
      const win = document.createElement('div');
      win.className = 'window';
      win.id = windowId;
      win.dataset.app = appKey;
      win.style.width = `${config.width}px`;
      win.style.height = `${config.height}px`;

      const offset = (this.windowCount % 8) * 26;
      win.style.left = `${Math.min(window.innerWidth - config.width - 24, 80 + offset)}px`;
      win.style.top = `${Math.min(window.innerHeight - config.height - 70, 50 + offset)}px`;
      win.style.zIndex = String(this.topZIndex);

      win.innerHTML = `
        <div class="window-header" data-win="${windowId}">
          <span class="window-title">${config.title}</span>
          <div class="window-controls">
            <button type="button" class="window-btn btn-minimize" data-action="minimize" data-win="${windowId}" aria-label="Minimize"></button>
            <button type="button" class="window-btn btn-maximize" data-action="maximize" data-win="${windowId}" aria-label="Maximize"></button>
            <button type="button" class="window-btn btn-close" data-action="close" data-win="${windowId}" aria-label="Close"></button>
          </div>
        </div>
        <div class="window-body" id="body-${windowId}"></div>
      `;

      this.container.appendChild(win);

      // 2. Bring window to front on mousedown
      win.addEventListener('mousedown', () => this.bringToFront(win));

      // 3. Attach dragging handler
      this.setupDragging(win);

      // 4. Create Taskbar Chip
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'taskbar-chip active';
      chip.textContent = config.title;
      chip.dataset.win = windowId;
      chip.addEventListener('click', () => this.toggleWindow(windowId, chip));
      this.taskbarApps.appendChild(chip);

      // 5. Mount Application
      const body = win.querySelector(`#body-${windowId}`);
      AppRouter.mount(appKey, windowId, body, (cleanupFn) => {
        if (typeof cleanupFn === 'function') {
          this.cleanups.set(windowId, cleanupFn);
        }
      });

      sound.playOpen();
      DesktopEnvironment.closeStartMenu();
    }

    /**
     * @param {HTMLElement} win
     */
    bringToFront(win) {
      this.topZIndex += 1;
      win.style.zIndex = String(this.topZIndex);

      const chip = this.taskbarApps.querySelector(`.taskbar-chip[data-win="${win.id}"]`);
      if (chip) {
        this.taskbarApps.querySelectorAll('.taskbar-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
      }
    }

    /**
     * @param {string} windowId
     */
    closeWindow(windowId) {
      const win = document.getElementById(windowId);
      if (!win) return;

      sound.playClose();
      win.classList.add('window-closing');

      // Trigger app cleanup callbacks (e.g. game loops, key listeners)
      if (this.cleanups.has(windowId)) {
        try {
          this.cleanups.get(windowId)();
        } catch (e) {
          console.error('[WindowManager] Cleanup error:', e);
        }
        this.cleanups.delete(windowId);
      }

      setTimeout(() => {
        win.remove();
        const chip = this.taskbarApps.querySelector(`.taskbar-chip[data-win="${windowId}"]`);
        if (chip) chip.remove();
      }, 150);
    }

    /**
     * @param {string} windowId
     */
    minimizeWindow(windowId) {
      const win = document.getElementById(windowId);
      const chip = this.taskbarApps.querySelector(`.taskbar-chip[data-win="${windowId}"]`);
      if (win) {
        win.style.display = 'none';
        win.classList.add('minimized');
        if (chip) chip.classList.remove('active');
      }
    }

    /**
     * @param {string} windowId
     * @param {HTMLElement} chip
     */
    toggleWindow(windowId, chip) {
      const win = document.getElementById(windowId);
      if (!win) return;

      if (win.classList.contains('minimized') || win.style.display === 'none') {
        win.classList.remove('minimized');
        win.style.display = 'flex';
        this.bringToFront(win);
      } else if (chip.classList.contains('active')) {
        this.minimizeWindow(windowId);
      } else {
        this.bringToFront(win);
      }
    }

    /**
     * @param {string} windowId
     */
    maximizeWindow(windowId) {
      const win = document.getElementById(windowId);
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
        win.style.height = 'calc(100vh - 48px)';
        win.style.left = '0px';
        win.style.top = '0px';
        win.dataset.maximized = 'true';
      }
      this.bringToFront(win);
    }

    /**
     * Implements document-level drag listeners to prevent mouse slippage.
     * @param {HTMLElement} win
     */
    setupDragging(win) {
      const header = win.querySelector('.window-header');
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let initX = 0;
      let initY = 0;

      const onMouseMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        win.style.left = `${initX + dx}px`;
        win.style.top = `${initY + dy}px`;
      };

      const onMouseUp = () => {
        if (isDragging) {
          isDragging = false;
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        }
      };

      header.addEventListener('mousedown', (e) => {
        if (e.target.closest('.window-btn')) return;
        if (win.dataset.maximized === 'true') return;

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initX = win.offsetLeft;
        initY = win.offsetTop;
        this.bringToFront(win);

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });
    }
  }

  const windowManager = new WindowManager();

  // =========================================================================
  // 6. APPLICATION ROUTER & CONTROLLERS
  // =========================================================================

  class AppRouter {
    /**
     * @param {string} appKey
     * @param {string} windowId
     * @param {HTMLElement} container
     * @param {Function} registerCleanup
     */
    static mount(appKey, windowId, container, registerCleanup) {
      switch (appKey) {
        case 'notepad':
          this.mountNotepad(windowId, container);
          break;
        case 'terminal':
          this.mountTerminal(windowId, container, registerCleanup);
          break;
        case 'calculator':
          this.mountCalculator(windowId, container);
          break;
        case 'filemanager':
          this.mountFileManager(windowId, container);
          break;
        case 'snake':
          this.mountSnake(windowId, container, registerCleanup);
          break;
        case 'browser':
          this.mountBrowser(windowId, container);
          break;
        case 'settings':
          this.mountSettings(windowId, container);
          break;
        default:
          container.textContent = 'Application initialized.';
      }
    }

    // --- APP: NOTEPAD ---
    static mountNotepad(windowId, container) {
      container.innerHTML = `
        <div class="notepad-layout">
          <div class="notepad-toolbar">
            <button type="button" class="tool-btn" id="${windowId}-new">New</button>
            <button type="button" class="tool-btn" id="${windowId}-save">Save</button>
            <select class="tool-select" id="${windowId}-files" aria-label="Open File">
              <option value="">Open...</option>
            </select>
            <span class="tool-status" id="${windowId}-status" aria-live="polite">Ready</span>
          </div>
          <textarea id="${windowId}-text" class="notepad-textarea" placeholder="Type your notes here..."></textarea>
        </div>
      `;

      const textarea = container.querySelector(`#${windowId}-text`);
      const status = container.querySelector(`#${windowId}-status`);
      const fileSelect = container.querySelector(`#${windowId}-files`);
      const btnNew = container.querySelector(`#${windowId}-new`);
      const btnSave = container.querySelector(`#${windowId}-save`);

      const refreshFiles = () => {
        fileSelect.innerHTML = '<option value="">Open...</option>';
        disk.list().forEach((f) => {
          const opt = document.createElement('option');
          opt.value = f;
          opt.textContent = f;
          fileSelect.appendChild(opt);
        });
      };

      btnNew.addEventListener('click', () => {
        sound.playClick();
        textarea.value = '';
        status.textContent = 'New file';
      });

      btnSave.addEventListener('click', () => {
        sound.playSuccess();
        const filename = prompt('Enter document name:', 'note.txt');
        if (!filename) return;

        disk.write(filename.trim(), textarea.value);
        refreshFiles();
        status.textContent = `Saved ${filename.trim()}`;
      });

      fileSelect.addEventListener('change', (e) => {
        const file = e.target.value;
        if (!file) return;
        sound.playClick();
        textarea.value = disk.read(file) || '';
        status.textContent = `Opened ${file}`;
      });

      refreshFiles();
    }

    // --- APP: TERMINAL ---
    static mountTerminal(windowId, container, registerCleanup) {
      container.innerHTML = `
        <div class="terminal-container" id="term-${windowId}">
          <div>Doodle OS Shell v1.0.0 (x86_64-web)</div>
          <div>Type 'help' for available commands.</div>
          <div class="terminal-line">
            <span class="terminal-prompt">user@doodle:~$</span>
            <input type="text" class="terminal-input" autofocus aria-label="Terminal Input" />
          </div>
        </div>
      `;

      const term = container.querySelector(`#term-${windowId}`);

      const processCommand = (inputEl, rawCmd) => {
        inputEl.disabled = true;
        const cmd = rawCmd.trim();
        const lower = cmd.toLowerCase();
        let output = '';

        if (lower === 'help') {
          output = 'Commands: help, date, clear, echo [text], whoami, reboot, ls, cat [file]';
        } else if (lower === 'date') {
          output = new Date().toUTCString();
        } else if (lower === 'clear') {
          term.innerHTML = '';
          createPrompt();
          return;
        } else if (lower === 'whoami') {
          output = `${AUTH_CONFIG.USER_NAME} (${AUTH_CONFIG.USER_ROLE})`;
        } else if (lower === 'reboot') {
          output = 'Rebooting system...';
          setTimeout(() => location.reload(), 600);
        } else if (lower === 'ls') {
          const files = disk.list();
          output = files.length > 0 ? files.join('   ') : 'No files found.';
        } else if (lower.startsWith('cat ')) {
          const file = cmd.slice(4).trim();
          const content = disk.read(file);
          output = content !== null ? content : `cat: ${file}: No such file`;
        } else if (lower.startsWith('echo ')) {
          output = cmd.slice(5);
        } else if (cmd === '') {
          output = '';
        } else {
          output = `Command not recognized: "${cmd}". Type 'help' for assistance.`;
        }

        if (output) {
          const outLine = document.createElement('div');
          outLine.textContent = output;
          term.appendChild(outLine);
        }

        createPrompt();
      };

      const createPrompt = () => {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.innerHTML = `
          <span class="terminal-prompt">user@doodle:~$</span>
          <input type="text" class="terminal-input" />
        `;
        term.appendChild(line);
        term.scrollTop = term.scrollHeight;

        const nextInput = line.querySelector('.terminal-input');
        nextInput.focus();
        nextInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') processCommand(nextInput, nextInput.value);
        });
      };

      const firstInput = term.querySelector('.terminal-input');
      if (firstInput) {
        firstInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') processCommand(firstInput, firstInput.value);
        });
      }

      registerCleanup(() => {
        term.innerHTML = '';
      });
    }

    // --- APP: CALCULATOR ---
    static mountCalculator(windowId, container) {
      container.innerHTML = `
        <div class="calc-layout">
          <div class="calc-screen" id="${windowId}-calc-screen" aria-live="polite">0</div>
          <div class="calc-grid">
            <button type="button" class="calc-key key-clear">C</button>
            <button type="button" class="calc-key key-op">÷</button>
            <button type="button" class="calc-key key-op">×</button>
            <button type="button" class="calc-key">⌫</button>
            <button type="button" class="calc-key">7</button>
            <button type="button" class="calc-key">8</button>
            <button type="button" class="calc-key">9</button>
            <button type="button" class="calc-key key-op">-</button>
            <button type="button" class="calc-key">4</button>
            <button type="button" class="calc-key">5</button>
            <button type="button" class="calc-key">6</button>
            <button type="button" class="calc-key key-op">+</button>
            <button type="button" class="calc-key">1</button>
            <button type="button" class="calc-key">2</button>
            <button type="button" class="calc-key">3</button>
            <button type="button" class="calc-key key-eq">=</button>
            <button type="button" class="calc-key key-zero">0</button>
            <button type="button" class="calc-key">.</button>
          </div>
        </div>
      `;

      const screen = container.querySelector(`#${windowId}-calc-screen`);
      let currentVal = '0';
      let storedOperand = null;
      let activeOperator = null;
      let resetOnNextInput = false;

      const updateDisplay = () => {
        screen.textContent = currentVal;
      };

      container.querySelector('.calc-grid').addEventListener('click', (e) => {
        const btn = e.target.closest('.calc-key');
        if (!btn) return;
        sound.playClick();

        const key = btn.textContent.trim();

        if (key === 'C') {
          currentVal = '0';
          storedOperand = null;
          activeOperator = null;
          resetOnNextInput = false;
        } else if (key === '⌫') {
          currentVal = currentVal.length > 1 ? currentVal.slice(0, -1) : '0';
        } else if (['+', '-', '×', '÷'].includes(key)) {
          storedOperand = parseFloat(currentVal);
          activeOperator = key;
          resetOnNextInput = true;
        } else if (key === '=') {
          if (activeOperator && storedOperand !== null) {
            const currentNum = parseFloat(currentVal);
            let res = 0;

            if (activeOperator === '+') res = storedOperand + currentNum;
            if (activeOperator === '-') res = storedOperand - currentNum;
            if (activeOperator === '×') res = storedOperand * currentNum;
            if (activeOperator === '÷') res = currentNum === 0 ? 'Error' : storedOperand / currentNum;

            currentVal = String(res);
            activeOperator = null;
            storedOperand = null;
            resetOnNextInput = true;
          }
        } else {
          if (currentVal === '0' || resetOnNextInput) {
            currentVal = key === '.' ? '0.' : key;
            resetOnNextInput = false;
          } else {
            if (key === '.' && currentVal.includes('.')) return;
            currentVal += key;
          }
        }
        updateDisplay();
      });
    }

    // --- APP: FILE MANAGER ---
    static mountFileManager(windowId, container) {
      container.innerHTML = `
        <div class="fm-layout">
          <div class="fm-toolbar">
            <span class="fm-count" id="${windowId}-fm-count">0 items</span>
            <button type="button" class="tool-btn" id="${windowId}-fm-refresh">Refresh</button>
          </div>
          <div class="fm-grid" id="${windowId}-fm-grid"></div>
        </div>
      `;

      const grid = container.querySelector(`#${windowId}-fm-grid`);
      const countEl = container.querySelector(`#${windowId}-fm-count`);
      const btnRefresh = container.querySelector(`#${windowId}-fm-refresh`);

      const renderGrid = () => {
        const files = disk.list();
        countEl.textContent = `${files.length} document${files.length === 1 ? '' : 's'}`;

        if (files.length === 0) {
          grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;color:var(--text-dim);padding:32px;">
              No documents created yet.<br>Save files in Notepad to populate.
            </div>
          `;
          return;
        }

        grid.innerHTML = '';
        files.forEach((name) => {
          const card = document.createElement('div');
          card.className = 'fm-card';
          card.innerHTML = `
            <svg class="fm-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <div class="fm-name">${name}</div>
            <div class="fm-actions">
              <button type="button" class="fm-btn btn-view" title="View">View</button>
              <button type="button" class="fm-btn btn-delete" title="Delete">Delete</button>
            </div>
          `;

          card.querySelector('.btn-view').addEventListener('click', () => {
            sound.playClick();
            const text = disk.read(name) || '';
            alert(`Document: ${name}\n\n${text}`);
          });

          card.querySelector('.btn-delete').addEventListener('click', () => {
            if (confirm(`Delete "${name}"?`)) {
              disk.remove(name);
              sound.playClose();
              renderGrid();
            }
          });

          grid.appendChild(card);
        });
      };

      btnRefresh.addEventListener('click', () => {
        sound.playClick();
        renderGrid();
      });

      renderGrid();
    }

    // --- APP: SNAKE GAME ---
    static mountSnake(windowId, container, registerCleanup) {
      container.innerHTML = `
        <div class="snake-layout">
          <div class="snake-header">Score: <span id="${windowId}-score">0</span></div>
          <canvas id="${windowId}-canvas" class="snake-canvas" width="340" height="340" tabindex="0"></canvas>
          <button type="button" class="btn btn-primary" id="${windowId}-restart">Start / Restart Game</button>
        </div>
      `;

      const canvas = container.querySelector(`#${windowId}-canvas`);
      const scoreEl = container.querySelector(`#${windowId}-score`);
      const btnRestart = container.querySelector(`#${windowId}-restart`);
      const ctx = canvas.getContext('2d');

      const GRID_SIZE = 17;
      const TILE_COUNT = canvas.width / GRID_SIZE;

      let snake = [{ x: 10, y: 10 }];
      let food = { x: 5, y: 5 };
      let vx = 1;
      let vy = 0;
      let score = 0;
      let isDead = false;
      let gameInterval = null;

      const draw = () => {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Food
        ctx.fillStyle = '#14b8a6';
        ctx.beginPath();
        ctx.arc(
          food.x * GRID_SIZE + GRID_SIZE / 2,
          food.y * GRID_SIZE + GRID_SIZE / 2,
          GRID_SIZE / 2 - 2,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Draw Snake
        snake.forEach((seg, idx) => {
          ctx.fillStyle = idx === 0 ? '#2563eb' : '#3b82f6';
          ctx.fillRect(seg.x * GRID_SIZE + 1, seg.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);
        });

        if (isDead) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#ffffff';
          ctx.font = '600 20px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 8);
          ctx.font = '400 14px Inter, sans-serif';
          ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 18);
        }
      };

      const step = () => {
        if (isDead) return;

        const head = { x: snake[0].x + vx, y: snake[0].y + vy };

        // Wall collisions
        if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
          endGame();
          return;
        }

        // Self collisions
        for (let i = 0; i < snake.length; i += 1) {
          if (snake[i].x === head.x && snake[i].y === head.y) {
            endGame();
            return;
          }
        }

        snake.unshift(head);

        // Food consumption
        if (head.x === food.x && head.y === food.y) {
          score += 10;
          scoreEl.textContent = String(score);
          sound.playSuccess();
          food = {
            x: Math.floor(Math.random() * TILE_COUNT),
            y: Math.floor(Math.random() * TILE_COUNT)
          };
        } else {
          snake.pop();
        }

        draw();
      };

      const endGame = () => {
        isDead = true;
        if (gameInterval) clearInterval(gameInterval);
        sound.playError();
        draw();
      };

      const onKeyDown = (e) => {
        if (isDead) return;
        if (['ArrowUp', 'KeyW'].includes(e.code) && vy === 0) {
          vx = 0; vy = -1; e.preventDefault();
        } else if (['ArrowDown', 'KeyS'].includes(e.code) && vy === 0) {
          vx = 0; vy = 1; e.preventDefault();
        } else if (['ArrowLeft', 'KeyA'].includes(e.code) && vx === 0) {
          vx = -1; vy = 0; e.preventDefault();
        } else if (['ArrowRight', 'KeyD'].includes(e.code) && vx === 0) {
          vx = 1; vy = 0; e.preventDefault();
        }
      };

      const start = () => {
        if (gameInterval) clearInterval(gameInterval);
        snake = [{ x: 10, y: 10 }];
        food = { x: 5, y: 5 };
        vx = 1;
        vy = 0;
        score = 0;
        isDead = false;
        scoreEl.textContent = '0';
        canvas.focus();
        draw();
        gameInterval = setInterval(step, 110);
      };

      canvas.addEventListener('keydown', onKeyDown);
      btnRestart.addEventListener('click', () => {
        sound.playClick();
        start();
      });

      start();

      // Clean up event listeners & intervals on window close to prevent leaks
      registerCleanup(() => {
        if (gameInterval) clearInterval(gameInterval);
        canvas.removeEventListener('keydown', onKeyDown);
      });
    }

    // --- APP: BROWSER ---
    static mountBrowser(windowId, container) {
      container.innerHTML = `
        <div class="browser-layout">
          <div class="browser-bar">
            <button type="button" class="tool-btn" id="${windowId}-home">Home</button>
            <input type="text" class="browser-url-input" id="${windowId}-url" placeholder="Search Google or enter a website address..." />
            <button type="button" class="btn btn-primary" id="${windowId}-go">Go</button>
          </div>
          <div class="browser-view">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>Type a URL above to browse the web</span>
          </div>
        </div>
      `;

      const input = container.querySelector(`#${windowId}-url`);
      const btnGo = container.querySelector(`#${windowId}-go`);
      const btnHome = container.querySelector(`#${windowId}-home`);

      const navigate = () => {
        const query = input.value.trim();
        if (!query) return;

        let target = query;
        if (!/^https?:\/\//i.test(query)) {
          if (query.includes('.') && !query.includes(' ')) {
            target = `https://${query}`;
          } else {
            target = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
          }
        }
        window.open(target, '_blank', 'noopener,noreferrer');
      };

      btnGo.addEventListener('click', navigate);
      btnHome.addEventListener('click', () => {
        window.open('https://google.com', '_blank', 'noopener,noreferrer');
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') navigate();
      });
    }

    // --- APP: SETTINGS ---
    static mountSettings(windowId, container) {
      container.innerHTML = `
        <div class="settings-layout">
          <div>
            <div class="settings-section-title">Preferences</div>
            <div class="settings-row" style="margin-top: 8px;">
              <span class="settings-label">System Sound Effects</span>
              <input type="checkbox" class="settings-toggle" id="${windowId}-sound" ${sound.enabled ? 'checked' : ''} />
            </div>
          </div>

          <div>
            <div class="settings-section-title">Appearance</div>
            <div class="settings-row" style="margin-top: 8px;">
              <span class="settings-label">Color Theme</span>
              <select class="tool-select" id="${windowId}-theme">
                <option value="light">Mixed Light (Default)</option>
                <option value="dark">Dark Theme</option>
              </select>
            </div>
          </div>

          <div>
            <div class="settings-section-title">Desktop Pattern</div>
            <div class="wp-swatches">
              <button type="button" class="wp-swatch" data-wp="dots">Dots</button>
              <button type="button" class="wp-swatch" data-wp="grid">Grid</button>
              <button type="button" class="wp-swatch" data-wp="lines">Lines</button>
              <button type="button" class="wp-swatch" data-wp="crosses">Crosses</button>
              <button type="button" class="wp-swatch" data-wp="clean">Solid</button>
            </div>
          </div>
        </div>
      `;

      const soundCheck = container.querySelector(`#${windowId}-sound`);
      const themeSelect = container.querySelector(`#${windowId}-theme`);

      themeSelect.value = StorageManager.getLocal(STORAGE_KEYS.THEME, 'light');

      soundCheck.addEventListener('change', (e) => {
        sound.setEnabled(e.target.checked);
      });

      themeSelect.addEventListener('change', (e) => {
        DesktopEnvironment.applyTheme(e.target.value);
      });

      container.querySelectorAll('.wp-swatch').forEach((btn) => {
        btn.addEventListener('click', () => {
          sound.playClick();
          DesktopEnvironment.applyWallpaper(btn.dataset.wp);
        });
      });
    }
  }

  // =========================================================================
  // 7. CALENDAR FLYOUT
  // =========================================================================

  class CalendarFlyout {
    constructor() {
      this.popup = document.getElementById('calendar-popup');
      this.toggleBtn = document.getElementById('calendar-btn');
      this.titleEl = document.getElementById('cal-month-year');
      this.gridEl = document.getElementById('cal-days');

      this.initEvents();
    }

    initEvents() {
      this.toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sound.playClick();
        const isHidden = this.popup.classList.toggle('hidden');
        this.toggleBtn.setAttribute('aria-expanded', String(!isHidden));
        if (!isHidden) this.render();
      });

      document.addEventListener('click', (e) => {
        if (!this.popup.contains(e.target) && e.target !== this.toggleBtn) {
          this.popup.classList.add('hidden');
          this.toggleBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    render() {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      this.titleEl.textContent = `${months[month]} ${year}`;

      const firstDay = new Date(year, month, 1).getDay();
      const totalDays = new Date(year, month + 1, 0).getDate();
      const today = now.getDate();

      const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
      let html = daysOfWeek.map((d) => `<div class="cal-day-label">${d}</div>`).join('');

      for (let i = 0; i < firstDay; i += 1) {
        html += '<div class="cal-cell empty"></div>';
      }

      for (let day = 1; day <= totalDays; day += 1) {
        const isToday = day === today;
        html += `<div class="cal-cell ${isToday ? 'today' : ''}">${day}</div>`;
      }

      this.gridEl.innerHTML = html;
    }
  }

  // =========================================================================
  // 8. DESKTOP ENVIRONMENT CONTROLLER
  // =========================================================================

  class DesktopEnvironment {
    static initialize() {
      this.desktop = document.getElementById('desktop');
      this.startMenu = document.getElementById('start-menu');
      this.startBtn = document.getElementById('start-btn');
      this.shutdownBtn = document.getElementById('shutdown-btn');
      this.clockEl = document.getElementById('clock');

      this.loadPreferences();
      this.initAuth();
      this.initShortcuts();
      this.initStartMenu();
      this.startClock();
      new CalendarFlyout();
    }

    static loadPreferences() {
      const savedTheme = StorageManager.getLocal(STORAGE_KEYS.THEME, 'light');
      this.applyTheme(savedTheme);

      const savedWallpaper = StorageManager.getLocal(STORAGE_KEYS.WALLPAPER, 'dots');
      this.applyWallpaper(savedWallpaper);
    }

    static applyTheme(theme) {
      this.desktop.setAttribute('data-theme', theme);
      document.body.setAttribute('data-theme', theme);
      StorageManager.setLocal(STORAGE_KEYS.THEME, theme);
    }

    static applyWallpaper(pattern) {
      this.desktop.setAttribute('data-wallpaper', pattern || 'dots');
      StorageManager.setLocal(STORAGE_KEYS.WALLPAPER, pattern || 'dots');
    }

    static closeStartMenu() {
      if (this.startMenu) {
        this.startMenu.classList.add('hidden');
        this.startBtn.setAttribute('aria-expanded', 'false');
      }
    }

    static initAuth() {
      const loginOverlay = document.getElementById('login-screen');
      const welcomeOverlay = document.getElementById('welcome-screen');
      const loginForm = document.getElementById('login-form');
      const passwordInput = document.getElementById('login-password');
      const enterBtn = document.getElementById('enter-btn');

      // Check for active session
      if (StorageManager.getSession(STORAGE_KEYS.SESSION) === 'true') {
        loginOverlay.style.display = 'none';
        welcomeOverlay.classList.remove('hidden');
      }

      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (passwordInput.value === AUTH_CONFIG.PASSWORD) {
          sound.playOpen();
          StorageManager.setSession(STORAGE_KEYS.SESSION, 'true');
          loginOverlay.classList.add('fade-out');

          setTimeout(() => {
            loginOverlay.style.display = 'none';
            welcomeOverlay.classList.remove('hidden');
          }, 400);
        } else {
          sound.playError();
          passwordInput.style.borderColor = 'var(--accent-danger)';
          passwordInput.value = '';
          passwordInput.placeholder = 'Invalid password';

          setTimeout(() => {
            passwordInput.style.borderColor = '';
            passwordInput.placeholder = 'Enter password';
          }, 1200);
        }
      });

      enterBtn.addEventListener('click', () => {
        sound.playOpen();
        welcomeOverlay.classList.add('fade-out');

        setTimeout(() => {
          welcomeOverlay.style.display = 'none';
          this.desktop.classList.remove('hidden');
        }, 400);
      });
    }

    static initShortcuts() {
      const grid = document.querySelector('.desktop-grid');
      if (!grid) return;

      grid.addEventListener('click', (e) => {
        const item = e.target.closest('.desktop-shortcut');
        if (!item) return;

        sound.playClick();
        grid.querySelectorAll('.desktop-shortcut').forEach((el) => el.classList.remove('selected'));
        item.classList.add('selected');
      });

      grid.addEventListener('dblclick', (e) => {
        const item = e.target.closest('.desktop-shortcut');
        if (!item) return;
        windowManager.openWindow(item.dataset.app);
      });

      grid.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const item = e.target.closest('.desktop-shortcut');
          if (item) windowManager.openWindow(item.dataset.app);
        }
      });
    }

    static initStartMenu() {
      this.startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sound.playClick();
        const isHidden = this.startMenu.classList.toggle('hidden');
        this.startBtn.setAttribute('aria-expanded', String(!isHidden));
      });

      document.addEventListener('click', (e) => {
        if (!this.startMenu.contains(e.target) && e.target !== this.startBtn) {
          this.closeStartMenu();
        }
      });

      this.startMenu.querySelectorAll('.start-menu-item[data-app]').forEach((btn) => {
        btn.addEventListener('click', () => {
          windowManager.openWindow(btn.dataset.app);
        });
      });

      this.shutdownBtn.addEventListener('click', () => {
        sound.playClose();
        StorageManager.removeSession(STORAGE_KEYS.SESSION);
        document.body.innerHTML = `
          <div style="height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;background:#0f172a;color:#f8fafc;">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
            <h2 style="font-weight:600;font-size:1.25rem;">Doodle OS Shut Down</h2>
            <p style="color:#94a3b8;font-size:0.875rem;">You can safely close this browser tab.</p>
          </div>
        `;
      });
    }

    static startClock() {
      const tick = () => {
        const now = new Date();
        this.clockEl.textContent = now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      };
      setInterval(tick, 1000);
      tick();
    }
  }

  // =========================================================================
  // 9. DOM INITIALIZATION
  // =========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    DesktopEnvironment.initialize();
  });
})();
