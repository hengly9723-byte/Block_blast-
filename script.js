// script-mobile.js - with touch support
(function() {
    // ... (keep all the existing constants and game logic) ...
    const BOARD_SIZE = 8;
    const QUEUE_SIZE = 3;
    
    const SHAPES = [
        [[1]],
        [[1,1]],
        [[1],[1]],
        [[1,1,1]],
        [[1],[1],[1]],
        [[1,0], [1,1]],
        [[0,1], [1,1]],
        [[1,1], [1,1]],
        [[0,1,0], [1,1,1]],
        [[0,1,1], [1,1,0]],
        [[1,1,0], [0,1,1]],
        [[1,0,1], [0,1,0]],
    ];

    let board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
    let queue = [];
    let currentScore = 0;

    const boardEl = document.getElementById('boardGrid');
    const queueContainer = document.getElementById('queueContainer');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const statusMsg = document.getElementById('statusMsg');

    function getRandomShape() {
        const idx = Math.floor(Math.random() * SHAPES.length);
        return SHAPES[idx].map(row => row.slice());
    }

    function refillQueue() {
        while (queue.length < QUEUE_SIZE) {
            queue.push(getRandomShape());
        }
    }

    function resetGame() {
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                board[r][c] = 0;
            }
        }
        queue = [];
        refillQueue();
        currentScore = 0;
        updateScore();
        statusMsg.innerText = '👆 tap a cell';
        renderBoard();
        renderQueue();
    }

    function updateScore() {
        scoreDisplay.innerText = currentScore;
    }

    function renderBoard() {
        let html = '';
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const filledClass = board[r][c] === 1 ? 'filled' : '';
                html += `<div class="cell ${filledClass}" data-row="${r}" data-col="${c}"></div>`;
            }
        }
        boardEl.innerHTML = html;
    }

    function renderQueue() {
        while (queue.length < QUEUE_SIZE) queue.push(getRandomShape());

        let containerHtml = '';
        for (let i = 0; i < QUEUE_SIZE; i++) {
            const shape = queue[i];
            const shapeRows = shape.length;
            const shapeCols = shape[0].length;

            let previewCells = '';
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    let isFilled = 0;
                    if (r < shapeRows && c < shapeCols && shape[r][c] === 1) {
                        isFilled = 1;
                    }
                    const fillClass = isFilled ? 'filled' : '';
                    previewCells += `<div class="preview-cell ${fillClass}"></div>`;
                }
            }
            containerHtml += `<div class="block-grid">${previewCells}</div>`;
        }
        queueContainer.innerHTML = containerHtml;
    }

    function canPlace(shape, topRow, leftCol) {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[0].length; c++) {
                if (shape[r][c] === 1) {
                    const boardRow = topRow + r;
                    const boardCol = leftCol + c;
                    if (boardRow >= BOARD_SIZE || boardCol >= BOARD_SIZE) return false;
                    if (board[boardRow][boardCol] === 1) return false;
                }
            }
        }
        return true;
    }

    function placeShape(shape, topRow, leftCol) {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[0].length; c++) {
                if (shape[r][c] === 1) {
                    board[topRow + r][leftCol + c] = 1;
                }
            }
        }
    }

    function clearFullLines() {
        let rowsCleared = 0;
        let colsCleared = 0;

        for (let r = 0; r < BOARD_SIZE; r++) {
            if (board[r].every(cell => cell === 1)) {
                for (let c = 0; c < BOARD_SIZE; c++) board[r][c] = 0;
                rowsCleared++;
            }
        }

        for (let c = 0; c < BOARD_SIZE; c++) {
            let colFull = true;
            for (let r = 0; r < BOARD_SIZE; r++) {
                if (board[r][c] === 0) {
                    colFull = false;
                    break;
                }
            }
            if (colFull) {
                for (let r = 0; r < BOARD_SIZE; r++) board[r][c] = 0;
                colsCleared++;
            }
        }

        if (rowsCleared > 0 || colsCleared > 0) {
            const total = (rowsCleared + colsCleared) * 10;
            currentScore += total;
            statusMsg.innerText = `✨ cleared! +${total}`;
            updateScore();
        } else {
            statusMsg.innerText = '✔️ block placed';
        }
    }

    function tryPlaceShape(row, col) {
        if (queue.length === 0) return false;
        const shape = queue[0];

        if (!canPlace(shape, row, col)) {
            statusMsg.innerText = '❌ cannot place there';
            // brief vibration feedback on mobile (optional, won't work if not supported)
            if (navigator.vibrate) navigator.vibrate(50);
            return false;
        }

        placeShape(shape, row, col);
        queue.shift();
        clearFullLines();
        refillQueue();
        renderBoard();
        renderQueue();

        if (!anyMoveAvailable()) {
            statusMsg.innerText = '⚠️ no possible moves? try reset';
            if (navigator.vibrate) navigator.vibrate(100);
        } else if (!statusMsg.innerText.includes('cleared') && !statusMsg.innerText.includes('❌')) {
            statusMsg.innerText = '👍 next block';
        }
        
        // success vibration
        if (navigator.vibrate) navigator.vibrate(30);
        return true;
    }

    function anyMoveAvailable() {
        for (let shapeIdx = 0; shapeIdx < queue.length; shapeIdx++) {
            const shape = queue[shapeIdx];
            for (let r = 0; r <= BOARD_SIZE - shape.length; r++) {
                for (let c = 0; c <= BOARD_SIZE - shape[0].length; c++) {
                    if (canPlace(shape, r, c)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // Handle both click and touch events
    function handleBoardInteraction(e) {
        // Prevent default to avoid double-firing on touch devices
        e.preventDefault();
        
        let target = e.target;
        // For touch events, get the touched element
        if (e.touches) {
            const touch = e.touches[0];
            target = document.elementFromPoint(touch.clientX, touch.clientY);
        }
        
        const cell = target.closest('.cell');
        if (!cell) return;
        
        const row = parseInt(cell.dataset.row, 10);
        const col = parseInt(cell.dataset.col, 10);
        if (isNaN(row) || isNaN(col)) return;
        
        tryPlaceShape(row, col);
    }

    // Remove existing listeners and add both click and touch
    boardEl.removeEventListener('click', handleBoardInteraction);
    boardEl.removeEventListener('touchstart', handleBoardInteraction);
    
    boardEl.addEventListener('click', handleBoardInteraction);
    boardEl.addEventListener('touchstart', handleBoardInteraction, { passive: false });
    
    document.getElementById('resetGame').addEventListener('click', resetGame);
    document.getElementById('resetGame').addEventListener('touchstart', (e) => {
        e.preventDefault();
        resetGame();
    }, { passive: false });

    // Prevent zooming on double-tap
    document.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    // Initial render
    resetGame();
})();