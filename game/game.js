function showToast(msg) {
  var el = document.getElementById('system-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'system-toast';
    el.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.9);color:#fff;padding:12px 24px;border-radius:14px;font-size:15px;z-index:9999;text-align:center;opacity:0;transition:opacity 0.3s;pointer-events:none;max-width:80%;border:1px solid rgba(255,255,255,0.1);';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  setTimeout(function() { el.style.opacity = '0'; }, 3000);
}

/* ===== Fruit Slice — Game Engine =====
   Swipe slicing arcade: fruits fly up, swipe to slice, avoid bombs
*/
const CANVAS_W = 400;
const CANVAS_H = 500;
const GRAVITY = 0.25;
const FRUITS = [
  { name: '🍎', color: '#ff6b6b', innerColor: '#fff', size: 30, points: 10 },
  { name: '🍊', color: '#ffa502', innerColor: '#fff', size: 30, points: 10 },
  { name: '🍋', color: '#ffd700', innerColor: '#fff', size: 28, points: 10 },
  { name: '🍉', color: '#4cd137', innerColor: '#ff6b6b', size: 36, points: 15 },
  { name: '🍇', color: '#a18cd1', innerColor: '#6c5ce7', size: 24, points: 15 },
  { name: '🍓', color: '#ff4757', innerColor: '#f368e0', size: 26, points: 12 },
  { name: '🥝', color: '#7bed9f', innerColor: '#70a1ff', size: 28, points: 12 },
  { name: '🍑', color: '#ff9ff3', innerColor: '#feca57', size: 30, points: 10 },
];

let canvas, ctx;
let fruits = [];
let slices = [];
let particles = null;
let floatingTexts = [];
let score = 0;
let lives = 3;
let combo = 0;
let maxComboThisGame = 0;
let fruitsSlicedThisGame = 0;
let gameActive = false;
let gameOver = false;
let difficulty = 1;
let spawnTimer = 0;
let lastSpawnTime = 0;
let isSlice = false;

// ─── Canvas Setup ────────────────────────────────────
function initCanvas() {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
}

// ─── Fruit Object ────────────────────────────────────
function createFruit() {
  const isBomb = Math.random() < (0.08 + difficulty * 0.02);
  if (isBomb) {
    const x = 50 + Math.random() * (CANVAS_W - 100);
    return {
      type: 'bomb',
      emoji: '💣',
      color: '#2d3436',
      size: 28,
      x, y: CANVAS_H + 30,
      vy: -(8 + Math.random() * 3 + difficulty * 0.3),
      vx: (Math.random() - 0.5) * 4,
      rotation: 0,
      rotSpeed: (Math.random() - 0.5) * 0.1,
      points: 0,
      sliced: false,
      missed: false,
    };
  }
  const fruit = FRUITS[Math.floor(Math.random() * FRUITS.length)];
  const x = 50 + Math.random() * (CANVAS_W - 100);
  return {
    type: 'fruit',
    fruit: fruit,
    emoji: fruit.name,
    color: fruit.color,
    innerColor: fruit.innerColor,
    size: fruit.size,
    x, y: CANVAS_H + 30,
    vy: -(10 + Math.random() * 3 + difficulty * 0.3),
    vx: (Math.random() - 0.5) * 3,
    rotation: 0,
    rotSpeed: (Math.random() - 0.5) * 0.15,
    points: fruit.points,
    sliced: false,
    missed: false,
  };
}

// ─── Slicing Detection ──────────────────────────────
function checkSlice(x1, y1, x2, y2) {
  if (!gameActive || gameOver) return;
  let hitAny = false;

  for (const fruit of fruits) {
    if (fruit.sliced) continue;
    // Check if line crosses fruit bounding circle
    const dist = pointToLineDist(fruit.x, fruit.y, x1, y1, x2, y2);
    if (dist < fruit.size + 10) {
      fruit.sliced = true;
      hitAny = true;

      if (fruit.type === 'bomb') {
        // Bomb - lose a life or game over
        hitBomb(fruit);
        return;
      }

      // Slice the fruit!
      combo++;
      if (combo > maxComboThisGame) maxComboThisGame = combo;
      fruitsSlicedThisGame++;

      // Calculate score with bonuses
      const bonuses = window.ProgressionSystem ? ProgressionSystem.getActiveBonuses() : {};
      const scoreMult = bonuses.scoreMult || 1;
      const comboBonus = bonuses.comboBonus || 0;
      const fruitBonus = bonuses.fruitBonus || 0;

      let pts = fruit.points + comboBonus + fruitBonus;
      if (combo >= 5) pts = Math.floor(pts * 1.5);
      if (combo >= 10) pts = Math.floor(pts * 2);
      if (combo >= 20) pts = Math.floor(pts * 3);
      pts = Math.floor(pts * scoreMult);
      score += pts;

      // Particles!
      if (particles) {
        particles.emit(fruit.x, fruit.y, fruit.color, 20, 'confetti');
        particles.emit(fruit.x - 10, fruit.y, fruit.innerColor || '#fff', 10);
        particles.emit(fruit.x + 10, fruit.y, fruit.innerColor || '#fff', 10);
      }

      // Floating score text
      const comboText = combo >= 10 ? ' 🔥COMBO!' : combo >= 5 ? ' ✨NICE!' : '';
      floatingTexts.push(new FloatingText(fruit.x, fruit.y - 20, `+${pts}${comboText}`, combo >= 10 ? '#ffd700' : '#fff', combo >= 10 ? 28 : 20));

      // Combo display
      showComboDisplay(combo);

      // Add half slices
      slices.push({ x: fruit.x - 8, y: fruit.y, vy: -2, vx: -2, rot: 0, size: fruit.size, color: fruit.color, life: 1 });
      slices.push({ x: fruit.x + 8, y: fruit.y, vy: -2, vx: 2, rot: 0, size: fruit.size, color: fruit.color, life: 1 });

      updateScoreDisplay();
    }
  }

  if (!hitAny) {
    // Miss - reset combo
    combo = 0;
    updateComboDisplay();
  }
}

function hitBomb(bomb) {
  if (particles) {
    particles.emit(bomb.x, bomb.y, '#ff0000', 40, 'confetti');
    particles.emit(bomb.x, bomb.y, '#ffa502', 20);
  }
  floatingTexts.push(new FloatingText(bomb.x, bomb.y - 20, '💥 BOOM!', '#ff0000', 30));
  combo = 0;

  // Check deflect chance
  const bonuses = window.ProgressionSystem ? ProgressionSystem.getActiveBonuses() : {};
  if (bonuses.bombDeflect && Math.random() < bonuses.bombDeflect) {
    floatingTexts.push(new FloatingText(CANVAS_W / 2, CANVAS_H / 2, '🛡️ Deflected!', '#4cd137', 24));
    return;
  }

  lives--;
  updateLivesDisplay();
  if (lives <= 0) {
    endGame();
  }
}

// ─── Math Helpers ────────────────────────────────────
function pointToLineDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  const nearX = x1 + t * dx;
  const nearY = y1 + t * dy;
  return Math.sqrt((px - nearX) ** 2 + (py - nearY) ** 2);
}

// ─── Render ──────────────────────────────────────────
function render() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Background gradient
  const grad = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H / 2, 0, CANVAS_W / 2, CANVAS_H / 2, CANVAS_W);
  grad.addColorStop(0, '#1a1a3a');
  grad.addColorStop(1, '#0a0a1a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Draw fruits
  for (const fruit of fruits) {
    if (fruit.sliced) continue;
    ctx.save();
    ctx.translate(fruit.x, fruit.y);
    ctx.rotate(fruit.rotation);

    if (fruit.type === 'bomb') {
      // Draw bomb
      ctx.fillStyle = '#2d3436';
      ctx.beginPath();
      ctx.arc(0, 0, fruit.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#636e72';
      ctx.beginPath();
      ctx.arc(-4, -4, fruit.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff0000';
      ctx.font = `${fruit.size * 1.2}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💣', 0, 0);
    } else {
      // Draw fruit
      // Shadow/glow
      ctx.shadowColor = fruit.color;
      ctx.shadowBlur = 15;
      ctx.fillStyle = fruit.color;
      ctx.beginPath();
      ctx.arc(0, 0, fruit.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner highlight
      const igrad = ctx.createRadialGradient(-5, -5, 0, 0, 0, fruit.size);
      igrad.addColorStop(0, 'rgba(255,255,255,0.3)');
      igrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = igrad;
      ctx.beginPath();
      ctx.arc(0, 0, fruit.size, 0, Math.PI * 2);
      ctx.fill();

      // Emoji
      ctx.fillStyle = '#fff';
      ctx.font = `${fruit.size * 0.9}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(fruit.emoji, 0, 2);
    }
    ctx.restore();
  }

  // Draw sliced halves
  slices = slices.filter(s => s.life > 0);
  for (const s of slices) {
    ctx.save();
    ctx.globalAlpha = s.life;
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(0, 0, s.size * 0.8, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, s.size * 0.8, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    s.x += s.vx;
    s.y += s.vy;
    s.vy += 0.2;
    s.rot += 0.05;
    s.life -= 0.02;
  }

  // Particles
  if (particles) { particles.update(); particles.draw(ctx); }

  // Floating texts
  floatingTexts = floatingTexts.filter(ft => ft.update());
  for (const ft of floatingTexts) ft.draw(ctx);

  // Draw swipe trail
  if (isSlice && swipePoints.length >= 2) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(swipePoints[0].x, swipePoints[0].y);
    for (let i = 1; i < swipePoints.length; i++) {
      ctx.lineTo(swipePoints[i].x, swipePoints[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }
}

// ─── Game Loop ───────────────────────────────────────
function gameLoop() {
  if (!gameActive || gameOver) return;

  // Spawn fruits
  spawnTimer++;
  const spawnRate = Math.max(15, 50 - difficulty * 3);
  if (spawnTimer % spawnRate === 0) {
    fruits.push(createFruit());
    // Sometimes spawn multiple
    if (difficulty > 3 && Math.random() < 0.3) {
      fruits.push(createFruit());
    }
  }

  // Update fruits
  for (let i = fruits.length - 1; i >= 0; i--) {
    const f = fruits[i];
    f.x += f.vx;
    f.y += f.vy;
    f.vy += GRAVITY;
    f.rotation += f.rotSpeed;

    // Bounce off walls
    if (f.x < f.size || f.x > CANVAS_W - f.size) {
      f.vx *= -0.8;
      f.x = Math.max(f.size, Math.min(CANVAS_W - f.size, f.x));
    }

    // Remove if off screen bottom
    if (f.y > CANVAS_H + 50 && !f.sliced) {
      f.missed = true;
      fruits.splice(i, 1);
      combo = 0;
      updateComboDisplay();
    }
    if (f.sliced) {
      fruits.splice(i, 1);
    }
  }

  render();
  requestAnimationFrame(gameLoop);
}

// ─── Swipe Controls ─────────────────────────────────
let swipePoints = [];
let swipeStart = null;

function initControls() {
  // Mouse
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    isSlice = true;
    swipePoints = [{ x, y }];
    swipeStart = { x, y };
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isSlice) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    swipePoints.push({ x, y });
    if (swipePoints.length > 10) swipePoints.shift();

    // Check slice
    if (swipePoints.length >= 2) {
      const p1 = swipePoints[swipePoints.length - 2];
      const p2 = swipePoints[swipePoints.length - 1];
      checkSlice(p1.x, p1.y, p2.x, p2.y);
    }
  });

  canvas.addEventListener('mouseup', () => {
    isSlice = false;
    swipePoints = [];
  });

  canvas.addEventListener('mouseleave', () => {
    isSlice = false;
    swipePoints = [];
  });

  // Touch
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const x = (t.clientX - rect.left) * scaleX;
    const y = (t.clientY - rect.top) * scaleY;
    isSlice = true;
    swipePoints = [{ x, y }];
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isSlice) return;
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const x = (t.clientX - rect.left) * scaleX;
    const y = (t.clientY - rect.top) * scaleY;
    swipePoints.push({ x, y });
    if (swipePoints.length > 10) swipePoints.shift();
    if (swipePoints.length >= 2) {
      const p1 = swipePoints[swipePoints.length - 2];
      const p2 = swipePoints[swipePoints.length - 1];
      checkSlice(p1.x, p1.y, p2.x, p2.y);
    }
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    isSlice = false;
    swipePoints = [];
  }, { passive: false });
}

// ─── UI Updates ──────────────────────────────────────
function updateScoreDisplay() {
  const el = document.getElementById('score-value');
  if (el) el.textContent = score;
}

function updateLivesDisplay() {
  const el = document.getElementById('lives-display');
  if (el) el.textContent = '❤️'.repeat(Math.max(0, lives));
}

function showComboDisplay(comboVal) {
  const el = document.getElementById('combo-display');
  if (!el) return;
  const texts = ['', '', '🔥 x2!', '🔥 x3!', '🔥 x4!', '✨ x5!', '✨ x6!', '✨ x7!', '✨ x8!', '✨ x9!', '💥 COMBO x10!'];
  el.textContent = comboVal < texts.length ? texts[comboVal] : comboVal >= 20 ? '🌀 ULTRA COMBO!' : comboVal >= 10 ? `💥 COMBO x${comboVal}!` : `🔥 x${comboVal}`;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
}

function updateComboDisplay() {
  const el = document.getElementById('combo-display');
  if (el && combo < 2) { el.classList.remove('show'); el.textContent = ''; }
}

// ─── Start / End ─────────────────────────────────────
function startGame() {
  fruits = [];
  slices = [];
  floatingTexts = [];
  score = 0;
  lives = 3;
  combo = 0;
  maxComboThisGame = 0;
  fruitsSlicedThisGame = 0;
  difficulty = 1;
  spawnTimer = 0;
  gameOver = false;
  gameActive = true;
  particles = new ParticleSystem();
  document.getElementById('game-over-overlay')?.classList.remove('visible');
  updateScoreDisplay();
  updateLivesDisplay();
  updateComboDisplay();
}

function endGame() {
  gameActive = false;
  gameOver = true;
  const overlay = document.getElementById('game-over-overlay');
  if (overlay) {
    overlay.classList.add('visible');
    document.getElementById('final-score').textContent = score;
    document.getElementById('go-fruits').textContent = fruitsSlicedThisGame;
    document.getElementById('go-combo').textContent = maxComboThisGame;
  }

  if (window.ProgressionSystem) {
    ProgressionSystem.endOfGame({
      score,
      fruitsSliced: fruitsSlicedThisGame,
      bestCombo: maxComboThisGame,
    });
    const unlocked = ProgressionSystem.checkAchievements();
    if (unlocked.length > 0) setTimeout(() => showAchievementPopup(unlocked), 1000);
    setTimeout(() => checkDailyBonus(), 1500);
  }

  // ─── Framework Game-Over Hooks ─────────────────
  if (window.RetentionSystem) RetentionSystem.onGameEnd(score);
  if (window.ChallengesSystem) {
    ChallengesSystem.reportProgress('score', score);
    ChallengesSystem.reportProgress('games', 1);
  }
  if (window.CollectiblesSystem) {
    CollectiblesSystem.incrementTracker('totalGames', 1);
    CollectiblesSystem.setTracker('highestScore', score);
  }
  if (window.AdsManager) AdsManager.tryShowInterstitial();

  if (particles) setTimeout(() => particles.emitLevelUp(), 500);
}

// ─── Achievement / Daily / HUD ──────────────────────
function showAchievementPopup(a) {
  const e = document.querySelector('.achievement-popup'); if (e) e.remove();
  a.forEach((ach, i) => setTimeout(() => {
    const d = document.createElement('div'); d.className = 'achievement-popup show';
    d.innerHTML = `<div class="ach-icon">${ach.icon}</div><div class="ach-title">🏅 Achievement!</div><div>${ach.name}</div><div class="ach-desc">${ach.desc}</div><div class="ach-reward">+${ach.reward.coins} 🪙 ${ach.reward.gems ? `+${ach.reward.gems} 💎` : ''}</div>`;
    document.body.appendChild(d); setTimeout(() => d.remove(), 3000);
  }, i * 700));
}

function checkDailyBonus() {
  if (!window.ProgressionSystem) return; const r = ProgressionSystem.claimDailyBonus(); if (!r) return;
  const e = document.querySelector('.daily-bonus-popup'); if (e) e.remove();
  const d = document.createElement('div'); d.className = 'daily-bonus-popup show';
  d.innerHTML = `<h3>📅 Daily Bonus!</h3><div>${'🔥'.repeat(Math.min(r.streak, 7))}</div><div>🪙 +${r.coins} coins</div>${r.gems ? `<div>💎 +${r.gems} gems</div>` : ''}<div style="font-size:13px;color:#888;margin-top:6px;">Day ${r.streak} streak!</div><button class="game-btn btn-primary" style="margin-top:10px;display:inline-flex;" onclick="this.closest('.daily-bonus-popup').remove()">Awesome!</button>`;
  document.body.appendChild(d); setTimeout(() => d.remove(), 5000);
}

function updateHUD() {
  if (!window.ProgressionSystem) return;
  const s = ProgressionSystem.getState();
  const c = document.getElementById('hud-coins'); const g = document.getElementById('hud-gems'); const l = document.getElementById('hud-level');
  if (c) c.textContent = s.coins; if (g) g.textContent = s.gems; if (l) l.textContent = s.level;
}

function showAchievementsList() {
  if (!window.ProgressionSystem) return;
  const s = ProgressionSystem.getState(); const a = ProgressionSystem.getAchievements(); const u = Object.keys(s.achievements).length;
  const m = document.createElement('div'); m.className = 'modal-overlay';
  m.innerHTML = `<div class="modal-box" style="min-width:300px;"><h3 style="text-align:center;margin-bottom:8px;color:var(--accent-gold);">🏆 Achievements</h3><div style="text-align:center;margin-bottom:12px;font-size:14px;color:var(--text-secondary);">${u}/${a.length} unlocked</div><div style="max-height:400px;overflow-y:auto;">${a.map(ach => { const done = !!s.achievements[ach.id]; return `<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:${done ? 'rgba(76,209,55,0.05)' : 'transparent'};border-radius:8px;margin-bottom:4px;${done ? 'opacity:0.8;' : ''}"><span style="font-size:20px;">${done ? ach.icon : '🔒'}</span><div style="flex:1;"><div style="font-size:13px;font-weight:600;">${ach.name}</div><div style="font-size:11px;color:var(--text-secondary);">${ach.desc}</div></div>${done ? '✅' : `<span style="font-size:11px;color:var(--accent-gold);">🪙${ach.reward.coins}${ach.reward.gems ? ' 💎'+ach.reward.gems : ''}</span>`}</div>`; }).join('')}</div><button class="game-btn btn-reset" style="margin:10px auto 0;display:block;background:linear-gradient(135deg,#636e72,#2d3436);color:white;border:none;border-radius:12px;padding:8px 20px;cursor:pointer;" onclick="this.closest('.modal-overlay').remove()">Close</button></div>`;
  document.body.appendChild(m); m.addEventListener('click', (e) => { if (e.target === m) m.remove(); });
}

function showNotification(msg) {
  const el = document.getElementById('notification') || (() => { const n = document.createElement('div'); n.id = 'notification'; document.body.appendChild(n); return n; })();
  el.textContent = msg; el.className = 'show';
  clearTimeout(el._timeout); el._timeout = setTimeout(() => el.className = '', 2500);
}

// ─── Init ────────────────────────────────────────────
function init() {
  initCanvas();
  initControls();

  if (window.ProgressionSystem) {
    ProgressionSystem.load();
    updateHUD();
    setInterval(updateHUD, 3000);
  }

  // ─── Framework Module Init ──────────────────────
  if (window.AdsManager) AdsManager.init();
  if (window.ChallengesSystem) ChallengesSystem.init();
  if (window.StoreRotator) StoreRotator.init();
  if (window.RetentionSystem) RetentionSystem.init();
  if (window.CollectiblesSystem) CollectiblesSystem.init();
  if (window.TutorialSystem) {
    TutorialSystem.init();
    if (TutorialSystem.shouldShow()) TutorialSystem.start();
  }

  document.getElementById('start-btn')?.addEventListener('click', startGame);
  document.getElementById('button-shop')?.addEventListener('click', () => { if (window.ShopUI) ShopUI.open(); });
  document.getElementById('button-ach')?.addEventListener('click', showAchievementsList);

  // Draw welcome screen
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🍉 Fruit Slice', CANVAS_W / 2, CANVAS_H / 2 - 20);
  ctx.font = '16px sans-serif';
  ctx.fillText('Swipe to slice fruits!', CANVAS_W / 2, CANVAS_H / 2 + 20);
  ctx.fillText('Avoid 💣 bombs!', CANVAS_W / 2, CANVAS_H / 2 + 50);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
