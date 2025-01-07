class ChessGame {
    constructor() {
        this.board = this.getInitialBoard();
        this.moveHistory = [];
        this.isWhiteTurn = true;
        this.whiteTime = 300;
        this.blackTime = 300;
        this.increment = 5;
        this.activeTimer = null;
        this.isPaused = false;
        this.gameStatus = 'active'; // 'active', 'checkmate', 'stalemate', 'draw'
        this.lastTickTime = Date.now();
        this.startClock(); // Start clock when game is created
    }

    getInitialBoard() {
        return [
            ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
            ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
            ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
        ];
    }

    executeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const isCapture = this.board[toRow][toCol] !== ' ';
        
        // Make the move
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = ' ';

        // Record move in history
        const isCheck = ChessRules.isKingInCheck(!this.isWhiteTurn, this.board);
        const isCheckmate = isCheck && ChessRules.isCheckmate(!this.isWhiteTurn, this.board);
        
        const algebraicMove = this.getAlgebraicNotation(
            fromRow, fromCol, toRow, toCol,
            piece, isCapture, isCheck, isCheckmate
        );

        if (this.isWhiteTurn) {
            this.moveHistory.push({
                number: this.moveHistory.length + 1,
                white: algebraicMove,
                black: ''
            });
        } else {
            this.moveHistory[this.moveHistory.length - 1].black = algebraicMove;
        }

        return { isCheck, isCheckmate };
    }

    handlePostMove() {
        // Add increment to current player's time
        if (this.isWhiteTurn) {
            this.whiteTime += this.increment;
        } else {
            this.blackTime += this.increment;
        }

        // Switch turns
        this.isWhiteTurn = !this.isWhiteTurn;

        // Check game status
        if (ChessRules.isCheckmate(this.isWhiteTurn, this.board)) {
            this.gameStatus = 'checkmate';
            const result = {
                success: true,
                status: 'checkmate',
                winner: this.isWhiteTurn ? 'Black' : 'White'
            };
            // Important: Return immediately if checkmate is detected
            return result;
        }

        // Only make computer move if game is still active
        if (!this.isWhiteTurn && this.gameStatus === 'active') {
            setTimeout(() => {
                if (this.makeComputerMove()) {
                    this.blackTime += this.increment;
                    this.isWhiteTurn = true;
                    
                    // Check if computer's move resulted in checkmate
                    if (ChessRules.isCheckmate(true, this.board)) {
                        this.gameStatus = 'checkmate';
                        return {
                            success: true,
                            status: 'checkmate',
                            winner: 'Black'
                        };
                    }
                }
            }, 500);
        }

        return { success: true };
    }

    makeComputerMove() {
        const possibleMoves = [];
        
        // Generate all valid moves for black
        for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
                const piece = this.board[fromRow][fromCol];
                if (piece === ' ' || piece === piece.toUpperCase()) continue;
                
                for (let toRow = 0; toRow < 8; toRow++) {
                    for (let toCol = 0; toCol < 8; toCol++) {
                        if (ChessRules.isValidMove(fromRow, fromCol, toRow, toCol, piece, this.board).valid) {
                            possibleMoves.push({ fromRow, fromCol, toRow, toCol });
                        }
                    }
                }
            }
        }

        if (possibleMoves.length === 0) return false;

        // Choose random move
        const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        
        // Execute the move
        const moveResult = this.executeMove(move.fromRow, move.fromCol, move.toRow, move.toCol);
        
        return true;
    }

    getAlgebraicNotation(fromRow, fromCol, toRow, toCol, piece, isCapture, isCheck, isCheckmate) {
        const pieceSymbol = piece.toLowerCase() === 'p' ? '' : piece.toUpperCase();
        const captureSymbol = isCapture ? 'x' : '';
        const toSquare = `${String.fromCharCode(97 + toCol)}${8 - toRow}`;
        const checkSymbol = isCheckmate ? '#' : (isCheck ? '+' : '');
        
        return `${pieceSymbol}${captureSymbol}${toSquare}${checkSymbol}`;
    }

    startClock() {
        if (this.activeTimer) {
            clearInterval(this.activeTimer);
        }

        this.lastTickTime = Date.now();

        this.activeTimer = setInterval(() => {
            if (!this.isPaused && this.gameStatus === 'active') {
                const currentTime = Date.now();
                const elapsedSeconds = (currentTime - this.lastTickTime) / 1000;
                this.lastTickTime = currentTime;

                if (this.isWhiteTurn) {
                    this.whiteTime = Math.max(0, this.whiteTime - elapsedSeconds);
                    if (this.whiteTime === 0) {
                        this.gameStatus = 'timeout';
                        this.handleTimeout('Black');
                    }
                } else {
                    this.blackTime = Math.max(0, this.blackTime - elapsedSeconds);
                    if (this.blackTime === 0) {
                        this.gameStatus = 'timeout';
                        this.handleTimeout('White');
                    }
                }
                
                this.updateClocks();
            }
        }, 100); // Update every 100ms for smoother display
    }

    handleTimeout(winner) {
        clearInterval(this.activeTimer);
        this.gameStatus = 'timeout';
        if (this.onClockUpdate) {
            this.onClockUpdate(this.whiteTime, this.blackTime, this.isWhiteTurn);
        }
        return {
            status: 'timeout',
            winner: winner
        };
    }

    togglePause() {
        if (!this.isPaused) {
            // Reset the last tick time when unpausing
            this.lastTickTime = Date.now();
        }
        this.isPaused = !this.isPaused;
        return this.isPaused;
    }

    restartGame() {
        this.board = this.getInitialBoard();
        this.moveHistory = [];
        this.isWhiteTurn = true;
        this.whiteTime = 300;
        this.blackTime = 300;
        this.gameStatus = 'active';
        this.startClock();
    }

    changeTimeControl(minutes, increment) {
        this.whiteTime = minutes * 60;
        this.blackTime = minutes * 60;
        this.increment = increment;
        this.updateClocks();
    }

    updateClocks() {
        if (this.onClockUpdate) {
            this.onClockUpdate(this.whiteTime, this.blackTime, this.isWhiteTurn);
        }
    }

    setClockUpdateCallback(callback) {
        this.onClockUpdate = callback;
    }
} 