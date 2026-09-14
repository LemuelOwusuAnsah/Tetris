(function () {
    const COLS = 10;
    const ROWS = 20;
    const BASE_BLOCK = 30;
    const PLAYED_KEY = 'tetris_has_played_v1';

    const COLORS = {
        I: '#00f0f0', O: '#f0f000', T: '#a000f0', S: '#00f000',
        Z: '#f00000', J: '#0000f0', L: '#f0a000'
    };

    const SHAPES = {
        I: [[1, 1, 1, 1]],
        O: [[1, 1], [1, 1]],
        T: [[0, 1, 0], [1, 1, 1]],
        S: [[0, 1, 1], [1, 1, 0]],
        Z: [[1, 1, 0], [0, 1, 1]],
        J: [[1, 0, 0], [1, 1, 1]],
        L: [[0, 0, 1], [1, 1, 1]]
    };

    const SCORE_TABLE = { 1: 100, 2: 300, 3: 500, 4: 800 };
    const LINES_PER_LEVEL = 10;

    const boardCanvas = document.getElementById('boardCanvas');
    const boardCtx = boardCanvas.getContext('2d');
    const nextCanvas = document.getElementById('nextCanvas');
    const nextCtx = nextCanvas.getContext('2d');

    const scoreDisplay = document.getElementById('scoreDisplay');
    const linesDisplay = document.getElementById('linesDisplay');
    const levelDisplay = document.getElementById('levelDisplay');
    const highScoreDisplay = document.getElementById('highScoreDisplay');

    const boardOverlay = document.getElementById('boardOverlay');
    const overlayTitle = document.getElementById('overlayTitle');
    const overlayText = document.getElementById('overlayText');
    const overlayBtn = document.getElementById('overlayBtn');
    const overlayRestartBtn = document.getElementById('overlayRestartBtn');
    const overlayQuitBtn = document.getElementById('overlayQuitBtn');
    const pauseBtn = document.getElementById('pauseBtn');

    const headerAvatar = document.getElementById('headerAvatar');
    const headerName = document.getElementById('headerName');

    let blockSize = BASE_BLOCK;
    let board = createEmptyBoard();
    let currentPiece = null;
    let nextPiece = null;
    let score = 0;
    let lines = 0;
    let level = 1;
    let dropCounter = 0;
    let dropInterval = 800;
    let lastTime = 0;
    let running = false;
    let paused = false;
    let gameOver = false;
    let animationId = null;

    function hasPlayedBefore() {
        try {
            return localStorage.getItem(PLAYED_KEY) === '1';
        } catch (e) {
            return false;
        }
    }

    function markPlayed() {
        try {
            localStorage.setItem(PLAYED_KEY, '1');
        } catch (e) {}
    }

    function createEmptyBoard() {
        const b = [];
        for (let r = 0; r < ROWS; r++) b.push(new Array(COLS).fill(null));
        return b;
    }

    function randomPiece() {
        const keys = Object.keys(SHAPES);
        const type = keys[Math.floor(Math.random() * keys.length)];
        const shape = SHAPES[type].map(function (row) { return row.slice(); });
        return {
            type: type,
            shape: shape,
            x: Math.floor((COLS - shape[0].length) / 2),
            y: 0
        };
    }

    function rotate(shape) {
        const rows = shape.length;
        const cols = shape[0].length;
        const result = [];
        for (let c = 0; c < cols; c++) {
            const newRow = [];
            for (let r = rows - 1; r >= 0; r--) newRow.push(shape[r][c]);
            result.push(newRow);
        }
        return result;
    }

    function collides(piece, offsetX, offsetY, shape) {
        const s = shape || piece.shape;
        for (let r = 0; r < s.length; r++) {
            for (let c = 0; c < s[r].length; c++) {
                if (!s[r][c]) continue;
                const x = piece.x + c + (offsetX || 0);
                const y = piece.y + r + (offsetY || 0);
                if (x < 0 || x >= COLS || y >= ROWS) return true;
                if (y >= 0 && board[y][x]) return true;
            }
        }
        return false;
    }

    function mergePiece() {
        currentPiece.shape.forEach(function (row, r) {
            row.forEach(function (val, c) {
                if (val) {
                    const y = currentPiece.y + r;
                    const x = currentPiece.x + c;
                    if (y >= 0 && y < ROWS && x >= 0 && x < COLS) board[y][x] = currentPiece.type;
                }
            });
        });
    }

    function clearLines() {
        let cleared = 0;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (board[r].every(function (cell) { return cell; })) {
                board.splice(r, 1);
                board.unshift(new Array(COLS).fill(null));
                cleared++;
                r++;
            }
        }
        if (cleared > 0) {
            score += SCORE_TABLE[cleared] * level;
            lines += cleared;
            const newLevel = Math.floor(lines / LINES_PER_LEVEL) + 1;
            if (newLevel > level) {
                level = newLevel;
                dropInterval = Math.max(80, 800 - (level - 1) * 70);
                if (window.TetrisSound) window.TetrisSound.play('levelUp');
            }
            if (window.TetrisSound) window.TetrisSound.play('clear');
            updateHud();
        }
    }

    function spawnPiece() {
        currentPiece = nextPiece || randomPiece();
        nextPiece = randomPiece();
        currentPiece.x = Math.floor((COLS - currentPiece.shape[0].length) / 2);
        currentPiece.y = 0;
        drawNext();
        if (collides(currentPiece, 0, 0)) endGame();
    }

    function move(dx) {
        if (!running || paused || gameOver) return;
        if (!collides(currentPiece, dx, 0)) {
            currentPiece.x += dx;
            draw();
            if (window.TetrisSound) window.TetrisSound.play('move');
        }
    }

    function rotatePiece() {
        if (!running || paused || gameOver) return;
        const rotated = rotate(currentPiece.shape);
        if (!collides(currentPiece, 0, 0, rotated)) {
            currentPiece.shape = rotated;
            draw();
            if (window.TetrisSound) window.TetrisSound.play('rotate');
        } else if (!collides(currentPiece, -1, 0, rotated)) {
            currentPiece.x -= 1;
            currentPiece.shape = rotated;
            draw();
            if (window.TetrisSound) window.TetrisSound.play('rotate');
        } else if (!collides(currentPiece, 1, 0, rotated)) {
            currentPiece.x += 1;
            currentPiece.shape = rotated;
            draw();
            if (window.TetrisSound) window.TetrisSound.play('rotate');
        }
    }

    function softDrop() {
        if (!running || paused || gameOver) return;
        if (!collides(currentPiece, 0, 1)) {
            currentPiece.y += 1;
            score += 1;
            updateHud();
            draw();
        } else {
            lockPiece();
        }
        dropCounter = 0;
    }

    function hardDrop() {
        if (!running || paused || gameOver) return;
        while (!collides(currentPiece, 0, 1)) {
            currentPiece.y += 1;
            score += 2;
        }
        if (window.TetrisSound) window.TetrisSound.play('hardDrop');
        updateHud();
        lockPiece();
        dropCounter = 0;
    }

    function lockPiece() {
        mergePiece();
        if (window.TetrisSound) window.TetrisSound.play('lock');
        clearLines();
        spawnPiece();
        draw();
    }

    function drawBlock(ctx, x, y, color, size) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(x, y, size, size * 0.15);
        ctx.fillRect(x, y, size * 0.15, size);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(x, y + size * 0.85, size, size * 0.15);
        ctx.fillRect(x + size * 0.85, y, size * 0.15, size);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
    }

    function drawGrid() {
        boardCtx.fillStyle = '#dbeafe';
        boardCtx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);

        boardCtx.strokeStyle = 'rgba(14, 165, 233, 0.18)';
        boardCtx.lineWidth = 1;
        for (let x = 0; x <= COLS; x++) {
            boardCtx.beginPath();
            boardCtx.moveTo(x * blockSize + 0.5, 0);
            boardCtx.lineTo(x * blockSize + 0.5, ROWS * blockSize);
            boardCtx.stroke();
        }
        for (let y = 0; y <= ROWS; y++) {
            boardCtx.beginPath();
            boardCtx.moveTo(0, y * blockSize + 0.5);
            boardCtx.lineTo(COLS * blockSize, y * blockSize + 0.5);
            boardCtx.stroke();
        }
    }

    function draw() {
        drawGrid();

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c]) {
                    drawBlock(boardCtx, c * blockSize, r * blockSize, COLORS[board[r][c]], blockSize);
                }
            }
        }

        if (currentPiece) {
            const ghostY = getGhostY();
            currentPiece.shape.forEach(function (row, r) {
                row.forEach(function (val, c) {
                    if (val) {
                        const gx = (currentPiece.x + c) * blockSize;
                        const gy = (ghostY + r) * blockSize;
                        boardCtx.fillStyle = 'rgba(14, 165, 233, 0.18)';
                        boardCtx.fillRect(gx, gy, blockSize, blockSize);
                        boardCtx.strokeStyle = 'rgba(14, 165, 233, 0.5)';
                        boardCtx.lineWidth = 2;
                        boardCtx.strokeRect(gx + 1, gy + 1, blockSize - 2, blockSize - 2);
                    }
                });
            });

            currentPiece.shape.forEach(function (row, r) {
                row.forEach(function (val, c) {
                    if (val) {
                        const x = (currentPiece.x + c) * blockSize;
                        const y = (currentPiece.y + r) * blockSize;
                        if (y >= 0) drawBlock(boardCtx, x, y, COLORS[currentPiece.type], blockSize);
                    }
                });
            });
        }
    }

    function getGhostY() {
        let gy = currentPiece.y;
        while (!collides(currentPiece, 0, gy - currentPiece.y + 1)) gy++;
        return gy;
    }

    function drawNext() {
        nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
        if (!nextPiece) return;
        const size = 24;
        const shape = nextPiece.shape;
        const w = shape[0].length * size;
        const h = shape.length * size;
        const offsetX = (nextCanvas.width - w) / 2;
        const offsetY = (nextCanvas.height - h) / 2;

        shape.forEach(function (row, r) {
            row.forEach(function (val, c) {
                if (val) drawBlock(nextCtx, offsetX + c * size, offsetY + r * size, COLORS[nextPiece.type], size);
            });
        });
    }

    function resizeBoard() {
        const wrap = document.querySelector('.board-wrap');
        if (!wrap) return;

        const vh = window.innerHeight;
        const header = document.querySelector('.game-header');
        const footer = document.querySelector('.game-footer');
        const headerH = header ? header.offsetHeight : 60;
        const footerH = footer ? footer.offsetHeight : 40;

        const availableH = vh - headerH - footerH - 60;
        const availableW = wrap.clientWidth - 24;

        const maxByHeight = Math.floor(availableH / ROWS);
        const maxByWidth = Math.floor(availableW / COLS);

        blockSize = Math.max(14, Math.min(BASE_BLOCK, maxByHeight, maxByWidth));

        const newW = COLS * blockSize;
        const newH = ROWS * blockSize;

        boardCanvas.width = newW;
        boardCanvas.height = newH;
        boardCanvas.style.width = newW + 'px';
        boardCanvas.style.height = newH + 'px';

        draw();
    }

    function updateHud() {
        if (scoreDisplay) scoreDisplay.textContent = score;
        if (linesDisplay) linesDisplay.textContent = lines;
        if (levelDisplay) levelDisplay.textContent = level;
        if (highScoreDisplay) {
            const top = window.TetrisLeaderboard ? window.TetrisLeaderboard.getTopScore() : 0;
            highScoreDisplay.textContent = top;
        }
    }

    function updateHeaderProfile() {
        if (!window.TetrisLeaderboard) return;
        const profile = window.TetrisLeaderboard.getProfile();
        if (headerAvatar) headerAvatar.textContent = profile.avatar || '🦊';
        if (headerName) headerName.textContent = profile.name || 'Anonymous';
    }

    function update(time) {
        if (!running || paused || gameOver) return;
        const delta = time - lastTime;
        lastTime = time;
        dropCounter += delta;
        if (dropCounter > dropInterval) {
            if (!collides(currentPiece, 0, 1)) {
                currentPiece.y += 1;
                draw();
            } else {
                lockPiece();
            }
            dropCounter = 0;
        }
        animationId = requestAnimationFrame(update);
    }

    function startGame() {
        if (animationId) cancelAnimationFrame(animationId);
        animationId = null;

        board = createEmptyBoard();
        score = 0;
        lines = 0;
        level = 1;
        dropInterval = 800;
        dropCounter = 0;
        lastTime = performance.now();
        paused = false;
        gameOver = false;
        currentPiece = null;
        nextPiece = randomPiece();

        markPlayed();
        document.body.classList.add('no-scroll');

        requestAnimationFrame(function () {
            resizeBoard();
            spawnPiece();
            updateHud();
            updateHeaderProfile();
            hideOverlay();
            updatePauseButton();
            draw();
            running = true;
            animationId = requestAnimationFrame(update);
            if (window.TetrisSound) window.TetrisSound.resumeMusic();
        });
    }

    function pauseGame() {
        if (!running || gameOver) return;
        paused = !paused;
        if (paused) {
            if (window.TetrisSound) window.TetrisSound.suspendMusic();
            showOverlay('Paused', 'Press P or the pause button to resume', 'Resume', true);
        } else {
            if (window.TetrisSound) window.TetrisSound.resumeMusic();
            hideOverlay();
            lastTime = performance.now();
            animationId = requestAnimationFrame(update);
        }
        updatePauseButton();
    }

    function updatePauseButton() {
        if (!pauseBtn) return;
        const pauseIcon = pauseBtn.querySelector('.icon-pause');
        const playIcon = pauseBtn.querySelector('.icon-play');
        if (!pauseIcon || !playIcon) return;
        if (paused) {
            pauseIcon.classList.add('hidden');
            playIcon.classList.remove('hidden');
        } else {
            pauseIcon.classList.remove('hidden');
            playIcon.classList.add('hidden');
        }
    }

    function endGame() {
        running = false;
        gameOver = true;
        if (animationId) cancelAnimationFrame(animationId);
        if (window.TetrisSound) {
            window.TetrisSound.suspendMusic();
            window.TetrisSound.play('gameOver');
        }

        let result = null;
        if (window.TetrisLeaderboard) {
            result = window.TetrisLeaderboard.addScore(score, lines, level);
            updateHud();
        }

        let text = 'Score: ' + score;
        if (result && result.isHighScore) text = '🏆 New high score: ' + score + '!';
        else if (result && result.isInTop) text = 'Rank #' + result.rank + ' · Score: ' + score;

        showOverlay('Game Over', text, 'Play Again', true);
        updatePauseButton();
    }

    function quitGame(mode) {
        if (!running) return;

        if (mode === 'keep') {
            paused = true;
            if (window.TetrisSound) window.TetrisSound.suspendMusic();
            updatePauseButton();
            return;
        }

        if (mode === 'save') {
            if (score > 0 && window.TetrisLeaderboard) {
                window.TetrisLeaderboard.addScore(score, lines, level);
                updateHud();
            }
        }

        running = false;
        paused = false;
        gameOver = false;
        if (animationId) cancelAnimationFrame(animationId);
        animationId = null;
        if (window.TetrisSound) window.TetrisSound.suspendMusic();
        updatePauseButton();
    }

    function restartGame() {
        running = false;
        paused = false;
        gameOver = false;
        if (animationId) cancelAnimationFrame(animationId);
        animationId = null;
        updatePauseButton();
        startGame();
    }

    function showOverlay(title, text, btnLabel, allowSecondary) {
        overlayTitle.textContent = title;
        overlayText.textContent = text;
        overlayBtn.textContent = btnLabel;

        const showSecondary = allowSecondary || hasPlayedBefore();
        if (overlayRestartBtn) {
            if (showSecondary) overlayRestartBtn.classList.remove('hidden');
            else overlayRestartBtn.classList.add('hidden');
        }
        if (overlayQuitBtn) {
            if (showSecondary) overlayQuitBtn.classList.remove('hidden');
            else overlayQuitBtn.classList.add('hidden');
        }

        boardOverlay.classList.remove('hidden');
    }

    function hideOverlay() {
        boardOverlay.classList.add('hidden');
    }

    function handleOverlayAction() {
        if (gameOver || !running) startGame();
        else if (paused) pauseGame();
        else startGame();
    }

    function init() {
        updateHud();
        updateHeaderProfile();
        drawNext();

        const onIntro = function () {
            document.body.classList.add('no-scroll');
            resizeBoard();

            const played = hasPlayedBefore();
            showOverlay(
                'Tetris',
                'Stack blocks. Clear lines. Beat your best.',
                'Start Game',
                played
            );

            if (overlayBtn) overlayBtn.addEventListener('click', handleOverlayAction);
        };

        if (window.TetrisIntro && window.TetrisIntro.isFinished()) onIntro();
        else document.addEventListener('introComplete', onIntro, { once: true });

        window.addEventListener('resize', function () {
            if (running) resizeBoard();
        });

        window.addEventListener('orientationchange', function () {
            setTimeout(function () { if (running) resizeBoard(); }, 200);
        });

        document.addEventListener('visibilitychange', function () {
            if (document.hidden && running && !paused && !gameOver) pauseGame();
        });
    }

    window.Tetris = {
        move: move,
        rotate: rotatePiece,
        softDrop: softDrop,
        hardDrop: hardDrop,
        pause: pauseGame,
        start: startGame,
        quit: quitGame,
        restart: restartGame,
        resize: resizeBoard,
        isRunning: function () { return running; },
        isPaused: function () { return paused; },
        isGameOver: function () { return gameOver; },
        hasPlayed: hasPlayedBefore,
        getStats: function () {
            return { score: score, lines: lines, level: level };
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();