// Elements
const game = document.getElementById('game');
const character = document.getElementById('character');
const pipe = document.getElementById('pipe');
const pipeTop = document.getElementById('pipeTop');
const pipeBottom = document.getElementById('pipeBottom');
const scoreEl = document.getElementById('score');
const overlay = document.getElementById('overlay');
const finalScoreEl = document.getElementById('finalScore');
const restartBtn = document.getElementById('restart');
const playAgainBtn = document.getElementById('playAgain');

// Sizes
const GAME_H = parseInt(getComputedStyle(game).height, 10);
const GAP_H  = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--gap'), 10);

// Safety margins for gap (keeps it on-screen)
let SAFE_TOP = 70;
let SAFE_BOT = 90;

// Gameplay state
let jumping = false;
let alive = true;
let score = 0;
let gravityTimer = null;

// AABB collision
function rectsOverlap(a, b){
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

// Size the two pipe pieces with a CLAMPED gap
function setPipeHeights(){
  const maxTop = GAME_H - GAP_H - SAFE_BOT; // highest allowed gapTop
  const minTop = SAFE_TOP;                   // lowest allowed gapTop

  // If settings are too tight, relax them so we always have a valid range
  if (maxTop <= minTop) {
    // Auto-fix: shrink margins until a valid range exists
    const room = Math.max(0, GAME_H - GAP_H - 20); // leave a tiny buffer
    SAFE_TOP = Math.min(SAFE_TOP, Math.floor(room / 2));
    SAFE_BOT = Math.min(SAFE_BOT, Math.ceil(room / 2));
  }

  const maxT = GAME_H - GAP_H - SAFE_BOT;
  const minT = SAFE_TOP;
  const range = Math.max(1, maxT - minT); // ensure positive
  const gapTop = Math.floor(Math.random() * (range + 1)) + minT;

  const topHeight = gapTop;
  const bottomHeight = GAME_H - (gapTop + GAP_H);

  pipeTop.style.height = `${topHeight}px`;
  pipeBottom.style.height = `${bottomHeight}px`;
}

// On each loop: new safe gap + score + (optional) speed ramp
pipe.addEventListener('animationiteration', () => {
  setPipeHeights();
  if (alive){
    score++;
    scoreEl.textContent = String(score);
    // speed ramp with floor
    const base = 2000, min = 1400;
    const next = Math.max(min, base - score * 25);
    pipe.style.animationDuration = `${next}ms`;
  }
});

// Gravity & collisions
function startGravity(){
  stopGravity();
  gravityTimer = setInterval(() => {
    let top = parseInt(getComputedStyle(character).top, 10);

    if (!jumping) {
      top += 3;
      character.style.top = `${top}px`;
    }

    // ground clamp
    const hardBottom = GAME_H - 26; // 26px bird
    if (top >= hardBottom - SAFE_BOT) return gameOver();

    // collision via DOM rects
    const birdR = character.getBoundingClientRect();
    const topR  = pipeTop.getBoundingClientRect();
    const botR  = pipeBottom.getBoundingClientRect();

    if (rectsOverlap(birdR, topR) || rectsOverlap(birdR, botR)) {
      return gameOver();
    }
  }, 10);
}
function stopGravity(){ if (gravityTimer){ clearInterval(gravityTimer); gravityTimer = null; } }

// Jump
function jump(){
  if (!alive || jumping) return;
  jumping = true;
  let ticks = 0;
  const j = setInterval(() => {
    let top = parseInt(getComputedStyle(character).top, 10);
    if (top > 10 && ticks < 16) character.style.top = (top - 6) + 'px';
    if (ticks > 20){ clearInterval(j); jumping = false; }
    ticks++;
  }, 10);
}

// State
function gameOver(){
  if (!alive) return;
  alive = false;
  stopGravity();
  finalScoreEl.textContent = String(score);
  overlay.hidden = false;
}
function resetGame(){
  alive = true;
  score = 0;
  scoreEl.textContent = '0';
  character.style.top = '160px';

  // IMPORTANT: set heights BEFORE starting the animation so the tube is visible immediately
  setPipeHeights();

  // restart animation cleanly (helps Safari/WebKit)
  pipe.style.animation = 'none';
  void pipe.offsetWidth; // reflow
  pipe.style.animation = `slide var(--speed) linear infinite`;
  pipe.style.animationDuration = getComputedStyle(document.documentElement).getPropertyValue('--speed').trim();

  overlay.hidden = true;
  startGravity();
  game.focus();
}

// Controls
game.addEventListener('click', jump);
game.addEventListener('touchstart', (e)=>{ e.preventDefault(); jump(); }, {passive:false});
window.addEventListener('keydown', (e)=>{
  if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); jump(); }
  if ((e.code === 'KeyR' || e.key === 'r') && !alive) resetGame();
});
restartBtn.addEventListener('click', resetGame);
playAgainBtn.addEventListener('click', resetGame);

// Go
resetGame();
