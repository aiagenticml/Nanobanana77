// ===== Game State =====
const state = {
    board: Array(9).fill(''),
    currentPlayer: 'X',
    gameActive: true,
    mode: 'pvp', // 'pvp' or 'ai'
    scores: { X: 0, O: 0, draw: 0 }
};

const winCombos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6]              // diags
];

// ===== DOM Elements =====
const cells = document.querySelectorAll('.cell');
const messageEl = document.getElementById('game-message');
const messageText = document.getElementById('message-text');
const restartBtn = document.getElementById('restart-btn');
const resetScoresBtn = document.getElementById('reset-scores-btn');
const playerXIndicator = document.getElementById('player-x-indicator');
const playerOIndicator = document.getElementById('player-o-indicator');
const xScoreEl = document.getElementById('x-score');
const oScoreEl = document.getElementById('o-score');
const drawScoreEl = document.getElementById('draw-score');
const confettiContainer = document.getElementById('confetti-container');
const modeBtns = document.querySelectorAll('.mode-btn');

// ===== Initialize =====
function init() {
    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    restartBtn.addEventListener('click', restartGame);
    resetScoresBtn.addEventListener('click', resetScores);
    modeBtns.forEach(btn => btn.addEventListener('click', handleModeChange));
}

// ===== Cell Click =====
function handleCellClick(e) {
    const cell = e.currentTarget;
    const index = parseInt(cell.dataset.index);

    if (state.board[index] !== '' || !state.gameActive) return;

    makeMove(index);

    // AI move
    if (state.mode === 'ai' && state.gameActive && state.currentPlayer === 'O') {
        setTimeout(() => {
            const aiIndex = getBestMove();
            if (aiIndex !== -1) makeMove(aiIndex);
        }, 400);
    }
}

// ===== Make Move =====
function makeMove(index) {
    state.board[index] = state.currentPlayer;
    const cell = cells[index];
    cell.textContent = state.currentPlayer;
    cell.classList.add('taken', state.currentPlayer === 'X' ? 'x-mark' : 'o-mark');

    const winCombo = checkWin();
    if (winCombo) {
        endGame(false, winCombo);
    } else if (state.board.every(c => c !== '')) {
        endGame(true);
    } else {
        switchPlayer();
    }
}

// ===== Check Win =====
function checkWin() {
    for (const combo of winCombos) {
        const [a, b, c] = combo;
        if (state.board[a] && state.board[a] === state.board[b] && state.board[a] === state.board[c]) {
            return combo;
        }
    }
    return null;
}

// ===== End Game =====
function endGame(isDraw, winCombo = null) {
    state.gameActive = false;
    cells.forEach(c => c.classList.add('game-over'));

    if (isDraw) {
        state.scores.draw++;
        showMessage("It's a Draw! 🤝");
    } else {
        state.scores[state.currentPlayer]++;
        highlightWin(winCombo);
        showMessage(`Player ${state.currentPlayer} Wins! 🎉`);
        spawnConfetti();
    }

    updateScoreboard();
}

// ===== Highlight Winning Cells =====
function highlightWin(combo) {
    combo.forEach(i => cells[i].classList.add('win-cell'));
}

// ===== Switch Player =====
function switchPlayer() {
    state.currentPlayer = state.currentPlayer === 'X' ? 'O' : 'X';
    playerXIndicator.classList.toggle('active', state.currentPlayer === 'X');
    playerOIndicator.classList.toggle('active', state.currentPlayer === 'O');
}

// ===== Show Message =====
function showMessage(text) {
    messageText.textContent = text;
    messageEl.classList.remove('hidden');
}

// ===== Update Scoreboard =====
function updateScoreboard() {
    xScoreEl.textContent = state.scores.X;
    oScoreEl.textContent = state.scores.O;
    drawScoreEl.textContent = state.scores.draw;
}

// ===== Restart Game =====
function restartGame() {
    state.board.fill('');
    state.currentPlayer = 'X';
    state.gameActive = true;

    cells.forEach(cell => {
        cell.textContent = '';
        cell.className = 'cell';
    });

    messageEl.classList.add('hidden');
    confettiContainer.innerHTML = '';

    playerXIndicator.classList.add('active');
    playerOIndicator.classList.remove('active');
}

// ===== Reset Scores =====
function resetScores() {
    state.scores = { X: 0, O: 0, draw: 0 };
    updateScoreboard();
    restartGame();
}

// ===== Mode Change =====
function handleModeChange(e) {
    const mode = e.currentTarget.dataset.mode;
    if (mode === state.mode) return;

    state.mode = mode;
    modeBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
    resetScores();
}

// ===== AI (Minimax) =====
function getBestMove() {
    let bestScore = -Infinity;
    let bestMove = -1;

    for (let i = 0; i < 9; i++) {
        if (state.board[i] === '') {
            state.board[i] = 'O';
            const score = minimax(state.board, 0, false);
            state.board[i] = '';
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    return bestMove;
}

function minimax(board, depth, isMaximizing) {
    const winner = getWinner(board);
    if (winner === 'O') return 10 - depth;
    if (winner === 'X') return depth - 10;
    if (board.every(c => c !== '')) return 0;

    if (isMaximizing) {
        let best = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                best = Math.max(best, minimax(board, depth + 1, false));
                board[i] = '';
            }
        }
        return best;
    } else {
        let best = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                best = Math.min(best, minimax(board, depth + 1, true));
                board[i] = '';
            }
        }
        return best;
    }
}

function getWinner(board) {
    for (const [a, b, c] of winCombos) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

// ===== Confetti =====
function spawnConfetti() {
    const colors = ['#7c5cfc', '#00d4aa', '#ffd700', '#ff6b6b', '#b44cff', '#00f5d4'];
    confettiContainer.innerHTML = '';

    for (let i = 0; i < 24; i++) {
        const piece = document.createElement('div');
        piece.classList.add('confetti-piece');
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.left = Math.random() * 100 + '%';
        piece.style.top = Math.random() * 30 + '%';
        piece.style.animationDelay = Math.random() * 0.5 + 's';
        piece.style.width = (Math.random() * 6 + 4) + 'px';
        piece.style.height = (Math.random() * 6 + 4) + 'px';
        confettiContainer.appendChild(piece);
    }
}

// ===== Start =====
init();
