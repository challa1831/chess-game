class ChessUI {
    constructor(game) {
        console.log('Initializing ChessUI');
        if (!game) {
            throw new Error('Game instance is required');
        }
        this.game = game;
        this.draggedPiece = null;
        this.startSquare = null;
        
        // Register for clock updates and start updating immediately
        this.game.setClockUpdateCallback((whiteTime, blackTime, isWhiteTurn) => {
            this.updateClocks();
        });
        
        this.initializeBoard();
        this.setupEventListeners();
        this.updateClocks(); // Initial clock display
    }

    initializeBoard() {
        console.log('Initializing board');
        const boardContainer = document.querySelector('.board-container');
        const chessboard = document.getElementById('chessboard');
        
        if (!boardContainer || !chessboard) {
            console.error('Required elements not found:', {
                boardContainer: !!boardContainer,
                chessboard: !!chessboard
            });
            throw new Error('Required elements not found');
        }
        
        chessboard.innerHTML = '';

        // Add row labels (8 to 1)
        for (let row = 0; row < 8; row++) {
            const label = document.createElement('div');
            label.className = 'row-label';
            label.style.top = `${row * 80 + 30}px`;
            label.textContent = 8 - row;
            boardContainer.appendChild(label);
        }

        // Add column labels (a to h)
        for (let col = 0; col < 8; col++) {
            const label = document.createElement('div');
            label.className = 'col-label';
            label.style.left = `${col * 80 + 30}px`;
            label.textContent = String.fromCharCode(97 + col);
            boardContainer.appendChild(label);
        }

        // Create squares and pieces
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = this.createSquare(row, col);
                const piece = this.game.board[row][col];
                if (piece !== ' ') {
                    square.appendChild(this.createPiece(piece));
                }
                chessboard.appendChild(square);
            }
        }
    }

    createSquare(row, col) {
        const square = document.createElement('div');
        square.className = `square ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
        square.dataset.row = row;
        square.dataset.col = col;
        
        square.addEventListener('dragover', this.handleDragOver.bind(this));
        square.addEventListener('drop', this.handleDrop.bind(this));
        
        return square;
    }

    createPiece(piece) {
        const pieceDiv = document.createElement('div');
        pieceDiv.className = `piece ${this.getPieceClass(piece)}`;
        pieceDiv.draggable = true;
        pieceDiv.addEventListener('dragstart', this.handleDragStart.bind(this));
        pieceDiv.addEventListener('dragend', this.handleDragEnd.bind(this));
        return pieceDiv;
    }

    getPieceClass(piece) {
        const color = piece === piece.toUpperCase() ? 'white' : 'black';
        const type = piece.toLowerCase();
        const pieceTypes = {
            'k': 'king',
            'q': 'queen',
            'r': 'rook',
            'b': 'bishop',
            'n': 'knight',
            'p': 'pawn'
        };
        return `${color} ${pieceTypes[type]}`;
    }

    setupEventListeners() {
        // Move input handling
        const moveInput = document.getElementById('moveInput');
        moveInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleMoveInput(moveInput.value);
                moveInput.value = '';
            }
        });

        // Clock controls
        const pauseButton = document.getElementById('pauseButton');
        if (pauseButton) {
            pauseButton.addEventListener('click', () => {
                const isPaused = this.game.togglePause();
                this.updatePauseButton(isPaused);
            });
        }

        const timeControl = document.getElementById('timeControl');
        if (timeControl) {
            timeControl.addEventListener('change', (e) => {
                const [minutes, increment] = e.target.value.split('+').map(Number);
                this.game.changeTimeControl(minutes, increment);
            });
        }
    }

    handleDragStart(e) {
        if (!this.game.isWhiteTurn) {
            e.preventDefault();
            return;
        }

        const square = e.target.parentNode;
        const piece = this.game.board[square.dataset.row][square.dataset.col];
        if (piece.toLowerCase() === piece) {
            e.preventDefault();
            return;
        }

        this.draggedPiece = e.target;
        this.startSquare = square;
        e.target.style.opacity = '0.4';
    }

    handleDragEnd(e) {
        if (this.draggedPiece) {
            this.draggedPiece.style.opacity = '1';
            this.draggedPiece = null;
            this.startSquare = null;
        }
    }

    handleDragOver(e) {
        e.preventDefault();
    }

    handleDrop(e) {
        e.preventDefault();
        if (!this.draggedPiece || !this.startSquare) return;

        const fromRow = parseInt(this.startSquare.dataset.row);
        const fromCol = parseInt(this.startSquare.dataset.col);
        const toRow = parseInt(e.target.dataset.row || e.target.parentNode.dataset.row);
        const toCol = parseInt(e.target.dataset.col || e.target.parentNode.dataset.col);

        this.makeMove(fromRow, fromCol, toRow, toCol);
    }

    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.game.board[fromRow][fromCol];
        
        // Validate turn and piece ownership
        if (!this.game.isWhiteTurn || piece.toLowerCase() === piece) {
            this.showNotification("Not your turn");
            return;
        }

        // Validate move
        const validation = ChessRules.isValidMove(fromRow, fromCol, toRow, toCol, piece, this.game.board);
        if (!validation.valid) {
            this.showNotification(validation.error);
            return;
        }

        // Execute move and handle result
        const moveResult = this.game.executeMove(fromRow, fromCol, toRow, toCol);
        const postMoveResult = this.game.handlePostMove();

        // Update display after white's move
        this.updateDisplay();

        // Handle checkmate immediately if detected
        if (postMoveResult.status === 'checkmate') {
            this.showNotification(`Checkmate! ${postMoveResult.winner} wins!`);
            this.showRestartButton();
            return;
        }

        // Only continue with computer move if not checkmate
        this.showNotification("Computer thinking...");
        setTimeout(() => {
            if (this.game.gameStatus === 'active') {
                this.updateDisplay();
                this.showNotification("Your turn");
            }
        }, 600);
    }

    handleMoveResult(result) {
        if (result.status === 'checkmate') {
            this.showNotification(`Checkmate! ${result.winner} wins!`);
            this.showRestartButton();
        } else if (result.status === 'timeout') {
            this.showNotification(`Time's up! ${result.winner} wins!`);
            this.showRestartButton();
        }
    }

    updateDisplay() {
        this.initializeBoard();
        this.updateMoveHistory();
        this.updateClocks();
    }

    updateMoveHistory() {
        const historyDiv = document.getElementById('moveHistory');
        historyDiv.innerHTML = `
            <div class="move-row">
                <span class="move-number">Move</span>
                <span class="move-white">White</span>
                <span class="move-black">Black</span>
            </div>
        `;
        
        this.game.moveHistory.forEach(move => {
            const moveRow = document.createElement('div');
            moveRow.className = 'move-row';
            moveRow.innerHTML = `
                <span class="move-number">${move.number}.</span>
                <span class="move-white">${move.white}</span>
                <span class="move-black">${move.black}</span>
            `;
            historyDiv.appendChild(moveRow);
        });
        
        historyDiv.scrollTop = historyDiv.scrollHeight;
    }

    updateClocks() {
        const whiteClock = document.getElementById('whiteClock');
        const blackClock = document.getElementById('blackClock');
        
        if (whiteClock && blackClock) {
            whiteClock.textContent = this.formatTime(this.game.whiteTime);
            blackClock.textContent = this.formatTime(this.game.blackTime);
            
            // Update active clock highlighting
            const whiteClockContainer = document.querySelector('.white-clock');
            const blackClockContainer = document.querySelector('.black-clock');
            
            if (whiteClockContainer && blackClockContainer) {
                whiteClockContainer.classList.toggle('active', this.game.isWhiteTurn);
                blackClockContainer.classList.toggle('active', !this.game.isWhiteTurn);
                
                // Add low time warning
                whiteClock.classList.toggle('low-time', this.game.whiteTime < 30);
                blackClock.classList.toggle('low-time', this.game.blackTime < 30);
            }
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    showNotification(message) {
        const notifications = document.getElementById('notifications');
        notifications.textContent = message;
    }

    showRestartButton() {
        const notifications = document.getElementById('notifications');
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Restart Game';
        restartButton.onclick = () => {
            this.game.restartGame();
            this.updateDisplay();
            this.showNotification('White to move');
        };
        notifications.appendChild(restartButton);
    }

    updatePauseButton(isPaused) {
        const pauseButton = document.getElementById('pauseButton');
        if (pauseButton) {
            pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
            pauseButton.classList.toggle('paused', isPaused);
        }
    }
} 