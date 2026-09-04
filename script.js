


var zIndex = 100;
var windowCount = 0;
var activeWindows = {};
var snakeIntervals = {};
var calcData = {};


window.onload = function() {
  if(sessionStorage.getItem("doodle_logged_in") == "yes") {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("welcome-screen").style.display = "flex";
  }
};


function doLogin() {
  var pw = document.getElementById("login-password").value;
  if(pw == "doodle") {
    sessionStorage.setItem("doodle_logged_in", "yes");
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("welcome-screen").style.display = "flex";
  } else {
    alert("Wrong password! Try doodle");
    document.getElementById("login-password").value = "";
  }
  return false; 
}

function enterDesktop() {
  document.getElementById("welcome-screen").style.display = "none";
  document.getElementById("desktop").style.display = "block";
  renderCalendar();
  startClock();
}


function startClock() {
  function tick() {
    var now = new Date();
    var h = now.getHours();
    var m = now.getMinutes();
    var ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if(h == 0) h = 12;
    if(m < 10) m = "0" + m;
    document.getElementById("clock").innerHTML = h + ":" + m + " " + ampm;
  }
  tick();
  setInterval(tick, 1000);
}


function toggleStartMenu() {
  var menu = document.getElementById("start-menu");
  if(menu.style.display == "none") {
    menu.style.display = "block";
  } else {
    menu.style.display = "none";
  }
}


function toggleCalendar() {
  var cal = document.getElementById("calendar-popup");
  if(cal.style.display == "none") {
    cal.style.display = "block";
    renderCalendar();
  } else {
    cal.style.display = "none";
  }
}

function renderCalendar() {
  var now = new Date();
  var year = now.getFullYear();
  var month = now.getMonth();
  var day = now.getDate();

  var months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  document.getElementById("cal-header").innerHTML = months[month] + " " + year;

  var firstDay = new Date(year, month, 1).getDay();
  var daysInMonth = new Date(year, month + 1, 0).getDate();

  var html = "<tr>";
  var weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  for(var i = 0; i < weekdays.length; i++) {
    html += "<th>" + weekdays[i] + "</th>";
  }
  html += "</tr><tr>";

  for(var i = 0; i < firstDay; i++) {
    html += "<td></td>";
  }

  for(var d = 1; d <= daysInMonth; d++) {
    if((firstDay + d - 1) % 7 == 0 && d > 1) {
      html += "</tr><tr>";
    }
    if(d == day) {
      html += "<td class='today'>" + d + "</td>";
    } else {
      html += "<td>" + d + "</td>";
    }
  }

  html += "</tr>";
  document.getElementById("cal-table").innerHTML = html;
}


function openApp(appName) {
  windowCount = windowCount + 1;
  var winId = "window-" + windowCount;
  zIndex = zIndex + 1;

  var titles = {
    notepad: "Notepad",
    terminal: "Terminal",
    calculator: "Calculator",
    files: "File Manager",
    snake: "Snake Game",
    browser: "Browser",
    settings: "Settings"
  };

  var w = 500;
  var h = 350;
  if(appName == "calculator") { w = 260; h = 380; }
  if(appName == "snake") { w = 370; h = 450; }
  if(appName == "settings") { w = 350; h = 300; }
  if(appName == "browser") { w = 550; h = 350; }

  var offset = (windowCount % 6) * 25;
  var left = 100 + offset;
  var top = 40 + offset;
  if(left + w > window.innerWidth) left = window.innerWidth - w - 20;
  if(top + h > window.innerHeight - 42) top = window.innerHeight - h - 60;

  var win = document.createElement("div");
  win.className = "window";
  win.id = winId;
  win.style.width = w + "px";
  win.style.height = h + "px";
  win.style.left = left + "px";
  win.style.top = top + "px";
  win.style.zIndex = zIndex;

  
  win.innerHTML = "<div class='window-header' onmousedown='startDrag(event, \"" + winId + "\")'>" +
    "<span class='window-title'>" + titles[appName] + "</span>" +
    "<div class='window-controls'>" +
    "<button class='btn-minimize' onclick='minimizeWindow(\"" + winId + "\")' title='Minimize'>&#8722;</button>" +
    "<button class='btn-maximize' onclick='maximizeWindow(\"" + winId + "\")' title='Maximize'>&#9633;</button>" +
    "<button class='btn-close' onclick='closeWindow(\"" + winId + "\")' title='Close'>&#215;</button>" +
    "</div></div>" +
    "<div class='window-body' id='" + winId + "-body'></div>";

  document.getElementById("windows-container").appendChild(win);

  
  var tb = document.createElement("div");
  tb.className = "taskbar-app active";
  tb.id = "tb-" + winId;
  tb.innerHTML = titles[appName];
  tb.onclick = function() {
    var w = document.getElementById(winId);
    if(w.style.display == "none") {
      w.style.display = "flex";
      tb.className = "taskbar-app active";
      bringToFront(winId);
    } else if(tb.className.indexOf("active") >= 0) {
      minimizeWindow(winId);
    } else {
      bringToFront(winId);
    }
  };
  document.getElementById("taskbar-apps").appendChild(tb);

  activeWindows[winId] = { app: appName, maximized: false };

  win.onmousedown = function() {
    bringToFront(winId);
  };

  var body = document.getElementById(winId + "-body");
  if(appName == "notepad") mountNotepad(body, winId);
  if(appName == "terminal") mountTerminal(body, winId);
  if(appName == "calculator") mountCalculator(body, winId);
  if(appName == "files") mountFiles(body, winId);
  if(appName == "snake") mountSnake(body, winId);
  if(appName == "browser") mountBrowser(body, winId);
  if(appName == "settings") mountSettings(body, winId);

  document.getElementById("start-menu").style.display = "none";

  console.log("opened window " + winId); 
}

function bringToFront(winId) {
  zIndex = zIndex + 1;
  document.getElementById(winId).style.zIndex = zIndex;
  var apps = document.getElementById("taskbar-apps").getElementsByTagName("div");
  for(var i = 0; i < apps.length; i++) {
    apps[i].className = apps[i].className.replace(" active", "");
  }
  var tb = document.getElementById("tb-" + winId);
  if(tb) tb.className = tb.className + " active";
}

function closeWindow(winId) {
  var win = document.getElementById(winId);
  if(win) win.parentNode.removeChild(win);
  var tb = document.getElementById("tb-" + winId);
  if(tb) tb.parentNode.removeChild(tb);
  delete activeWindows[winId];
  if(snakeIntervals[winId]) {
    clearInterval(snakeIntervals[winId]);
    delete snakeIntervals[winId];
  }
}

function minimizeWindow(winId) {
  document.getElementById(winId).style.display = "none";
  var tb = document.getElementById("tb-" + winId);
  if(tb) tb.className = tb.className.replace(" active", "");
}

function maximizeWindow(winId) {
  var win = document.getElementById(winId);
  var data = activeWindows[winId];
  if(data.maximized != true) {
    data.prevWidth = win.style.width;
    data.prevHeight = win.style.height;
    data.prevLeft = win.style.left;
    data.prevTop = win.style.top;
    win.style.width = "100vw";
    win.style.height = "calc(100vh - 42px)";
    win.style.left = "0px";
    win.style.top = "0px";
    data.maximized = true;
  } else {
    win.style.width = data.prevWidth;
    win.style.height = data.prevHeight;
    win.style.left = data.prevLeft;
    win.style.top = data.prevTop;
    data.maximized = false;
  }
}


var dragWin = null;
var dragOffX = 0;
var dragOffY = 0;

function startDrag(e, winId) {
  if(e.target.tagName == "BUTTON") return;
  var win = document.getElementById(winId);
  if(activeWindows[winId].maximized == true) return;
  dragWin = win;
  dragOffX = e.clientX - win.offsetLeft;
  dragOffY = e.clientY - win.offsetTop;
  bringToFront(winId);
}

document.onmousemove = function(e) {
  if(dragWin == null) return;
  dragWin.style.left = (e.clientX - dragOffX) + "px";
  dragWin.style.top = (e.clientY - dragOffY) + "px";
};

document.onmouseup = function() {
  dragWin = null;
};


function mountNotepad(body, winId) {
  body.innerHTML = "<div class='notepad-bar'>" +
    "<button onclick='notepadNew(\"" + winId + "\")'>New</button>" +
    "<button onclick='notepadSave(\"" + winId + "\")'>Save</button>" +
    "<select id='" + winId + "-files' onchange='notepadOpen(\"" + winId + "\")'>" +
    "<option value=''>Open...</option></select></div>" +
    "<textarea class='notepad-area' id='" + winId + "-text' placeholder='Type here...'></textarea>";

  notepadRefreshFiles(winId);
}

function notepadNew(winId) {
  document.getElementById(winId + "-text").value = "";
}

function notepadSave(winId) {
  var name = prompt("File name:", "note.txt");
  if(name == null || name == "") return;
  var text = document.getElementById(winId + "-text").value;
  var files = JSON.parse(localStorage.getItem("doodle_files") || "{}");
  files[name] = text;
  localStorage.setItem("doodle_files", JSON.stringify(files));
  notepadRefreshFiles(winId);
  alert("Saved " + name);
}

function notepadOpen(winId) {
  var sel = document.getElementById(winId + "-files");
  var name = sel.value;
  if(name == "") return;
  var files = JSON.parse(localStorage.getItem("doodle_files") || "{}");
  document.getElementById(winId + "-text").value = files[name] || "";
}

function notepadRefreshFiles(winId) {
  var sel = document.getElementById(winId + "-files");
  var files = JSON.parse(localStorage.getItem("doodle_files") || "{}");
  var html = "<option value=''>Open...</option>";
  for(var name in files) {
    html += "<option value='" + name + "'>" + name + "</option>";
  }
  sel.innerHTML = html;
}


function mountTerminal(body, winId) {
  body.innerHTML = "<div class='terminal-box' id='" + winId + "-term'></div>";
  var term = document.getElementById(winId + "-term");
  term.innerHTML = "<div class='terminal-line'>Doodle OS Shell v1.0</div>";
  term.innerHTML += "<div class='terminal-line'>Type 'help' for commands.</div>";
  addPrompt(term, winId);
}

function addPrompt(term, winId) {
  var line = document.createElement("div");
  line.className = "terminal-input-line";
  line.innerHTML = "<span class='terminal-prompt'>$</span>" +
    "<input type='text' class='terminal-input' id='" + winId + "-input'>";
  term.appendChild(line);
  term.scrollTop = term.scrollHeight;

  var inp = document.getElementById(winId + "-input");
  inp.focus();
  inp.onkeydown = function(e) {
    if(e.keyCode == 13) {
      processCommand(term, winId, inp.value);
    }
  };
}

function processCommand(term, winId, cmd) {
  var input = document.getElementById(winId + "-input");
  input.disabled = true;
  var lower = cmd.toLowerCase();
  var output = "";

  if(lower == "help") {
    output = "Commands: help, date, clear, echo [text], whoami, reboot, ls, cat [file]";
  } else if(lower == "date") {
    output = new Date().toString();
  } else if(lower == "clear") {
    term.innerHTML = "";
    addPrompt(term, winId);
    return;
  } else if(lower == "whoami") {
    output = "user (admin)";
  } else if(lower == "reboot") {
    output = "Rebooting...";
    setTimeout(function() { location.reload(); }, 600);
  } else if(lower == "ls") {
    var files = JSON.parse(localStorage.getItem("doodle_files") || "{}");
    var names = [];
    for(var n in files) names.push(n);
    output = names.length > 0 ? names.join("  ") : "No files.";
  } else if(lower.indexOf("cat ") == 0) {
    var name = cmd.substring(4).trim();
    var files = JSON.parse(localStorage.getItem("doodle_files") || "{}");
    output = files[name] != undefined ? files[name] : "File not found: " + name;
  } else if(lower.indexOf("echo ") == 0) {
    output = cmd.substring(5);
  } else if(cmd == "") {
    output = "";
  } else {
    output = "Unknown command: " + cmd;
  }

  if(output != "") {
    var div = document.createElement("div");
    div.className = "terminal-line";
    div.innerHTML = output;
    term.appendChild(div);
  }
  addPrompt(term, winId);
}


function mountCalculator(body, winId) {
  calcData[winId] = { current: "0", expr: "", reset: false };

  body.innerHTML = "<div class='calc-screen' id='" + winId + "-screen'>0</div>" +
    "<table class='calc-table'>" +
    "<tr><td><button onclick='calcPress(\"" + winId + "\", \"C\")'>C</button></td>" +
    "<td><button onclick='calcPress(\"" + winId + "\", \"/\")'>/</button></td>" +
    "<td><button onclick='calcPress(\"" + winId + "\", \"*\")'>*</button></td>" +
    "<td><button onclick='calcPress(\"" + winId + "\", \"DEL\")'>DEL</button></td></tr>" +
    "<tr><td><button onclick='calcPress(\"" + winId + "\", \"7\")'>7</button></td>" +
    "<td><button onclick='calcPress(\"" + winId + "\", \"8\")'>8</button></td>" +
    "<td><button onclick='calcPress(\"" + winId + "\", \"9\")'>9</button></td>" +
    "<td><button onclick='calcPress(\"" + winId + "\", \"-\")'>-</button></td></tr>" +
    "<tr><td><button onclick='calcPress(\"" + winId + "\", \"4\")'>4</button></td>" +
    "<td><button onclick='calcPress(\"" + winId + "\", \"5\")'>5</button></td>" +
    "<td><button onclick='calcPress(\"" + winId + "\", \"+\")'>+</button></td></tr>" +
    "<tr><td><button onclick='calcPress(\"" + winId + "\", \"1\")'>1</button></td>" +
    "<td><button onclick='calcPress(\"" + winId + "\", \"2\")'>2</button></td>" +
    "<td><button onclick='calcPress(\"" + winId + "\", \"3\")'>3</button></td>" +
    "<td rowspan='2'><button class='equals' onclick='calcPress(\"" + winId + "\", \"=\")' style='height:100%'>=" +
    "</button></td></tr>" +
    "<tr><td colspan='2'><button onclick='calcPress(\"" + winId + "\", \"0\")' style='width:100%'>0</button></td>" +
    "<td><button onclick='calcPress(\"" + winId + "\", \".\")'>.</button></td></tr>" +
    "</table>";
}

function calcPress(winId, key) {
  var data = calcData[winId];
  var screen = document.getElementById(winId + "-screen");

  if(key == "C") {
    data.current = "0";
    data.expr = "";
    data.reset = false;
  } else if(key == "DEL") {
    if(data.current.length > 1) {
      data.current = data.current.substring(0, data.current.length - 1);
    } else {
      data.current = "0";
    }
  } else if(key == "+" || key == "-" || key == "*" || key == "/") {
    data.expr = data.expr + data.current + key;
    data.reset = true;
  } else if(key == "=") {
    try {
      var toCalc = data.expr + data.current;
      var res = eval(toCalc);
      data.current = String(res);
      data.expr = "";
      data.reset = true;
    } catch(err) {
      data.current = "Error";
      data.expr = "";
      data.reset = true;
    }
  } else {
    if(data.current == "0" || data.reset == true) {
      data.current = key;
      data.reset = false;
    } else {
      if(key == "." && data.current.indexOf(".") >= 0) {
        
      } else {
        data.current = data.current + key;
      }
    }
  }

  screen.innerHTML = data.current;
}


function mountFiles(body, winId) {
  body.innerHTML = "<div style='margin-bottom:8px;'>" +
    "<button onclick='refreshFiles(\"" + winId + "\")'>Refresh</button></div>" +
    "<div class='fm-list' id='" + winId + "-list'></div>";
  refreshFiles(winId);
}

function refreshFiles(winId) {
  var list = document.getElementById(winId + "-list");
  var files = JSON.parse(localStorage.getItem("doodle_files") || "{}");
  var names = [];
  for(var n in files) names.push(n);

  if(names.length == 0) {
    list.innerHTML = "<p style='color:#999;'>No files yet. Save something in Notepad!</p>";
    return;
  }

  var html = "";
  for(var i = 0; i < names.length; i++) {
    var name = names[i];
    html += "<div class='fm-file'>" +
      "<span>&#128196; " + name + "</span>" +
      "<div>" +
      "<button onclick='viewFile(\"" + name + "\")'>View</button>" +
      "<button onclick='deleteFile(\"" + name + "\", \"" + winId + "\")'>Delete</button>" +
      "</div></div>";
  }
  list.innerHTML = html;
}

function viewFile(name) {
  var files = JSON.parse(localStorage.getItem("doodle_files") || "{}");
  var content = files[name] || "(empty)";
  alert("File: " + name + "\n\n" + content);
}

function deleteFile(name, winId) {
  if(confirm("Delete \"" + name + "\"?")) {
    var files = JSON.parse(localStorage.getItem("doodle_files") || "{}");
    delete files[name];
    localStorage.setItem("doodle_files", JSON.stringify(files));
    refreshFiles(winId);
  }
}


function mountSnake(body, winId) {
  body.innerHTML = "<div class='snake-score'>Score: <span id='" + winId + "-score'>0</span></div>" +
    "<canvas class='snake-canvas' id='" + winId + "-canvas' width='340' height='340'></canvas>" +
    "<div class='snake-controls'><button onclick='startSnake(\"" + winId + "\")'>Start / Restart</button></div>";

  startSnake(winId);
}

function startSnake(winId) {
  if(snakeIntervals[winId]) {
    clearInterval(snakeIntervals[winId]);
  }

  var canvas = document.getElementById(winId + "-canvas");
  var ctx = canvas.getContext("2d");
  var scoreEl = document.getElementById(winId + "-score");

  var gs = 17;
  var tc = 20; 

  var snake = [{x: 10, y: 10}];
  var food = {x: 5, y: 5};
  var vx = 1;
  var vy = 0;
  var score = 0;
  var dead = false;

  function draw() {
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "green";
    ctx.fillRect(food.x * gs + 2, food.y * gs + 2, gs - 4, gs - 4);

    for(var i = 0; i < snake.length; i++) {
      if(i == 0) ctx.fillStyle = "#333333";
      else ctx.fillStyle = "#666666";
      ctx.fillRect(snake[i].x * gs + 1, snake[i].y * gs + 1, gs - 2, gs - 2);
    }

    if(dead) {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ffffff";
      ctx.font = "20px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
      ctx.font = "14px Arial";
      ctx.fillText("Score: " + score, canvas.width / 2, canvas.height / 2 + 20);
    }
  }

  function step() {
    if(dead) return;

    var head = {x: snake[0].x + vx, y: snake[0].y + vy};

    if(head.x < 0 || head.x >= tc || head.y < 0 || head.y >= tc) {
      dead = true;
      clearInterval(snakeIntervals[winId]);
      draw();
      return;
    }

    for(var i = 0; i < snake.length; i++) {
      if(snake[i].x == head.x && snake[i].y == head.y) {
        dead = true;
        clearInterval(snakeIntervals[winId]);
        draw();
        return;
      }
    }

    snake.unshift(head);

    if(head.x == food.x && head.y == food.y) {
      score = score + 10;
      scoreEl.innerHTML = score;
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
    if(dead) return;
    
    if(e.keyCode == 38 && vy == 0) { vx = 0; vy = -1; e.preventDefault(); }
    if(e.keyCode == 40 && vy == 0) { vx = 0; vy = 1; e.preventDefault(); }
    if(e.keyCode == 37 && vx == 0) { vx = -1; vy = 0; e.preventDefault(); }
    if(e.keyCode == 39 && vx == 0) { vx = 1; vy = 0; e.preventDefault(); }
  }

  canvas.setAttribute("tabindex", "0");
  canvas.focus();
  canvas.onkeydown = onKey;

  draw();
  snakeIntervals[winId] = setInterval(step, 120);
}


function mountBrowser(body, winId) {
  body.innerHTML = "<div class='browser-bar'>" +
    "<input type='text' id='" + winId + "-url' placeholder='Enter URL or search...'>" +
    "<button onclick='browse(\"" + winId + "\")'>Go</button></div>" +
    "<div class='browser-msg'>Enter a website above to open it in a new tab</div>";

  document.getElementById(winId + "-url").onkeydown = function(e) {
    if(e.keyCode == 13) browse(winId);
  };
}

function browse(winId) {
  var val = document.getElementById(winId + "-url").value.trim();
  if(val == "") return;
  var url = val;
  if(url.indexOf("http") != 0) {
    if(url.indexOf(".") > 0 && url.indexOf(" ") < 0) {
      url = "https://" + url;
    } else {
      url = "https://www.google.com/search?q=" + encodeURIComponent(url);
    }
  }
  window.open(url, "_blank");
}


function mountSettings(body, winId) {
  var currentTheme = localStorage.getItem("doodle_theme") || "light";

  body.innerHTML = "<div class='settings-row'>" +
    "<label>Sound Effects</label>" +
    "<input type='checkbox' checked></div>" +
    "<div class='settings-row'>" +
    "<label>Theme</label>" +
    "<select id='" + winId + "-theme' onchange='changeTheme(this.value)'>" +
    "<option value='light'" + (currentTheme == "light" ? " selected" : "") + ">Light</option>" +
    "<option value='dark'" + (currentTheme == "dark" ? " selected" : "") + ">Dark</option>" +
    "</select></div>" +
    "<p style='margin-top:12px;font-size:12px;color:#999;'>Wallpaper changes with theme.</p>";

  changeTheme(currentTheme);
}

function changeTheme(theme) {
  localStorage.setItem("doodle_theme", theme);
  if(theme == "dark") {
    document.body.className = "dark-mode";
  } else {
    document.body.className = "";
  }
}


function shutdown() {
  sessionStorage.removeItem("doodle_logged_in");
  document.body.innerHTML = "<div style='height:100vh;display:flex;align-items:center;" +
    "justify-content:center;flex-direction:column;background-color:#2c3e50;color:#ffffff;'>" +
    "<div style='font-size:48px;margin-bottom:16px;'>&#9209;</div>" +
    "<h2>Doodle OS Shut Down</h2>" +
    "<p style='margin-top:8px;color:#aaaaaa;'>You can safely close this tab.</p></div>";
}


document.onclick = function(e) {
  if(e.target.id != "start-btn" && !e.target.closest("#start-menu")) {
    document.getElementById("start-menu").style.display = "none";
  }
  if(e.target.id != "calendar-btn" && !e.target.closest("#calendar-popup")) {
    document.getElementById("calendar-popup").style.display = "none";
  }
};

   
