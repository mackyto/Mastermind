/* ── Constants ──────────────────────────────────────────────────── */
const COLORS = [
  { name: 'Rojo',     hex: '#e84a4a' },
  { name: 'Azul',     hex: '#4a7ae8' },
  { name: 'Verde',    hex: '#4ae87a' },
  { name: 'Amarillo', hex: '#e8c44a' },
  { name: 'Naranja',  hex: '#e87a4a' },
  { name: 'Violeta',  hex: '#a04ae8' },
  { name: 'Cian',     hex: '#4ae8d4' },
  { name: 'Rosa',     hex: '#e84aaa' },
];

const POSITIONS    = 6;
const MAX_ATTEMPTS = 8;

/* ── State ──────────────────────────────────────────────────────── */
let secret        = [];
let currentRow    = 0;
let currentGuess  = [];
let selectedColor = null;
let gameOver      = false;
let wins          = 0;

/* ── Init ───────────────────────────────────────────────────────── */
function init() {
  secret        = Array.from({ length: POSITIONS }, () => Math.floor(Math.random() * COLORS.length));
  currentRow    = 0;
  currentGuess  = Array(POSITIONS).fill(null);
  selectedColor = null;
  gameOver      = false;

  buildBoard();
  buildColorGrid();
  buildAttemptTrack();
  updateConfirmBtn();
  setStatus('selecciona un color y colócalo');
  document.getElementById('modalBg').classList.remove('show');
}

/* ── DOM builders ───────────────────────────────────────────────── */
function buildAttemptTrack() {
  const t = document.getElementById('attemptTrack');
  t.innerHTML = '';
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const d = document.createElement('div');
    d.className = 'attempt-dot';
    d.id = 'adot-' + i;
    t.appendChild(d);
  }
}

function buildBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '';

  for (let r = 0; r < MAX_ATTEMPTS; r++) {
    const row = document.createElement('div');
    row.className = 'row' + (r === 0 ? ' active' : '');
    row.id = 'row-' + r;

    const num = document.createElement('div');
    num.className = 'row-num';
    num.textContent = r + 1;
    row.appendChild(num);

    const pegs = document.createElement('div');
    pegs.className = 'pegs';
    for (let p = 0; p < POSITIONS; p++) {
      const peg = document.createElement('div');
      peg.className = 'peg';
      peg.id = 'peg-' + r + '-' + p;
      peg.addEventListener('click', (function(pos) {
        return function() { placePeg(pos); };
      })(p));
      pegs.appendChild(peg);
    }
    row.appendChild(pegs);

    const fb = document.createElement('div');
    fb.className = 'feedback';
    fb.id = 'fb-' + r;
    for (let f = 0; f < POSITIONS; f++) {
      const fp = document.createElement('div');
      fp.className = 'fb-peg';
      fb.appendChild(fp);
    }
    row.appendChild(fb);

    board.appendChild(row);
  }
}

function buildColorGrid() {
  const grid = document.getElementById('colorGrid');
  grid.innerHTML = '';
  for (let i = 0; i < COLORS.length; i++) {
    const btn = document.createElement('div');
    btn.className = 'color-btn';
    btn.style.background = COLORS[i].hex;
    btn.title = COLORS[i].name;
    btn.id = 'cbtn-' + i;
    btn.addEventListener('click', (function(idx) {
      return function() { selectColor(idx); };
    })(i));
    grid.appendChild(btn);
  }
}

/* ── Gameplay ───────────────────────────────────────────────────── */
function selectColor(idx) {
  if (gameOver) return;
  if (selectedColor !== null) {
    var prev = document.getElementById('cbtn-' + selectedColor);
    if (prev) prev.classList.remove('active-color');
  }
  selectedColor = idx;
  var cur = document.getElementById('cbtn-' + idx);
  if (cur) cur.classList.add('active-color');
  setStatus(COLORS[idx].name.toUpperCase() + ' seleccionado — haz clic en una posición');
}

function placePeg(pos) {
  if (gameOver || selectedColor === null) return;
  currentGuess[pos] = selectedColor;
  var peg = document.getElementById('peg-' + currentRow + '-' + pos);
  peg.style.background = COLORS[selectedColor].hex;
  peg.classList.add('filled');
  updateConfirmBtn();
}

function updateConfirmBtn() {
  var filled = 0;
  for (var i = 0; i < currentGuess.length; i++) {
    if (currentGuess[i] !== null) filled++;
  }
  document.getElementById('btnConfirm').disabled = (filled < POSITIONS || gameOver);
}

function setStatus(msg, cls) {
  var el = document.getElementById('statusBar');
  el.textContent = msg;
  el.className = 'status-bar' + (cls ? ' ' + cls : '');
}

function confirmGuess() {
  if (gameOver) return;
  for (var i = 0; i < currentGuess.length; i++) {
    if (currentGuess[i] === null) return;
  }

  var result = evaluate(currentGuess, secret);
  renderFeedback(currentRow, result);

  var dot = document.getElementById('adot-' + currentRow);
  if (dot) dot.classList.add('used');
  document.getElementById('row-' + currentRow).classList.remove('active');

  if (result.black === POSITIONS) {
    gameOver = true;
    wins++;
    document.getElementById('winCount').textContent = wins;
    setStatus('¡código descifrado en ' + (currentRow + 1) + ' intento' + (currentRow > 0 ? 's' : '') + '!', 'win');
    setTimeout(function() { showModal(true, currentRow + 1); }, 600);
    return;
  }

  currentRow++;
  if (currentRow >= MAX_ATTEMPTS) {
    gameOver = true;
    var lastDot = document.getElementById('adot-' + (currentRow - 1));
    if (lastDot) { lastDot.classList.remove('used'); lastDot.classList.add('fail'); }
    setStatus('sin más intentos — el código era:', 'lose');
    setTimeout(function() { showModal(false, 0); }, 600);
    return;
  }

  document.getElementById('row-' + currentRow).classList.add('active');
  currentGuess = Array(POSITIONS).fill(null);
  updateConfirmBtn();
  setStatus('intento ' + (currentRow + 1) + ' de ' + MAX_ATTEMPTS);
}

/* ── Logic ──────────────────────────────────────────────────────── */
function evaluate(guess, sec) {
  var black = 0, white = 0;
  var gU = Array(POSITIONS).fill(false);
  var sU = Array(POSITIONS).fill(false);

  for (var i = 0; i < POSITIONS; i++) {
    if (guess[i] === sec[i]) { black++; gU[i] = true; sU[i] = true; }
  }
  for (var i = 0; i < POSITIONS; i++) {
    if (gU[i]) continue;
    for (var j = 0; j < POSITIONS; j++) {
      if (!sU[j] && guess[i] === sec[j]) { white++; sU[j] = true; break; }
    }
  }
  return { black: black, white: white };
}

function renderFeedback(row, result) {
  var dots = document.getElementById('fb-' + row).querySelectorAll('.fb-peg');
  var idx = 0;
  for (var i = 0; i < result.black; i++, idx++) dots[idx].classList.add('black');
  for (var i = 0; i < result.white; i++, idx++) dots[idx].classList.add('white');
}

function clearRow() {
  if (gameOver) return;
  currentGuess = Array(POSITIONS).fill(null);
  for (var p = 0; p < POSITIONS; p++) {
    var peg = document.getElementById('peg-' + currentRow + '-' + p);
    peg.style.background = '';
    peg.classList.remove('filled');
  }
  updateConfirmBtn();
  setStatus('fila limpiada — selecciona colores');
}

/* ── Modal ──────────────────────────────────────────────────────── */
function showModal(win, attempts) {
  document.getElementById('modalTitle').textContent = win ? '¡VICTORIA!' : 'DERROTA';
  document.getElementById('modalTitle').className   = 'modal-title ' + (win ? 'win-title' : 'lose-title');
  document.getElementById('modalMsg').textContent   = win
    ? 'Descifrado en ' + attempts + ' intento' + (attempts > 1 ? 's' : '') + '. ¡Excelente deducción!'
    : 'Sin más intentos. El código secreto era:';

  var rev = document.getElementById('secretReveal');
  rev.innerHTML = '';
  for (var i = 0; i < secret.length; i++) {
    var p = document.createElement('div');
    p.className = 'peg filled';
    p.style.background = COLORS[secret[i]].hex;
    p.style.cursor = 'default';
    rev.appendChild(p);
  }

  document.getElementById('modalBg').classList.add('show');
}

function newGame() { init(); }

/* ── Event listeners ────────────────────────────────────────────── */
document.getElementById('btnConfirm').addEventListener('click', confirmGuess);
document.getElementById('btnClear').addEventListener('click',   clearRow);
document.getElementById('btnNew').addEventListener('click',     newGame);

document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter')                           confirmGuess();
  if (e.key === 'Delete' || e.key === 'Backspace') clearRow();
  if (e.key >= '1' && e.key <= '8')               selectColor(parseInt(e.key) - 1);
});

/* ── Start ──────────────────────────────────────────────────────── */
init();

/* ── Background music ───────────────────────────────────────────── */
(function () {
  var audio = document.getElementById('bgMusic');
  var btn   = document.getElementById('musicBtn');

  // Autoplay as soon as the user interacts with the page
  function startMusic() {
    audio.volume = 0.5;
    audio.play().catch(function () {});
    document.removeEventListener('click', startMusic);
    document.removeEventListener('keydown', startMusic);
  }

  // Try immediate autoplay; browsers may block it until interaction
  audio.volume = 0.5;
  audio.play().catch(function () {
    document.addEventListener('click',   startMusic);
    document.addEventListener('keydown', startMusic);
  });

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (audio.paused) {
      audio.play();
      btn.classList.remove('muted');
      btn.textContent = '♪';
    } else {
      audio.pause();
      btn.classList.add('muted');
      btn.textContent = '♩';
    }
  });
})();
