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
    d.id = `adot-${i}`;
    t.appendChild(d);
  }
}

function buildBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '';

  for (let r = 0; r < MAX_ATTEMPTS; r++) {
    const row = document.createElement('div');
    row.className = 'row' + (r === 0 ? ' active' : '');
    row.id = `row-${r}`;

    /* row number */
    const num = document.createElement('div');
    num.className = 'row-num';
    num.textContent = r + 1;
    row.appendChild(num);

    /* guess pegs */
    const pegs = document.createElement('div');
    pegs.className = 'pegs';
    for (let p = 0; p < POSITIONS; p++) {
      const peg = document.createElement('div');
      peg.className = 'peg';
      peg.id = `peg-${r}-${p}`;
      peg.addEventListener('click', () => placePeg(p));
      pegs.appendChild(peg);
    }
    row.appendChild(pegs);

    /* feedback dots */
    const fb = document.createElement('div');
    fb.className = 'feedback';
    fb.id = `fb-${r}`;
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
  COLORS.forEach((c, i) => {
    const btn = document.createElement('div');
    btn.className = 'color-btn';
    btn.style.background = c.hex;
    btn.title = c.name;
    btn.id = `cbtn-${i}`;
    btn.addEventListener('click', () => selectColor(i));
    grid.appendChild(btn);
  });
}

/* ── Gameplay ───────────────────────────────────────────────────── */
function selectColor(idx) {
  if (gameOver) return;
  if (selectedColor !== null)
    document.getElementById(`cbtn-${selectedColor}`)?.classList.remove('active-color');
  selectedColor = idx;
  document.getElementById(`cbtn-${idx}`)?.classList.add('active-color');
  setStatus(`${COLORS[idx].name.toUpperCase()} seleccionado — haz clic en una posición`);
}

function placePeg(pos) {
  if (gameOver || selectedColor === null) return;
  currentGuess[pos] = selectedColor;
  const peg = document.getElementById(`peg-${currentRow}-${pos}`);
  peg.style.background = COLORS[selectedColor].hex;
  peg.classList.add('filled');
  updateConfirmBtn();
}

function updateConfirmBtn() {
  document.getElementById('btnConfirm').disabled =
    (currentGuess.filter(v => v !== null).length < POSITIONS || gameOver);
}

function setStatus(msg, cls = '') {
  const el = document.getElementById('statusBar');
  el.textContent = msg;
  el.className = 'status-bar ' + cls;
}

function confirmGuess() {
  if (gameOver || currentGuess.some(v => v === null)) return;

  const result = evaluate(currentGuess, secret);
  renderFeedback(currentRow, result);
  document.getElementById(`adot-${currentRow}`)?.classList.add('used');
  document.getElementById(`row-${currentRow}`).classList.remove('active');

  if (result.black === POSITIONS) {
    gameOver = true;
    setStatus(`¡código descifrado en ${currentRow + 1} intento${currentRow ? 's' : ''}!`, 'win');
    setTimeout(() => showModal(true, currentRow + 1), 600);
    return;
  }

  currentRow++;
  if (currentRow >= MAX_ATTEMPTS) {
    gameOver = true;
    const ld = document.getElementById(`adot-${currentRow - 1}`);
    if (ld) { ld.classList.remove('used'); ld.classList.add('fail'); }
    setStatus('sin más intentos — el código era:', 'lose');
    setTimeout(() => showModal(false, 0), 600);
    return;
  }

  document.getElementById(`row-${currentRow}`).classList.add('active');
  currentGuess = Array(POSITIONS).fill(null);
  updateConfirmBtn();
  setStatus(`intento ${currentRow + 1} de ${MAX_ATTEMPTS}`);
}

/* ── Logic ──────────────────────────────────────────────────────── */
function evaluate(guess, secret) {
  let black = 0, white = 0;
  const gU = Array(POSITIONS).fill(false);
  const sU = Array(POSITIONS).fill(false);

  /* exact matches */
  for (let i = 0; i < POSITIONS; i++) {
    if (guess[i] === secret[i]) { black++; gU[i] = sU[i] = true; }
  }
  /* color matches, wrong position */
  for (let i = 0; i < POSITIONS; i++) {
    if (gU[i]) continue;
    for (let j = 0; j < POSITIONS; j++) {
      if (!sU[j] && guess[i] === secret[j]) { white++; sU[j] = true; break; }
    }
  }
  return { black, white };
}

function renderFeedback(row, { black, white }) {
  const dots = document.getElementById(`fb-${row}`).querySelectorAll('.fb-peg');
  let idx = 0;
  for (let i = 0; i < black; i++, idx++) dots[idx].classList.add('black');
  for (let i = 0; i < white; i++, idx++) dots[idx].classList.add('white');
}

function clearRow() {
  if (gameOver) return;
  currentGuess = Array(POSITIONS).fill(null);
  for (let p = 0; p < POSITIONS; p++) {
    const peg = document.getElementById(`peg-${currentRow}-${p}`);
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
    ? `Descifrado en ${attempts} intento${attempts > 1 ? 's' : ''}. ¡Excelente deducción!`
    : 'Sin más intentos. El código secreto era:';

  const rev = document.getElementById('secretReveal');
  rev.innerHTML = '';
  secret.forEach(ci => {
    const p = document.createElement('div');
    p.className = 'peg filled';
    p.style.background = COLORS[ci].hex;
    p.style.cursor = 'default';
    rev.appendChild(p);
  });

  document.getElementById('modalBg').classList.add('show');
}

function newGame() { init(); }

/* ── Event listeners ────────────────────────────────────────────── */
document.getElementById('btnConfirm').addEventListener('click', confirmGuess);
document.getElementById('btnClear').addEventListener('click',   clearRow);
document.getElementById('btnNew').addEventListener('click',     newGame);

document.addEventListener('keydown', e => {
  if (e.key === 'Enter')                          confirmGuess();
  if (e.key === 'Delete' || e.key === 'Backspace') clearRow();
  if (e.key >= '1' && e.key <= '8')               selectColor(parseInt(e.key) - 1);
});

/* ── Start ──────────────────────────────────────────────────────── */
init();
