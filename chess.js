// Chess piece Unicode characters for Lichess font
const pieces = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

// Piece CSS classes for Lichess pieces
const pieceClasses = {
    'K': 'white king',
    'Q': 'white queen',
    'R': 'white rook',
    'B': 'white bishop',
    'N': 'white knight',
    'P': 'white pawn',
    'k': 'black king',
    'q': 'black queen',
    'r': 'black rook',
    'b': 'black bishop',
    'n': 'black knight',
    'p': 'black pawn'
};

// Initial board setup
let board = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

// Add these at the top of your file
let whiteTime = 300; // 5 minutes in seconds
let blackTime = 300;
let activeTimer = null;
let lastMoveTime = Date.now();
let isWhiteTurn = true;

function updateClocks() {
    const whiteClockElement = document.getElementById('whiteClock');
    const blackClockElement = document.getElementById('blackClock');
    
    // Format and display times
    whiteClockElement.textContent = formatTime(whiteTime);
    blackClockElement.textContent = formatTime(blackTime);
    
    // Update active clock styling
    document.querySelector('.white-clock').classList.toggle('active', isWhiteTurn);
    document.querySelector('.black-clock').classList.toggle('active', !isWhiteTurn);
    
    // Add warning style for low time
    whiteClockElement.classList.toggle('low-time', whiteTime < 30);
    blackClockElement.classList.toggle('low-time', blackTime < 30);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function startClock() {
    if (activeTimer) clearInterval(activeTimer);
    lastMoveTime = Date.now();
    
    activeTimer = setInterval(() => {
        const currentTime = Date.now();
        const elapsed = Math.floor((currentTime - lastMoveTime) / 1000);
        
        if (isWhiteTurn) {
            whiteTime = Math.max(0, whiteTime - 1);
        } else {
            blackTime = Math.max(0, blackTime - 1);
        }
        
        updateClocks();
        
        // Check for time out
        if (whiteTime === 0 || blackTime === 0) {
            clearInterval(activeTimer);
            const winner = whiteTime === 0 ? 'Black' : 'White';
            document.getElementById('status').textContent = `Game Over - ${winner} wins on time!`;
            // Show restart button
            const restartButton = document.createElement('button');
            restartButton.textContent = 'Restart Game';
            restartButton.onclick = restartGame;
            document.getElementById('status').appendChild(document.createElement('br'));
            document.getElementById('status').appendChild(restartButton);
        }
    }, 1000);
}

// Initialize the board
function initializeBoard() {
    const boardContainer = document.querySelector('.board-container');
    const chessboard = document.getElementById('chessboard');
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

    // Create the chess squares and pieces
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = `square ${(row + col) % 2 === 1 ? 'white' : 'black'}`;
            square.dataset.row = row;
            square.dataset.col = col;
            
            const piece = board[row][col];
            if (piece !== ' ') {
                const pieceDiv = document.createElement('div');
                pieceDiv.className = `piece ${pieceClasses[piece]}`;
                square.appendChild(pieceDiv);
            }
            
            chessboard.appendChild(square);
        }
    }
}

// Convert chess notation to board coordinates
function parseMove(move) {
    // Handle castling notation
    if (move === '0-0' || move === 'o-o') {
        return { castling: 'kingside' };
    }
    if (move === '0-0-0' || move === 'o-o-o') {
        return { castling: 'queenside' };
    }

    // Existing coordinate parsing
    if (move.length !== 4) return null;
    
    const fromCol = move.charCodeAt(0) - 'a'.charCodeAt(0);
    const fromRow = 8 - parseInt(move[1]);
    const toCol = move.charCodeAt(2) - 'a'.charCodeAt(0);
    const toRow = 8 - parseInt(move[3]);
    
    if (fromCol < 0 || fromCol > 7 || fromRow < 0 || fromRow > 7 ||
        toCol < 0 || toCol > 7 || toRow < 0 || toRow > 7) {
        return null;
    }
    
    return { fromRow, fromCol, toRow, toCol };
}

// Add these helper functions for algebraic notation
function getPieceLetter(piece) {
    if (piece === 'P' || piece === 'p') return '';
    return piece.toUpperCase();
}

function getAlgebraicNotation(fromRow, fromCol, toRow, toCol, piece, isCapture) {
    const from = String.fromCharCode(97 + fromCol) + (8 - fromRow);
    const to = String.fromCharCode(97 + toCol) + (8 - toRow);
    const pieceLetter = getPieceLetter(piece);
    const captureNotation = isCapture ? 'x' : '';
    return `${pieceLetter}${captureNotation}${to}`;
}

// Add move history tracking
let moveHistory = [];

// Add these validation functions
function isValidMove(fromRow, fromCol, toRow, toCol, piece) {
    const pieceType = piece.toLowerCase();
    const isWhite = piece === piece.toUpperCase();
    const deltaRow = toRow - fromRow;
    const deltaCol = toCol - fromCol;

    // Can't capture your own pieces
    const targetPiece = board[toRow][toCol];
    if (targetPiece !== ' ' && 
        (isWhite === (targetPiece === targetPiece.toUpperCase()))) {
        return { valid: false, error: "Cannot capture your own piece" };
    }

    switch (pieceType) {
        case 'p': // Pawn
            return isValidPawnMove(fromRow, fromCol, toRow, toCol, isWhite);
        case 'r': // Rook
            return isValidRookMove(fromRow, fromCol, toRow, toCol);
        case 'n': // Knight
            return isValidKnightMove(fromRow, fromCol, toRow, toCol);
        case 'b': // Bishop
            return isValidBishopMove(fromRow, fromCol, toRow, toCol);
        case 'q': // Queen
            return isValidQueenMove(fromRow, fromCol, toRow, toCol);
        case 'k': // King
            return isValidKingMove(fromRow, fromCol, toRow, toCol);
        default:
            return { valid: false, error: "Invalid piece" };
    }
}

function isValidPawnMove(fromRow, fromCol, toRow, toCol, isWhite) {
    const direction = isWhite ? -1 : 1;
    const startRow = isWhite ? 6 : 1;
    const deltaRow = toRow - fromRow;
    const deltaCol = toCol - fromCol;

    // Basic forward move
    if (deltaCol === 0 && deltaRow === direction && board[toRow][toCol] === ' ') {
        return { valid: true };
    }

    // Initial two-square move
    if (deltaCol === 0 && fromRow === startRow && deltaRow === 2 * direction &&
        board[fromRow + direction][fromCol] === ' ' && board[toRow][toCol] === ' ') {
        return { valid: true };
    }

    // Capture move
    if (Math.abs(deltaCol) === 1 && deltaRow === direction && 
        board[toRow][toCol] !== ' ' && 
        isWhite !== (board[toRow][toCol] === board[toRow][toCol].toUpperCase())) {
        return { valid: true };
    }

    return { valid: false, error: "Invalid pawn move" };
}

function isValidRookMove(fromRow, fromCol, toRow, toCol) {
    if (fromRow !== toRow && fromCol !== toCol) {
        return { valid: false, error: "Rook must move in straight lines" };
    }

    // Check path is clear
    const rowStep = fromRow === toRow ? 0 : (toRow - fromRow) / Math.abs(toRow - fromRow);
    const colStep = fromCol === toCol ? 0 : (toCol - fromCol) / Math.abs(toCol - fromCol);
    
    for (let i = 1; i < Math.max(Math.abs(toRow - fromRow), Math.abs(toCol - fromCol)); i++) {
        if (board[fromRow + i * rowStep][fromCol + i * colStep] !== ' ') {
            return { valid: false, error: "Path is blocked" };
        }
    }

    return { valid: true };
}

function isValidKnightMove(fromRow, fromCol, toRow, toCol) {
    const deltaRow = Math.abs(toRow - fromRow);
    const deltaCol = Math.abs(toCol - fromCol);
    
    if ((deltaRow === 2 && deltaCol === 1) || (deltaRow === 1 && deltaCol === 2)) {
        return { valid: true };
    }
    return { valid: false, error: "Invalid knight move" };
}

function isValidBishopMove(fromRow, fromCol, toRow, toCol) {
    const deltaRow = Math.abs(toRow - fromRow);
    const deltaCol = Math.abs(toCol - fromCol);
    
    if (deltaRow !== deltaCol) {
        return { valid: false, error: "Bishop must move diagonally" };
    }

    // Check path is clear
    const rowStep = (toRow - fromRow) / deltaRow;
    const colStep = (toCol - fromCol) / deltaCol;
    
    for (let i = 1; i < deltaRow; i++) {
        if (board[fromRow + i * rowStep][fromCol + i * colStep] !== ' ') {
            return { valid: false, error: "Path is blocked" };
        }
    }

    return { valid: true };
}

function isValidQueenMove(fromRow, fromCol, toRow, toCol) {
    // Queen combines rook and bishop moves
    const rookValid = isValidRookMove(fromRow, fromCol, toRow, toCol);
    const bishopValid = isValidBishopMove(fromRow, fromCol, toRow, toCol);
    
    if (rookValid.valid || bishopValid.valid) {
        return { valid: true };
    }
    return { valid: false, error: "Invalid queen move" };
}

function isValidKingMove(fromRow, fromCol, toRow, toCol) {
    const deltaRow = Math.abs(toRow - fromRow);
    const deltaCol = Math.abs(toCol - fromCol);
    
    if (deltaRow <= 1 && deltaCol <= 1) {
        return { valid: true };
    }
    return { valid: false, error: "Invalid king move" };
}

// Add these new functions to detect check and checkmate

function isKingInCheck(isWhiteKing, testBoard = board) {
    // Find king's position
    let kingRow, kingCol;
    const kingPiece = isWhiteKing ? 'K' : 'k';
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (testBoard[row][col] === kingPiece) {
                kingRow = row;
                kingCol = col;
                break;
            }
        }
    }

    // Check if any opponent piece can capture the king
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = testBoard[row][col];
            if (piece !== ' ' && 
                (isWhiteKing === (piece === piece.toLowerCase()))) {
                const validation = isValidMove(row, col, kingRow, kingCol, piece, testBoard);
                if (validation.valid) {
                    return true;
                }
            }
        }
    }
    return false;
}

function isCheckmate(isWhiteKing) {
    if (!isKingInCheck(isWhiteKing)) {
        return false;
    }

    // Try all possible moves for all pieces
    for (let fromRow = 0; fromRow < 8; fromRow++) {
        for (let fromCol = 0; fromCol < 8; fromCol++) {
            const piece = board[fromRow][fromCol];
            // Check only pieces of the same color as the king
            if (piece !== ' ' && 
                (isWhiteKing === (piece === piece.toUpperCase()))) {
                
                for (let toRow = 0; toRow < 8; toRow++) {
                    for (let toCol = 0; toCol < 8; toCol++) {
                        const validation = isValidMove(fromRow, fromCol, toRow, toCol, piece);
                        if (validation.valid) {
                            // Try the move
                            const originalPiece = board[toRow][toCol];
                            board[toRow][toCol] = piece;
                            board[fromRow][fromCol] = ' ';
                            
                            // Check if king is still in check
                            const stillInCheck = isKingInCheck(isWhiteKing);
                            
                            // Undo the move
                            board[fromRow][fromCol] = piece;
                            board[toRow][toCol] = originalPiece;
                            
                            if (!stillInCheck) {
                                return false; // Found a valid move to escape check
                            }
                        }
                    }
                }
            }
        }
    }
    return true; // No valid moves found to escape check
}

// Add restart game function
function restartGame() {
    board = [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];
    moveHistory = [];
    initializeBoard();
    updateMoveHistory();
    document.getElementById('status').textContent = 'White to move';
    
    // Reset clocks
    whiteTime = 300;
    blackTime = 300;
    isWhiteTurn = true;
    updateClocks();
    startClock();
}

// Modify the makeMove function to include check and checkmate detection
function makeMove() {
    const moveInput = document.getElementById('moveInput');
    const move = parseMove(moveInput.value.toLowerCase());
    const status = document.getElementById('status');
    
    if (!move) {
        status.textContent = 'Invalid move format. Use e2e4, 0-0, or 0-0-0';
        return;
    }

    // Handle castling moves
    if (move.castling) {
        const isKingside = move.castling === 'kingside';
        const validation = isValidCastling(isKingside, true);
        
        if (!validation.valid) {
            status.textContent = `Invalid castling: ${validation.error}`;
            return;
        }

        // Perform castling
        const row = 7;
        const kingFromCol = 4;
        const kingToCol = isKingside ? 6 : 2;
        const rookFromCol = isKingside ? 7 : 0;
        const rookToCol = isKingside ? 5 : 3;

        board[row][kingToCol] = board[row][kingFromCol];
        board[row][rookToCol] = board[row][rookFromCol];
        board[row][kingFromCol] = ' ';
        board[row][rookFromCol] = ' ';

        const algebraicMove = isKingside ? 'O-O' : 'O-O-O';
        // ... rest of move processing ...
    }

    // Check if the selected piece is white (uppercase)
    const piece = board[move.fromRow][move.fromCol];
    if (piece === ' ' || piece.toLowerCase() === piece) {
        status.textContent = 'Invalid move: Must move a white piece';
        return;
    }

    // Validate the move
    const validation = isValidMove(move.fromRow, move.fromCol, move.toRow, move.toCol, piece);
    if (!validation.valid) {
        status.textContent = `Invalid move: ${validation.error}`;
        return;
    }
    
    const isCapture = board[move.toRow][move.toCol] !== ' ';
    const algebraicMove = getAlgebraicNotation(
        move.fromRow, move.fromCol, 
        move.toRow, move.toCol, 
        piece, isCapture
    );
    
    // Make the move
    board[move.toRow][move.toCol] = board[move.fromRow][move.fromCol];
    board[move.fromRow][move.fromCol] = ' ';
    
    // Check if opponent's king is in check
    const isBlackInCheck = isKingInCheck(false);
    
    if (isBlackInCheck) {
        if (isCheckmate(false)) {
            initializeBoard();
            status.textContent = 'Checkmate! White wins!';
            // Show restart option
            const restartButton = document.createElement('button');
            restartButton.textContent = 'Restart Game';
            restartButton.onclick = restartGame;
            status.appendChild(document.createElement('br'));
            status.appendChild(restartButton);
            return;
        } else {
            status.textContent = 'Black is in check!';
        }
    }

    // Add move to history
    if (moveHistory.length === 0 || moveHistory[moveHistory.length - 1].black) {
        moveHistory.push({
            number: moveHistory.length + 1,
            white: algebraicMove,
            black: ''
        });
    }
    
    // Update the display
    initializeBoard();
    updateMoveHistory();
    status.textContent = 'Computer thinking...';
    
    // Add 5 seconds to white's clock after their move
    whiteTime += 5;
    isWhiteTurn = false;
    updateClocks();

    // Make computer's move after a short delay
    setTimeout(() => {
        if (makeComputerMove()) {
            // Add 5 seconds to black's clock after their move
            blackTime += 5;
            isWhiteTurn = true;
            updateClocks();
            initializeBoard();
            // Check if white king is in check
            if (isKingInCheck(true)) {
                if (isCheckmate(true)) {
                    status.textContent = 'Checkmate! Black wins!';
                    const restartButton = document.createElement('button');
                    restartButton.textContent = 'Restart Game';
                    restartButton.onclick = restartGame;
                    status.appendChild(document.createElement('br'));
                    status.appendChild(restartButton);
                } else {
                    status.textContent = 'White is in check!';
                }
            } else {
                status.textContent = 'Your turn';
            }
        } else {
            status.textContent = 'Game Over';
        }
        moveInput.value = '';
    }, 500);
}

// Update the makeComputerMove function
function makeComputerMove() {
    const possibleMoves = [];
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece === 'p') {
                if (row < 7 && board[row + 1][col] === ' ') {
                    possibleMoves.push({
                        fromRow: row,
                        fromCol: col,
                        toRow: row + 1,
                        toCol: col,
                        piece: piece
                    });
                }
            }
        }
    }
    
    if (possibleMoves.length > 0) {
        const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        const isCapture = board[move.toRow][move.toCol] !== ' ';
        
        // Get algebraic notation for the computer's move
        const algebraicMove = getAlgebraicNotation(
            move.fromRow, move.fromCol,
            move.toRow, move.toCol,
            move.piece, isCapture
        );
        
        // Make the move
        board[move.toRow][move.toCol] = board[move.fromRow][move.fromCol];
        board[move.fromRow][move.fromCol] = ' ';
        
        // Add to move history
        if (moveHistory.length > 0) {
            moveHistory[moveHistory.length - 1].black = algebraicMove;
        }
        
        updateMoveHistory();
        return true;
    }
    return false;
}

// Add function to update move history display
function updateMoveHistory() {
    const historyDiv = document.getElementById('moveHistory');
    // Keep the header row
    historyDiv.innerHTML = `
        <div class="move-row">
            <span class="move-number">Move</span>
            <span class="move-white">White</span>
            <span class="move-black">Black</span>
        </div>
    `;
    
    moveHistory.forEach(move => {
        const moveRow = document.createElement('div');
        moveRow.className = 'move-row';
        moveRow.innerHTML = `
            <span class="move-number">${move.number}.</span>
            <span class="move-white">${move.white}</span>
            <span class="move-black">${move.black}</span>
        `;
        historyDiv.appendChild(moveRow);
    });
    
    // Scroll to bottom
    historyDiv.scrollTop = historyDiv.scrollHeight;
}

// Add castling validation
function isValidCastling(isKingside, isWhite) {
    const row = isWhite ? 7 : 0;
    const kingCol = 4;
    const rookCol = isKingside ? 7 : 0;
    
    // Check if king and rook are in their original positions
    if (board[row][kingCol] !== (isWhite ? 'K' : 'k') ||
        board[row][rookCol] !== (isWhite ? 'R' : 'r')) {
        return { valid: false, error: "King or Rook has moved" };
    }

    // Check if path is clear
    const cols = isKingside ? [5, 6] : [1, 2, 3];
    for (const col of cols) {
        if (board[row][col] !== ' ') {
            return { valid: false, error: "Path is not clear for castling" };
        }
    }

    // Check if king is in check
    if (isKingInCheck(isWhite)) {
        return { valid: false, error: "Cannot castle while in check" };
    }

    // Check if king passes through attacked squares
    const checkCols = isKingside ? [5, 6] : [2, 3];
    for (const col of checkCols) {
        const tempBoard = board.map(row => [...row]);
        tempBoard[row][kingCol] = ' ';
        tempBoard[row][col] = isWhite ? 'K' : 'k';
        if (isKingInCheck(isWhite, tempBoard)) {
            return { valid: false, error: "Cannot castle through check" };
        }
    }

    return { valid: true };
}

// Start the clock when the game initializes
document.addEventListener('DOMContentLoaded', () => {
    initializeBoard();
    updateClocks();
    startClock();
}); 