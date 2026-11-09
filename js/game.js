// =========================================================================
// ECHO-PARADOX 3D — ADVANCED CYBER GAME ENGINE
// Three.js + Web Audio API (Procedural Synthwave) + WebRTC PeerJS
// =========================================================================

// =========================================================================
// 1. SYNTHESIZED CYBER AUDIO & PROCEDURAL SYNTHWAVE MUSIC ENGINE
// =========================================================================
class CyberAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.musicEnabled = true;

    // Master gains
    this.sfxGain = null;
    this.musicGain = null;

    // Synthwave Sequencer State
    this.seqTimer = null;
    this.currentStep = 0;
    this.inTensionMode = false;
    this.lastBeepSecond = -1;

    // D minor 16-step synthwave bassline frequencies
    // D2=73.4, F2=87.3, G2=98.0, A2=110.0, Bb2=116.5, C3=130.8, D3=146.8
    this.bassPattern = [
      73.4, 73.4, 146.8, 73.4,
      87.3, 73.4, 98.0, 73.4,
      110.0, 73.4, 87.3, 73.4,
      130.8, 110.0, 98.0, 87.3
    ];
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
        this.sfxGain.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(0.22, this.ctx.currentTime);
        this.musicGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- PROCEDURAL SYNTHWAVE MUSIC SEQUENCER ---
  startBGM() {
    this.init();
    if (!this.ctx || this.seqTimer || !this.musicEnabled) return;

    // 120 BPM = 500ms per quarter note => 125ms per 16th step
    this.currentStep = 0;
    this.seqTimer = setInterval(() => {
      if (!this.musicEnabled || !this.ctx) return;
      this.playSequencerStep();
    }, 125);
  }

  stopBGM() {
    if (this.seqTimer) {
      clearInterval(this.seqTimer);
      this.seqTimer = null;
    }
  }

  setMusicVolume(ratio) {
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(Math.max(0, Math.min(1, ratio)) * 0.45, this.ctx.currentTime);
    }
  }

  setSFXVolume(ratio) {
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(Math.max(0, Math.min(1, ratio)) * 0.9, this.ctx.currentTime);
    }
  }

  toggleBGM() {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) {
      this.startBGM();
    } else {
      this.stopBGM();
    }
    return this.musicEnabled;
  }

  playSequencerStep() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const step = this.currentStep % 16;
    let baseFreq = this.bassPattern[step];

    // In tension mode (last 3.5s before rewind), raise octave and filter
    if (this.inTensionMode) {
      baseFreq *= 1.5;
    }

    // 1. Synth Bass Note (Sawtooth + Sub-Sine + Lowpass Filter)
    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const noteGain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(baseFreq, now);

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(baseFreq * 0.5, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(this.inTensionMode ? 1900 : 720, now);
    filter.Q.setValueAtTime(3.5, now);

    noteGain.gain.setValueAtTime(0.18, now);
    noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.musicGain);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + 0.12);
    subOsc.stop(now + 0.12);

    // 2. Synthesized Kick (Every 4 steps: 0, 4, 8, 12)
    if (step % 4 === 0) {
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(140, now);
      kickOsc.frequency.exponentialRampToValueAtTime(32, now + 0.08);

      kickGain.gain.setValueAtTime(0.32, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      kickOsc.connect(kickGain);
      kickGain.connect(this.musicGain);
      kickOsc.start(now);
      kickOsc.stop(now + 0.1);
    }

    // 3. Synthesized Hi-Hat (Every off-beat step: 2, 6, 10, 14)
    if (step % 2 === 0) {
      const hhOsc = this.ctx.createOscillator();
      const hhFilter = this.ctx.createBiquadFilter();
      const hhGain = this.ctx.createGain();

      hhOsc.type = 'square';
      hhOsc.frequency.setValueAtTime(7500, now);

      hhFilter.type = 'highpass';
      hhFilter.frequency.setValueAtTime(6000, now);

      hhGain.gain.setValueAtTime(0.035, now);
      hhGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

      hhOsc.connect(hhFilter);
      hhFilter.connect(hhGain);
      hhGain.connect(this.musicGain);

      hhOsc.start(now);
      hhOsc.stop(now + 0.035);
    }

    this.currentStep++;
  }

  // --- SOUND EFFECTS (SFX) ---
  playLaser(isEcho = false) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isEcho ? 'triangle' : 'sawtooth';
    osc.frequency.setValueAtTime(isEcho ? 640 : 880, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
    gain.gain.setValueAtTime(isEcho ? 0.06 : 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  playDash() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.18);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playHit() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(170, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playCloneDestroy() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Shatter sound: chord drop + noise burst
    [320, 480, 720].forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.28);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.29);
    });
  }

  playReflect() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.14);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  playPowerup() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [440, 660, 880, 1320].forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.05);
      gain.gain.setValueAtTime(0.12, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.18);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.19);
    });
  }

  playCountdownBeep(n) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(n === 1 ? 1200 : 850, now);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playTimeRewind() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [330, 440, 660, 880].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + idx * 0.06 + 0.25);
      gain.gain.setValueAtTime(0.12, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.26);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.27);
    });
  }

  playVictory() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [440, 554.37, 659.25, 880].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.11);
      gain.gain.setValueAtTime(0.18, now + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.35);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.11);
      osc.stop(now + idx * 0.11 + 0.36);
    });
  }
}


// =========================================================================
// ACHIEVEMENTS & TROPHIES ENGINE
// =========================================================================
const ACHIEVEMENTS_DEF = [
  { id: 'first_win', title: 'Premier Sang', icon: '🥇', desc: 'Remporter ton premier duel temporel' },
  { id: 'emp_deflect', title: 'Miroir Fatal', icon: '🛡️', desc: 'Renvoyer un laser avec le bouclier EMP' },
  { id: 'dash_crush_3', title: 'Briseur de Boucle', icon: '💥', desc: 'Détruire un clone au Dash en plein vol' },
  { id: 'accuracy_elite', title: 'Tireur d\'Élite', icon: '🎯', desc: 'Finir un duel avec plus de 75% de précision' },
  { id: 'survive_cycle_3', title: 'Chrono-Maître', icon: '⏱️', desc: 'Survivre jusqu\'au Cycle 3 ou plus' },
  { id: 'powerup_collector', title: 'Pillard Temporel', icon: '💎', desc: 'Ramasser un bonus au centre de l\'arène' }
];

let unlockedAchievements = new Set();

function loadAchievements() {
  try {
    const raw = localStorage.getItem('echo_achievements_v2');
    if (raw) {
      unlockedAchievements = new Set(JSON.parse(raw));
    }
  } catch (e) {}
}

function unlockAchievement(id) {
  if (unlockedAchievements.has(id)) return;
  const ach = ACHIEVEMENTS_DEF.find((a) => a.id === id);
  if (!ach) return;

  unlockedAchievements.add(id);
  try {
    localStorage.setItem('echo_achievements_v2', JSON.stringify(Array.from(unlockedAchievements)));
  } catch (e) {}

  soundFX.playPowerup();
  triggerHaptics([80, 50, 100]);

  // Spawn visual golden achievement banner
  const containerEl = document.getElementById('achievement-popup-container');
  if (containerEl) {
    const popup = document.createElement('div');
    popup.className = 'achievement-popup hud-glass rounded-2xl px-5 py-2.5 border-2 border-amber-400/80 shadow-2xl flex items-center gap-3 bg-gradient-to-r from-amber-950/70 via-slate-900/90 to-slate-950';
    popup.innerHTML = `
      <div class="h-10 w-10 rounded-xl bg-amber-400/20 border border-amber-300 flex items-center justify-center text-xl shrink-0">
        ${ach.icon}
      </div>
      <div>
        <div class="text-[10px] font-bold tracking-wider text-amber-300 font-cyber">🏆 SUCCÈS DÉBLOQUÉ !</div>
        <div class="font-cyber text-xs font-black text-white">${ach.title}</div>
        <div class="text-[11px] text-slate-300">${ach.desc}</div>
      </div>
    `;
    containerEl.appendChild(popup);
    setTimeout(() => popup.remove(), 3500);
  }
}

function renderAchievementsModal() {
  const listEl = document.getElementById('achievements-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  ACHIEVEMENTS_DEF.forEach((ach) => {
    const isUnlocked = unlockedAchievements.has(ach.id);
    const card = document.createElement('div');
    card.className = `rounded-2xl p-3.5 border ${
      isUnlocked
        ? 'border-amber-400/60 bg-amber-950/25 hud-glass'
        : 'border-slate-800 bg-slate-900/60 opacity-60'
    } flex items-center gap-3`;
    card.innerHTML = `
      <div class="h-11 w-11 rounded-xl ${
        isUnlocked ? 'bg-amber-400/20 border border-amber-400' : 'bg-slate-800'
      } flex items-center justify-center text-2xl shrink-0">
        ${isUnlocked ? ach.icon : '🔒'}
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center justify-between">
          <h4 class="font-cyber text-xs font-bold ${isUnlocked ? 'text-amber-300' : 'text-slate-400'}">${ach.title}</h4>
          <span class="text-[10px] font-mono ${isUnlocked ? 'text-emerald-400 font-bold' : 'text-slate-500'}">${isUnlocked ? 'DÉBLOQUÉ' : 'VERROUILLÉ'}</span>
        </div>
        <p class="text-[11px] text-slate-300 mt-0.5 truncate">${ach.desc}</p>
      </div>
    `;
    listEl.appendChild(card);
  });
}

const soundFX = new CyberAudio();

// =========================================================================
// UX: HAPTICS, MATCH STATS & HANGAR SKIN CUSTOMIZATION
// =========================================================================
let matchStartTime = performance.now();
let p1ShotsFired = 0;
let p1HitsLanded = 0;
let p1DashKills = 0;
let hapticsEnabled = true;

function triggerHaptics(pattern) {
  if (hapticsEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch (e) {}
  }
}

const SKINS = {
  cyan: { name: 'Cyan Cyber', color: 0x06b6d4, cssColor: '#06b6d4' },
  purple: { name: 'Synthwave', color: 0xa855f7, cssColor: '#a855f7' },
  green: { name: 'Matrix', color: 0x10b981, cssColor: '#10b981' },
  gold: { name: 'Solaire', color: 0xf59e0b, cssColor: '#f59e0b' },
  white: { name: 'Fantôme', color: 0xe2e8f0, cssColor: '#e2e8f0' }
};

let currentSkinId = 'cyan';

function applyPlayerSkin(skinId) {
  if (!SKINS[skinId]) skinId = 'cyan';
  currentSkinId = skinId;
  const skin = SKINS[skinId];
  p1.color = skin.color;

  // Update P1 Mesh Materials
  if (p1.mesh) {
    p1.mesh.traverse((node) => {
      if (node.isMesh && node.material) {
        if (node.material.emissive && node !== p1.mesh.userData.shield) {
          node.material.emissive.setHex(skin.color);
        }
        if (node.material.color && node !== p1.mesh.userData.shield && node.material.color.getHex() !== 0x0f172a && node.material.color.getHex() !== 0x091428) {
          node.material.color.setHex(skin.color);
        }
      }
    });
  }

  // Update HUD Marker
  const markerHp = document.getElementById('marker-p1-hp');
  if (markerHp) markerHp.style.background = skin.cssColor;
  const hudHp = document.getElementById('hud-p1-hp');
  if (hudHp) hudHp.style.background = `linear-gradient(to right, ${skin.cssColor}, #2563eb)`;

  // Update UI Buttons
  document.querySelectorAll('.skin-choice-btn').forEach((btn) => {
    if (btn.getAttribute('data-skin') === skinId) {
      btn.classList.add('active');
      btn.style.borderColor = '#ffffff';
    } else {
      btn.classList.remove('active');
      btn.style.borderColor = '';
    }
  });

  try { localStorage.setItem('echo_paradox_skin_v2', skinId); } catch (e) {}
}

document.querySelectorAll('.skin-choice-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const sId = btn.getAttribute('data-skin');
    applyPlayerSkin(sId);
    soundFX.playPowerup();
    showToast();
  });
});


// =========================================================================
// 2. PERSISTENT PLAYER STATS (Safe localStorage wrapper)
// =========================================================================
const PlayerStats = {
  wins: 0,
  echoes: 0,
  clonesDestroyed: 0,
  load() {
    try {
      const raw = localStorage.getItem('echo_paradox_stats_v2');
      if (raw) {
        const data = JSON.parse(raw);
        this.wins = Number(data.wins) || 0;
        this.echoes = Number(data.echoes) || 0;
        this.clonesDestroyed = Number(data.clonesDestroyed) || 0;
      }
    } catch (e) {}
    this.updateUI();
  },
  save() {
    try {
      localStorage.setItem('echo_paradox_stats_v2', JSON.stringify({
        wins: this.wins,
        echoes: this.echoes,
        clonesDestroyed: this.clonesDestroyed
      }));
    } catch (e) {}
    this.updateUI();
  },
  updateUI() {
    const wEl = document.getElementById('stat-wins');
    const eEl = document.getElementById('stat-echoes');
    const rEl = document.getElementById('stat-rank');
    if (wEl) wEl.textContent = String(this.wins);
    if (eEl) eEl.textContent = String(this.echoes);
    if (rEl) {
      if (this.wins >= 15) rEl.textContent = 'MAÎTRE PARADOXE';
      else if (this.wins >= 7) rEl.textContent = 'DIAMANT AR';
      else if (this.wins >= 3) rEl.textContent = 'OR CYBER';
      else rEl.textContent = 'BRONZE I';
    }
  }
};

// =========================================================================
// 3. THREE.JS 3D HOLOGRAPHIC AR ENGINE & SHARED ASSETS (0 Memory Leaks)
// =========================================================================
const container = document.getElementById('game-canvas-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x030712, 0.014);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 250);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.75);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(15, 35, 20);
scene.add(dirLight);

const cyanPointLight = new THREE.PointLight(0x06b6d4, 2.5, 35);
cyanPointLight.position.set(-12, 5, 0);
scene.add(cyanPointLight);

const pinkPointLight = new THREE.PointLight(0xf43f5e, 2.5, 35);
pinkPointLight.position.set(12, 5, 0);
scene.add(pinkPointLight);

// Shared Geometries to prevent GPU buffer memory leaks
const sharedProjGeo = new THREE.SphereGeometry(0.42, 12, 12);
const sharedEchoProjGeo = new THREE.SphereGeometry(0.32, 10, 10);
const sharedTrailGeo = new THREE.CylinderGeometry(0.12, 0.02, 1.5, 8);
sharedTrailGeo.rotateZ(Math.PI / 2);
const sharedParticleGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
const sharedShockwaveGeo = new THREE.RingGeometry(0.3, 0.55, 32);
sharedShockwaveGeo.rotateX(-Math.PI / 2);
const sharedThrusterGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);


// =========================================================================
// MULTI-ARENA THEMES (Cyber, Magma, Void)
// =========================================================================
const ARENA_THEMES = {
  cyber: {
    name: 'Cyber Néon',
    baseColor: 0x091326,
    grid1: 0x0284c7,
    grid2: 0x1e293b,
    border: 0x22d3ee,
    ring1: 0x38bdf8,
    ring2: 0xf43f5e,
    fog: 0x030712,
    ambient: 0x38bdf8
  },
  magma: {
    name: 'Noyau Magma',
    baseColor: 0x1a0505,
    grid1: 0xea580c,
    grid2: 0x431407,
    border: 0xf97316,
    ring1: 0xfbbf24,
    ring2: 0xef4444,
    fog: 0x100202,
    ambient: 0xf97316
  },
  void: {
    name: 'Void Nébuleuse',
    baseColor: 0x0c0418,
    grid1: 0x9333ea,
    grid2: 0x3b0764,
    border: 0xa855f7,
    ring1: 0x10b981,
    ring2: 0x3b82f6,
    fog: 0x06020c,
    ambient: 0xa855f7
  }
};

let currentArenaTheme = 'cyber';

function applyArenaTheme(themeId) {
  if (!ARENA_THEMES[themeId]) themeId = 'cyber';
  currentArenaTheme = themeId;
  const th = ARENA_THEMES[themeId];

  baseMat.color.setHex(th.baseColor);
  borderMat.color.setHex(th.border);
  orbitalRing1.material.color.setHex(th.ring1);
  orbitalRing2.material.color.setHex(th.ring2);
  ambientLight.color.setHex(th.ambient);
  scene.fog.color.setHex(th.fog);
  renderer.setClearColor(th.fog);

  // Update polar grid
  arenaGroup.remove(polarGrid);
  const newGrid = new THREE.PolarGridHelper(ARENA_RADIUS - 0.3, 16, 8, 64, th.grid1, th.grid2);
  newGrid.position.y = 0.03;
  arenaGroup.add(newGrid);

  // Update buttons
  document.querySelectorAll('.arena-choice-btn').forEach((btn) => {
    if (btn.getAttribute('data-arena') === themeId) {
      btn.classList.add('active');
      btn.style.borderColor = '#ffffff';
    } else {
      btn.classList.remove('active');
      btn.style.borderColor = '';
    }
  });

  try { localStorage.setItem('echo_arena_theme_v2', themeId); } catch (e) {}
}

document.querySelectorAll('.arena-choice-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const aId = btn.getAttribute('data-arena');
    applyArenaTheme(aId);
    soundFX.playPowerup();
    showToast('Arène 3D changée : ' + ARENA_THEMES[aId].name);
  });
});

// Arena Constants
const ARENA_RADIUS = 19;
const obstacles = [];

// Build 3D Holographic Octagon Arena
const arenaGroup = new THREE.Group();
scene.add(arenaGroup);

// Base Dark Reflective Disc (Also used for Mouse Raycasting)
const baseGeo = new THREE.CylinderGeometry(ARENA_RADIUS, ARENA_RADIUS * 0.92, 1.2, 32);
const baseMat = new THREE.MeshStandardMaterial({
  color: 0x091326,
  metalness: 0.7,
  roughness: 0.3
});
const baseMesh = new THREE.Mesh(baseGeo, baseMat);
baseMesh.position.y = -0.6;
arenaGroup.add(baseMesh);

// Glowing Polar Grid Overlay
const polarGrid = new THREE.PolarGridHelper(ARENA_RADIUS - 0.3, 16, 8, 64, 0x0284c7, 0x1e293b);
polarGrid.position.y = 0.03;
arenaGroup.add(polarGrid);

// Outer Neon Perimeter Ring
const borderGeo = new THREE.TorusGeometry(ARENA_RADIUS, 0.25, 16, 64);
const borderMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
const borderRing = new THREE.Mesh(borderGeo, borderMat);
borderRing.rotation.x = Math.PI / 2;
borderRing.position.y = 0.25;
arenaGroup.add(borderRing);

// Outer Orbital AR Hologram Rings
const orbitalRing1 = new THREE.Mesh(
  new THREE.TorusGeometry(ARENA_RADIUS + 3.5, 0.06, 12, 64),
  new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 })
);
orbitalRing1.rotation.x = Math.PI / 2.2;
arenaGroup.add(orbitalRing1);

const orbitalRing2 = new THREE.Mesh(
  new THREE.TorusGeometry(ARENA_RADIUS + 6.2, 0.05, 12, 64),
  new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.35 })
);
orbitalRing2.rotation.x = Math.PI / 1.8;
arenaGroup.add(orbitalRing2);

// 4 Tactical Holographic Cover Pillars
const pillarPositions = [
  { x: -6.8, z: -6.8 },
  { x: 6.8, z: -6.8 },
  { x: -6.8, z: 6.8 },
  { x: 6.8, z: 6.8 }
];
pillarPositions.forEach((pos) => {
  const pGeo = new THREE.CylinderGeometry(1.15, 1.15, 2.5, 6);
  const pMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    emissive: 0x0284c7,
    emissiveIntensity: 0.4,
    metalness: 0.8,
    roughness: 0.2
  });
  const pillar = new THREE.Mesh(pGeo, pMat);
  pillar.position.set(pos.x, 1.25, pos.z);

  const edges = new THREE.EdgesGeometry(pGeo);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x38bdf8 }));
  pillar.add(line);

  arenaGroup.add(pillar);
  obstacles.push({ x: pos.x, z: pos.z, radius: 1.35, mesh: pillar });
});

// MULTI-POWERUP ROTATING SYSTEM
// Types: 'chrono_core' (Gold - Triple Shot + Heal), 'emp_shield' (Cyan - Reflector Shield), 'time_warp' (Purple - Enemy Slow)
const powerupState = {
  active: true,
  type: 'chrono_core',
  types: ['chrono_core', 'emp_shield', 'time_warp'],
  typeIndex: 0,
  respawnTimer: 0
};

const powerupGroup = new THREE.Group();
const powerupCoreMesh = new THREE.Mesh(
  new THREE.OctahedronGeometry(1.05, 0),
  new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
);
const powerupHaloMesh = new THREE.Mesh(
  new THREE.OctahedronGeometry(1.45, 0),
  new THREE.MeshBasicMaterial({ color: 0xfde047, wireframe: true, transparent: true, opacity: 0.85 })
);
powerupGroup.add(powerupCoreMesh);
powerupGroup.add(powerupHaloMesh);
powerupGroup.position.set(0, 1.4, 0);
scene.add(powerupGroup);

function setPowerupType(type) {
  powerupState.type = type;
  if (type === 'chrono_core') {
    powerupCoreMesh.material.color.setHex(0xfbbf24);
    powerupHaloMesh.material.color.setHex(0xfde047);
  } else if (type === 'emp_shield') {
    powerupCoreMesh.material.color.setHex(0x22d3ee);
    powerupHaloMesh.material.color.setHex(0x38bdf8);
  } else if (type === 'time_warp') {
    powerupCoreMesh.material.color.setHex(0xa855f7);
    powerupHaloMesh.material.color.setHex(0xc084fc);
  }
}

// Click Target Indicator on Floor
const clickTargetMesh = new THREE.Mesh(
  new THREE.RingGeometry(0.5, 0.85, 24),
  new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide, transparent: true, opacity: 0.0 })
);
clickTargetMesh.rotation.x = -Math.PI / 2;
clickTargetMesh.position.y = 0.1;
scene.add(clickTargetMesh);

// Background Starfield
const starCount = 350;
const starsGeo = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount * 3; i += 3) {
  starPositions[i] = (Math.random() - 0.5) * 110;
  starPositions[i + 1] = (Math.random() - 0.3) * 50;
  starPositions[i + 2] = (Math.random() - 0.5) * 110;
}
starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starsMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.35, transparent: true, opacity: 0.65 });
const starField = new THREE.Points(starsGeo, starsMat);
scene.add(starField);

// =========================================================================
// 4. SCI-FI STARFIGHTER MESH BUILDER & ENTITY DEFINITIONS
// =========================================================================
function createCyberFighterMesh(colorHex, isGhost = false, hasAimLaser = false) {
  const group = new THREE.Group();

  // 1. Sleek Central Fuselage
  const hullGeo = new THREE.ConeGeometry(0.85, 2.6, 6);
  hullGeo.rotateX(Math.PI / 2);
  const hullMat = new THREE.MeshStandardMaterial({
    color: isGhost ? colorHex : 0x091428,
    emissive: colorHex,
    emissiveIntensity: isGhost ? 0.9 : 0.45,
    metalness: 0.8,
    roughness: 0.2,
    transparent: isGhost,
    opacity: isGhost ? 0.48 : 1.0
  });
  const hull = new THREE.Mesh(hullGeo, hullMat);
  hull.position.y = 0.85;
  group.add(hull);

  // Wireframe outline
  const wireGeo = new THREE.EdgesGeometry(hullGeo);
  const wireMat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: isGhost ? 0.75 : 0.95
  });
  const wire = new THREE.LineSegments(wireGeo, wireMat);
  hull.add(wire);

  // 2. Swept Delta Wings with Glowing Neon Trim
  const wingShape = new THREE.BoxGeometry(2.7, 0.12, 1.1);
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    emissive: colorHex,
    emissiveIntensity: 0.5,
    metalness: 0.85,
    roughness: 0.2,
    transparent: isGhost,
    opacity: isGhost ? 0.45 : 1.0
  });
  const wings = new THREE.Mesh(wingShape, wingMat);
  wings.position.set(0, 0.8, -0.3);
  group.add(wings);

  // 3. Glowing Cockpit Canopy
  const canopyGeo = new THREE.SphereGeometry(0.38, 12, 8);
  canopyGeo.scale(1, 0.7, 1.8);
  const canopyMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 0.9,
    metalness: 0.3,
    roughness: 0.1
  });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(0, 1.15, 0.25);
  group.add(canopy);

  // 4. Twin Rear Thrusters with Emissive Glow Exhaust
  [-0.45, 0.45].forEach((tx) => {
    const thrusterGeo = new THREE.CylinderGeometry(0.18, 0.24, 0.5, 8);
    thrusterGeo.rotateX(Math.PI / 2);
    const thrusterMat = new THREE.MeshBasicMaterial({ color: colorHex });
    const thruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    thruster.position.set(tx, 0.8, -1.25);
    group.add(thruster);
  });

  // 5. Aiming Laser Sight (Rotates with ship)
  let laserLine = null;
  if (hasAimLaser) {
    const laserGeo = new THREE.CylinderGeometry(0.04, 0.04, 12, 6);
    laserGeo.rotateX(Math.PI / 2);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.45
    });
    laserLine = new THREE.Mesh(laserGeo, laserMat);
    laserLine.position.set(0, 0.85, 7.0);
    group.add(laserLine);
  }

  // 6. Shield Sphere (Dash / EMP Reflective Shield)
  const shieldGeo = new THREE.SphereGeometry(1.85, 18, 18);
  const shieldMat = new THREE.MeshBasicMaterial({
    color: 0xfacc15,
    wireframe: true,
    transparent: true,
    opacity: 0.0
  });
  const shield = new THREE.Mesh(shieldGeo, shieldMat);
  shield.position.y = 0.85;
  group.add(shield);

  group.userData = { hull, shield, shieldMat, laserLine };
  return group;
}


// =========================================================================
// TACTICAL MINI-RADAR & CINEMATIC KILLCAM CONTROLLER
// =========================================================================
const radarCanvas = document.getElementById('radar-canvas');
const radarCtx = radarCanvas ? radarCanvas.getContext('2d') : null;
let radarSweepAngle = 0;

function renderTacticalRadar() {
  if (!radarCtx || !gameState.running) return;
  const w = 84;
  const h = 84;
  const cx = 42;
  const cy = 42;
  const rMax = 36;

  radarCtx.clearRect(0, 0, w, h);

  // Radar circular background
  radarCtx.fillStyle = 'rgba(3, 10, 24, 0.88)';
  radarCtx.beginPath();
  radarCtx.arc(cx, cy, rMax, 0, Math.PI * 2);
  radarCtx.fill();

  // Range rings
  radarCtx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
  radarCtx.lineWidth = 1;
  radarCtx.beginPath();
  radarCtx.arc(cx, cy, rMax * 0.5, 0, Math.PI * 2);
  radarCtx.stroke();
  radarCtx.beginPath();
  radarCtx.arc(cx, cy, rMax, 0, Math.PI * 2);
  radarCtx.stroke();

  // Crosshairs
  radarCtx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
  radarCtx.beginPath();
  radarCtx.moveTo(cx - rMax, cy);
  radarCtx.lineTo(cx + rMax, cy);
  radarCtx.moveTo(cx, cy - rMax);
  radarCtx.lineTo(cx, cy + rMax);
  radarCtx.stroke();

  // Radar sweep beam
  radarSweepAngle += 0.055;
  const sweepX = cx + Math.cos(radarSweepAngle) * rMax;
  const sweepY = cy + Math.sin(radarSweepAngle) * rMax;
  radarCtx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
  radarCtx.beginPath();
  radarCtx.moveTo(cx, cy);
  radarCtx.lineTo(sweepX, sweepY);
  radarCtx.stroke();

  const toRadar = (wx, wz) => ({
    x: cx + (wx / ARENA_RADIUS) * rMax,
    y: cy + (wz / ARENA_RADIUS) * rMax
  });

  // Obstacles
  obstacles.forEach((obs) => {
    const pt = toRadar(obs.x, obs.z);
    radarCtx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    radarCtx.beginPath();
    radarCtx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
    radarCtx.fill();
  });

  // Powerup
  if (powerupState && powerupState.active) {
    const pt = toRadar(0, 0);
    radarCtx.fillStyle = '#facc15';
    radarCtx.beginPath();
    radarCtx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
    radarCtx.fill();
  }

  // Clones
  activeEchoClones.forEach((c) => {
    const pt = toRadar(c.mesh.position.x, c.mesh.position.z);
    radarCtx.fillStyle = c.team === 1 ? 'rgba(56, 189, 248, 0.65)' : 'rgba(244, 63, 94, 0.65)';
    radarCtx.beginPath();
    radarCtx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
    radarCtx.fill();
  });

  // P2
  const p2Pt = toRadar(p2.x, p2.z);
  radarCtx.fillStyle = '#f43f5e';
  radarCtx.beginPath();
  radarCtx.arc(p2Pt.x, p2Pt.y, 3.5, 0, Math.PI * 2);
  radarCtx.fill();

  // P1
  const p1Pt = toRadar(p1.x, p1.z);
  radarCtx.fillStyle = '#22d3ee';
  radarCtx.beginPath();
  radarCtx.arc(p1Pt.x, p1Pt.y, 4, 0, Math.PI * 2);
  radarCtx.fill();

  // P1 Heading line
  radarCtx.strokeStyle = '#67e8f9';
  radarCtx.lineWidth = 1.5;
  radarCtx.beginPath();
  radarCtx.moveTo(p1Pt.x, p1Pt.y);
  radarCtx.lineTo(p1Pt.x + Math.cos(p1.angle) * 6, p1Pt.y + Math.sin(p1.angle) * 6);
  radarCtx.stroke();
}

// Killcam State
let killcamActive = false;
let killcamTarget = null;
let killcamAngle = 0;

function triggerCinematicKillcam(target, winnerTeam) {
  killcamActive = true;
  killcamTarget = target;
  killcamAngle = target.angle;
  gameState.slowMoFactor = 0.08;

  const overlay = document.getElementById('killcam-overlay');
  if (overlay) {
    overlay.classList.remove('hidden');
    void overlay.offsetWidth;
    overlay.classList.add('killcam-flash');
    setTimeout(() => overlay.classList.add('hidden'), 1600);
  }

  spawnExplosion(target.x, 1.2, target.z, target.color, 36);
  spawnShockwave(target.x, target.z, 0xfacc15, 8.5);
  soundFX.playCloneDestroy();
  soundFX.playVictory();

  setTimeout(() => {
    killcamActive = false;
    gameState.slowMoFactor = 1.0;
    endMatch(winnerTeam);
  }, 1450);
}

// =========================================================================
// SOLO CHALLENGES & TRAINING DOJO CONTROLLER
// =========================================================================
const soloChallengeState = {
  active: false,
  type: null,
  timer: 0,
  targetCount: 0,
  maxTargets: 6,
  targets: []
};

function startSoloChallenge(type) {
  soloChallengeState.active = true;
  soloChallengeState.type = type;
  soloChallengeState.timer = 0;
  soloChallengeState.targetCount = 0;

  soloChallengeState.targets.forEach((t) => scene.remove(t.mesh));
  soloChallengeState.targets = [];

  const challengesModal = document.getElementById('challenges-modal');
  if (challengesModal) {
    challengesModal.classList.add('hidden');
    challengesModal.classList.remove('flex');
  }

  if (type === 'targets') {
    startMatch('bot', '🎯 DRONES CIBLES');
    p2.hp = 99999;
    p2.x = 999;
    p2.mesh.position.set(999, 999, 999);

    const positions = [
      { x: -8, z: -5 }, { x: 8, z: -5 },
      { x: -7, z: 6 },  { x: 7, z: 6 },
      { x: 0, z: -10 }, { x: 0, z: 9 }
    ];

    positions.forEach((pos) => {
      const geo = new THREE.SphereGeometry(1.0, 16, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.7,
        metalness: 0.7,
        roughness: 0.2
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos.x, 1.2, pos.z);
      scene.add(mesh);
      soloChallengeState.targets.push({ mesh, hp: 20, x: pos.x, z: pos.z });
    });

    setCoachText('🎯 <span class="text-cyan-300">DÉFI 1 :</span> Détruis les 6 drones dorés le plus vite possible !');
  } else if (type === 'survival') {
    startMatch('bot', '⚠️ TOURELLES RAPIDES');
    gameState.botDifficulty = 'hard';
    setCoachText('🛡️ <span class="text-amber-300">DÉFI 2 :</span> Survis 20 secondes face au tir continu !');
  } else if (type === 'dash_smash') {
    startMatch('bot', '💥 CIBLES DASH');
    p2.hp = 99999;
    p2.x = 999;
    p2.mesh.position.set(999, 999, 999);

    for (let i = 0; i < 4; i++) {
      const mesh = createCyberFighterMesh(0xfb7185, true, false);
      const angle = (i / 4) * Math.PI * 2;
      const x = Math.cos(angle) * 9;
      const z = Math.sin(angle) * 9;
      mesh.position.set(x, 0.9, z);
      scene.add(mesh);
      activeEchoClones.push({
        team: 2,
        color: 0xfb7185,
        recording: [],
        frameIndex: 0,
        mesh,
        hp: 1,
        maxHp: 1
      });
    }
    setCoachText('💥 <span class="text-rose-300">DÉFI 3 :</span> Utilise le bouton DASH pour percuter et pulvériser les 4 clones !');
  }
}

// Global Game State
const gameState = {
  running: false,
  paused: false,
  mode: 'bot', // 'bot', 'local', 'online'
  botDifficulty: 'easy',
  autoFire: true,
  aimMode: 'auto', // 'auto' (Lock on opponent) or 'manual' (Free aim at mouse/stick)
  cameraMode: 0,
  loopDuration: 10.0,
  loopTimer: 10.0,
  cycleCount: 1,
  shakeIntensity: 0,
  slowMoFactor: 1.0,
  totalPlayerHits: 0,
  scores: { p1: 0, p2: 0 },
  roundsToWin: 2
};

// Players
const p1 = {
  id: 'p1',
  team: 1,
  color: 0x06b6d4,
  x: -11,
  z: 0,
  vx: 0,
  vz: 0,
  targetX: null,
  targetZ: null,
  angle: 0,
  hp: 100,
  maxHp: 100,
  shootCooldown: 0,
  dashCooldown: 0,
  dashActiveTimer: 0,
  tripleShotTimer: 0,
  empShieldTimer: 0,
  freezeTimer: 0,
  mesh: createCyberFighterMesh(0x06b6d4, false, true),
  currentRecording: [],
  pastRecordings: []
};
scene.add(p1.mesh);

const p2 = {
  id: 'p2',
  team: 2,
  color: 0xf43f5e,
  x: 11,
  z: 0,
  vx: 0,
  vz: 0,
  angle: Math.PI,
  hp: 100,
  maxHp: 100,
  shootCooldown: 0,
  dashCooldown: 0,
  dashActiveTimer: 0,
  tripleShotTimer: 0,
  empShieldTimer: 0,
  freezeTimer: 0,
  mesh: createCyberFighterMesh(0xf43f5e, false, false),
  currentRecording: [],
  pastRecordings: []
};
scene.add(p2.mesh);

let activeEchoClones = [];
let projectiles = [];
let particles = [];
let shockwaves = [];
let thrusterParticles = [];
let damageNumbers = [];

// =========================================================================
// 5. UNIVERSAL CONTROLS (Keyboard, Mouse Free-Aim, Touch Joystick, Gamepad)
// =========================================================================
const keys = {};
const raycaster = new THREE.Raycaster();
const mouseNDC = new THREE.Vector2();
let mouseWorldPoint = new THREE.Vector3(0, 0, 0);
let isPointerDownOnArena = false;
let touchJoystickVec = { x: 0, z: 0 };
let gpPrevStartPressed = false;

window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  // Clear mouse target if keyboard is used
  if (['KeyW', 'KeyZ', 'KeyS', 'KeyA', 'KeyQ', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    p1.targetX = null;
    p1.targetZ = null;
  }
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && gameState.running) {
    e.preventDefault();
  }
  if (e.code === 'KeyP' && gameState.running) {
    togglePause();
  }
  // Shortcut 'T' to toggle Free Aim / Auto Aim
  if (e.code === 'KeyT') {
    toggleAimMode();
  }
  // Shortcut 'F' for Fullscreen
  if (e.code === 'KeyF') {
    toggleFullscreen();
  }
  // Quick rematch hotkey when gameover modal is open
  if ((e.code === 'Space' || e.code === 'Enter') && !gameState.running) {
    const gModal = document.getElementById('gameover-modal');
    if (gModal && !gModal.classList.contains('hidden')) {
      document.getElementById('btn-rematch').click();
    }
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

// Mouse coordinates on Arena Floor Plane (for Free Aim & Click-to-Move)
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function updateMouseWorldCoordinates(clientX, clientY) {
  mouseNDC.x = (clientX / window.innerWidth) * 2 - 1;
  mouseNDC.y = -(clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouseNDC, camera);
  raycaster.ray.intersectPlane(floorPlane, mouseWorldPoint);
}

window.addEventListener('pointermove', (e) => {
  updateMouseWorldCoordinates(e.clientX, e.clientY);
  if (isPointerDownOnArena && gameState.running && !gameState.paused) {
    p1.targetX = mouseWorldPoint.x;
    p1.targetZ = mouseWorldPoint.z;
    clickTargetMesh.position.set(mouseWorldPoint.x, 0.12, mouseWorldPoint.z);
    clickTargetMesh.material.opacity = 0.85;
  }
});

container.addEventListener('pointerdown', (e) => {
  window.focus();
  if (!gameState.running || gameState.paused) return;
  isPointerDownOnArena = true;
  updateMouseWorldCoordinates(e.clientX, e.clientY);
  p1.targetX = mouseWorldPoint.x;
  p1.targetZ = mouseWorldPoint.z;
  clickTargetMesh.position.set(mouseWorldPoint.x, 0.12, mouseWorldPoint.z);
  clickTargetMesh.material.opacity = 0.85;
  triggerShoot(p1, false);
});

window.addEventListener('pointerup', () => {
  isPointerDownOnArena = false;
});

// Virtual Touch Joystick Implementation
const joystickZone = document.getElementById('virtual-joystick-zone');
const joystickKnob = document.getElementById('joystick-knob');
let joystickActive = false;
let joystickCenter = { x: 0, y: 0 };
let activeJoystickPointerId = null;
let currentControlMode = 'joystick';

function setControlMode(mode) {
  currentControlMode = mode;
  const dpad = document.getElementById('dpad-container');
  const label = document.getElementById('ctrl-mode-label');
  const maxR = 46;

  if (mode === 'joystick') {
    if (joystickZone) joystickZone.classList.remove('hidden');
    if (dpad) dpad.classList.add('hidden');
    if (label) label.textContent = 'Mode: Joystick';
  } else {
    if (joystickZone) joystickZone.classList.add('hidden');
    if (dpad) dpad.classList.remove('hidden');
    if (label) label.textContent = 'Mode: Croix D-Pad';
    touchJoystickVec.x = 0;
    touchJoystickVec.z = 0;
    if (joystickKnob) joystickKnob.style.transform = 'translate(0px, 0px)';
  }
  try { localStorage.setItem('echo_control_mode', mode); } catch (e) {}
}

function initVirtualJoystick() {
  if (!joystickZone || !joystickKnob) return;

  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.matchMedia('(pointer: coarse)').matches;
  let savedMode = 'joystick';
  try { savedMode = localStorage.getItem('echo_control_mode') || (isTouchDevice ? 'joystick' : 'dpad'); } catch (e) {}
  setControlMode(savedMode);

  const updateKnobFromCoords = (clientX, clientY) => {
    const dx = clientX - joystickCenter.x;
    const dy = clientY - joystickCenter.y;
    const dist = Math.hypot(dx, dy);
    const maxR = 46;
    const clampedDist = Math.min(dist, maxR);
    const angle = Math.atan2(dy, dx);
    const kx = Math.cos(angle) * clampedDist;
    const ky = Math.sin(angle) * clampedDist;

    joystickKnob.style.transform = `translate(${kx}px, ${ky}px)`;
    // Normalize vector [-1, 1]
    touchJoystickVec.x = kx / maxR;
    touchJoystickVec.z = ky / maxR;
  };

  const handlePointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    activeJoystickPointerId = e.pointerId;
    try { joystickZone.setPointerCapture(e.pointerId); } catch (err) {}

    const rect = joystickZone.getBoundingClientRect();
    joystickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    joystickActive = true;
    updateKnobFromCoords(e.clientX, e.clientY);
    triggerHaptic(15);
  };

  const handlePointerMove = (e) => {
    if (!joystickActive || e.pointerId !== activeJoystickPointerId) return;
    e.preventDefault();
    updateKnobFromCoords(e.clientX, e.clientY);
  };

  const handlePointerUp = (e) => {
    if (e.pointerId !== activeJoystickPointerId) return;
    joystickActive = false;
    activeJoystickPointerId = null;
    try { joystickZone.releasePointerCapture(e.pointerId); } catch (err) {}
    joystickKnob.style.transform = 'translate(0px, 0px)';
    touchJoystickVec.x = 0;
    touchJoystickVec.z = 0;
  };

  joystickZone.addEventListener('pointerdown', handlePointerDown);
  joystickZone.addEventListener('pointermove', handlePointerMove);
  joystickZone.addEventListener('pointerup', handlePointerUp);
  joystickZone.addEventListener('pointercancel', handlePointerUp);

  // Toggle control switcher
  const btnToggleCtrl = document.getElementById('btn-toggle-ctrl-style');
  if (btnToggleCtrl) {
    btnToggleCtrl.addEventListener('click', () => {
      const newMode = currentControlMode === 'joystick' ? 'dpad' : 'joystick';
      setControlMode(newMode);
      showToast(newMode === 'joystick' ? '🕹️ Mode Joystick Tactile activé' : '🔲 Mode Croix Directionnelle activé');
      window.focus();
    });
  }
}

// Fallback touch D-Pad listeners
document.querySelectorAll('.touch-move-btn').forEach((btn) => {
  const dir = btn.getAttribute('data-dir');
  const startMove = (ev) => {
    ev.preventDefault();
    p1.targetX = null;
    p1.targetZ = null;
    if (dir === 'up') touchJoystickVec.z = -1;
    if (dir === 'down') touchJoystickVec.z = 1;
    if (dir === 'left') touchJoystickVec.x = -1;
    if (dir === 'right') touchJoystickVec.x = 1;
    triggerHaptic(12);
  };
  const endMove = (ev) => {
    ev.preventDefault();
    touchJoystickVec.x = 0;
    touchJoystickVec.z = 0;
  };
  btn.addEventListener('pointerdown', startMove);
  btn.addEventListener('pointerup', endMove);
  btn.addEventListener('pointercancel', endMove);
  btn.addEventListener('mouseleave', endMove);
});

// Low-Latency Responsive Action Buttons (Zero 300ms Delay on Touch)
const btnShoot = document.getElementById('btn-action-shoot');
const btnDash = document.getElementById('btn-action-dash');

const handleInstantShoot = (e) => {
  if (e) e.preventDefault();
  window.focus();
  if (gameState.running && !gameState.paused) {
    triggerShoot(p1, false);
    triggerHaptic(25);
  }
};

const handleInstantDash = (e) => {
  if (e) e.preventDefault();
  window.focus();
  if (gameState.running && !gameState.paused) {
    triggerDash(p1);
    triggerHaptic(40);
  }
};

if (btnShoot) {
  btnShoot.addEventListener('pointerdown', handleInstantShoot);
  btnShoot.addEventListener('click', (e) => e.preventDefault());
}

if (btnDash) {
  btnDash.addEventListener('pointerdown', handleInstantDash);
  btnDash.addEventListener('click', (e) => e.preventDefault());
}

document.getElementById('btn-autofire-toggle').addEventListener('click', () => {
  gameState.autoFire = !gameState.autoFire;
  const btn = document.getElementById('btn-autofire-toggle');
  if (gameState.autoFire) {
    btn.textContent = '🤖 TIR AUTO : ACTIVÉ';
    btn.className = 'rounded-xl bg-emerald-500/25 border border-emerald-400 px-3 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/35 transition active:scale-95 shadow-md';
  } else {
    btn.textContent = '🎯 TIR MANUEL (Bouton Tir ou Espace)';
    btn.className = 'rounded-xl bg-slate-800/90 border border-slate-600 px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-cyan-400 transition active:scale-95 shadow-md';
  }
  window.focus();
});

function toggleAimMode() {
  gameState.aimMode = gameState.aimMode === 'auto' ? 'manual' : 'auto';
  const labelHeader = document.getElementById('aim-mode-label');
  const labelSettings = document.getElementById('aim-settings-label');
  const text = gameState.aimMode === 'auto' ? 'Visée: Auto' : 'Visée: Libre';
  if (labelHeader) labelHeader.textContent = text;
  if (labelSettings) labelSettings.textContent = text;
  showToast(gameState.aimMode === 'auto' ? '🎯 Visée Automatique (Verrouillée)' : '🎯 Visée Libre (Dirige au toucher/souris !)');
}

document.getElementById('btn-aim-mode').addEventListener('click', toggleAimMode);

// =========================================================================
// 6. 3D TO 2D FLOATING MARKERS & DAMAGE NUMBERS
// =========================================================================
function updateFloatingMarker(domId, worldX, worldY, worldZ) {
  const el = document.getElementById(domId);
  if (!el) return;
  if (!gameState.running) {
    el.classList.add('hidden');
    return;
  }
  const vec = new THREE.Vector3(worldX, worldY, worldZ);
  vec.project(camera);
  if (vec.z > 1) {
    el.classList.add('hidden');
    return;
  }
  const x = (vec.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-(vec.y * 0.5) + 0.5) * window.innerHeight;
  el.classList.remove('hidden');
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
}

// 3D Floating Damage Numbers
function spawnDamageNumber(worldX, worldY, worldZ, text, colorHex = '#f43f5e', isCrit = false) {
  const containerEl = document.getElementById('damage-numbers-container');
  if (!containerEl) return;
  const badge = document.createElement('div');
  badge.className = 'damage-number';
  badge.textContent = text;
  badge.style.color = colorHex;
  if (isCrit) {
    badge.style.fontSize = '20px';
  }

  containerEl.appendChild(badge);
  damageNumbers.push({
    el: badge,
    pos: new THREE.Vector3(worldX, worldY, worldZ),
    vy: 1.8,
    life: 0.75
  });
}

// =========================================================================
// 7. COMBAT MECHANICS: SHOOTING, DASHING, SHOCKWAVES & PARTICLES
// =========================================================================
function spawnShockwave(x, z, colorHex, maxRadius = 4.5) {
  const mat = new THREE.MeshBasicMaterial({
    color: colorHex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.95
  });
  const mesh = new THREE.Mesh(sharedShockwaveGeo, mat);
  mesh.position.set(x, 0.18, z);
  scene.add(mesh);
  shockwaves.push({ mesh, mat, scale: 1, maxScale: maxRadius * 2, opacity: 0.95 });
}

function spawnExplosion(x, y, z, colorHex, count = 16) {
  const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 1 });
  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(sharedParticleGeo, mat);
    mesh.position.set(x, y, z);
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 9;
    scene.add(mesh);
    particles.push({
      mesh,
      mat,
      vx: Math.cos(angle) * speed,
      vy: 2 + Math.random() * 6,
      vz: Math.sin(angle) * speed,
      life: 0.45 + Math.random() * 0.35
    });
  }
}

// Thruster Particle Emitter
function emitThrusterParticle(x, z, angle, colorHex, isDashing = false) {
  const pMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: isDashing ? 1.0 : 0.65
  });
  const mesh = new THREE.Mesh(sharedThrusterGeo, pMat);
  // Spawn from rear of ship
  const backX = x - Math.cos(angle) * 1.1;
  const backZ = z - Math.sin(angle) * 1.1;
  mesh.position.set(backX, 0.8, backZ);
  scene.add(mesh);

  const speed = isDashing ? 12 : 3.5;
  thrusterParticles.push({
    mesh,
    mat: pMat,
    vx: -Math.cos(angle) * speed + (Math.random() - 0.5) * 1.5,
    vy: (Math.random() - 0.5) * 0.8,
    vz: -Math.sin(angle) * speed + (Math.random() - 0.5) * 1.5,
    life: isDashing ? 0.35 : 0.18
  });
}

function fireProjectile(ownerTeam, x, z, angle, colorHex, isEcho = false) {
  const mat = new THREE.MeshBasicMaterial({ color: isEcho ? 0xe0f2fe : colorHex });
  const mesh = new THREE.Mesh(isEcho ? sharedEchoProjGeo : sharedProjGeo, mat);
  mesh.position.set(x + Math.cos(angle) * 1.4, 0.9, z + Math.sin(angle) * 1.4);

  const trailMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.8
  });
  const trail = new THREE.Mesh(sharedTrailGeo, trailMat);
  trail.position.x = -0.65;
  mesh.add(trail);
  mesh.rotation.y = -angle;

  scene.add(mesh);
  const speed = isEcho ? 20 : 23;
  projectiles.push({
    team: ownerTeam,
    isEcho,
    x: mesh.position.x,
    z: mesh.position.z,
    vx: Math.cos(angle) * speed,
    vz: Math.sin(angle) * speed,
    mesh,
    color: colorHex,
    bouncesLeft: 1,
    life: 2.6
  });
}

function triggerShoot(fighter, isEcho = false) {
  if (fighter.shootCooldown > 0) return false;
  fighter.shootCooldown = fighter.tripleShotTimer > 0 ? 0.26 : 0.36;
  soundFX.playLaser(isEcho);

  if (fighter.team === 1 && !isEcho) {
    p1ShotsFired++;
    triggerHaptics(18);
  }

  if (fighter.tripleShotTimer > 0) {
    [-0.2, 0, 0.2].forEach((offset) => {
      fireProjectile(fighter.team, fighter.x, fighter.z, fighter.angle + offset, 0xfbbf24, isEcho);
    });
  } else {
    fireProjectile(fighter.team, fighter.x, fighter.z, fighter.angle, fighter.color, isEcho);
  }
  return true;
}

function triggerDash(fighter) {
  if (fighter.dashCooldown > 0) return false;
  fighter.dashCooldown = 2.0;
  fighter.dashActiveTimer = 0.65;
  soundFX.playDash();
  spawnShockwave(fighter.x, fighter.z, 0xfacc15, 3.8);

  const dashSpeed = 20;
  fighter.vx = Math.cos(fighter.angle) * dashSpeed;
  fighter.vz = Math.sin(fighter.angle) * dashSpeed;
  if (fighter.team === 1) triggerHaptics(35);
  return true;
}

// =========================================================================
// 8. TIME-LOOP REWIND & HOLOGRAPHIC CLONES SPAWNER
// =========================================================================
function showBanner(text, icon = '⚡') {
  const banner = document.getElementById('live-banner');
  const txtEl = document.getElementById('live-banner-text');
  const icoEl = document.getElementById('live-banner-icon');
  if (!banner || !txtEl || !icoEl) return;
  txtEl.textContent = text;
  icoEl.textContent = icon;
  banner.classList.remove('opacity-0', '-translate-y-2');
  banner.classList.add('opacity-100', 'translate-y-0');
  setTimeout(() => {
    banner.classList.remove('opacity-100', 'translate-y-0');
    banner.classList.add('opacity-0', '-translate-y-2');
  }, 2600);
}

let coachTimeout = null;
function setCoachText(htmlText) {
  const bar = document.getElementById('coach-bar');
  const el = document.getElementById('coach-step-text');
  if (el) el.innerHTML = htmlText;
  if (bar) {
    bar.classList.remove('hidden', 'opacity-0');
    bar.classList.add('opacity-100');
    if (coachTimeout) clearTimeout(coachTimeout);
    coachTimeout = setTimeout(() => {
      bar.classList.add('transition-opacity', 'duration-500', 'opacity-0');
      setTimeout(() => {
        if (bar.classList.contains('opacity-0')) bar.classList.add('hidden');
      }, 500);
    }, 5500);
  }
}

function triggerTimeRewindCycle() {
  soundFX.playTimeRewind();
  gameState.cycleCount += 1;
  gameState.loopTimer = gameState.loopDuration;
  gameState.shakeIntensity = 0.45;
  soundFX.inTensionMode = false;
  soundFX.lastBeepSecond = -1;

  const overlay = document.getElementById('rewind-overlay');
  if (overlay) {
    overlay.classList.remove('hidden', 'rewind-flash');
    void overlay.offsetWidth;
    overlay.classList.add('rewind-flash');
    setTimeout(() => overlay.classList.add('hidden'), 650);
  }

  if (p1.currentRecording.length > 10) {
    p1.pastRecordings.push(p1.currentRecording);
    if (p1.pastRecordings.length > 3) p1.pastRecordings.shift();
    PlayerStats.echoes += 1;
  }
  if (p2.currentRecording.length > 10) {
    p2.pastRecordings.push(p2.currentRecording);
    if (p2.pastRecordings.length > 3) p2.pastRecordings.shift();
  }
  PlayerStats.save();

  p1.currentRecording = [];
  p2.currentRecording = [];

  activeEchoClones.forEach((c) => scene.remove(c.mesh));
  activeEchoClones = [];

  // Spawn Destructible Clones (30 HP each!)
  p1.pastRecordings.forEach((rec) => {
    const mesh = createCyberFighterMesh(0x38bdf8, true, false);
    scene.add(mesh);
    activeEchoClones.push({
      team: 1,
      color: 0x38bdf8,
      recording: rec,
      frameIndex: 0,
      mesh,
      hp: 30,
      maxHp: 30
    });
  });

  p2.pastRecordings.forEach((rec) => {
    const mesh = createCyberFighterMesh(0xfb7185, true, false);
    scene.add(mesh);
    activeEchoClones.push({
      team: 2,
      color: 0xfb7185,
      recording: rec,
      frameIndex: 0,
      mesh,
      hp: 30,
      maxHp: 30
    });
  });

  spawnShockwave(p1.x, p1.z, 0x22d3ee, 5.5);
  spawnShockwave(p2.x, p2.z, 0xf43f5e, 5.5);

  showBanner(`⏪ BOUCLE TEMPORELLE C${gameState.cycleCount} : NOUVEAUX CLONES ACTIFS !`, '⏪');
  setCoachText(`✨ <span class="text-cyan-300">CLONES OPÉRATIONNELS !</span> Tu as <strong>${p1.pastRecordings.length} clone(s) bleu(s)</strong> qui tirent avec toi. <em>Astuce : tire sur les clones rouges ou dashe à travers pour les détruire !</em>`);
  updateHUD();
}

// =========================================================================
// 9. INTELLIGENT BOT AI
// =========================================================================
function updateBotAI(dt) {
  let moveX = 0;
  let moveZ = 0;

  // 1. Detect Nearest Incoming Projectile
  let dangerProj = null;
  let minDist = 6.0;
  for (const proj of projectiles) {
    if (proj.team !== p2.team) {
      const dx = proj.x - p2.x;
      const dz = proj.z - p2.z;
      const dist = Math.hypot(dx, dz);
      if (dist < minDist) {
        minDist = dist;
        dangerProj = proj;
      }
    }
  }

  // 2. Dodge Projectiles or Move Tactically
  if (dangerProj && gameState.botDifficulty !== 'easy') {
    const perpX = -dangerProj.vz;
    const perpZ = dangerProj.vx;
    const len = Math.hypot(perpX, perpZ) || 1;
    moveX += (perpX / len) * 1.35;
    moveZ += (perpZ / len) * 1.35;

    if (minDist < 3.2 && p2.dashCooldown <= 0 && gameState.botDifficulty === 'hard') {
      triggerDash(p2);
    }
  } else {
    // If power-up is active, bot might try to grab it!
    if (powerupState.active && gameState.botDifficulty !== 'easy' && Math.hypot(p2.x, p2.z) > 4) {
      moveX += -p2.x * 0.4;
      moveZ += -p2.z * 0.4;
    } else {
      const dx = p1.x - p2.x;
      const dz = p1.z - p2.z;
      const dist = Math.hypot(dx, dz) || 1;
      const desiredDist = 10.5;
      const radialFactor = (dist - desiredDist) * 0.22;
      const orbitDir = Math.sin(performance.now() * 0.001) > 0 ? 1 : -1;

      moveX += (dx / dist) * radialFactor - (dz / dist) * orbitDir * 0.75;
      moveZ += (dz / dist) * radialFactor + (dx / dist) * orbitDir * 0.75;
    }
  }

  const mag = Math.hypot(moveX, moveZ);
  let speedMult = gameState.botDifficulty === 'hard' ? 10.0 : gameState.botDifficulty === 'medium' ? 7.6 : 5.4;
  if (p2.freezeTimer > 0) speedMult *= 0.35; // Slow-mo freeze effect

  if (mag > 0.01) {
    p2.vx = (moveX / mag) * speedMult;
    p2.vz = (moveZ / mag) * speedMult;
  }

  const leadFactor = gameState.botDifficulty === 'hard' ? 0.25 : 0;
  const targetX = p1.x + p1.vx * leadFactor;
  const targetZ = p1.z + p1.vz * leadFactor;
  p2.angle = Math.atan2(targetZ - p2.z, targetX - p2.x);

  const shootChance = gameState.botDifficulty === 'hard' ? 0.85 : gameState.botDifficulty === 'medium' ? 0.55 : 0.24;
  if (p2.shootCooldown <= 0 && Math.random() < shootChance * dt * 8) {
    triggerShoot(p2, false);
  }
}

// =========================================================================
// 10. PHYSICS, COLLISIONS, POWER-UPS & COMBAT RESOLUTION
// =========================================================================
function constrainToArenaAndObstacles(fighter) {
  for (const obs of obstacles) {
    const dx = fighter.x - obs.x;
    const dz = fighter.z - obs.z;
    const dist = Math.hypot(dx, dz);
    const minDist = obs.radius + 1.0;
    if (dist < minDist && dist > 0.001) {
      fighter.x = obs.x + (dx / dist) * minDist;
      fighter.z = obs.z + (dz / dist) * minDist;
    }
  }
  const r = Math.hypot(fighter.x, fighter.z);
  const maxR = ARENA_RADIUS - 1.2;
  if (r > maxR) {
    fighter.x = (fighter.x / r) * maxR;
    fighter.z = (fighter.z / r) * maxR;
  }
}

function updateFighter(fighter, dt, didShootThisFrame) {
  if (fighter.shootCooldown > 0) fighter.shootCooldown = Math.max(0, fighter.shootCooldown - dt);
  if (fighter.dashCooldown > 0) fighter.dashCooldown = Math.max(0, fighter.dashCooldown - dt);
  if (fighter.dashActiveTimer > 0) fighter.dashActiveTimer = Math.max(0, fighter.dashActiveTimer - dt);
  if (fighter.tripleShotTimer > 0) fighter.tripleShotTimer = Math.max(0, fighter.tripleShotTimer - dt);
  if (fighter.empShieldTimer > 0) fighter.empShieldTimer = Math.max(0, fighter.empShieldTimer - dt);
  if (fighter.freezeTimer > 0) fighter.freezeTimer = Math.max(0, fighter.freezeTimer - dt);

  fighter.x += fighter.vx * dt;
  fighter.z += fighter.vz * dt;
  fighter.vx *= 0.85;
  fighter.vz *= 0.85;

  constrainToArenaAndObstacles(fighter);

  fighter.mesh.position.set(fighter.x, 0, fighter.z);
  fighter.mesh.rotation.y = -fighter.angle + Math.PI / 2;

  // Shield visibility (Dash or EMP Reflective Shield)
  const isShielded = fighter.dashActiveTimer > 0 || fighter.empShieldTimer > 0;
  fighter.mesh.userData.shieldMat.opacity = isShielded ? 0.75 : 0.0;
  if (fighter.empShieldTimer > 0) {
    fighter.mesh.userData.shieldMat.color.setHex(0x22d3ee);
  } else {
    fighter.mesh.userData.shieldMat.color.setHex(0xfacc15);
  }
  fighter.mesh.userData.shield.rotation.y += dt * 4;

  // Emit thruster particles when moving
  const speed = Math.hypot(fighter.vx, fighter.vz);
  if (speed > 1.2) {
    emitThrusterParticle(fighter.x, fighter.z, fighter.angle, fighter.color, fighter.dashActiveTimer > 0);
  }

  // Paradox Dash Strike: Dashing through enemy clones shatters them!
  if (fighter.dashActiveTimer > 0) {
    for (let c = activeEchoClones.length - 1; c >= 0; c--) {
      const clone = activeEchoClones[c];
      if (clone.team !== fighter.team) {
        const dist = Math.hypot(fighter.x - clone.mesh.position.x, fighter.z - clone.mesh.position.z);
        if (dist < 2.2) {
          // SHATTER!
          scene.remove(clone.mesh);
          activeEchoClones.splice(c, 1);
          spawnExplosion(clone.mesh.position.x, 0.9, clone.mesh.position.z, clone.color, 24);
          spawnShockwave(clone.mesh.position.x, clone.mesh.position.z, 0xfacc15, 4.2);
          soundFX.playCloneDestroy();
          gameState.shakeIntensity = 0.55;
          gameState.slowMoFactor = 0.2;
          setTimeout(() => { gameState.slowMoFactor = 1.0; }, 120);

          spawnDamageNumber(clone.mesh.position.x, 1.8, clone.mesh.position.z, '💥 PARADOX SHATTER!', '#facc15', true);
          showBanner('💥 COLLISION DE PARADOXE : CLONE ENNEMI DÉTRUIT EN DASH !', '💥');
          if (fighter.team === 1) {
            p1DashKills++;
            unlockAchievement('dash_crush_3');
            triggerHaptics([60, 40, 80]);
            PlayerStats.clonesDestroyed = (PlayerStats.clonesDestroyed || 0) + 1;
            PlayerStats.save();
          }
        }
      }
    }
  }

  fighter.currentRecording.push({
    x: fighter.x,
    z: fighter.z,
    angle: fighter.angle,
    shoot: didShootThisFrame,
    dash: fighter.dashActiveTimer > 0
  });
}

function updateHUD() {
  const p1Pct = `${Math.max(0, p1.hp)}%`;
  const p2Pct = `${Math.max(0, p2.hp)}%`;
  document.getElementById('hud-p1-hp').style.width = p1Pct;
  document.getElementById('hud-p2-hp').style.width = p2Pct;
  const m1 = document.getElementById('marker-p1-hp');
  const m2 = document.getElementById('marker-p2-hp');
  if (m1) m1.style.width = p1Pct;
  if (m2) m2.style.width = p2Pct;

  document.getElementById('hud-score-p1').textContent = String(gameState.scores.p1);
  document.getElementById('hud-score-p2').textContent = String(gameState.scores.p2);
  document.getElementById('hud-p1-clones').textContent = `${p1.pastRecordings.length} Clone${p1.pastRecordings.length > 1 ? 's' : ''}`;
  document.getElementById('hud-p2-clones').textContent = `${p2.pastRecordings.length} Clone${p2.pastRecordings.length > 1 ? 's' : ''}`;
  document.getElementById('hud-cycle-badge').textContent = `C${gameState.cycleCount}`;

  const dashLabel = document.getElementById('dash-cooldown-label');
  if (dashLabel) {
    dashLabel.textContent = p1.dashCooldown <= 0.05 ? '(PRÊT)' : `(${p1.dashCooldown.toFixed(1)}s)`;
  }
}

function resetRoundPositions(keepScores = true) {
  p1.x = -11.5;
  p1.z = 0;
  p1.vx = 0;
  p1.vz = 0;
  p1.targetX = null;
  p1.targetZ = null;
  p1.angle = 0;
  p1.hp = 100;
  p1.shootCooldown = 0;
  p1.dashCooldown = 0;
  p1.dashActiveTimer = 0;
  p1.tripleShotTimer = 0;
  p1.empShieldTimer = 0;
  p1.freezeTimer = 0;
  p1.currentRecording = [];
  p1.pastRecordings = [];

  p2.x = 11.5;
  p2.z = 0;
  p2.vx = 0;
  p2.vz = 0;
  p2.angle = Math.PI;
  p2.hp = 100;
  p2.shootCooldown = 0;
  p2.dashCooldown = 0;
  p2.dashActiveTimer = 0;
  p2.tripleShotTimer = 0;
  p2.empShieldTimer = 0;
  p2.freezeTimer = 0;
  p2.currentRecording = [];
  p2.pastRecordings = [];

  activeEchoClones.forEach((c) => scene.remove(c.mesh));
  activeEchoClones = [];

  projectiles.forEach((pr) => scene.remove(pr.mesh));
  projectiles = [];

  gameState.loopTimer = gameState.loopDuration;
  gameState.cycleCount = 1;
  gameState.slowMoFactor = 1.0;
  soundFX.inTensionMode = false;
  soundFX.lastBeepSecond = -1;

  powerupState.active = true;
  powerupGroup.visible = true;
  setPowerupType('chrono_core');

  if (!keepScores) {
    gameState.scores.p1 = 0;
    gameState.scores.p2 = 0;
    gameState.totalPlayerHits = 0;
  }
  updateHUD();
}

function handleRoundWin(winnerTeam) {
  soundFX.playVictory();
  gameState.slowMoFactor = 0.25;
  gameState.shakeIntensity = 0.65;

  if (winnerTeam === 1) {
    gameState.scores.p1 += 1;
  } else {
    gameState.scores.p2 += 1;
  }
  updateHUD();

  if (gameState.scores.p1 >= gameState.roundsToWin || gameState.scores.p2 >= gameState.roundsToWin) {
    setTimeout(() => {
      endMatch(winnerTeam);
    }, 700);
  } else {
    showBanner(
      winnerTeam === 1 ? '🏆 MANCHE GAGNÉE ! ENCORE 1 POUR LA VICTOIRE FINALE !' : '⚠️ MANCHE PERDUE ! PRÉPARE LA REVANCHE !',
      '🏆'
    );
    setTimeout(() => {
      resetRoundPositions(true);
    }, 950);
  }
}

function endMatch(winnerTeam) {
  gameState.running = false;
  gameState.slowMoFactor = 1.0;
  soundFX.stopBGM();

  document.getElementById('marker-p1').classList.add('hidden');
  document.getElementById('marker-p2').classList.add('hidden');
  document.getElementById('marker-core').classList.add('hidden');

  if (winnerTeam === 1) {
    PlayerStats.wins += 1;
    PlayerStats.save();
  }

  const modal = document.getElementById('gameover-modal');
  const title = document.getElementById('gameover-title');
  const sub = document.getElementById('gameover-subtitle');
  const scoreEl = document.getElementById('gameover-score');
  const clonesEl = document.getElementById('gameover-clones');
  const hitsEl = document.getElementById('gameover-hits');

  if (winnerTeam === 1) {
    title.textContent = '🎉 VICTOIRE ÉCLATANTE !';
    title.className = 'font-cyber text-2xl sm:text-3xl font-black text-white neon-text-cyan';
    sub.textContent = 'Tes esquives millimétrées et tes clones ont triomphé du duel temporel.';
  } else {
    title.textContent = '💥 DÉFAITE... REJOUE !';
    title.className = 'font-cyber text-2xl sm:text-3xl font-black text-white neon-text-pink';
    sub.textContent = 'Astuce : Utilise le DASH pour détruire les clones ennemis et ramasse les power-ups au centre !';
  }

  scoreEl.textContent = `${gameState.scores.p1} - ${gameState.scores.p2}`;
  clonesEl.textContent = String(activeEchoClones.length);
  hitsEl.textContent = String(gameState.totalPlayerHits);

  // Advanced Pro Stats
  const durationSec = Math.max(1, Math.round((performance.now() - matchStartTime) / 1000));
  const accuracy = p1ShotsFired > 0 ? Math.round((p1HitsLanded / p1ShotsFired) * 100) : 0;
  const precEl = document.getElementById('stat-precision');
  const dashEl = document.getElementById('stat-dash-kills');
  const timeEl = document.getElementById('stat-match-time');
  if (precEl) precEl.textContent = `${accuracy}% (${p1HitsLanded}/${p1ShotsFired})`;
  if (accuracy >= 75 && p1ShotsFired >= 8) unlockAchievement('accuracy_elite');
  if (dashEl) dashEl.textContent = `${p1DashKills} détruit${p1DashKills > 1 ? 's' : ''}`;
  if (timeEl) timeEl.textContent = `${durationSec}s`;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

// =========================================================================
// 11. ONLINE P2P MULTIPLAYER & VIRAL JOIN LINK (PeerJS WebRTC)
// =========================================================================
let peerInstance = null;
let activeConn = null;
let myShortCode = 'ECHO-' + Math.floor(1000 + Math.random() * 9000);

function initPeerMultiplayer() {
  const codeEl = document.getElementById('my-room-code');
  if (codeEl) codeEl.textContent = myShortCode;

  if (typeof Peer === 'undefined') return;
  try {
    peerInstance = new Peer(myShortCode);
    peerInstance.on('open', (id) => {
      myShortCode = id;
      if (codeEl) codeEl.textContent = id;
      checkUrlJoinParams();
    });
    peerInstance.on('connection', (conn) => {
      activeConn = conn;
      setupPeerConnection();
      showToast('Joueur distant connecté ! Lancement du duel...');
      startMatch('online', '🔴 JOUEUR MONDIAL');
    });
    peerInstance.on('error', () => {});
  } catch (e) {}
}

function setupPeerConnection() {
  if (!activeConn) return;
  activeConn.on('data', (data) => {
    if (data && data.type === 'state' && gameState.running && gameState.mode === 'online') {
      p2.x = -data.x;
      p2.z = -data.z;
      p2.angle = data.angle + Math.PI;
      if (data.shoot) triggerShoot(p2, false);
      if (data.dash) triggerDash(p2);
    }
  });
}

function checkUrlJoinParams() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('join') || params.get('room');
  if (code && code.trim()) {
    const cleanCode = code.trim().toUpperCase();
    const input = document.getElementById('input-join-code');
    if (input) input.value = cleanCode;
    showToast(`Connexion automatique au salon ${cleanCode}...`);
    setTimeout(() => {
      document.getElementById('btn-join-online').click();
    }, 800);
  }
}

// =========================================================================
// 12. MAIN GAME LOOP (60 FPS Animation & 3D Camera Controller)
// =========================================================================
let lastTime = performance.now();
let frameCount = 0;
let lastFpsTime = performance.now();

function animate(now) {
  frameCount++;
  if (now - lastFpsTime >= 500) {
    const currentFps = Math.round((frameCount * 1000) / (now - lastFpsTime));
    frameCount = 0;
    lastFpsTime = now;
    const fpsEl = document.getElementById('fps-counter');
    if (fpsEl) fpsEl.textContent = `${currentFps} FPS`;
  }
  requestAnimationFrame(animate);

  const rawDt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  const dt = rawDt * gameState.slowMoFactor;

  // Ambient 3D Arena Animations
  orbitalRing1.rotation.z += rawDt * 0.28;
  orbitalRing2.rotation.z -= rawDt * 0.22;
  starField.rotation.y += rawDt * 0.03;

  if (powerupState.active) {
    powerupGroup.rotation.y += rawDt * 2.2;
    powerupGroup.position.y = 1.35 + Math.sin(now * 0.004) * 0.28;
  }

  if (clickTargetMesh.material.opacity > 0) {
    clickTargetMesh.material.opacity = Math.max(0, clickTargetMesh.material.opacity - rawDt * 1.4);
  }

  // --- GAMEPAD API POLLING ---
  let gpMoveX = 0;
  let gpMoveZ = 0;
  let gpShot = false;
  let gpDash = false;
  if (navigator.getGamepads) {
    const gamepads = navigator.getGamepads();
    const gp = gamepads[0] || gamepads[1];
    const badge = document.getElementById('gamepad-badge');
    if (gp && gp.connected) {
      if (badge) badge.classList.remove('hidden');
      const deadzone = 0.16;
      if (Math.abs(gp.axes[0]) > deadzone) gpMoveX = gp.axes[0];
      if (Math.abs(gp.axes[1]) > deadzone) gpMoveZ = gp.axes[1];

      // Right Stick for manual aim
      if (gameState.aimMode === 'manual') {
        const rx = gp.axes[2];
        const rz = gp.axes[3];
        if (Math.hypot(rx, rz) > deadzone) {
          p1.angle = Math.atan2(rz, rx);
        }
      }

      if (gp.buttons[0]?.pressed || gp.buttons[7]?.pressed) gpShot = true;
      if (gp.buttons[1]?.pressed || gp.buttons[4]?.pressed || gp.buttons[5]?.pressed) gpDash = true;
      if (gp.buttons[9]?.pressed && !gpPrevStartPressed) togglePause();
      gpPrevStartPressed = !!gp.buttons[9]?.pressed;
    } else if (badge) {
      badge.classList.add('hidden');
    }
  }

  if (gameState.running && !gameState.paused) {
    
      if (soloChallengeState.active) {
        soloChallengeState.timer += dt;
        if (soloChallengeState.type === 'survival' && soloChallengeState.timer >= 20.0) {
          soloChallengeState.active = false;
          showBanner('🎉 DÉFI SURVIE RÉUSSI ! Médaille : 🥇 OR', '🥇');
          unlockAchievement('first_win');
          setTimeout(() => endMatch(1), 1200);
        }
      }

        // 1. Update Time-Loop Countdown & Tension Music
    gameState.loopTimer -= dt;
    const timerEl = document.getElementById('hud-loop-timer');
    if (timerEl) {
      timerEl.textContent = `${Math.max(0, gameState.loopTimer).toFixed(1)}s`;
    }

    // Audio tension in the last 3.5 seconds
    if (gameState.loopTimer <= 3.5) {
      soundFX.inTensionMode = true;
      const intSec = Math.ceil(gameState.loopTimer);
      if (intSec >= 1 && intSec <= 3 && intSec !== soundFX.lastBeepSecond) {
        soundFX.lastBeepSecond = intSec;
        soundFX.playCountdownBeep(intSec);
      }
    } else {
      soundFX.inTensionMode = false;
    }

    if (gameState.loopTimer <= 0) {
      triggerTimeRewindCycle();
    }

    // 2. Player 1 Movement Input
    let p1MoveX = gpMoveX + touchJoystickVec.x;
    let p1MoveZ = gpMoveZ + touchJoystickVec.z;
    const allowArrowsForP1 = gameState.mode !== 'local';

    const upPressed = keys['KeyW'] || keys['KeyZ'] || (allowArrowsForP1 && keys['ArrowUp']);
    const downPressed = keys['KeyS'] || (allowArrowsForP1 && keys['ArrowDown']);
    const leftPressed = keys['KeyA'] || keys['KeyQ'] || (allowArrowsForP1 && keys['ArrowLeft']);
    const rightPressed = keys['KeyD'] || (allowArrowsForP1 && keys['ArrowRight']);

    if (upPressed) p1MoveZ -= 1;
    if (downPressed) p1MoveZ += 1;
    if (leftPressed) p1MoveX -= 1;
    if (rightPressed) p1MoveX += 1;

    // Visual feedback on D-Pad buttons
    const dUp = document.getElementById('dpad-up');
    const dDown = document.getElementById('dpad-down');
    const dLeft = document.getElementById('dpad-left');
    const dRight = document.getElementById('dpad-right');
    if (dUp) dUp.style.borderColor = upPressed ? '#22d3ee' : '';
    if (dDown) dDown.style.borderColor = downPressed ? '#22d3ee' : '';
    if (dLeft) dLeft.style.borderColor = leftPressed ? '#22d3ee' : '';
    if (dRight) dRight.style.borderColor = rightPressed ? '#22d3ee' : '';

    // If no direct key/stick, move toward mouse click target on floor
    if (p1MoveX === 0 && p1MoveZ === 0 && p1.targetX !== null && p1.targetZ !== null) {
      const dx = p1.targetX - p1.x;
      const dz = p1.targetZ - p1.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.6) {
        p1MoveX = dx / dist;
        p1MoveZ = dz / dist;
      } else {
        p1.targetX = null;
        p1.targetZ = null;
      }
    }

    const p1Mag = Math.hypot(p1MoveX, p1MoveZ);
    if (p1Mag > 0.01 && p1.dashActiveTimer <= 0.25) {
      let speed = 11.2;
      if (p1.freezeTimer > 0) speed *= 0.35;
      p1.vx = (p1MoveX / p1Mag) * speed;
      p1.vz = (p1MoveZ / p1Mag) * speed;
    }

    // AIMING: Auto-Aim (Opponent lock) or Free-Aim (Mouse position)
    if (gameState.aimMode === 'manual') {
      p1.angle = Math.atan2(mouseWorldPoint.z - p1.z, mouseWorldPoint.x - p1.x);
    } else {
      p1.angle = Math.atan2(p2.z - p1.z, p2.x - p1.x);
    }

    let p1Shot = false;
    if (keys['Space'] || gpShot || gameState.autoFire) {
      p1Shot = triggerShoot(p1, false);
    }
    if (keys['ShiftLeft'] || keys['ShiftRight'] || keys['KeyE'] || gpDash) {
      triggerDash(p1);
    }

    // 3. Player 2 Input
    let p2Shot = false;
    if (gameState.mode === 'local') {
      let p2MoveX = 0;
      let p2MoveZ = 0;
      if (keys['ArrowUp']) p2MoveZ -= 1;
      if (keys['ArrowDown']) p2MoveZ += 1;
      if (keys['ArrowLeft']) p2MoveX -= 1;
      if (keys['ArrowRight']) p2MoveX += 1;

      const p2Mag = Math.hypot(p2MoveX, p2MoveZ);
      if (p2Mag > 0.01 && p2.dashActiveTimer <= 0.25) {
        let speed = 11.2;
        if (p2.freezeTimer > 0) speed *= 0.35;
        p2.vx = (p2MoveX / p2Mag) * speed;
        p2.vz = (p2MoveZ / p2Mag) * speed;
      }
      p2.angle = Math.atan2(p1.z - p2.z, p1.x - p2.x);

      if (keys['Enter'] || keys['KeyM'] || gameState.autoFire) {
        p2Shot = triggerShoot(p2, false);
      }
      if (keys['ControlRight'] || keys['KeyL']) {
        triggerDash(p2);
      }
    } else if (gameState.mode === 'bot' || !activeConn) {
      const prevCooldown = p2.shootCooldown;
      updateBotAI(dt);
      p2Shot = prevCooldown <= 0 && p2.shootCooldown > 0;
    }

    // Broadcast P1 state over WebRTC
    if (gameState.mode === 'online' && activeConn && activeConn.open) {
      activeConn.send({
        type: 'state',
        x: p1.x,
        z: p1.z,
        angle: p1.angle,
        shoot: p1Shot,
        dash: p1.dashActiveTimer > 0.45
      });
    }

    // 4. Update Both Main Fighters
    updateFighter(p1, dt, p1Shot);
    updateFighter(p2, dt, p2Shot);

    // 5. Update All Holographic Time-Echo Clones
    for (const clone of activeEchoClones) {
      if (clone.recording.length === 0) continue;
      const frame = clone.recording[clone.frameIndex];
      if (frame) {
        clone.mesh.position.set(frame.x, 0, frame.z);
        clone.mesh.rotation.y = -frame.angle + Math.PI / 2;
        if (frame.shoot) {
          fireProjectile(clone.team, frame.x, frame.z, frame.angle, clone.color, true);
          soundFX.playLaser(true);
        }
      }
      clone.frameIndex = (clone.frameIndex + 1) % clone.recording.length;
    }

    // 6. Power-up Collection
    if (powerupState.active) {
      [p1, p2].forEach((fighter) => {
        if (Math.hypot(fighter.x, fighter.z) < 2.1) {
          powerupState.active = false;
          powerupGroup.visible = false;
          powerupState.respawnTimer = 11.5;
          soundFX.playPowerup();

          if (powerupState.type === 'chrono_core') {
            fighter.tripleShotTimer = 7.0;
            fighter.hp = Math.min(100, fighter.hp + 30);
            spawnShockwave(0, 0, 0xfbbf24, 6.0);
            showBanner(fighter.team === 1 ? '💎 DIAMANT CAPTURÉ : TRIPLE TIR + SOIN (+30 HP) !' : '⚠️ L\'ENNEMI A PRIS LE DIAMANT CENTRAL !', '💎');
          } else if (powerupState.type === 'emp_shield') {
            fighter.empShieldTimer = 4.5;
            spawnShockwave(0, 0, 0x22d3ee, 6.0);
            showBanner(fighter.team === 1 ? '🛡️ BOUCLIER EMP RÉFLECTEUR ACTIVÉ (4.5s) !' : '⚠️ L\'ENNEMI A ACTIVÉ UN BOUCLIER RÉFLECTEUR !', '🛡️');
          } else if (powerupState.type === 'time_warp') {
            const enemy = fighter.team === 1 ? p2 : p1;
            enemy.freezeTimer = 2.5;
            spawnShockwave(0, 0, 0xa855f7, 7.0);
            showBanner(fighter.team === 1 ? '⚡ DISTORSION TEMPORELLE : ENNEMI RALENTI DE 65% !' : '⚠️ TU AS ÉTÉ TOUCHÉ PAR LA DISTORSION TEMPORELLE !', '⚡');
          }
          updateHUD();
        }
      });
    } else {
      powerupState.respawnTimer -= dt;
      if (powerupState.respawnTimer <= 0) {
        powerupState.active = true;
        powerupGroup.visible = true;
        powerupState.typeIndex = (powerupState.typeIndex + 1) % powerupState.types.length;
        setPowerupType(powerupState.types[powerupState.typeIndex]);
        spawnShockwave(0, 0, 0xfbbf24, 4.0);
      }
    }

    // 7. Update Projectiles & Bounces
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const pr = projectiles[i];
      pr.x += pr.vx * dt;
      pr.z += pr.vz * dt;
      pr.life -= dt;
      pr.mesh.position.set(pr.x, 0.9, pr.z);

      let removeProj = pr.life <= 0;

      
      // Check hits against Solo Challenge Targets
      if (soloChallengeState.active && soloChallengeState.type === 'targets' && !removeProj) {
        for (let t = soloChallengeState.targets.length - 1; t >= 0; t--) {
          const dtgt = soloChallengeState.targets[t];
          if (Math.hypot(pr.x - dtgt.x, pr.z - dtgt.z) < 1.35) {
            removeProj = true;
            dtgt.hp -= 15;
            spawnExplosion(dtgt.x, 1.2, dtgt.z, 0xfacc15, 12);
            spawnDamageNumber(dtgt.x, 2.0, dtgt.z, '-15', '#facc15');
            soundFX.playHit();
            if (dtgt.hp <= 0) {
              scene.remove(dtgt.mesh);
              soloChallengeState.targets.splice(t, 1);
              spawnExplosion(dtgt.x, 1.2, dtgt.z, 0xfacc15, 28);
              spawnShockwave(dtgt.x, dtgt.z, 0xfacc15, 4.0);
              soundFX.playCloneDestroy();
              showBanner(`🎯 DRONE DÉTRUIT ! (${6 - soloChallengeState.targets.length}/6)`, '🎯');
              if (soloChallengeState.targets.length === 0) {
                const timeTaken = Math.round(soloChallengeState.timer);
                let medal = '🥉 Bronze';
                if (timeTaken <= 15) medal = '🥇 OR';
                else if (timeTaken <= 25) medal = '🥈 ARGENT';
                showBanner(`🎉 DÉFI TERMINÉ EN ${timeTaken}s ! Médaille : ${medal}`, '🥇');
                unlockAchievement('first_win');
                setTimeout(() => endMatch(1), 1200);
              }
            }
            break;
          }
        }
      }

      // Pillar Obstacle Bounces
      for (const obs of obstacles) {
        const dx = pr.x - obs.x;
        const dz = pr.z - obs.z;
        const dist = Math.hypot(dx, dz);
        if (dist < obs.radius + 0.35) {
          if (pr.bouncesLeft > 0) {
            pr.bouncesLeft -= 1;
            const nx = dx / (dist || 1);
            const nz = dz / (dist || 1);
            const dot = pr.vx * nx + pr.vz * nz;
            pr.vx -= 2 * dot * nx;
            pr.vz -= 2 * dot * nz;
            pr.mesh.rotation.y = -Math.atan2(pr.vz, pr.vx);
            spawnExplosion(pr.x, 0.9, pr.z, pr.color, 5);
          } else {
            removeProj = true;
          }
          break;
        }
      }

      // Arena Perimeter Bounces
      const r = Math.hypot(pr.x, pr.z);
      if (r > ARENA_RADIUS - 0.4) {
        if (pr.bouncesLeft > 0) {
          pr.bouncesLeft -= 1;
          const nx = -pr.x / r;
          const nz = -pr.z / r;
          const dot = pr.vx * nx + pr.vz * nz;
          pr.vx -= 2 * dot * nx;
          pr.vz -= 2 * dot * nz;
          pr.mesh.rotation.y = -Math.atan2(pr.vz, pr.vx);
          spawnExplosion(pr.x, 0.9, pr.z, pr.color, 6);
        } else {
          removeProj = true;
        }
      }

      // Check Hits against Enemy Fighters (P1 or P2)
      const target = pr.team === 1 ? p2 : p1;
      if (!removeProj && Math.hypot(pr.x - target.x, pr.z - target.z) < 1.35) {
        // EMP Reflective Shield active: Reflect projectile back at sender!
        if (target.empShieldTimer > 0) {
          pr.vx = -pr.vx * 1.15;
          pr.vz = -pr.vz * 1.15;
          pr.team = target.team;
          pr.color = target.color;
          pr.mesh.rotation.y = -Math.atan2(pr.vz, pr.vx);
          soundFX.playReflect();
          spawnShockwave(target.x, target.z, 0x22d3ee, 2.5);
          spawnDamageNumber(target.x, 1.8, target.z, '⚡ RENVOI !', '#22d3ee');
          if (target.team === 1) unlockAchievement('emp_deflect');
        } else if (target.dashActiveTimer > 0) {
          removeProj = true;
          spawnShockwave(target.x, target.z, 0xfacc15, 2.8);
          soundFX.playDash();
        } else {
          removeProj = true;
          const dmg = pr.team === 1 ? (pr.isEcho ? 14 : 18) : (gameState.botDifficulty === 'easy' ? 8 : 15);
          target.hp = Math.max(0, target.hp - dmg);
          if (pr.team === 1) gameState.totalPlayerHits += 1;
          soundFX.playHit();
          gameState.shakeIntensity = 0.35;
          spawnExplosion(target.x, 1.0, target.z, target.color, 16);
          spawnDamageNumber(target.x, 1.8, target.z, `-${dmg}`, target.team === 1 ? '#38bdf8' : '#f43f5e');
          updateHUD();

          if (target.hp <= 0) {
            handleRoundWin(pr.team);
          }
        }
      }

      // Check Hits against Destructible Echo Clones!
      if (!removeProj) {
        for (let c = activeEchoClones.length - 1; c >= 0; c--) {
          const clone = activeEchoClones[c];
          if (clone.team !== pr.team) {
            const cdist = Math.hypot(pr.x - clone.mesh.position.x, pr.z - clone.mesh.position.z);
            if (cdist < 1.35) {
              removeProj = true;
              const dmg = pr.isEcho ? 12 : 18;
              clone.hp -= dmg;
              spawnExplosion(clone.mesh.position.x, 0.9, clone.mesh.position.z, clone.color, 8);
              spawnDamageNumber(clone.mesh.position.x, 1.8, clone.mesh.position.z, `-${dmg}`, '#c084fc');
              soundFX.playHit();

              if (clone.hp <= 0) {
                // Shatter clone!
                scene.remove(clone.mesh);
                activeEchoClones.splice(c, 1);
                spawnExplosion(clone.mesh.position.x, 0.9, clone.mesh.position.z, clone.color, 24);
                spawnShockwave(clone.mesh.position.x, clone.mesh.position.z, clone.color, 4.0);
                soundFX.playCloneDestroy();
                showBanner('⚡ PARADOXE : CLONE ENNEMI ÉLIMINÉ !', '⚡');
                if (pr.team === 1) {
                  PlayerStats.clonesDestroyed = (PlayerStats.clonesDestroyed || 0) + 1;
                  PlayerStats.save();
                }
              }
              break;
            }
          }
        }
      }

      if (removeProj) {
        scene.remove(pr.mesh);
        projectiles.splice(i, 1);
      }
    }
  }

  // 8. Update Shockwaves
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const sw = shockwaves[i];
    sw.scale += rawDt * 14;
    sw.opacity -= rawDt * 1.8;
    sw.mesh.scale.set(sw.scale, sw.scale, 1);
    sw.mat.opacity = Math.max(0, sw.opacity);
    if (sw.opacity <= 0) {
      scene.remove(sw.mesh);
      if (sw.mat && sw.mat.dispose) sw.mat.dispose();
      shockwaves.splice(i, 1);
    }
  }

  // 9. Update Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    pt.life -= rawDt;
    pt.mesh.position.x += pt.vx * rawDt;
    pt.mesh.position.y += pt.vy * rawDt;
    pt.mesh.position.z += pt.vz * rawDt;
    pt.vy -= 14 * rawDt;
    pt.mat.opacity = Math.max(0, pt.life * 2);
    if (pt.life <= 0) {
      scene.remove(pt.mesh);
      particles.splice(i, 1);
    }
  }

  // 10. Update Thruster Exhaust Particles
  for (let i = thrusterParticles.length - 1; i >= 0; i--) {
    const tp = thrusterParticles[i];
    tp.life -= rawDt;
    tp.mesh.position.x += tp.vx * rawDt;
    tp.mesh.position.y += tp.vy * rawDt;
    tp.mesh.position.z += tp.vz * rawDt;
    tp.mat.opacity = Math.max(0, tp.life * 2.5);
    if (tp.life <= 0) {
      scene.remove(tp.mesh);
      if (tp.mat && tp.mat.dispose) tp.mat.dispose();
      thrusterParticles.splice(i, 1);
    }
  }

  // 11. Update Floating Damage Numbers
  for (let i = damageNumbers.length - 1; i >= 0; i--) {
    const dn = damageNumbers[i];
    dn.life -= rawDt;
    dn.pos.y += dn.vy * rawDt;
    const projVec = dn.pos.clone().project(camera);
    if (projVec.z > 1) {
      dn.el.style.opacity = '0';
    } else {
      const scrX = (projVec.x * 0.5 + 0.5) * window.innerWidth;
      const scrY = (-(projVec.y * 0.5) + 0.5) * window.innerHeight;
      dn.el.style.left = `${scrX}px`;
      dn.el.style.top = `${scrY}px`;
    }
    if (dn.life <= 0) {
      dn.el.remove();
      damageNumbers.splice(i, 1);
    }
  }

  // 12. Dynamic 3D Camera Positioning & Screen Shake
  let camTargetX = (p1.x + p2.x) * 0.22;
  let camTargetZ = (p1.z + p2.z) * 0.22;

  if (!gameState.running) {
    const menuAngle = now * 0.00035;
    camera.position.set(Math.cos(menuAngle) * 29, 21, Math.sin(menuAngle) * 29);
    camera.lookAt(0, 1, 0);
  } else {
    if (gameState.cameraMode === 0) {
      camera.position.lerp(new THREE.Vector3(camTargetX, 25, 23 + camTargetZ * 0.35), 0.08);
    } else if (gameState.cameraMode === 1) {
      camera.position.lerp(new THREE.Vector3(0, 36, 4), 0.08);
    } else {
      camera.position.lerp(new THREE.Vector3(camTargetX * 1.3, 15, 28), 0.08);
    }

    if (gameState.shakeIntensity > 0.01) {
      camera.position.x += (Math.random() - 0.5) * gameState.shakeIntensity * 2.0;
      camera.position.y += (Math.random() - 0.5) * gameState.shakeIntensity * 2.0;
      gameState.shakeIntensity *= 0.88;
    }
    camera.lookAt(camTargetX * 0.5, 0.5, camTargetZ * 0.5);
  }

  cyanPointLight.position.set(p1.x, 4, p1.z);
  pinkPointLight.position.set(p2.x, 4, p2.z);

    if (killcamActive && killcamTarget) {
    killcamAngle += rawDt * 2.8;
    camera.position.set(killcamTarget.x + Math.cos(killcamAngle) * 8.5, 4.5, killcamTarget.z + Math.sin(killcamAngle) * 8.5);
    camera.lookAt(killcamTarget.x, 1.0, killcamTarget.z);
  }

  renderer.render(scene, camera);
  renderTacticalRadar();

  // Update 2D Floating Labels
  updateFloatingMarker('marker-p1', p1.x, 2.7, p1.z);
  updateFloatingMarker('marker-p2', p2.x, 2.7, p2.z);
  if (powerupState.active) {
    updateFloatingMarker('marker-core', 0, 3.1, 0);
  } else {
    document.getElementById('marker-core').classList.add('hidden');
  }
}

// =========================================================================
// 13. UI EVENT LISTENERS & MENU FLOW
// =========================================================================
function showToast(msg) {
  const box = document.getElementById('toast-box');
  if (!box) return;
  box.textContent = msg;
  box.classList.remove('hidden');
  setTimeout(() => box.classList.add('hidden'), 2800);
}

function startMatch(mode, opponentLabel) {
  soundFX.init();
  soundFX.startBGM();
  window.focus();
  gameState.mode = mode;
  gameState.running = true;
  gameState.paused = false;

  document.getElementById('hud-p2-name').textContent = opponentLabel;
  document.getElementById('marker-p2-label').textContent = opponentLabel;
  document.getElementById('menu-overlay').classList.add('hidden');
  document.getElementById('gameover-modal').classList.add('hidden');
  document.getElementById('gameover-modal').classList.remove('flex');
  document.getElementById('hud-center-panel').classList.remove('hidden');
  const radarBox = document.getElementById('tactical-radar-box'); if (radarBox) radarBox.classList.remove('hidden');
  document.getElementById('hud-center-panel').classList.add('flex');
  document.getElementById('coach-bar').classList.remove('hidden');
  document.getElementById('btn-pause-game').classList.remove('hidden');
  document.getElementById('ingame-controls-footer').classList.remove('hidden');
  document.getElementById('ingame-controls-footer').classList.add('flex');

  matchStartTime = performance.now();
  p1ShotsFired = 0;
  p1HitsLanded = 0;
  p1DashKills = 0;

  setCoachText('🎯 <span class="text-cyan-300">OBJECTIF :</span> Déplace ton vaisseau <span class="text-cyan-300">BLEU</span> (Flèches, ZQSD, Souris ou Joystick). Détruis les clones ennemis ou dashe à travers !');
  resetRoundPositions(false);
  showBanner('C\'EST PARTI ! DÉPLACE-TOI POUR ESQUIVER ET DÉTRUIS LES CLONES ROUGES !', '🚀');
}

function togglePause() {
  if (!gameState.running) return;
  gameState.paused = !gameState.paused;
  const pauseBtn = document.getElementById('btn-pause-game');
  if (pauseBtn) {
    pauseBtn.innerHTML = gameState.paused ? '▶ <span class="hidden sm:inline">Reprendre</span>' : '⏸ <span class="hidden sm:inline">Pause</span>';
  }
  showBanner(gameState.paused ? 'JEU EN PAUSE' : 'REPRISE DU DUEL TEMPOREL', '⏸');
}

// Bot Difficulty
document.querySelectorAll('.bot-diff-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    gameState.botDifficulty = btn.getAttribute('data-diff');
    document.querySelectorAll('.bot-diff-btn').forEach((b) => {
      b.className = 'bot-diff-btn rounded-lg py-1.5 text-xs font-bold border border-slate-700 bg-slate-800/70 text-slate-300';
    });
    btn.className = 'bot-diff-btn rounded-lg py-1.5 text-xs font-bold border border-cyan-400 bg-cyan-500/25 text-cyan-200';
  });
});

// Launch Modes
document.getElementById('btn-start-bot').addEventListener('click', () => {
  const diffLabel = gameState.botDifficulty === 'hard' ? '🔴 BOT PARADOXE' : gameState.botDifficulty === 'medium' ? '🔴 BOT TACTICIEN' : '🔴 BOT INITIÉ';
  startMatch('bot', diffLabel);
});

document.getElementById('btn-start-local').addEventListener('click', () => {
  startMatch('local', '🔴 JOUEUR 2');
});

document.getElementById('btn-sim-online').addEventListener('click', () => {
  const globalNames = ['🔴 NEO-TOKYO_99', '🔴 ABIDJAN_PRO', '🔴 PARIS_CYBER', '🔴 SEOUL_GHOST', '🔴 NY_CHRONO'];
  const picked = globalNames[Math.floor(Math.random() * globalNames.length)];
  showToast(`Adversaire mondial trouvé : ${picked}`);
  gameState.botDifficulty = 'medium';
  startMatch('online', picked);
});

document.getElementById('btn-join-online').addEventListener('click', () => {
  const codeInput = document.getElementById('input-join-code');
  const code = (codeInput.value || '').trim().toUpperCase();
  if (!code) {
    showToast('Entre un code de salon (ex: ECHO-4821)');
    return;
  }
  const statusMsg = document.getElementById('online-status-msg');
  if (statusMsg) statusMsg.textContent = `Connexion au salon ${code}...`;

  if (peerInstance) {
    try {
      activeConn = peerInstance.connect(code);
      activeConn.on('open', () => {
        setupPeerConnection();
        startMatch('online', '🔴 ' + code);
      });
      setTimeout(() => {
        if (!gameState.running) {
          showToast(`Salon ${code} rejoint !`);
          startMatch('online', '🔴 ' + code);
        }
      }, 1200);
    } catch (e) {
      startMatch('online', '🔴 ' + code);
    }
  } else {
    startMatch('online', '🔴 ' + code);
  }
});

// Copy Code Button
document.getElementById('btn-copy-code').addEventListener('click', () => {
  const text = `${myShortCode}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
  showToast(`Code ${myShortCode} copié !`);
});

// Copy Direct Invitation Link Button (1-Click join)
const btnDirectLink = document.getElementById('btn-copy-direct-link');
if (btnDirectLink) {
  btnDirectLink.addEventListener('click', () => {
    const link = window.location.origin + window.location.pathname + '?join=' + myShortCode;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).catch(() => {});
    }
    showToast('🔗 Lien direct copié ! Envoie-le sur WhatsApp ou Discord pour lancer le duel en 1 clic !');
  });
}

// Navigation & Header Controls
document.getElementById('btn-home-menu').addEventListener('click', () => {
  gameState.running = false;
  soundFX.stopBGM();
  document.getElementById('menu-overlay').classList.remove('hidden');
  document.getElementById('gameover-modal').classList.add('hidden');
  document.getElementById('gameover-modal').classList.remove('flex');
  document.getElementById('hud-center-panel').classList.add('hidden');
  const radarBox = document.getElementById('tactical-radar-box'); if (radarBox) radarBox.classList.add('hidden');
  document.getElementById('coach-bar').classList.add('hidden');
  document.getElementById('btn-pause-game').classList.add('hidden');
  document.getElementById('ingame-controls-footer').classList.add('hidden');
  document.getElementById('marker-p1').classList.add('hidden');
  document.getElementById('marker-p2').classList.add('hidden');
  document.getElementById('marker-core').classList.add('hidden');
});

function cycleCameraMode() {
  gameState.cameraMode = (gameState.cameraMode + 1) % 3;
  const labels = ['Caméra: Immersive', 'Caméra: Tactique', 'Caméra: Hologramme AR'];
  const lblHeader = document.getElementById('camera-label');
  const lblSettings = document.getElementById('camera-settings-label');
  if (lblHeader) lblHeader.textContent = labels[gameState.cameraMode];
  if (lblSettings) lblSettings.textContent = labels[gameState.cameraMode];
  showToast(labels[gameState.cameraMode]);
  window.focus();
}

document.getElementById('btn-camera-view').addEventListener('click', cycleCameraMode);

document.getElementById('btn-sound-toggle').addEventListener('click', () => {
  soundFX.enabled = !soundFX.enabled;
  document.getElementById('sound-label').textContent = soundFX.enabled ? 'Son ON' : 'Son OFF';
  showToast(soundFX.enabled ? 'Effets sonores activés' : 'Effets sonores coupés');
  window.focus();
});

document.getElementById('btn-music-toggle').addEventListener('click', () => {
  const isEnabled = soundFX.toggleBGM();
  document.getElementById('music-label').textContent = isEnabled ? 'Musique ON' : 'Musique OFF';
  showToast(isEnabled ? '🎵 Musique Synthwave activée' : '🔇 Musique Synthwave coupée');
  window.focus();
});

document.getElementById('btn-pause-game').addEventListener('click', togglePause);

// Modals
document.getElementById('btn-rules-help').addEventListener('click', () => {
  if (gameState.running && !gameState.paused) togglePause();
  const m = document.getElementById('rules-modal');
  m.classList.remove('hidden');
  m.classList.add('flex');
});
document.getElementById('btn-close-rules').addEventListener('click', () => {
  const m = document.getElementById('rules-modal');
  m.classList.add('hidden');
  m.classList.remove('flex');
  if (gameState.running && gameState.paused) togglePause();
  window.focus();
});
document.getElementById('btn-ok-rules').addEventListener('click', () => {
  const m = document.getElementById('rules-modal');
  m.classList.add('hidden');
  m.classList.remove('flex');
  if (gameState.running && gameState.paused) togglePause();
  window.focus();
});

document.getElementById('btn-rematch').addEventListener('click', () => {
  const oppName = document.getElementById('hud-p2-name').textContent;
  startMatch(gameState.mode, oppName);
});

document.getElementById('btn-back-lobby').addEventListener('click', () => {
  document.getElementById('btn-home-menu').click();
});

document.getElementById('btn-share-score').addEventListener('click', () => {
  const link = window.location.origin + window.location.pathname + '?join=' + myShortCode;
  const shareTxt = `🔥 Je viens de gagner sur ECHO-PARADOX 3D (${gameState.scores.p1}-${gameState.scores.p2}) ! Rejoins mon salon en 1 clic : ${link}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(shareTxt).catch(() => {});
  }
  showToast('Message de défi copié pour WhatsApp / Discord !');
});

document.getElementById('btn-vercel-modal').addEventListener('click', () => {
  const m = document.getElementById('vercel-modal');
  m.classList.remove('hidden');
  m.classList.add('flex');
});
document.getElementById('btn-close-vercel').addEventListener('click', () => {
  const m = document.getElementById('vercel-modal');
  m.classList.add('hidden');
  m.classList.remove('flex');
});
document.getElementById('btn-ok-vercel').addEventListener('click', () => {
  const m = document.getElementById('vercel-modal');
  m.classList.add('hidden');
  m.classList.remove('flex');
});

// Responsive Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


// =========================================================================
// 14. FULLSCREEN & SETTINGS MODAL LOGIC
// =========================================================================
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
    showToast('Plein écran activé (Touche F pour quitter)');
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
      showToast('Mode fenêtré');
    }
  }
}

const btnFs = document.getElementById('btn-fullscreen-toggle');
if (btnFs) btnFs.addEventListener('click', toggleFullscreen);

const settingsModal = document.getElementById('settings-modal');
const btnOpenSettings = document.getElementById('btn-settings-modal');
const btnCloseSettings = document.getElementById('btn-close-settings');
const btnOkSettings = document.getElementById('btn-ok-settings');
const sliderMusic = document.getElementById('slider-vol-music');
const sliderSfx = document.getElementById('slider-vol-sfx');
const toggleHapticsEl = document.getElementById('toggle-haptics');

if (btnOpenSettings && settingsModal) {
  btnOpenSettings.addEventListener('click', () => {
    if (gameState.running && !gameState.paused) togglePause();
    settingsModal.classList.remove('hidden');
    settingsModal.classList.add('flex');
  });
}

function closeSettings() {
  if (settingsModal) {
    settingsModal.classList.add('hidden');
    settingsModal.classList.remove('flex');
  }
  if (gameState.running && gameState.paused) togglePause();
}

if (btnCloseSettings) btnCloseSettings.addEventListener('click', closeSettings);
if (btnOkSettings) btnOkSettings.addEventListener('click', closeSettings);

if (sliderMusic) {
  sliderMusic.addEventListener('input', (e) => {
    const val = Number(e.target.value);
    document.getElementById('label-vol-music').textContent = `${val}%`;
    soundFX.setMusicVolume(val / 100);
    try { localStorage.setItem('echo_music_vol', String(val)); } catch (err) {}
  });
}

if (sliderSfx) {
  sliderSfx.addEventListener('input', (e) => {
    const val = Number(e.target.value);
    document.getElementById('label-vol-sfx').textContent = `${val}%`;
    soundFX.setSFXVolume(val / 100);
    try { localStorage.setItem('echo_sfx_vol', String(val)); } catch (err) {}
  });
}

if (toggleHapticsEl) {
  toggleHapticsEl.addEventListener('change', (e) => {
    hapticsEnabled = e.target.checked;
    try { localStorage.setItem('echo_haptics', hapticsEnabled ? '1' : '0'); } catch (err) {}
  });
}

// Settings Modal Mobile Quick Shortcuts
const btnCameraSettings = document.getElementById('btn-camera-settings');
if (btnCameraSettings) btnCameraSettings.addEventListener('click', cycleCameraMode);

const btnAimSettings = document.getElementById('btn-aim-settings');
if (btnAimSettings) btnAimSettings.addEventListener('click', toggleAimMode);

const btnCtrlSettings = document.getElementById('btn-ctrl-mode-settings');
if (btnCtrlSettings) {
  btnCtrlSettings.addEventListener('click', () => {
    const newMode = currentControlMode === 'joystick' ? 'dpad' : 'joystick';
    setControlMode(newMode);
    showToast(newMode === 'joystick' ? '🕹️ Mode Joystick Tactile activé' : '🔲 Mode Croix Directionnelle activé');
  });
}

const btnFsSettings = document.getElementById('btn-fullscreen-settings');
if (btnFsSettings) btnFsSettings.addEventListener('click', toggleFullscreen);

const btnRulesSettings = document.getElementById('btn-rules-settings');
if (btnRulesSettings) {
  btnRulesSettings.addEventListener('click', () => {
    closeSettings();
    document.getElementById('btn-rules-help').click();
  });
}

const btnAchSettings = document.getElementById('btn-achievements-settings');
if (btnAchSettings) {
  btnAchSettings.addEventListener('click', () => {
    closeSettings();
    const btnOpen = document.getElementById('btn-achievements-modal');
    if (btnOpen) btnOpen.click();
  });
}


// Achievements Modal Listeners
const achModal = document.getElementById('achievements-modal');
const btnOpenAch = document.getElementById('btn-achievements-modal');
const btnCloseAch = document.getElementById('btn-close-achievements');
const btnOkAch = document.getElementById('btn-ok-achievements');

if (btnOpenAch && achModal) {
  btnOpenAch.addEventListener('click', () => {
    if (gameState.running && !gameState.paused) togglePause();
    renderAchievementsModal();
    achModal.classList.remove('hidden');
    achModal.classList.add('flex');
  });
}
function closeAchModal() {
  if (achModal) {
    achModal.classList.add('hidden');
    achModal.classList.remove('flex');
  }
  if (gameState.running && gameState.paused) togglePause();
}
if (btnCloseAch) btnCloseAch.addEventListener('click', closeAchModal);
if (btnOkAch) btnOkAch.addEventListener('click', closeAchModal);

// Challenges Modal Listeners
const chalModal = document.getElementById('challenges-modal');
const btnOpenChal = document.getElementById('btn-open-challenges');
const btnCloseChal = document.getElementById('btn-close-challenges');

if (btnOpenChal && chalModal) {
  btnOpenChal.addEventListener('click', () => {
    chalModal.classList.remove('hidden');
    chalModal.classList.add('flex');
  });
}
if (btnCloseChal && chalModal) {
  btnCloseChal.addEventListener('click', () => {
    chalModal.classList.add('hidden');
    chalModal.classList.remove('flex');
  });
}

document.querySelectorAll('.btn-start-challenge').forEach((btn) => {
  btn.addEventListener('click', () => {
    const cType = btn.getAttribute('data-challenge');
    startSoloChallenge(cType);
  });
});

// PWA Service Worker & Install Prompt Management
let deferredPwaPrompt = null;

function initPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker actif:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration skipped:', err);
        });
    });
  }

  const btnInstallHeader = document.getElementById('btn-install-pwa');
  const btnInstallSettings = document.getElementById('btn-install-pwa-settings');
  const pwaModal = document.getElementById('pwa-modal');
  const btnClosePwaModal = document.getElementById('btn-close-pwa-modal');
  const btnOkPwaModal = document.getElementById('btn-ok-pwa-modal');
  const btnTriggerPrompt = document.getElementById('btn-trigger-pwa-prompt');
  const pwaNativeBlock = document.getElementById('pwa-native-prompt');
  const pwaIosBlock = document.getElementById('pwa-ios-instructions');

  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  if (isStandalone) {
    if (btnInstallHeader) btnInstallHeader.classList.add('hidden');
    if (btnInstallSettings) {
      btnInstallSettings.textContent = '✅ Jeu déjà installé en PWA';
      btnInstallSettings.classList.add('opacity-75');
    }
    return;
  }

  if (isIos && !isStandalone) {
    if (btnInstallHeader) btnInstallHeader.classList.remove('hidden');
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPwaPrompt = e;
    if (btnInstallHeader) btnInstallHeader.classList.remove('hidden');
    if (btnInstallSettings) btnInstallSettings.textContent = '📲 Installer l\'App sur mon Appareil (1 Clic)';
  });

  window.addEventListener('appinstalled', () => {
    deferredPwaPrompt = null;
    if (btnInstallHeader) btnInstallHeader.classList.add('hidden');
    if (pwaModal) {
      pwaModal.classList.add('hidden');
      pwaModal.classList.remove('flex');
    }
    showToast('🎉 Echo-Paradox 3D installé avec succès ! Retrouve-le sur ton écran d\'accueil !');
  });

  const openPwaModal = () => {
    if (deferredPwaPrompt) {
      deferredPwaPrompt.prompt();
      deferredPwaPrompt.userChoice.then((choice) => {
        if (choice && choice.outcome === 'accepted') {
          showToast('Installation en cours...');
        }
        deferredPwaPrompt = null;
      });
      return;
    }

    if (pwaModal) {
      if (isIos) {
        if (pwaNativeBlock) pwaNativeBlock.classList.add('hidden');
        if (pwaIosBlock) pwaIosBlock.classList.remove('hidden');
      } else {
        if (pwaNativeBlock) pwaNativeBlock.classList.remove('hidden');
        if (pwaIosBlock) pwaIosBlock.classList.add('hidden');
      }
      pwaModal.classList.remove('hidden');
      pwaModal.classList.add('flex');
    }
  };

  if (btnInstallHeader) btnInstallHeader.addEventListener('click', openPwaModal);
  if (btnInstallSettings) btnInstallSettings.addEventListener('click', openPwaModal);

  if (btnTriggerPrompt) {
    btnTriggerPrompt.addEventListener('click', () => {
      if (deferredPwaPrompt) {
        deferredPwaPrompt.prompt();
      } else {
        showToast('Appuyez sur le menu du navigateur (⋮) puis "Ajouter à l\'écran d\'accueil"');
      }
    });
  }

  const closePwa = () => {
    if (pwaModal) {
      pwaModal.classList.add('hidden');
      pwaModal.classList.remove('flex');
    }
  };
  if (btnClosePwaModal) btnClosePwaModal.addEventListener('click', closePwa);
  if (btnOkPwaModal) btnOkPwaModal.addEventListener('click', closePwa);
}

function initMenuTabs() {
  const tabs = document.querySelectorAll('.menu-tab-btn');
  const panels = document.querySelectorAll('.menu-tab-panel');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      tabs.forEach((t) => {
        t.classList.remove('active', 'border-cyan-400', 'bg-cyan-500/25', 'text-cyan-300');
        t.classList.add('border-transparent', 'text-slate-400');
      });
      tab.classList.add('active', 'border-cyan-400', 'bg-cyan-500/25', 'text-cyan-300');
      tab.classList.remove('border-transparent', 'text-slate-400');

      panels.forEach((p) => {
        if (p.id === `tab-panel-${target}`) {
          p.classList.remove('hidden');
          p.classList.add('flex');
        } else {
          p.classList.add('hidden');
          p.classList.remove('flex');
        }
      });
      triggerHaptic(15);
    });
  });

  const btnAchFromRules = document.getElementById('btn-achievements-from-rules');
  if (btnAchFromRules) {
    btnAchFromRules.addEventListener('click', () => {
      const btnOpen = document.getElementById('btn-achievements-modal');
      if (btnOpen) btnOpen.click();
    });
  }
}

// Boot on load
window.onload = () => {
  PlayerStats.load();
  loadAchievements();
  initPeerMultiplayer();
  initVirtualJoystick();
  initPWA();
  initMenuTabs();

  // Load saved arena theme
  try {
    const savedArena = localStorage.getItem('echo_arena_theme_v2') || 'cyber';
    applyArenaTheme(savedArena);
  } catch (e) {}

  // Load saved skin
  try {
    const savedSkin = localStorage.getItem('echo_paradox_skin_v2') || 'cyan';
    applyPlayerSkin(savedSkin);
  } catch (e) {}

  // Load saved volume preferences
  try {
    const savedMusic = localStorage.getItem('echo_music_vol');
    if (savedMusic !== null && sliderMusic) {
      sliderMusic.value = savedMusic;
      sliderMusic.dispatchEvent(new Event('input'));
    }
    const savedSfx = localStorage.getItem('echo_sfx_vol');
    if (savedSfx !== null && sliderSfx) {
      sliderSfx.value = savedSfx;
      sliderSfx.dispatchEvent(new Event('input'));
    }
    const savedHap = localStorage.getItem('echo_haptics');
    if (savedHap !== null && toggleHapticsEl) {
      toggleHapticsEl.checked = savedHap === '1';
      hapticsEnabled = savedHap === '1';
    }
  } catch (e) {}

  // PWA shortcut / URL params
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    if (mode === 'dojo') {
      const btnOpen = document.getElementById('btn-open-challenges');
      if (btnOpen) btnOpen.click();
    } else if (mode === 'arena') {
      const btnVsBot = document.getElementById('btn-start-bot');
      if (btnVsBot) btnVsBot.click();
    }
  } catch (e) {}

  requestAnimationFrame(animate);
};
