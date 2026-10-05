const state = {
  screen: "home",
  levels: [],
  currentLevel: null,
  questionIndex: 0,
  score: 0,
  lives: 3,
  correct: 0,
  answered: false,
  timeLeft: 45,
  timerId: null,
  sound: true,
  progress: {},
  username: ""
};

const STORAGE_KEY = "tkj-network-adventure-v1";

const screen = document.getElementById("screen");
const toast = document.getElementById("toast");
const soundToggle = document.getElementById("soundToggle");
const resetProgressBtn = document.getElementById("resetProgress");
const userBadge = document.getElementById("userBadge");
const userNameText = document.getElementById("userNameText");
const backgroundMusic = new Audio("assets/sounds/background-music.mp3.mp3");
backgroundMusic.loop = true;
backgroundMusic.volume = 0.22;
let musicStarted = false;

function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function loadState() {
  const saved = safeParse(localStorage.getItem(STORAGE_KEY), null);
  if (saved && typeof saved === "object") {
    state.progress = saved.progress && typeof saved.progress === "object" ? saved.progress : {};
    state.sound = saved.sound !== false;
    state.username = typeof saved.username === "string" ? saved.username.trim() : "";
  }
  updateSoundButton();
  updateUserBadge();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    progress: state.progress,
    sound: state.sound,
    username: state.username
  }));
}

function updateUserBadge() {
  if (!userBadge || !userNameText) return;
  const hasName = Boolean(state.username);
  userBadge.hidden = !hasName;
  userNameText.textContent = hasName ? state.username : "";
}

function renderWelcome() {
  clearTimer();
  state.screen = "welcome";

  screen.innerHTML = `
    <section class="welcome-screen" aria-labelledby="welcomeTitle">
      <div class="welcome-glow glow-one"></div>
      <div class="welcome-glow glow-two"></div>

      <div class="welcome-card">
        <div class="welcome-visual" aria-hidden="true">
          <div class="orbit orbit-a"></div>
          <div class="orbit orbit-b"></div>
          <div class="core-device">
            <span>TKJ</span>
            <small>NET</small>
          </div>
          <span class="float-icon icon-a">🖥️</span>
          <span class="float-icon icon-b">🔀</span>
          <span class="float-icon icon-c">🌐</span>
          <span class="float-icon icon-d">💡</span>
        </div>

        <div class="welcome-copy">
          <span class="badge">🎮 Media Pembelajaran TKJ</span>
          <p class="welcome-kicker">SELAMAT DATANG DI</p>
          <h1 id="welcomeTitle">TKJ Network Adventure</h1>
          <p class="welcome-description">
            Jelajahi misi hardware, kabel UTP, jaringan komputer, hingga troubleshooting.
            Sebelum berpetualang, masukkan nama kamu dulu.
          </p>

          <form id="usernameForm" class="username-form" novalidate>
            <label for="usernameInput">Nama pengguna</label>
            <div class="username-input-wrap">
              <span class="input-icon" aria-hidden="true">👤</span>
              <input
                id="usernameInput"
                name="username"
                type="text"
                maxlength="24"
                autocomplete="nickname"
                placeholder="Contoh : Zoxlien"
                required
              />
            </div>
            <p id="usernameError" class="username-error" role="alert"></p>
            <button class="primary-btn welcome-btn" type="submit">
              🚀 Masuk & Mulai Petualangan
            </button>
          </form>

          <div class="welcome-features">
            <span>❤️ 3 Nyawa</span>
            <span>⭐ Kumpulkan Poin</span>
            <span>🔓 Buka Level</span>
          </div>
        </div>
      </div>
    </section>
  `;

  const form = document.getElementById("usernameForm");
  const input = document.getElementById("usernameInput");
  const error = document.getElementById("usernameError");

  input.value = state.username || "";
  requestAnimationFrame(() => input.focus());

  form.addEventListener("submit", event => {
    event.preventDefault();
    const name = input.value.trim().replace(/\s+/g, " ");

    if (name.length < 2) {
      error.textContent = "Nama minimal 2 karakter.";
      input.focus();
      return;
    }

    state.username = name.slice(0, 24);
    saveState();
    updateUserBadge();
    showToast(`Selamat datang, ${state.username}! 🎉`);
    renderHome();
  });
}

function updateSoundButton() {
  soundToggle.textContent = state.sound ? "🔊" : "🔇";
  soundToggle.setAttribute("aria-pressed", String(state.sound));
}

function startBackgroundMusic() {
  if (!state.sound || musicStarted) return;
  backgroundMusic.play()
    .then(() => { musicStarted = true; })
    .catch(() => {
      // Browser menunggu interaksi pengguna atau file musik belum tersedia.
    });
}

function stopBackgroundMusic() {
  backgroundMusic.pause();
  musicStarted = false;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function playBeep(type) {
  if (!state.sound) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = type === "correct" ? 660 : 220;
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  } catch {
    // Sound is optional.
  }
}

function getLevelProgress(levelId) {
  return state.progress[levelId] || { unlocked: levelId === 1 || levelId === 5, completed: false, best: 0 };
}

function setLevelProgress(levelId, patch) {
  const old = getLevelProgress(levelId);
  state.progress[levelId] = { ...old, ...patch };
  saveState();
}

async function loadLevels() {
  try {
    const response = await fetch("data/levels.json");
    if (!response.ok) throw new Error("Gagal memuat data level.");
    const data = await response.json();
    state.levels = data.levels || [];
    state.levels.forEach((level, index) => {
      if (!state.progress[level.id]) {
        state.progress[level.id] = {
          unlocked: index === 0,
          completed: false,
          best: 0
        };
      }
    });
    state.progress[5] = {
      ...(state.progress[5] || { completed: false, best: 0 }),
      unlocked: true
    };
    // Level berikutnya terbuka setelah level sebelumnya selesai.
    state.levels.forEach((level, index) => {
      if (index > 0 && getLevelProgress(state.levels[index - 1].id).completed) {
        setLevelProgress(level.id, { unlocked: true });
      }
    });
    saveState();
    renderHome();
  } catch (error) {
    screen.innerHTML = `
      <section class="panel center">
        <div style="font-size:64px">⚠️</div>
        <h2>Data game belum terbaca</h2>
        <p style="color:var(--muted);line-height:1.7">
          Jalankan project melalui <strong>Live Server</strong> di VS Code agar file JSON dapat dimuat oleh browser.
        </p>
        <p class="tip">Error: ${escapeHtml(error.message)}</p>
      </section>
    `;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderHome() {
  clearTimer();
  if (!state.username) {
    renderWelcome();
    return;
  }
  state.screen = "home";

  const completed = state.levels.filter(l => getLevelProgress(l.id).completed).length
    + (getLevelProgress(5).completed ? 1 : 0);
  const total = state.levels.length + 1;
  const bestScore = state.levels.reduce((sum, level) => sum + (getLevelProgress(level.id).best || 0), 0);

  screen.innerHTML = `
    <section class="hero">
      <div class="panel">
        <span class="badge">🎮 Media Pembelajaran TKJ</span>
        <p class="welcome-user">Halo, <strong>${escapeHtml(state.username || "Petualang TKJ")}</strong>! 👋</p>
        <h1>TKJ Network Adventure</h1>
        <p>
          Belajar hardware, kabel UTP, jaringan, dan troubleshooting
          melalui misi interaktif. Kumpulkan poin, jaga nyawa, dan buka level berikutnya.
        </p>

        <div class="stats">
          <div class="stat">
            <strong>${completed}/${total}</strong>
            <span>Level selesai</span>
          </div>
          <div class="stat">
            <strong>${bestScore}</strong>
            <span>Best score</span>
          </div>
          <div class="stat">
            <strong>3 ❤️</strong>
            <span>Nyawa awal</span>
          </div>
        </div>

        <div class="hero-actions">
          <button class="primary-btn" type="button" data-action="start">🚀 Mulai Bermain</button>
          <button class="secondary-btn" type="button" data-action="howto">📘 Cara Bermain</button>
          <button class="secondary-btn" type="button" data-action="welcome">🏠 Kembali ke Halaman Awal</button>
        </div>
      </div>

      <div class="panel preview-card">
        <div>
          <span class="badge">Preview</span>
          <h2 style="margin:10px 0 6px">Bangun jaringanmu</h2>
          <p style="color:var(--muted);line-height:1.6;margin:0">
            Pahami alur PC → Switch → Router → Internet.
          </p>
        </div>

        <div class="network-map" aria-label="Ilustrasi topologi jaringan">
          <div class="connector c1"></div>
          <div class="connector c2"></div>
          <div class="connector c3"></div>
          <div class="node pc1"><span class="emoji">🖥️</span><small>PC 1</small></div>
          <div class="node pc2"><span class="emoji">💻</span><small>PC 2</small></div>
          <div class="node switch"><span class="emoji">🔀</span><small>Switch</small></div>
          <div class="node router"><span class="emoji">🌐</span><small>Router</small></div>
        </div>
      </div>
    </section>

    <section style="margin-top:20px">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:end;flex-wrap:wrap">
        <div>
          <span class="badge">Level</span>
          <h2 style="margin:8px 0 0">Misi Pembelajaran</h2>
        </div>
        <span style="color:var(--muted);font-size:13px">Selesaikan level untuk membuka level berikutnya.</span>
      </div>

      <div class="level-grid">
        ${state.levels.map(levelCard).join("")}
      </div>

      <section class="snake-feature" aria-labelledby="snakeFeatureTitle">
        <div class="snake-feature-copy">
          <span class="badge">Game Kolaboratif</span>
          <h2 id="snakeFeatureTitle">🐍 Ular Tangga TKJ</h2>
          <p>Uji pengetahuan jaringan komputer sambil bermain. Lempar dadu, taklukkan tangga, hindari ular, dan capai petak 100 bersama teman.</p>
          <div class="snake-feature-meta">
            <span>🎮 2 Pemain</span>
            <span>❓ Soal jaringan</span>
            <span>🏁 Target petak 100</span>
          </div>
        </div>
        <div class="snake-feature-action">
          <div class="snake-feature-art" aria-hidden="true">🐍<span>🪜</span></div>
          ${snakeLevelCard()}
        </div>
      </section>
    </section>
  `;

  screen.querySelectorAll("[data-level]").forEach(btn => {
    btn.addEventListener("click", () => startLevel(Number(btn.dataset.level)));
  });
  const snakeLevelButton = screen.querySelector("[data-snake-level]");
  if (snakeLevelButton) {
    snakeLevelButton.addEventListener("click", () => startLevel(5));
  }

  screen.querySelector('[data-action="start"]').addEventListener("click", () => {
    const firstUnlocked = state.levels.find(level => getLevelProgress(level.id).unlocked);
    if (firstUnlocked) startLevel(firstUnlocked.id);
  });

  screen.querySelector('[data-action="howto"]').addEventListener("click", renderHowTo);
  screen.querySelector('[data-action="welcome"]').addEventListener("click", renderWelcome);
}

function levelCard(level) {
  const progress = getLevelProgress(level.id);
  const locked = !progress.unlocked;
  const done = progress.completed;
  return `
    <article class="level-card ${locked ? "locked" : ""} ${done ? "done" : ""}">
      <div class="level-no">LEVEL ${level.id}</div>
      <div style="font-size:34px;margin-top:7px">${level.icon}</div>
      <h3>${escapeHtml(level.title)} ${done ? "✅" : ""}</h3>
      <p>${escapeHtml(level.description)}</p>
      <div class="level-meta">
        <span>${level.questions.length} soal</span>
        <span>Best: ${progress.best || 0}</span>
      </div>
      <div class="play-row">
        <button class="${locked ? "secondary-btn" : "primary-btn"}" type="button"
          ${locked ? "disabled" : ""} data-level="${level.id}">
          ${locked ? "🔒 Terkunci" : "▶ Main"}
        </button>
      </div>
    </article>
  `;
}

function renderHowTo() {
  clearTimer();
  screen.innerHTML = `
    <section class="panel">
      <button class="back-btn" type="button" id="backHome">← Kembali</button>
      <div style="margin-top:20px">
        <span class="badge">Cara Bermain</span>
        <h1 style="font-size:clamp(30px,5vw,48px);margin:10px 0">Misi TKJ</h1>
        <div class="level-grid">
          <div class="level-card">
            <div style="font-size:36px">❤️</div>
            <h3>Jaga Nyawa</h3>
            <p>Setiap jawaban salah mengurangi satu nyawa. Game berakhir jika nyawa habis.</p>
          </div>
          <div class="level-card">
            <div style="font-size:36px">⭐</div>
            <h3>Kumpulkan Poin</h3>
            <p>Setiap jawaban benar mendapat 10 poin. Dengan 10 soal, skor maksimal level adalah 100 poin.</p>
          </div>
          <div class="level-card">
            <div style="font-size:36px">⏱️</div>
            <h3>Perhatikan Waktu</h3>
            <p>Setiap soal memiliki batas waktu. Gunakan waktumu untuk membaca soal dengan teliti.</p>
          </div>
          <div class="level-card">
            <div style="font-size:36px">🔓</div>
            <h3>Buka Level</h3>
            <p>Selesaikan level agar misi berikutnya terbuka secara otomatis.</p>
          </div>
        </div>
        <div class="hero-actions">
          <button class="primary-btn" type="button" id="playNow">🚀 Mulai</button>
        </div>
      </div>
    </section>
  `;

  document.getElementById("backHome").addEventListener("click", renderHome);
  document.getElementById("playNow").addEventListener("click", () => {
    const firstUnlocked = state.levels.find(level => getLevelProgress(level.id).unlocked);
    if (firstUnlocked) startLevel(firstUnlocked.id);
  });
}


function snakeLevelCard() {
  const progress = getLevelProgress(5);
  const locked = false;
  const done = progress.completed;
  return `
    <article class="level-card snake-level-card ${locked ? "locked" : ""} ${done ? "done" : ""}">
      <div class="level-no">GAME TKJ • 2 PEMAIN</div>
      <div style="font-size:34px;margin-top:7px">🐍🪜</div>
      <h3>Ular Tangga TKJ ${done ? "✅" : ""}</h3>
      <p>Jawab soal TKJ, lempar dadu, naik tangga, hindari ular, dan capai kotak 100.</p>
      <div class="level-meta">
        <span>2 Pemain</span>
        <span>${done ? "Selesai" : "Siap dimainkan"}</span>
      </div>
      <div class="play-row">
        <button class="${locked ? "secondary-btn" : "primary-btn"}" type="button"
          ${locked ? "disabled" : ""} data-snake-level="5">
          ${locked ? "🔒 Terkunci" : "🐍 Main Ular Tangga"}
        </button>
      </div>
    </article>
  `;
}

function startSnakeSetup() {
  // Level 5 memakai project Ular Tangga TKJ yang asli sebagai halaman terpisah.
  window.location.href = "snake-game/index.html";
}

function startLevel(levelId) {
  clearTimer();
  if (levelId === 5) {
    if (!getLevelProgress(5).unlocked) {
      showToast("Level 5 masih terkunci. Selesaikan semua level soal terlebih dahulu.");
      return;
    }
    startSnakeSetup();
    return;
  }
  const level = state.levels.find(item => item.id === levelId);
  if (!level) return;
  if (!getLevelProgress(levelId).unlocked) {
    showToast("Level ini masih terkunci.");
    return;
  }

  state.screen = "game";
  state.currentLevel = level;
  state.questionIndex = 0;
  state.score = 0;
  state.lives = 3;
  state.correct = 0;
  state.answered = false;
  state.timeLeft = 45;
  renderQuestion();
}

function renderQuestion() {
  clearTimer();
  const level = state.currentLevel;
  const question = level.questions[state.questionIndex];
  state.answered = false;
  state.timeLeft = 45;

  const currentNo = state.questionIndex + 1;
  const total = level.questions.length;
  const progress = Math.round(((currentNo - 1) / total) * 100);

  screen.innerHTML = `
    <div class="game-header">
      <div>
        <h1 class="game-title">${level.icon} ${escapeHtml(level.title)}</h1>
        <p class="game-subtitle">Soal ${currentNo} dari ${total}</p>
      </div>
      <div class="game-metrics">
        <div class="metric">⭐ ${state.score}</div>
        <div class="metric">❤️ ${state.lives}</div>
        <div class="metric">⏱️ <span id="timerText">${state.timeLeft}s</span></div>
      </div>
    </div>

    <div class="progress-wrap">
      <div class="progress-bar">
        <div class="progress-fill" style="width:${progress}%"></div>
      </div>
    </div>

    <section class="question-card">
      <div class="question-label">Pertanyaan</div>
      <div class="question">${escapeHtml(question.question)}</div>

      <div class="visual-area">
        <div class="diagram">
          <div>
            <span class="big-icon">${question.icon}</span>
            <div style="color:var(--muted);font-size:13px">Pilih jawaban yang paling tepat.</div>
          </div>
        </div>
      </div>

      <div class="options" id="options">
        ${question.options.map((option, index) => `
          <button class="option-btn" type="button" data-answer="${index}">
            ${String.fromCharCode(65 + index)}. ${escapeHtml(option)}
          </button>
        `).join("")}
      </div>

      <div class="explain" id="explain"></div>

      <div class="game-actions">
        <span id="answerStatus" style="color:var(--muted);font-size:13px">Pilih satu jawaban.</span>
        <button class="primary-btn" type="button" id="nextQuestion" disabled>Soal Berikutnya →</button>
      </div>
    </section>
  `;

  screen.querySelectorAll("[data-answer]").forEach(button => {
    button.addEventListener("click", () => answerQuestion(Number(button.dataset.answer)));
  });

  document.getElementById("nextQuestion").addEventListener("click", nextQuestion);
  startTimer();
}

function startTimer() {
  state.timeLeft = 45;
  updateTimerText();
  state.timerId = setInterval(() => {
    state.timeLeft -= 1;
    updateTimerText();

    if (state.timeLeft <= 0) {
      clearTimer();
      answerQuestion(-1, true);
    }
  }, 1000);
}

function updateTimerText() {
  const el = document.getElementById("timerText");
  if (el) {
    el.textContent = `${Math.max(0, state.timeLeft)}s`;
    if (state.timeLeft <= 10) el.style.color = "var(--danger)";
  }
}

function clearTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function answerQuestion(selectedIndex, timeout = false) {
  if (state.answered) return;
  state.answered = true;
  clearTimer();

  const question = state.currentLevel.questions[state.questionIndex];
  const buttons = [...screen.querySelectorAll("[data-answer]")];
  const explain = document.getElementById("explain");
  const status = document.getElementById("answerStatus");
  const nextButton = document.getElementById("nextQuestion");

  buttons.forEach(button => button.disabled = true);
  buttons.forEach(button => {
    const idx = Number(button.dataset.answer);
    if (idx === question.answer) button.classList.add("correct");
    if (idx === selectedIndex && idx !== question.answer) button.classList.add("wrong");
  });

  if (selectedIndex === question.answer) {
    const earned = 10;
    state.score += earned;
    state.correct += 1;
    status.textContent = `✅ Benar! +${earned} poin`;
    status.style.color = "var(--success)";
    playBeep("correct");
  } else {
    state.lives -= 1;
    status.textContent = timeout
      ? "⏰ Waktu habis. Nyawa berkurang."
      : "❌ Jawaban kurang tepat. Nyawa berkurang.";
    status.style.color = "var(--danger)";
    playBeep("wrong");
  }

  explain.innerHTML = `<strong>💡 Penjelasan:</strong> ${escapeHtml(question.explanation)}`;
  explain.classList.add("show");
  nextButton.disabled = false;

  if (state.lives <= 0) {
    nextButton.textContent = "Lihat Hasil";
  } else if (state.questionIndex >= state.currentLevel.questions.length - 1) {
    nextButton.textContent = "Selesaikan Level";
  } else {
    nextButton.textContent = "Soal Berikutnya →";
  }
}

function nextQuestion() {
  if (!state.answered) return;
  if (state.lives <= 0 || state.questionIndex >= state.currentLevel.questions.length - 1) {
    finishLevel();
    return;
  }
  state.questionIndex += 1;
  renderQuestion();
}

function finishLevel() {
  clearTimer();
  const level = state.currentLevel;
  const completed = state.lives > 0 && state.correct >= Math.ceil(level.questions.length / 2);
  const old = getLevelProgress(level.id);
  const newBest = Math.max(old.best || 0, state.score);

  setLevelProgress(level.id, {
    completed: old.completed || completed,
    best: newBest,
    unlocked: true
  });

  const next = state.levels.find(item => item.id === level.id + 1);
  if (completed && next) {
    setLevelProgress(next.id, { unlocked: true });
  }
  if (completed && level.id === 4) {
    setLevelProgress(5, { unlocked: true });
  }

  const title = completed ? "Level Selesai! 🎉" : "Misi Belum Berhasil";
  const icon = completed ? "🏆" : "🛠️";
  const message = completed
    ? next
      ? `Level berikutnya, <strong>${escapeHtml(next.title)}</strong>, sudah terbuka.`
      : "Semua level utama sudah kamu selesaikan."
    : "Coba lagi dan perbaiki jawabanmu. Belum semua misi berhasil diselesaikan.";

  screen.innerHTML = `
    <section class="panel result">
      <div class="result-icon">${icon}</div>
      <span class="badge">${escapeHtml(level.title)}</span>
      <h2>${title}</h2>
      <p>${message}</p>

      <div class="result-score">
        <div class="stat">
          <strong>${state.score}</strong>
          <span>Skor</span>
        </div>
        <div class="stat">
          <strong>${state.correct}/${level.questions.length}</strong>
          <span>Benar</span>
        </div>
        <div class="stat">
          <strong>${state.lives}</strong>
          <span>Nyawa tersisa</span>
        </div>
      </div>

      <div class="hero-actions" style="justify-content:center">
        <button class="primary-btn" type="button" id="retry">🔄 Ulangi Level</button>
        <button class="secondary-btn" type="button" id="home">🏠 Menu Utama</button>
      </div>

      ${completed && next ? `
        <div class="tip">🔓 ${escapeHtml(next.title)} telah terbuka.</div>
      ` : ""}
    </section>
  `;

  document.getElementById("retry").addEventListener("click", () => startLevel(level.id));
  document.getElementById("home").addEventListener("click", renderHome);
  saveState();
}

soundToggle.addEventListener("click", () => {
  state.sound = !state.sound;
  updateSoundButton();
  if (state.sound) startBackgroundMusic();
  else stopBackgroundMusic();
  saveState();
  showToast(state.sound ? "Suara dinyalakan." : "Suara dimatikan.");
});

document.addEventListener("pointerdown", startBackgroundMusic, { once: true });

resetProgressBtn.addEventListener("click", () => {
  const ok = window.confirm("Reset semua progres game?");
  if (!ok) return;
  localStorage.removeItem(STORAGE_KEY);
  state.progress = {};
  state.levels.forEach((level, index) => {
    state.progress[level.id] = {
      unlocked: index === 0,
      completed: false,
      best: 0
    };
  });
  state.progress[5] = { unlocked: true, completed: false, best: 0 };
  saveState();
  showToast("Progres berhasil direset.");
  renderHome();
});

loadState();
loadLevels();
