/* =========================================================================
   ULAR TANGGA TKJ — game logic
   Semua state permainan disimpan di objek `state`. Papan berukuran 10x10
   (petak 1–100), dengan tangga & ular yang dipetakan sebagai pasangan
   {petakAwal: petakTujuan}, serta daftar petak yang memicu soal TKJ.
   ========================================================================= */

(() => {
  "use strict";

  /* ------------------------------- DATA --------------------------------- */

  // Tangga: berhenti di petak kunci -> naik ke petak nilai
  const LADDERS = { 3: 22, 7: 29, 15: 44, 27: 55, 37: 72, 49: 68, 60: 85, 73: 94 };

  // Ular: berhenti di petak kunci (kepala) -> turun ke petak nilai (ekor)
  const SNAKES = { 17: 4, 32: 11, 48: 26, 56: 34, 64: 42, 75: 53, 88: 66, 97: 76 };

  // Petak yang memunculkan soal TKJ ketika ditempati
  const QUESTION_SQUARES = [5, 9, 13, 19, 24, 30, 35, 40, 45, 50, 54, 58, 62, 65, 69, 74, 79, 83, 89, 92, 95, 98];

  // Bank soal bertema Teknik Komputer dan Jaringan (Fase E / kelas 11)
  const QUESTIONS = [
    { q: "Apa kepanjangan dari LAN?", options: ["Local Area Network", "Large Area Network", "Long Access Node", "Link Area Network"], answer: "Local Area Network" },
    { q: "Apa kepanjangan dari WAN?", options: ["Wide Area Network", "Wireless Access Network", "Web Area Network", "Wide Access Node"], answer: "Wide Area Network" },
    { q: "Perangkat yang berfungsi menghubungkan dua jaringan berbeda dan menentukan jalur data disebut...", options: ["Router", "Switch", "Repeater", "Access Point"], answer: "Router" },
    { q: "Perangkat yang menghubungkan banyak komputer dalam satu jaringan dan mampu membaca alamat MAC untuk meneruskan data secara efisien disebut...", options: ["Switch", "Modem", "Bridge lampu", "Speaker"], answer: "Switch" },
    { q: "Dibanding switch, hub meneruskan data dengan cara...", options: ["Broadcast ke semua port", "Hanya ke port tujuan", "Mengenkripsi data", "Memblokir data"], answer: "Broadcast ke semua port" },
    { q: "Kabel UTP standar jaringan komputer terdiri dari berapa pasang kabel (kawat)?", options: ["4 pasang", "2 pasang", "6 pasang", "3 pasang"], answer: "4 pasang" },
    { q: "Konektor yang digunakan pada ujung kabel UTP untuk jaringan Ethernet adalah...", options: ["RJ45", "RJ11", "BNC", "SC"], answer: "RJ45" },
    { q: "Topologi jaringan yang menghubungkan semua perangkat ke satu titik pusat (switch/hub) disebut topologi...", options: ["Star", "Bus", "Ring", "Mesh"], answer: "Star" },
    { q: "Kelemahan utama topologi bus adalah...", options: ["Jika kabel utama putus, seluruh jaringan terganggu", "Butuh banyak switch", "Tidak bisa dipasang kabel", "Kecepatan selalu maksimal"], answer: "Jika kabel utama putus, seluruh jaringan terganggu" },
    { q: "Topologi yang menghubungkan setiap perangkat langsung ke semua perangkat lain disebut topologi...", options: ["Mesh", "Star", "Bus", "Ring"], answer: "Mesh" },
    { q: "Model referensi OSI terdiri dari berapa lapisan (layer)?", options: ["7 layer", "5 layer", "4 layer", "9 layer"], answer: "7 layer" },
    { q: "Pengalamatan IP Address diproses pada layer OSI ke berapa?", options: ["Layer 3 (Network)", "Layer 1 (Physical)", "Layer 7 (Application)", "Layer 2 (Data Link)"], answer: "Layer 3 (Network)" },
    { q: "Layer OSI yang berkaitan langsung dengan media fisik seperti kabel dan sinyal listrik adalah...", options: ["Physical Layer", "Session Layer", "Presentation Layer", "Application Layer"], answer: "Physical Layer" },
    { q: "Protokol yang digunakan untuk mengirim email disebut...", options: ["SMTP", "HTTP", "FTP", "DNS"], answer: "SMTP" },
    { q: "Protokol yang digunakan untuk mengakses halaman web secara aman (terenkripsi) adalah...", options: ["HTTPS", "HTTP", "FTP", "Telnet"], answer: "HTTPS" },
    { q: "Port default untuk protokol HTTP adalah...", options: ["80", "443", "21", "25"], answer: "80" },
    { q: "Port default untuk protokol HTTPS adalah...", options: ["443", "80", "23", "110"], answer: "443" },
    { q: "Layanan yang menerjemahkan nama domain (misalnya google.com) menjadi alamat IP disebut...", options: ["DNS", "DHCP", "FTP", "VPN"], answer: "DNS" },
    { q: "Layanan yang membagikan alamat IP secara otomatis ke perangkat dalam jaringan disebut...", options: ["DHCP", "DNS", "SMTP", "SSH"], answer: "DHCP" },
    { q: "Alamat IPv4 tersusun dari berapa bit?", options: ["32 bit", "64 bit", "16 bit", "128 bit"], answer: "32 bit" },
    { q: "Alamat IPv6 tersusun dari berapa bit?", options: ["128 bit", "32 bit", "64 bit", "48 bit"], answer: "128 bit" },
    { q: "Subnet mask default untuk IP kelas C adalah...", options: ["255.255.255.0", "255.255.0.0", "255.0.0.0", "255.255.255.255"], answer: "255.255.255.0" },
    { q: "Perangkat lunak/keras yang berfungsi menyaring lalu lintas jaringan demi keamanan disebut...", options: ["Firewall", "Router", "Switch", "Modem"], answer: "Firewall" },
    { q: "Perangkat yang memancarkan sinyal Wi-Fi agar perangkat lain dapat terhubung ke jaringan disebut...", options: ["Access Point", "Modem", "Switch", "NIC"], answer: "Access Point" },
    { q: "Perangkat yang mengubah sinyal digital menjadi sinyal analog (dan sebaliknya) untuk koneksi internet disebut...", options: ["Modem", "Router", "Switch", "Repeater"], answer: "Modem" },
    { q: "Kartu yang dipasang pada komputer agar dapat terhubung ke jaringan disebut...", options: ["NIC (Network Interface Card)", "VGA Card", "Sound Card", "RAM"], answer: "NIC (Network Interface Card)" },
    { q: "Perintah command line untuk menguji koneksi ke suatu alamat IP/host adalah...", options: ["ping", "ipconfig", "netstat", "tracert"], answer: "ping" },
    { q: "Perintah untuk melihat konfigurasi IP Address di sistem operasi Windows adalah...", options: ["ipconfig", "ifconfig", "ping", "netstat"], answer: "ipconfig" },
    { q: "Perintah untuk melihat konfigurasi IP Address di sistem operasi Linux adalah...", options: ["ifconfig / ip addr", "ipconfig", "config", "netcfg"], answer: "ifconfig / ip addr" },
    { q: "Kapasitas maksimum data yang dapat ditransmisikan dalam suatu jaringan pada waktu tertentu disebut...", options: ["Bandwidth", "Latency", "Ping", "Protokol"], answer: "Bandwidth" },
    { q: "Kabel UTP tipe cross-over umumnya digunakan untuk menghubungkan...", options: ["Dua perangkat sejenis, misalnya PC ke PC", "PC ke switch", "PC ke access point", "Switch ke router"], answer: "Dua perangkat sejenis, misalnya PC ke PC" },
    { q: "Keunggulan utama kabel fiber optic dibanding kabel tembaga (UTP) adalah...", options: ["Kecepatan tinggi dan jarak transmisi jauh", "Harga selalu lebih murah", "Tidak perlu konektor", "Hanya untuk jaringan lokal kecil"], answer: "Kecepatan tinggi dan jarak transmisi jauh" },
    { q: "Sistem operasi berikut yang umum digunakan sebagai sistem operasi jaringan (server) adalah...", options: ["Debian / Windows Server", "MS Paint", "Adobe Photoshop", "CorelDRAW"], answer: "Debian / Windows Server" },
    { q: "Teknologi yang membuat koneksi pribadi dan terenkripsi melalui jaringan publik (internet) disebut...", options: ["VPN", "DNS", "DHCP", "LAN"], answer: "VPN" },
    { q: "Standar teknologi untuk jaringan nirkabel (Wi-Fi) dikenal dengan kode...", options: ["802.11", "802.3", "56K", "USB 3.0"], answer: "802.11" },
    { q: "Jaringan komputer dengan jangkauan sangat kecil, misalnya antar perangkat pribadi seperti HP dan earphone via Bluetooth, disebut...", options: ["PAN (Personal Area Network)", "WAN", "MAN", "LAN"], answer: "PAN (Personal Area Network)" },
    { q: "Perangkat yang berfungsi menghubungkan dua jaringan dengan protokol/arsitektur berbeda disebut...", options: ["Gateway", "Repeater", "Hub", "NIC"], answer: "Gateway" },
    { q: "Standar keamanan enkripsi jaringan Wi-Fi yang umum digunakan saat ini adalah...", options: ["WPA2/WPA3", "HTML", "FTP", "USB"], answer: "WPA2/WPA3" },
    { q: "Alamat IP kelas C digunakan untuk jaringan dengan jumlah host...", options: ["Kecil (maksimal 254 host per jaringan)", "Sangat besar (jutaan host)", "Tidak terbatas", "Selalu tepat 1000 host"], answer: "Kecil (maksimal 254 host per jaringan)" },
    { q: "Perangkat jaringan yang memperkuat kembali sinyal agar jangkauan jaringan lebih jauh disebut...", options: ["Repeater", "Firewall", "Gateway", "DNS Server"], answer: "Repeater" },
    { q: "Protokol yang digunakan untuk transfer file antar komputer dalam jaringan disebut...", options: ["FTP", "SMTP", "DHCP", "ARP"], answer: "FTP" },
  ];

  /* ------------------------------ HELPERS -------------------------------- */

  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function debounce(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  /* -------------------------------- SOUND --------------------------------- */

  let audioCtx = null;
  const backgroundMusic = new Audio("../assets/sounds/background-music.mp3.mp3");
  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.22;

  function startBackgroundMusic() {
    if (state.muted) return;
    backgroundMusic.play().catch(() => {
      // Browser may wait for a direct user interaction before playing audio.
    });
  }

  function stopBackgroundMusic() {
    backgroundMusic.pause();
  }

  function ensureAudio() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    return audioCtx;
  }

  function beep(freq, duration = 0.09, type = "sine", vol = 0.05, delay = 0) {
    if (state.muted) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    try {
      const start = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(vol, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.02);
    } catch (e) { /* no-op: audio is a non-critical enhancement */ }
  }

  const sfx = {
    tick: () => beep(320, 0.05, "square", 0.03),
    settle: () => beep(520, 0.14, "triangle", 0.05),
    correct: () => { beep(660, 0.1, "sine", 0.06); beep(880, 0.14, "sine", 0.06, 0.1); },
    wrong: () => { beep(300, 0.16, "sawtooth", 0.05); beep(190, 0.2, "sawtooth", 0.05, 0.12); },
    ladder: () => { beep(500, 0.08, "triangle", 0.05); beep(760, 0.12, "triangle", 0.05, 0.09); },
    snake: () => { beep(420, 0.08, "sawtooth", 0.05); beep(240, 0.18, "sawtooth", 0.05, 0.09); },
    win: () => { [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.22, "triangle", 0.06, i * 0.14)); },
  };

  /* -------------------------------- STATE --------------------------------- */

  const state = {
    players: [
      { name: "Pemain 1", pos: 0, correct: 0, wrong: 0 },
      { name: "Pemain 2", pos: 0, correct: 0, wrong: 0 },
    ],
    current: 0,
    locked: true,      // true while setup overlay is open / animation running
    gameOver: false,
    muted: false,
    questionQueue: [],
  };

  const cellEls = {};     // number(1-100) -> cell DOM element
  let startSlotEls = [];  // [slot for player0, slot for player1]
  let tokenEls = [];      // [token for player0, token for player1]

  /* ------------------------------ DOM REFS -------------------------------- */

  const els = {
    setupOverlay: $("setupOverlay"),
    p1Name: $("p1Name"),
    p2Name: $("p2Name"),
    btnStart: $("btnStart"),

    boardWrapper: $("boardWrapper"),
    connectorLayer: $("connectorLayer"),
    boardGrid: $("boardGrid"),
    startZone: $("startZone"),

    turnBanner: $("turnBanner"),
    turnText: $("turnText"),
    dice: $("dice"),
    dicePips: $("dicePips"),
    btnRoll: $("btnRoll"),

    logList: $("logList"),

    btnRules: $("btnRules"),
    rulesModal: $("rulesModal"),
    btnCloseRules: $("btnCloseRules"),

    btnSound: $("btnSound"),
    soundIcon: $("soundIcon"),

    questionModal: $("questionModal"),
    questionTag: $("questionTag"),
    questionTitle: $("questionTitle"),
    optionsList: $("optionsList"),
    feedbackBox: $("feedbackBox"),
    feedbackText: $("feedbackText"),
    btnContinue: $("btnContinue"),

    winModal: $("winModal"),
    winConfetti: $("winConfetti"),
    winMessage: $("winMessage"),
    winScore: $("winScore"),
    btnRestart: $("btnRestart"),
  };

  for (let i = 0; i < 2; i++) {
    els[`avatar${i}`] = $(`playerAvatar${i}`);
    els[`name${i}`] = $(`playerName${i}`);
    els[`pos${i}`] = $(`playerPos${i}`);
    els[`correct${i}`] = $(`playerCorrect${i}`);
    els[`wrong${i}`] = $(`playerWrong${i}`);
    els[`panel${i}`] = $(`playerPanel${i}`);
  }

  /* ------------------------------ BOARD BUILD ------------------------------ */

  function numberForCellIndex(i) {
    const displayRow = Math.floor(i / 10); // 0 = top of screen
    const col = i % 10;
    const boardRow = 9 - displayRow;       // 0 = bottom row (1-10)
    return boardRow % 2 === 0 ? boardRow * 10 + col + 1 : boardRow * 10 + (9 - col) + 1;
  }

  function buildBoard() {
    els.boardGrid.innerHTML = "";
    for (let i = 0; i < 100; i++) {
      const number = numberForCellIndex(i);
      const displayRow = Math.floor(i / 10);
      const col = i % 10;

      const cell = document.createElement("div");
      cell.className = "board-cell" + ((displayRow + col) % 2 === 1 ? " shade-b" : "");
      cell.dataset.number = String(number);

      const label = document.createElement("span");
      label.className = "cell-number";
      label.textContent = String(number);
      cell.appendChild(label);

      let icon = "";
      if (number === 1) { icon = "🚩"; }
      if (LADDERS[number]) { icon = "🪜"; cell.classList.add("cell-ladder"); }
      if (SNAKES[number]) { icon = "🐍"; cell.classList.add("cell-snake"); }
      if (QUESTION_SQUARES.includes(number)) { icon = "❓"; cell.classList.add("cell-question"); }
      if (number === 100) { cell.classList.add("cell-final"); icon = "🏁"; }

      if (LADDERS[number] !== undefined) {
        const route = document.createElement("span");
        route.className = "cell-route cell-route-ladder";
        route.textContent = `↑${LADDERS[number]}`;
        route.title = `Tangga menuju petak ${LADDERS[number]}`;
        cell.appendChild(route);
      } else if (SNAKES[number] !== undefined) {
        const route = document.createElement("span");
        route.className = "cell-route cell-route-snake";
        route.textContent = `↓${SNAKES[number]}`;
        route.title = `Ular menuju petak ${SNAKES[number]}`;
        cell.appendChild(route);
      }

      if (icon) {
        const iconEl = document.createElement("span");
        iconEl.className = "cell-icon";
        iconEl.textContent = icon;
        cell.appendChild(iconEl);
      }

      els.boardGrid.appendChild(cell);
      cellEls[number] = cell;
    }

    startSlotEls = [$("startSlot0"), $("startSlot1")];
  }

  function buildTokens() {
    tokenEls.forEach((t) => t.remove());
    tokenEls = [0, 1].map((i) => {
      const t = document.createElement("div");
      t.className = `token token-${i}`;
      t.textContent = String(i + 1);
      els.boardWrapper.appendChild(t);
      return t;
    });
  }

  /* --------------------------- LAYOUT / POSITIONING ------------------------ */

  function anchorFor(playerIndex) {
    const pos = state.players[playerIndex].pos;
    return pos === 0 ? startSlotEls[playerIndex] : cellEls[pos];
  }

  function positionToken(playerIndex) {
    const token = tokenEls[playerIndex];
    const anchor = anchorFor(playerIndex);
    if (!anchor || !token) return;

    const wrapRect = els.boardWrapper.getBoundingClientRect();
    const aRect = anchor.getBoundingClientRect();
    const cx = aRect.left - wrapRect.left + aRect.width / 2;
    const cy = aRect.top - wrapRect.top + aRect.height / 2;

    // small deterministic nudge so two tokens on the same square don't fully overlap
    const nudge = playerIndex === 0 ? -6 : 6;

    token.style.left = `${cx + nudge - token.offsetWidth / 2}px`;
    token.style.top = `${cy + nudge - token.offsetHeight / 2}px`;
  }

  function positionAllTokens() {
    positionToken(0);
    positionToken(1);
  }

  function drawConnectors() {
    const layer = els.connectorLayer;
    const layerRect = layer.getBoundingClientRect();
    layer.setAttribute("width", String(layerRect.width));
    layer.setAttribute("height", String(layerRect.height));
    layer.innerHTML = "";

    const centerOf = (num) => {
      const r = cellEls[num].getBoundingClientRect();
      return { x: r.left - layerRect.left + r.width / 2, y: r.top - layerRect.top + r.height / 2 };
    };

    const svgNS = "http://www.w3.org/2000/svg";

    Object.entries(LADDERS).forEach(([start, end]) => {
      const a = centerOf(Number(start));
      const b = centerOf(Number(end));
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len; // perpendicular unit vector
      const rail = 5.5;

      const rail1 = document.createElementNS(svgNS, "line");
      rail1.setAttribute("x1", a.x + nx * rail); rail1.setAttribute("y1", a.y + ny * rail);
      rail1.setAttribute("x2", b.x + nx * rail); rail1.setAttribute("y2", b.y + ny * rail);
      rail1.setAttribute("class", "connector-ladder");
      rail1.setAttribute("stroke-width", "3");
      rail1.setAttribute("stroke-linecap", "round");
      layer.appendChild(rail1);

      const rail2 = document.createElementNS(svgNS, "line");
      rail2.setAttribute("x1", a.x - nx * rail); rail2.setAttribute("y1", a.y - ny * rail);
      rail2.setAttribute("x2", b.x - nx * rail); rail2.setAttribute("y2", b.y - ny * rail);
      rail2.setAttribute("class", "connector-ladder");
      rail2.setAttribute("stroke-width", "3");
      rail2.setAttribute("stroke-linecap", "round");
      layer.appendChild(rail2);

      const rungCount = Math.max(3, Math.round(len / 16));
      for (let i = 1; i < rungCount; i++) {
        const t = i / rungCount;
        const mx = a.x + dx * t, my = a.y + dy * t;
        const rung = document.createElementNS(svgNS, "line");
        rung.setAttribute("x1", mx + nx * rail); rung.setAttribute("y1", my + ny * rail);
        rung.setAttribute("x2", mx - nx * rail); rung.setAttribute("y2", my - ny * rail);
        rung.setAttribute("class", "connector-ladder-rung");
        rung.setAttribute("stroke-width", "2");
        layer.appendChild(rung);
      }
    });

    Object.entries(SNAKES).forEach(([start, end]) => {
      const a = centerOf(Number(start));
      const b = centerOf(Number(end));
      const mx = (a.x + b.x) / 2 + (a.y - b.y) * 0.18;
      const my = (a.y + b.y) / 2 + (b.x - a.x) * 0.18;

      const path = document.createElementNS(svgNS, "path");
      path.setAttribute("d", `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`);
      path.setAttribute("class", "connector-snake");
      path.setAttribute("stroke-width", "3.5");
      path.setAttribute("stroke-linecap", "round");
      layer.appendChild(path);

      const head = document.createElementNS(svgNS, "circle");
      head.setAttribute("cx", String(a.x));
      head.setAttribute("cy", String(a.y));
      head.setAttribute("r", "5");
      head.setAttribute("class", "connector-snake-head");
      layer.appendChild(head);
    });
  }

  function recalcLayout() {
    drawConnectors();
    positionAllTokens();
  }

  /* -------------------------------- LOGGING -------------------------------- */

  function logEvent(message, kind) {
    const li = document.createElement("li");
    li.textContent = message;
    if (kind === "good") li.className = "log-good";
    if (kind === "bad") li.className = "log-bad";
    els.logList.insertBefore(li, els.logList.firstChild);
    while (els.logList.children.length > 40) els.logList.removeChild(els.logList.lastChild);
  }

  /* ------------------------------- UI UPDATES ------------------------------ */

  function updateSidebar() {
    for (let i = 0; i < 2; i++) {
      els[`name${i}`].textContent = state.players[i].name;
      els[`avatar${i}`].textContent = String(i + 1);
      els[`pos${i}`].textContent = state.players[i].pos === 0 ? "Mulai" : String(state.players[i].pos);
      els[`correct${i}`].textContent = String(state.players[i].correct);
      els[`wrong${i}`].textContent = String(state.players[i].wrong);
      els[`panel${i}`].classList.toggle("is-active", state.current === i && !state.gameOver);
    }
  }

  function updateTurnBanner() {
    const p = state.players[state.current];
    els.turnText.textContent = `Giliran ${p.name}`;
    els.turnBanner.classList.toggle("turn-p1", state.current === 1);
  }

  /* --------------------------------- DICE ---------------------------------- */

  function setDiceFace(value) {
    els.dicePips.dataset.value = String(value);
  }

  function animateDiceRoll() {
    return new Promise((resolve) => {
      els.dice.classList.add("is-rolling");
      let ticks = 0;
      const maxTicks = 9;
      const interval = setInterval(() => {
        const randomFace = 1 + Math.floor(Math.random() * 6);
        setDiceFace(randomFace);
        sfx.tick();
        ticks++;
        if (ticks >= maxTicks) {
          clearInterval(interval);
          els.dice.classList.remove("is-rolling");
          const finalValue = 1 + Math.floor(Math.random() * 6);
          setDiceFace(finalValue);
          sfx.settle();
          resolve(finalValue);
        }
      }, 70);
    });
  }

  /* ------------------------------- MOVEMENT -------------------------------- */

  async function stepMove(playerIndex, from, to) {
    const dir = to >= from ? 1 : -1;
    let pos = from;
    while (pos !== to) {
      pos += dir;
      state.players[playerIndex].pos = pos;
      positionToken(playerIndex);
      if (dir > 0) sfx.tick();
      updateSidebar();
      await sleep(180);
    }
  }

  async function jumpMove(playerIndex, to) {
    const token = tokenEls[playerIndex];
    token.classList.add("token-jump");
    token.classList.add(to > state.players[playerIndex].pos ? "token-climb" : "token-slide");
    state.players[playerIndex].pos = to;
    positionToken(playerIndex);
    await sleep(560);
    token.classList.remove("token-jump");
    token.classList.remove("token-climb", "token-slide");
    token.classList.add("token-pop");
    await sleep(400);
    token.classList.remove("token-pop");
  }

  function highlightCell(number) {
    const cell = cellEls[number];
    if (!cell) return;
    cell.classList.remove("cell-highlight");
    // force reflow so the animation can restart
    void cell.offsetWidth;
    cell.classList.add("cell-highlight");
  }

  /* ------------------------------- QUESTIONS -------------------------------- */

  function nextQuestion() {
    if (state.questionQueue.length === 0) {
      state.questionQueue = shuffle(QUESTIONS);
    }
    return state.questionQueue.pop();
  }

  function openQuestion(playerIndex, squareNumber) {
    return new Promise((resolve) => {
      const player = state.players[playerIndex];
      const q = nextQuestion();
      const letters = ["A", "B", "C", "D"];
      const options = shuffle(q.options);

      els.questionTag.textContent = `Petak ${squareNumber} · ${player.name}`;
      els.questionTitle.textContent = q.q;
      els.optionsList.innerHTML = "";
      els.feedbackBox.hidden = true;
      els.feedbackBox.className = "feedback-box";
      els.btnContinue.hidden = true;

      let correctBtn = null;

      options.forEach((optionText, idx) => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.type = "button";
        const letterSpan = document.createElement("span");
        letterSpan.className = "option-letter";
        letterSpan.textContent = letters[idx];
        const textSpan = document.createElement("span");
        textSpan.textContent = optionText;
        btn.appendChild(letterSpan);
        btn.appendChild(textSpan);

        const isCorrectOption = optionText === q.answer;
        if (isCorrectOption) correctBtn = btn;

        btn.addEventListener("click", () => {
          Array.from(els.optionsList.children).forEach((b) => (b.disabled = true));

          if (isCorrectOption) {
            btn.classList.add("is-correct");
            player.correct++;
            sfx.correct();
            els.feedbackText.textContent = `Benar! ${player.name} tetap di petak ${squareNumber}.`;
            els.feedbackBox.classList.add("is-good");
          } else {
            btn.classList.add("is-wrong");
            if (correctBtn) correctBtn.classList.add("is-correct");
            player.wrong++;
            sfx.wrong();
            els.feedbackText.textContent = `Kurang tepat. Jawaban yang benar: "${q.answer}". ${player.name} akan mundur beberapa langkah.`;
            els.feedbackBox.classList.add("is-bad");
          }
          els.feedbackBox.hidden = false;
          updateSidebar();
          els.btnContinue.hidden = false;
          els.btnContinue.focus();

          els.btnContinue.onclick = () => {
            els.questionModal.hidden = true;
            resolve(isCorrectOption);
          };
        });

        els.optionsList.appendChild(btn);
      });

      els.questionModal.hidden = false;
      requestAnimationFrame(() => {
        const first = els.optionsList.querySelector(".option-btn");
        if (first) first.focus();
      });
    });
  }

  /* --------------------------------- TURN FLOW ------------------------------ */

  async function handleRoll() {
    if (state.locked || state.gameOver) return;
    state.locked = true;
    els.btnRoll.disabled = true;

    const playerIndex = state.current;
    const player = state.players[playerIndex];

    const value = await animateDiceRoll();
    logEvent(`${player.name} melempar dadu: ${value}.`);

    const from = player.pos;
    const target = from + value;

    if (target > 100) {
      logEvent(`${player.name} butuh angka pas untuk mencapai petak 100 (sisa ${100 - from}). Giliran berpindah.`);
      await sleep(500);
      return endTurn();
    }

    await stepMove(playerIndex, from, target);

    let landed = target;

    if (LADDERS[landed] !== undefined) {
      const dest = LADDERS[landed];
      logEvent(`${player.name} menaiki tangga dari petak ${landed} ke petak ${dest}!`, "good");
      sfx.ladder();
      await sleep(200);
      await jumpMove(playerIndex, dest);
      landed = dest;
      highlightCell(landed);
    } else if (SNAKES[landed] !== undefined) {
      const dest = SNAKES[landed];
      logEvent(`${player.name} digigit ular di petak ${landed}, turun ke petak ${dest}.`, "bad");
      sfx.snake();
      await sleep(200);
      await jumpMove(playerIndex, dest);
      landed = dest;
      highlightCell(landed);
    }

    updateSidebar();

    if (landed === 100) {
      await sleep(300);
      return showWin(playerIndex);
    }

    if (QUESTION_SQUARES.includes(landed)) {
      await sleep(200);
      const wasCorrect = await openQuestion(playerIndex, landed);
      if (!wasCorrect) {
        const setback = Math.random() < 0.5 ? 1 : 2;
        const newPos = Math.max(1, state.players[playerIndex].pos - setback);
        logEvent(`${player.name} mundur ${setback} langkah ke petak ${newPos}.`, "bad");
        await stepMove(playerIndex, state.players[playerIndex].pos, newPos);

        const snakeTail = SNAKES[state.players[playerIndex].pos];
        if (snakeTail !== undefined) {
          const snakeHead = state.players[playerIndex].pos;
          logEvent(`${player.name} terkena ular di petak ${snakeHead}! Turun ke petak ${snakeTail}.`, "bad");
          sfx.snake();
          await sleep(200);
          await jumpMove(playerIndex, snakeTail);
          highlightCell(snakeTail);
        }
      }
      updateSidebar();
      if (state.players[playerIndex].pos === 100) {
        await sleep(300);
        return showWin(playerIndex);
      }
      return endTurn();
    }

    await sleep(150);
    endTurn();
  }

  function endTurn() {
    if (state.gameOver) return;
    state.current = 1 - state.current;
    state.locked = false;
    els.btnRoll.disabled = false;
    updateTurnBanner();
    updateSidebar();
  }

  /* --------------------------------- WIN / RESET ----------------------------- */

  function spawnConfetti() {
    const colors = ["#22d3c7", "#38bdf8", "#f472b6", "#3ddc97", "#ffb347"];
    els.winConfetti.innerHTML = "";
    for (let i = 0; i < 36; i++) {
      const piece = document.createElement("i");
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.animationDuration = `${1.2 + Math.random() * 1.1}s`;
      piece.style.animationDelay = `${Math.random() * 0.4}s`;
      els.winConfetti.appendChild(piece);
    }
  }

  function markMainLevel5Completed() {
    try {
      const key = "tkj-network-adventure-v1";
      const saved = JSON.parse(localStorage.getItem(key) || "{}");
      saved.progress = saved.progress || {};
      const current = saved.progress["5"] || { unlocked: true, completed: false, best: 0 };
      saved.progress["5"] = { ...current, unlocked: true, completed: true, best: Math.max(Number(current.best) || 0, 100) };
      localStorage.setItem(key, JSON.stringify(saved));
    } catch (_) {
      // Progress utama bersifat opsional.
    }
  }

  function showWin(playerIndex) {
    state.gameOver = true;
    els.btnRoll.disabled = true;
    markMainLevel5Completed();
    const winner = state.players[playerIndex];
    const loserIndex = 1 - playerIndex;
    const loser = state.players[loserIndex];

    logEvent(`${winner.name} mencapai petak 100 dan memenangkan permainan!`, "good");
    sfx.win();
    spawnConfetti();

    els.winMessage.textContent = `${winner.name} mencapai petak 100 lebih dulu.`;
    els.winScore.innerHTML = "";
    [winner, loser].forEach((p) => {
      const span = document.createElement("span");
      span.textContent = `${p.name}: ${p.correct} benar / ${p.wrong} salah`;
      els.winScore.appendChild(span);
    });

    els.winModal.hidden = false;
  }

  function resetGame() {
    state.players.forEach((p) => { p.pos = 0; p.correct = 0; p.wrong = 0; });
    state.current = 0;
    state.gameOver = false;
    state.locked = false;
    state.questionQueue = [];
    els.logList.innerHTML = "";
    els.winModal.hidden = true;
    els.btnRoll.disabled = false;
    setDiceFace(1);
    updateSidebar();
    updateTurnBanner();
    positionAllTokens();
    logEvent("Permainan dimulai ulang. Giliran " + state.players[0].name + ".");
  }

  /* --------------------------------- SETUP ----------------------------------- */

  function startGame() {
    state.players[0].name = els.p1Name.value.trim() || "Pemain 1";
    state.players[1].name = els.p2Name.value.trim() || "Pemain 2";
    startBackgroundMusic();
    els.setupOverlay.hidden = true;
    state.locked = false;
    els.btnRoll.disabled = false;
    updateSidebar();
    updateTurnBanner();
    positionAllTokens();
    logEvent(`Permainan dimulai! Giliran ${state.players[0].name}.`);
    els.btnRoll.focus();
  }

  /* ---------------------------------- EVENTS ---------------------------------- */

  function wireEvents() {
    els.btnStart.addEventListener("click", startGame);
    [els.p1Name, els.p2Name].forEach((input) => {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") startGame();
      });
    });

    els.btnRoll.addEventListener("click", handleRoll);

    els.btnRules.addEventListener("click", () => {
      els.rulesModal.hidden = false;
      els.btnCloseRules.focus();
    });
    els.btnCloseRules.addEventListener("click", () => {
      els.rulesModal.hidden = true;
      els.btnRules.focus();
    });
    els.rulesModal.addEventListener("click", (e) => {
      if (e.target === els.rulesModal) els.rulesModal.hidden = true;
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !els.rulesModal.hidden) els.rulesModal.hidden = true;
    });

    els.btnSound.addEventListener("click", () => {
      state.muted = !state.muted;
      els.soundIcon.textContent = state.muted ? "🔇" : "🔊";
      els.btnSound.setAttribute("aria-pressed", String(!state.muted));
      if (!state.muted) {
        ensureAudio();
        startBackgroundMusic();
      } else {
        stopBackgroundMusic();
      }
    });

    els.btnRestart.addEventListener("click", resetGame);

    const backBtn = document.getElementById("btnBackToMain");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        window.location.href = "../index.html";
      });
    }

    window.addEventListener("resize", debounce(recalcLayout, 150));
  }

  /* ----------------------------------- INIT ------------------------------------ */

  function init() {
    buildBoard();
    buildTokens();
    wireEvents();
    updateSidebar();
    updateTurnBanner();
    setDiceFace(1);
    els.btnRoll.disabled = true;

    // Layout depends on rendered box sizes; run after the browser has painted,
    // and again once web fonts finish loading (font metrics can shift widths).
    requestAnimationFrame(() => requestAnimationFrame(recalcLayout));
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(recalcLayout);
    }

    els.p1Name.focus();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
