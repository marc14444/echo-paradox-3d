// =========================================================================
// 1. SYNTHESIZED CYBER AUDIO ENGINE (Web Audio API - Zero external files)
// =========================================================================
class CyberAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playLaser(isEcho = false) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isEcho ? 'triangle' : 'sawtooth';
    osc.frequency.setValueAtTime(isEcho ? 660 : 880, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
    gain.gain.setValueAtTime(isEcho ? 0.05 : 0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
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
    gain.connect(this.ctx.destination);
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
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.2);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.21);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
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
      gain.connect(this.ctx.destination);
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
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.11);
      osc.stop(now + idx * 0.11 + 0.36);
    });
  }
}

const soundFX = new CyberAudio();

// =========================================================================
// 2. PERSISTENT PLAYER STATS (Safe localStorage wrapper)
// =========================================================================
const PlayerStats = {
  wins: 0,
  echoes: 0,
  load() {
    try {
      const raw = localStorage.getItem('echo_paradox_stats_v1');
      if (raw) {
        const data = JSON.parse(raw);
        this.wins = Number(data.wins) || 0;
        this.echoes = Number(data.echoes) || 0;
      }
    } catch (e) {}
    this.updateUI();
  },
  save() {
    try {
      localStorage.setItem('echo_paradox_stats_v1', JSON.stringify({
        wins: this.wins,
        echoes: this.echoes
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
// 3. THREE.JS 3D HOLOGRAPHIC AR ENGINE & TIME-CLONE GAMEPLAY
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

// Arena Constants
const ARENA_RADIUS = 19;
const obstacles = [];

// Build 3D Holographic Octagon Arena
const arenaGroup = new THREE.Group();
scene.add(arenaGroup);

// Base Dark Reflective Disc (Also used for Mouse Raycasting!)
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

// 4 Tactical Holographic Cover Pillars inside the Arena
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

// Central Chrono Core Power-up (Gives Triple Shot + Heal)
const chronoCoreGroup = new THREE.Group();
const coreOcta = new THREE.Mesh(
  new THREE.OctahedronGeometry(1.05, 0),
  new THREE.MeshBasicMaterial({ color: 0xfbbf24, wireframe: false })
);
const coreWire = new THREE.Mesh(
  new THREE.OctahedronGeometry(1.45, 0),
  new THREE.MeshBasicMaterial({ color: 0xfde047, wireframe: true, transparent: true, opacity: 0.8 })
);
chronoCoreGroup.add(coreOcta);
chronoCoreGroup.add(coreWire);
chronoCoreGroup.position.set(0, 1.4, 0);
scene.add(chronoCoreGroup);

let chronoCoreActive = true;
let chronoCoreRespawnTimer = 0;

// Click Target Ring Indicator on Floor (Shows where mouse click moves P1)
const clickTargetMesh = new THREE.Mesh(
  new THREE.RingGeometry(0.5, 0.85, 24),
  new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide, transparent: true, opacity: 0.0 })
);
clickTargetMesh.rotation.x = -Math.PI / 2;
clickTargetMesh.position.y = 0.1;
scene.add(clickTargetMesh);

// Background Starfield
const starsGeo = new THREE.BufferGeometry();
const starCount = 350;
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
// 4. PLAYER, HOLOGRAPHIC CLONE & AIM LASER BUILDERS
// =========================================================================
function createCyberFighterMesh(colorHex, isGhost = false, hasAimLaser = false) {
  const group = new THREE.Group();

  // Main Futuristic Hover Chassis (Slightly larger & brighter for visibility)
  const bodyGeo = new THREE.ConeGeometry(1.15, 2.5, 6);
  bodyGeo.rotateX(Math.PI / 2);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: isGhost ? 0.9 : 0.55,
    metalness: 0.7,
    roughness: 0.2,
    transparent: isGhost,
    opacity: isGhost ? 0.48 : 1.0
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.9;
  group.add(body);

  // Holographic Wireframe Shell
  const wireGeo = new THREE.EdgesGeometry(bodyGeo);
  const wireMat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: isGhost ? 0.85 : 0.95
  });
  const wire = new THREE.LineSegments(wireGeo, wireMat);
  body.add(wire);

  // Hover Energy Ring Under Fighter
  const ringGeo = new THREE.RingGeometry(1.05, 1.4, 24);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: isGhost ? 0.45 : 0.9
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = 0.14;
  group.add(ring);

  // Optional Aiming Laser Sight Line (So player sees where their shots go!)
  if (hasAimLaser) {
    const laserGeo = new THREE.CylinderGeometry(0.04, 0.04, 10, 6);
    laserGeo.rotateX(Math.PI / 2);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.35
    });
    const laserLine = new THREE.Mesh(laserGeo, laserMat);
    laserLine.position.set(0, 0.9, 6.2);
    group.add(laserLine);
  }

  // Shield Sphere (Visible when dashing / invulnerable)
  const shieldGeo = new THREE.SphereGeometry(1.75, 18, 18);
  const shieldMat = new THREE.MeshBasicMaterial({
    color: 0xfacc15,
    wireframe: true,
    transparent: true,
    opacity: 0.0
  });
  const shield = new THREE.Mesh(shieldGeo, shieldMat);
  shield.position.y = 0.9;
  group.add(shield);

  group.userData = { body, ring, shield, shieldMat };
  return group;
}

// Active Game Entities & State
const gameState = {
  running: false,
  paused: false,
  mode: 'bot', // 'bot', 'local', 'online'
  botDifficulty: 'easy', // Default to 'easy' so new players immediately win & understand!
  autoFire: true, // Auto-fire ON by default so player only needs to move!
  cameraMode: 0, // 0: Immersive, 1: Tactical Top-Down, 2: Dynamic AR Orbit
  loopDuration: 10.0,
  loopTimer: 10.0,
  cycleCount: 1,
  shakeIntensity: 0,
  slowMoFactor: 1.0,
  totalPlayerHits: 0,
  scores: { p1: 0, p2: 0 },
  roundsToWin: 2
};

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
  mesh: createCyberFighterMesh(0xf43f5e, false, false),
  currentRecording: [],
  pastRecordings: []
};
scene.add(p2.mesh);

let activeEchoClones = [];
let projectiles = [];
let particles = [];
let shockwaves = [];

// =========================================================================
// 5. UNIVERSAL INPUT HANDLING (Keyboard + Mouse Click-to-Move + Touch D-Pad)
// =========================================================================
const keys = {};
const touchDir = { up: false, down: false, left: false, right: false };
const raycaster = new THREE.Raycaster();
const mouseNDC = new THREE.Vector2();
let isPointerDownOnArena = false;

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
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

// Click / Drag directly on 3D Arena to Move P1 & Shoot!
function updatePointerTarget(clientX, clientY) {
  mouseNDC.x = (clientX / window.innerWidth) * 2 - 1;
  mouseNDC.y = -(clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouseNDC, camera);
  const intersects = raycaster.intersectObject(baseMesh);
  if (intersects.length > 0) {
    const pt = intersects[0].point;
    p1.targetX = pt.x;
    p1.targetZ = pt.z;
    clickTargetMesh.position.set(pt.x, 0.12, pt.z);
    clickTargetMesh.material.opacity = 0.85;
  }
}

container.addEventListener('pointerdown', (e) => {
  window.focus();
  if (!gameState.running || gameState.paused) return;
  isPointerDownOnArena = true;
  updatePointerTarget(e.clientX, e.clientY);
  triggerShoot(p1, false);
});

container.addEventListener('pointermove', (e) => {
  if (!gameState.running || gameState.paused || !isPointerDownOnArena) return;
  updatePointerTarget(e.clientX, e.clientY);
});

window.addEventListener('pointerup', () => {
  isPointerDownOnArena = false;
});

// Touch / Click D-Pad listeners
document.querySelectorAll('.touch-move-btn').forEach((btn) => {
  const dir = btn.getAttribute('data-dir');
  const startMove = (ev) => {
    ev.preventDefault();
    p1.targetX = null;
    p1.targetZ = null;
    touchDir[dir] = true;
  };
  const endMove = (ev) => {
    ev.preventDefault();
    touchDir[dir] = false;
  };
  btn.addEventListener('touchstart', startMove, { passive: false });
  btn.addEventListener('touchend', endMove, { passive: false });
  btn.addEventListener('mousedown', startMove);
  btn.addEventListener('mouseup', endMove);
  btn.addEventListener('mouseleave', endMove);
});

document.getElementById('btn-action-shoot').addEventListener('click', () => {
  window.focus();
  if (gameState.running && !gameState.paused) {
    triggerShoot(p1, false);
  }
});

document.getElementById('btn-action-dash').addEventListener('click', () => {
  window.focus();
  if (gameState.running && !gameState.paused) {
    triggerDash(p1);
  }
});

document.getElementById('btn-autofire-toggle').addEventListener('click', () => {
  gameState.autoFire = !gameState.autoFire;
  const btn = document.getElementById('btn-autofire-toggle');
  if (gameState.autoFire) {
    btn.textContent = '🤖 TIR AUTO : ACTIVÉ (Vise et tire tout seul)';
    btn.className = 'rounded-xl bg-emerald-500/25 border border-emerald-400 px-3 py-1 text-xs font-bold text-emerald-200 hover:bg-emerald-500/35 transition';
  } else {
    btn.textContent = '🎯 TIR MANUEL (Appuie sur ESPACE pour tirer)';
    btn.className = 'rounded-xl bg-slate-800/90 border border-slate-600 px-3 py-1 text-xs font-bold text-slate-300 hover:border-cyan-400 transition';
  }
  window.focus();
});

// =========================================================================
// 6. 3D TO 2D FLOATING MARKERS PROJECTION (So Player 1 & Enemy are obvious!)
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

// =========================================================================
// 7. COMBAT MECHANICS: SHOOTING, DASHING, SHOCKWAVES & CLONES
// =========================================================================
function spawnShockwave(x, z, colorHex, maxRadius = 4.5) {
  const geo = new THREE.RingGeometry(0.3, 0.55, 32);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    color: colorHex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, 0.18, z);
  scene.add(mesh);
  shockwaves.push({ mesh, mat, scale: 1, maxScale: maxRadius * 2, opacity: 0.9 });
}

function spawnExplosion(x, y, z, colorHex, count = 16) {
  for (let i = 0; i < count; i++) {
    const pGeo = new THREE.BoxGeometry(0.26, 0.26, 0.26);
    const pMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 1 });
    const mesh = new THREE.Mesh(pGeo, pMat);
    mesh.position.set(x, y, z);
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 9;
    scene.add(mesh);
    particles.push({
      mesh,
      mat: pMat,
      vx: Math.cos(angle) * speed,
      vy: 2 + Math.random() * 6,
      vz: Math.sin(angle) * speed,
      life: 0.45 + Math.random() * 0.35
    });
  }
}

function fireProjectile(ownerTeam, x, z, angle, colorHex, isEcho = false) {
  const geo = new THREE.SphereGeometry(isEcho ? 0.36 : 0.46, 12, 12);
  const mat = new THREE.MeshBasicMaterial({ color: isEcho ? 0xe0f2fe : colorHex });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x + Math.cos(angle) * 1.4, 0.9, z + Math.sin(angle) * 1.4);

  const trailGeo = new THREE.CylinderGeometry(0.14, 0.03, 1.6, 8);
  trailGeo.rotateZ(Math.PI / 2);
  const trailMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.8
  });
  const trail = new THREE.Mesh(trailGeo, trailMat);
  trail.position.x = -0.65;
  mesh.add(trail);
  mesh.rotation.y = -angle;

  scene.add(mesh);
  const speed = isEcho ? 19 : 22;
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
    life: 2.5
  });
}

function triggerShoot(fighter, isEcho = false) {
  if (fighter.shootCooldown > 0) return false;
  fighter.shootCooldown = fighter.tripleShotTimer > 0 ? 0.28 : 0.38;
  soundFX.playLaser(isEcho);

  if (fighter.tripleShotTimer > 0) {
    [-0.18, 0, 0.18].forEach((offset) => {
      fireProjectile(fighter.team, fighter.x, fighter.z, fighter.angle + offset, 0xfbbf24, isEcho);
    });
  } else {
    fireProjectile(fighter.team, fighter.x, fighter.z, fighter.angle, fighter.color, isEcho);
  }
  return true;
}

function triggerDash(fighter) {
  if (fighter.dashCooldown > 0) return false;
  fighter.dashCooldown = 2.2;
  fighter.dashActiveTimer = 0.65;
  soundFX.playDash();
  spawnShockwave(fighter.x, fighter.z, 0xfacc15, 3.5);

  const dashSpeed = 19;
  fighter.vx = Math.cos(fighter.angle) * dashSpeed;
  fighter.vz = Math.sin(fighter.angle) * dashSpeed;
  return true;
}

// =========================================================================
// 8. TIME-LOOP REWIND & HOLOGRAPHIC CLONE SPAWNER
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

function setCoachText(htmlText) {
  const el = document.getElementById('coach-step-text');
  if (el) el.innerHTML = htmlText;
}

function triggerTimeRewindCycle() {
  soundFX.playTimeRewind();
  gameState.cycleCount += 1;
  gameState.loopTimer = gameState.loopDuration;
  gameState.shakeIntensity = 0.4;

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

  p1.pastRecordings.forEach((rec) => {
    const mesh = createCyberFighterMesh(0x38bdf8, true, false);
    scene.add(mesh);
    activeEchoClones.push({
      team: 1,
      color: 0x38bdf8,
      recording: rec,
      frameIndex: 0,
      mesh
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
      mesh
    });
  });

  spawnShockwave(p1.x, p1.z, 0x22d3ee, 5.5);
  spawnShockwave(p2.x, p2.z, 0xf43f5e, 5.5);

  showBanner(`⏪ BOUCLE TEMPORELLE : UN CLONE BLEU ALLIÉ VIENT D'APPARAÎTRE !`, '⏪');
  setCoachText(`✨ <span class="text-cyan-300">SUPER !</span> Tu as maintenant <strong>${p1.pastRecordings.length} clone(s) bleu(s)</strong> qui rejouent tes tirs passés pour t'aider à vaincre le vaisseau rouge !`);
  updateHUD();
}

// =========================================================================
// 9. INTELLIGENT BOT AI (Balanced for Fun & Playability)
// =========================================================================
function updateBotAI(dt) {
  let moveX = 0;
  let moveZ = 0;

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

  if (dangerProj && gameState.botDifficulty !== 'easy') {
    const perpX = -dangerProj.vz;
    const perpZ = dangerProj.vx;
    const len = Math.hypot(perpX, perpZ) || 1;
    moveX += (perpX / len) * 1.3;
    moveZ += (perpZ / len) * 1.3;

    if (minDist < 3.2 && p2.dashCooldown <= 0 && gameState.botDifficulty === 'hard') {
      triggerDash(p2);
    }
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

  const mag = Math.hypot(moveX, moveZ);
  const speedMult = gameState.botDifficulty === 'hard' ? 9.8 : gameState.botDifficulty === 'medium' ? 7.6 : 5.4;
  if (mag > 0.01) {
    p2.vx = (moveX / mag) * speedMult;
    p2.vz = (moveZ / mag) * speedMult;
  }

  const leadFactor = gameState.botDifficulty === 'hard' ? 0.25 : 0;
  const targetX = p1.x + p1.vx * leadFactor;
  const targetZ = p1.z + p1.vz * leadFactor;
  p2.angle = Math.atan2(targetZ - p2.z, targetX - p2.x);

  // Bot shoots less frequently on Easy so new players can comfortably learn and win
  const shootChance = gameState.botDifficulty === 'hard' ? 0.85 : gameState.botDifficulty === 'medium' ? 0.55 : 0.24;
  if (p2.shootCooldown <= 0 && Math.random() < shootChance * dt * 8) {
    triggerShoot(p2, false);
  }
}

// =========================================================================
// 10. PHYSICS, COLLISIONS & ROUND MANAGEMENT
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

  fighter.x += fighter.vx * dt;
  fighter.z += fighter.vz * dt;
  fighter.vx *= 0.85;
  fighter.vz *= 0.85;

  constrainToArenaAndObstacles(fighter);

  fighter.mesh.position.set(fighter.x, 0, fighter.z);
  fighter.mesh.rotation.y = -fighter.angle + Math.PI / 2;
  fighter.mesh.userData.shieldMat.opacity = fighter.dashActiveTimer > 0 ? 0.7 : 0.0;
  fighter.mesh.userData.shield.rotation.y += dt * 4;

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
  p2.currentRecording = [];
  p2.pastRecordings = [];

  activeEchoClones.forEach((c) => scene.remove(c.mesh));
  activeEchoClones = [];

  projectiles.forEach((pr) => scene.remove(pr.mesh));
  projectiles = [];

  gameState.loopTimer = gameState.loopDuration;
  gameState.cycleCount = 1;
  gameState.slowMoFactor = 1.0;
  chronoCoreActive = true;
  chronoCoreGroup.visible = true;

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
      winnerTeam === 1 ? '🏆 MANCHE GAGNÉE PAR TOI (BLEU) ! ENCORE 1 POUR LA VICTOIRE !' : `⚠️ MANCHE PERDUE ! PRÉPARE LA REVANCHE !`,
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
    title.textContent = '🎉 VICTOIRE ! TU AS GAGNÉ !';
    title.className = 'font-cyber text-2xl sm:text-3xl font-black text-white neon-text-cyan';
    sub.textContent = 'Bravo ! Tes déplacements et tes clones temporels ont écrasé l\'adversaire.';
  } else {
    title.textContent = '💥 DÉFAITE... REJOUE !';
    title.className = 'font-cyber text-2xl sm:text-3xl font-black text-white neon-text-pink';
    sub.textContent = 'Astuce : Ramasse le diamant jaune au milieu et utilise le bouton BOUCLIER DASH !';
  }

  scoreEl.textContent = `${gameState.scores.p1} - ${gameState.scores.p2}`;
  clonesEl.textContent = String(activeEchoClones.length);
  hitsEl.textContent = String(gameState.totalPlayerHits);

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

// =========================================================================
// 11. ONLINE P2P MULTIPLAYER (PeerJS WebRTC for Global Play on Vercel)
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
      if (codeEl) codeEl.textContent = id;
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

// =========================================================================
// 12. MAIN GAME LOOP (60 FPS Animation & 3D Camera Controller)
// =========================================================================
let lastTime = performance.now();

function animate(now) {
  requestAnimationFrame(animate);

  const rawDt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  const dt = rawDt * gameState.slowMoFactor;

  // Ambient 3D Arena Animations
  orbitalRing1.rotation.z += rawDt * 0.28;
  orbitalRing2.rotation.z -= rawDt * 0.22;
  starField.rotation.y += rawDt * 0.03;

  if (chronoCoreActive) {
    chronoCoreGroup.rotation.y += rawDt * 2.2;
    chronoCoreGroup.position.y = 1.35 + Math.sin(now * 0.004) * 0.28;
  }

  if (clickTargetMesh.material.opacity > 0) {
    clickTargetMesh.material.opacity = Math.max(0, clickTargetMesh.material.opacity - rawDt * 1.4);
  }

  if (gameState.running && !gameState.paused) {
    // 1. Update Time-Loop Countdown
    gameState.loopTimer -= dt;
    const timerEl = document.getElementById('hud-loop-timer');
    if (timerEl) {
      timerEl.textContent = `${Math.max(0, gameState.loopTimer).toFixed(1)}s`;
    }
    if (gameState.loopTimer <= 0) {
      triggerTimeRewindCycle();
    }

    // 2. Player 1 Input: Supports WASD + ZQSD + Arrow Keys (in Solo/Online) + Mouse Click Target + On-screen D-Pad!
    let p1MoveX = 0;
    let p1MoveZ = 0;
    const allowArrowsForP1 = gameState.mode !== 'local';

    const upPressed = keys['KeyW'] || keys['KeyZ'] || touchDir.up || (allowArrowsForP1 && keys['ArrowUp']);
    const downPressed = keys['KeyS'] || touchDir.down || (allowArrowsForP1 && keys['ArrowDown']);
    const leftPressed = keys['KeyA'] || keys['KeyQ'] || touchDir.left || (allowArrowsForP1 && keys['ArrowLeft']);
    const rightPressed = keys['KeyD'] || touchDir.right || (allowArrowsForP1 && keys['ArrowRight']);

    if (upPressed) p1MoveZ -= 1;
    if (downPressed) p1MoveZ += 1;
    if (leftPressed) p1MoveX -= 1;
    if (rightPressed) p1MoveX += 1;

    // Visual feedback on D-Pad buttons when keys are pressed
    document.getElementById('dpad-up').style.borderColor = upPressed ? '#22d3ee' : '';
    document.getElementById('dpad-down').style.borderColor = downPressed ? '#22d3ee' : '';
    document.getElementById('dpad-left').style.borderColor = leftPressed ? '#22d3ee' : '';
    document.getElementById('dpad-right').style.borderColor = rightPressed ? '#22d3ee' : '';

    // If no keyboard pressed, check if player clicked a point on the 3D Arena
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
      const speed = 11.2;
      p1.vx = (p1MoveX / p1Mag) * speed;
      p1.vz = (p1MoveZ / p1Mag) * speed;
    }

    // Always aim P1 directly at P2 so shots hit reliably!
    p1.angle = Math.atan2(p2.z - p1.z, p2.x - p1.x);

    let p1Shot = false;
    if (keys['Space'] || gameState.autoFire) {
      p1Shot = triggerShoot(p1, false);
    }
    if (keys['ShiftLeft'] || keys['ShiftRight'] || keys['KeyE']) {
      triggerDash(p1);
    }

    // 3. Player 2 Input (Local 2P or Bot AI or Online Sync)
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
        const speed = 11.2;
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

    // Broadcast P1 state if connected via P2P WebRTC
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

    // 6. Central Chrono Core Power-up Pickup
    if (chronoCoreActive) {
      [p1, p2].forEach((fighter) => {
        if (Math.hypot(fighter.x, fighter.z) < 2.1) {
          chronoCoreActive = false;
          chronoCoreGroup.visible = false;
          chronoCoreRespawnTimer = 11.0;
          fighter.tripleShotTimer = 6.5;
          fighter.hp = Math.min(100, fighter.hp + 30);
          spawnShockwave(0, 0, 0xfbbf24, 6.0);
          soundFX.playDash();
          showBanner(
            fighter.team === 1
              ? '💎 TU AS CAPTURÉ LE DIAMANT : TRIPLE TIR + SOIN ACTIVÉ !'
              : '⚠️ L\'ENNEMI A PRIS LE DIAMANT CENTRAL !',
            '💎'
          );
          updateHUD();
        }
      });
    } else {
      chronoCoreRespawnTimer -= dt;
      if (chronoCoreRespawnTimer <= 0) {
        chronoCoreActive = true;
        chronoCoreGroup.visible = true;
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

      // Check Hit against P1 or P2
      const target = pr.team === 1 ? p2 : p1;
      if (!removeProj && Math.hypot(pr.x - target.x, pr.z - target.z) < 1.35) {
        removeProj = true;
        if (target.dashActiveTimer > 0) {
          spawnShockwave(target.x, target.z, 0xfacc15, 2.8);
          soundFX.playDash();
        } else {
          // Give P1 slightly stronger shots on Easy mode for instant gratification
          const dmg = pr.team === 1
            ? (pr.isEcho ? 14 : 18)
            : (gameState.botDifficulty === 'easy' ? 8 : 15);
          target.hp = Math.max(0, target.hp - dmg);
          if (pr.team === 1) gameState.totalPlayerHits += 1;
          soundFX.playHit();
          gameState.shakeIntensity = 0.3;
          spawnExplosion(target.x, 1.0, target.z, target.color, 16);
          updateHUD();

          if (target.hp <= 0) {
            handleRoundWin(pr.team);
          }
        }
      }

      if (removeProj) {
        scene.remove(pr.mesh);
        projectiles.splice(i, 1);
      }
    }
  }

  // 8. Update Shockwaves & Particles
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const sw = shockwaves[i];
    sw.scale += rawDt * 14;
    sw.opacity -= rawDt * 1.8;
    sw.mesh.scale.set(sw.scale, sw.scale, 1);
    sw.mat.opacity = Math.max(0, sw.opacity);
    if (sw.opacity <= 0) {
      scene.remove(sw.mesh);
      shockwaves.splice(i, 1);
    }
  }

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

  // 9. Dynamic 3D Camera Positioning + Screen Shake
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

  renderer.render(scene, camera);

  // Update 2D Floating Labels Above 3D Ships!
  updateFloatingMarker('marker-p1', p1.x, 2.7, p1.z);
  updateFloatingMarker('marker-p2', p2.x, 2.7, p2.z);
  if (chronoCoreActive) {
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
  setTimeout(() => box.classList.add('hidden'), 2600);
}

function startMatch(mode, opponentLabel) {
  soundFX.init();
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
  document.getElementById('hud-center-panel').classList.add('flex');
  document.getElementById('coach-bar').classList.remove('hidden');
  document.getElementById('btn-pause-game').classList.remove('hidden');
  document.getElementById('ingame-controls-footer').classList.remove('hidden');
  document.getElementById('ingame-controls-footer').classList.add('flex');

  setCoachText('🎯 <span class="text-cyan-300">OBJECTIF :</span> Bouge ton vaisseau <span class="text-cyan-300">BLEU</span> (Flèches, ZQSD, ou <strong>clique sur l\'arène</strong>). Il tire automatiquement sur l\'ennemi <span class="text-rose-400">ROUGE</span> !');
  resetRoundPositions(false);
  showBanner('C\'EST PARTI ! DÉPLACE-TOI POUR ESQUIVER ET RAMASSE LE DIAMANT JAUNE !', '🚀');
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

// Bot Difficulty Selection
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
  const diffLabel = gameState.botDifficulty === 'hard' ? '🔴 BOT PRO' : gameState.botDifficulty === 'medium' ? '🔴 BOT NORMAL' : '🔴 BOT FACILE';
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

document.getElementById('btn-copy-code').addEventListener('click', () => {
  const text = `${myShortCode}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  } else {
    const temp = document.createElement('textarea');
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    document.body.removeChild(temp);
  }
  showToast(`Code ${myShortCode} copié ! Envoie-le à ton ami.`);
});

// Top Navigation Controls
document.getElementById('btn-home-menu').addEventListener('click', () => {
  gameState.running = false;
  document.getElementById('menu-overlay').classList.remove('hidden');
  document.getElementById('gameover-modal').classList.add('hidden');
  document.getElementById('gameover-modal').classList.remove('flex');
  document.getElementById('hud-center-panel').classList.add('hidden');
  document.getElementById('coach-bar').classList.add('hidden');
  document.getElementById('btn-pause-game').classList.add('hidden');
  document.getElementById('ingame-controls-footer').classList.add('hidden');
  document.getElementById('marker-p1').classList.add('hidden');
  document.getElementById('marker-p2').classList.add('hidden');
  document.getElementById('marker-core').classList.add('hidden');
});

document.getElementById('btn-camera-view').addEventListener('click', () => {
  gameState.cameraMode = (gameState.cameraMode + 1) % 3;
  const labels = ['Caméra: Immersive', 'Caméra: Tactique', 'Caméra: Hologramme AR'];
  document.getElementById('camera-label').textContent = labels[gameState.cameraMode];
  showToast(labels[gameState.cameraMode]);
  window.focus();
});

document.getElementById('btn-sound-toggle').addEventListener('click', () => {
  soundFX.enabled = !soundFX.enabled;
  document.getElementById('sound-label').textContent = soundFX.enabled ? 'Son ON' : 'Son OFF';
  showToast(soundFX.enabled ? 'Effets sonores activés' : 'Effets sonores coupés');
  window.focus();
});

document.getElementById('btn-pause-game').addEventListener('click', togglePause);

// Rules Help Modal
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

// Gameover Modal Buttons
document.getElementById('btn-rematch').addEventListener('click', () => {
  const oppName = document.getElementById('hud-p2-name').textContent;
  startMatch(gameState.mode, oppName);
});

document.getElementById('btn-back-lobby').addEventListener('click', () => {
  document.getElementById('btn-home-menu').click();
});

document.getElementById('btn-share-score').addEventListener('click', () => {
  const shareTxt = `🔥 Je viens de gagner sur ECHO-PARADOX 3D (${gameState.scores.p1}-${gameState.scores.p2}) avec ${activeEchoClones.length} clones temporels ! Viens me défier (Code: ${myShortCode})`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(shareTxt).catch(() => {});
  }
  showToast('Message de défi copié pour WhatsApp / TikTok / Discord !');
});

// Vercel Guide Modal
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

// Boot on load
window.onload = () => {
  PlayerStats.load();
  initPeerMultiplayer();
  requestAnimationFrame(animate);
};
