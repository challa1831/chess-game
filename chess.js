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
let isPaused = false;
let increment = 5; // Default increment in seconds

// Add these variables at the top
let draggedPiece = null;
let startSquare = null;

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
    if (activeTimer) {
        clearInterval(activeTimer);
        activeTimer = null;
    }
    
    lastMoveTime = Date.now();
    
    activeTimer = setInterval(() => {
        if (!isPaused) {
            const currentTime = Date.now();
            const elapsed = Math.floor((currentTime - lastMoveTime) / 1000);
            
            if (isWhiteTurn) {
                whiteTime = Math.max(0, whiteTime - 1);
            } else {
                blackTime = Math.max(0, blackTime - 1);
            }
            
            updateClocks();
            
            if (whiteTime === 0 || blackTime === 0) {
                const winner = whiteTime === 0 ? 'Black' : 'White';
                handleGameEnd(`Game Over - ${winner} wins on time!`);
            }
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
                
                // Add drag events
                pieceDiv.draggable = true;
                pieceDiv.addEventListener('dragstart', handleDragStart);
                pieceDiv.addEventListener('dragend', handleDragEnd);
                
                square.appendChild(pieceDiv);
            }
            
            // Add drop events to squares
            square.addEventListener('dragover', handleDragOver);
            square.addEventListener('drop', handleDrop);
            
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

function getAlgebraicNotation(fromRow, fromCol, toRow, toCol, piece, isCapture, isCheck = false, isCheckmate = false) {
    const from = String.fromCharCode(97 + fromCol) + (8 - fromRow);
    const to = String.fromCharCode(97 + toCol) + (8 - toRow);
    const pieceLetter = getPieceLetter(piece);
    const captureNotation = isCapture ? 'x' : '';
    const checkNotation = isCheckmate ? '#' : (isCheck ? '+' : '');
    
    return `${pieceLetter}${captureNotation}${to}${checkNotation}`;
}

// Add move history tracking
let moveHistory = [];

// Add these validation functions
function isValidMove(fromRow, fromCol, toRow, toCol, piece, testBoard = board) {
    const pieceType = piece.toLowerCase();
    const isWhite = piece === piece.toUpperCase();
    const deltaRow = toRow - fromRow;
    const deltaCol = toCol - fromCol;

    // Can't capture your own pieces
    const targetPiece = testBoard[toRow][toCol];
    if (targetPiece !== ' ' && 
        (isWhite === (targetPiece === targetPiece.toUpperCase()))) {
        return { valid: false, error: "Cannot capture your own piece" };
    }

    switch (pieceType) {
        case 'p': // Pawn
            return isValidPawnMove(fromRow, fromCol, toRow, toCol, isWhite, testBoard);
        case 'r': // Rook
            return isValidRookMove(fromRow, fromCol, toRow, toCol, testBoard);
        case 'n': // Knight
            return isValidKnightMove(fromRow, fromCol, toRow, toCol);
        case 'b': // Bishop
            return isValidBishopMove(fromRow, fromCol, toRow, toCol, testBoard);
        case 'q': // Queen
            return isValidQueenMove(fromRow, fromCol, toRow, toCol, testBoard);
        case 'k': // King
            return isValidKingMove(fromRow, fromCol, toRow, toCol);
        default:
            return { valid: false, error: "Invalid piece" };
    }
}

function isValidPawnMove(fromRow, fromCol, toRow, toCol, isWhite, testBoard = board) {
    const direction = isWhite ? -1 : 1;
    const startRow = isWhite ? 6 : 1;
    const deltaRow = toRow - fromRow;
    const deltaCol = toCol - fromCol;

    // Basic forward move
    if (deltaCol === 0 && deltaRow === direction && testBoard[toRow][toCol] === ' ') {
        return { valid: true };
    }

    // Initial two-square move
    if (deltaCol === 0 && fromRow === startRow && deltaRow === 2 * direction &&
        testBoard[fromRow + direction][fromCol] === ' ' && testBoard[toRow][toCol] === ' ') {
        return { valid: true };
    }

    // Capture move
    if (Math.abs(deltaCol) === 1 && deltaRow === direction && 
        testBoard[toRow][toCol] !== ' ' && 
        isWhite !== (testBoard[toRow][toCol] === testBoard[toRow][toCol].toUpperCase())) {
        return { valid: true };
    }

    return { valid: false, error: "Invalid pawn move" };
}

function isValidRookMove(fromRow, fromCol, toRow, toCol, testBoard = board) {
    if (fromRow !== toRow && fromCol !== toCol) {
        return { valid: false, error: "Rook must move in straight lines" };
    }

    // Check path is clear
    const rowStep = fromRow === toRow ? 0 : (toRow - fromRow) / Math.abs(toRow - fromRow);
    const colStep = fromCol === toCol ? 0 : (toCol - fromCol) / Math.abs(toCol - fromCol);
    
    for (let i = 1; i < Math.max(Math.abs(toRow - fromRow), Math.abs(toCol - fromCol)); i++) {
        if (testBoard[fromRow + i * rowStep][fromCol + i * colStep] !== ' ') {
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

function isValidBishopMove(fromRow, fromCol, toRow, toCol, testBoard = board) {
    const deltaRow = Math.abs(toRow - fromRow);
    const deltaCol = Math.abs(toCol - fromCol);
    
    if (deltaRow !== deltaCol) {
        return { valid: false, error: "Bishop must move diagonally" };
    }

    // Check path is clear
    const rowStep = (toRow - fromRow) / deltaRow;
    const colStep = (toCol - fromCol) / deltaCol;
    
    for (let i = 1; i < deltaRow; i++) {
        if (testBoard[fromRow + i * rowStep][fromCol + i * colStep] !== ' ') {
            return { valid: false, error: "Path is blocked" };
        }
    }

    return { valid: true };
}

function isValidQueenMove(fromRow, fromCol, toRow, toCol, testBoard = board) {
    // Queen combines rook and bishop moves
    const rookValid = isValidRookMove(fromRow, fromCol, toRow, toCol, testBoard);
    const bishopValid = isValidBishopMove(fromRow, fromCol, toRow, toCol, testBoard);
    
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
    let kingRow = -1, kingCol = -1;
    const kingPiece = isWhiteKing ? 'K' : 'k';
    
    // Find the king
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (testBoard[row][col] === kingPiece) {
                kingRow = row;
                kingCol = col;
                console.log(`Found ${kingPiece} at position [${kingRow}, ${kingCol}]`);
                break;
            }
        }
        if (kingRow !== -1) break;
    }

    if (kingRow === -1) {
        console.log(`${kingPiece} not found on board!`);
        return false;
    }

    // Check if any opponent piece can capture the king
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = testBoard[row][col];
            if (piece === ' ') continue;
            
            // Check only opponent's pieces
            if (isWhiteKing === (piece === piece.toLowerCase())) {
                const validation = isValidMove(row, col, kingRow, kingCol, piece);
                if (validation.valid) {
                    console.log(`King in check from ${piece} at [${row}, ${col}]`);
                    return true;
                }
            }
        }
    }
    console.log('No pieces are attacking the king');
    return false;
}

function isCheckmate(isWhiteKing) {
    // First check if king is in check
    if (!isKingInCheck(isWhiteKing)) {
        return false;
    }

    // Try all possible moves for all pieces of the king's color
    for (let fromRow = 0; fromRow < 8; fromRow++) {
        for (let fromCol = 0; fromCol < 8; fromCol++) {
            const piece = board[fromRow][fromCol];
            
            // Skip empty squares and opponent's pieces
            if (piece === ' ' || 
                (isWhiteKing !== (piece === piece.toUpperCase()))) {
                continue;
            }
            
            // Try moving to every square
            for (let toRow = 0; toRow < 8; toRow++) {
                for (let toCol = 0; toCol < 8; toCol++) {
                    // Skip if it's the same square
                    if (fromRow === toRow && fromCol === toCol) {
                        continue;
                    }

                    // Check if move is valid according to piece rules
                    const validation = isValidMove(fromRow, fromCol, toRow, toCol, piece);
                    if (!validation.valid) {
                        continue;
                    }

                    // Try the move on a temporary board
                    const tempBoard = board.map(row => [...row]);
                    tempBoard[toRow][toCol] = piece;
                    tempBoard[fromRow][fromCol] = ' ';

                    // If this move gets the king out of check, it's not checkmate
                    if (!isKingInCheck(isWhiteKing, tempBoard)) {
                        return false;
                    }
                }
            }
        }
    }

    return true;
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
    document.getElementById('notifications').textContent = 'White to move';
    
    // Reset clocks
    whiteTime = 300;
    blackTime = 300;
    isWhiteTurn = true;
    updateClocks();
    startClock();
}

// Add this function to check if a move puts the king out of check
function doesMoveResolveCheck(fromRow, fromCol, toRow, toCol, piece, isWhiteKing) {
    // Try the move on a temporary board
    const tempBoard = board.map(row => [...row]);
    tempBoard[toRow][toCol] = tempBoard[fromRow][fromCol];
    tempBoard[fromRow][fromCol] = ' ';
    
    // Check if king is still in check after the move
    return !isKingInCheck(isWhiteKing, tempBoard);
}

// Add this helper function to handle game end
function handleGameEnd(message) {
    // Stop the clock
    clearInterval(activeTimer);
    activeTimer = null;
    
    // Reset clocks to initial values
    whiteTime = 300;  // 5 minutes
    blackTime = 300;
    updateClocks();
    
    // Show game end message and restart button
    document.getElementById('notifications').textContent = message;
    const restartButton = document.createElement('button');
    restartButton.textContent = 'Restart Game';
    restartButton.onclick = restartGame;
    document.getElementById('notifications').appendChild(restartButton);
}

// Modify the makeMove function's checkmate sections
function makeMove() {
    const moveInput = document.getElementById('moveInput');
    const move = parseMove(moveInput.value.toLowerCase());
    
    if (!move) {
        document.getElementById('notifications').textContent = 'Invalid move format. Use e2e4, 0-0, or 0-0-0';
        return;
    }

    // Check if the selected piece is white (uppercase)
    const piece = board[move.fromRow][move.fromCol];
    if (piece === ' ' || piece.toLowerCase() === piece) {
        document.getElementById('notifications').textContent = 'Invalid move: Must move a white piece';
        return;
    }

    // Validate the move
    const validation = isValidMove(move.fromRow, move.fromCol, move.toRow, move.toCol, piece);
    if (!validation.valid) {
        document.getElementById('notifications').textContent = `Invalid move: ${validation.error}`;
        return;
    }

    // Check if this move would leave own king in check
    const tempBoard = board.map(row => [...row]);
    tempBoard[move.toRow][move.toCol] = tempBoard[move.fromRow][move.fromCol];
    tempBoard[move.fromRow][move.fromCol] = ' ';

    if (isKingInCheck(true, tempBoard)) {
        document.getElementById('notifications').textContent = 'Invalid move: Would leave your king in check';
        return;
    }

    // Make the actual move
    const isCapture = board[move.toRow][move.toCol] !== ' ';
    board[move.toRow][move.toCol] = board[move.fromRow][move.fromCol];
    board[move.fromRow][move.fromCol] = ' ';

    // Check for check/checkmate
    const isCheck = isKingInCheck(false);
    const mated = isCheck && isCheckmate(false);
    
    // Get algebraic notation for the move
    const algebraicMove = getAlgebraicNotation(
        move.fromRow, move.fromCol,
        move.toRow, move.toCol,
        piece, isCapture,
        isCheck, mated
    );

    // Add to move history
    if (moveHistory.length === 0 || moveHistory[moveHistory.length - 1].black) {
        moveHistory.push({
            number: moveHistory.length + 1,
            white: algebraicMove,
            black: ''
        });
    }

    // Handle checkmate
    if (mated) {
        initializeBoard();
        updateMoveHistory();
        handleGameEnd('Checkmate! White wins!');
        return;
    }

    // Update display and continue game
    whiteTime += increment;
    isWhiteTurn = false;
    updateClocks();
    initializeBoard();
    updateMoveHistory();
    
    if (isCheck) {
        document.getElementById('notifications').textContent = 'Black is in check!';
    } else {
        document.getElementById('notifications').textContent = 'Computer thinking...';
    }

    // Make computer's move
    setTimeout(() => {
        const computerMoved = makeComputerMove();
        if (!computerMoved) {
            handleGameEnd('Game Over - Black has no valid moves');
            return;
        }
        
        blackTime += increment;
        isWhiteTurn = true;
        updateClocks();
        initializeBoard();
        updateMoveHistory();

        const whiteInCheck = isKingInCheck(true);
        if (whiteInCheck) {
            if (isCheckmate(true)) {
                handleGameEnd('Checkmate! Black wins!');
            } else {
                document.getElementById('notifications').textContent = 'White is in check!';
            }
        } else {
            document.getElementById('notifications').textContent = 'Your turn';
        }
        moveInput.value = '';
    }, 500);
}

// Update the makeComputerMove function
function makeComputerMove() {
    const possibleMoves = [];
    
    // Generate all valid moves
    for (let fromRow = 0; fromRow < 8; fromRow++) {
        for (let fromCol = 0; fromCol < 8; fromCol++) {
            const piece = board[fromRow][fromCol];
            if (piece === ' ' || piece === piece.toUpperCase()) continue;
            
            for (let toRow = 0; toRow < 8; toRow++) {
                for (let toCol = 0; toCol < 8; toCol++) {
                    if (fromRow === toRow && fromCol === toCol) continue;
                    
                    const validation = isValidMove(fromRow, fromCol, toRow, toCol, piece);
                    if (!validation.valid) continue;
                    
                    // Try move on temporary board
                    const tempBoard = board.map(row => [...row]);
                    tempBoard[toRow][toCol] = piece;
                    tempBoard[fromRow][fromCol] = ' ';
                    
                    // Skip moves that leave own king in check
                    if (isKingInCheck(false, tempBoard)) continue;
                    
                    possibleMoves.push({
                        fromRow,
                        fromCol,
                        toRow,
                        toCol,
                        piece
                    });
                }
            }
        }
    }
    
    if (possibleMoves.length === 0) return false;
    
    // Choose and make a move
    const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    const isCapture = board[move.toRow][move.toCol] !== ' ';
    
    // Make the move
    board[move.toRow][move.toCol] = move.piece;
    board[move.fromRow][move.fromCol] = ' ';
    
    // Check for check/checkmate
    const isCheck = isKingInCheck(true);
    const mated = isCheck && isCheckmate(true);
    
    // Get algebraic notation
    const algebraicMove = getAlgebraicNotation(
        move.fromRow, move.fromCol,
        move.toRow, move.toCol,
        move.piece, isCapture,
        isCheck, mated
    );
    
    // Add to move history
    if (moveHistory.length > 0) {
        moveHistory[moveHistory.length - 1].black = algebraicMove;
    }
    
    return true;
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

// Add these functions
function togglePause() {
    isPaused = !isPaused;
    const pauseButton = document.getElementById('pauseButton');
    
    if (isPaused) {
        pauseButton.textContent = 'Resume';
        pauseButton.classList.add('paused');
    } else {
        pauseButton.textContent = 'Pause';
        pauseButton.classList.remove('paused');
        lastMoveTime = Date.now(); // Reset the timer when resuming
    }
    
    document.querySelector('.chess-clocks').classList.toggle('paused', isPaused);
}

function changeTimeControl() {
    const timeControl = document.getElementById('timeControl').value;
    const [minutes, inc] = timeControl.split('+').map(Number);
    
    // Reset times
    whiteTime = minutes * 60;
    blackTime = minutes * 60;
    increment = inc;
    
    // Update display
    updateClocks();
    
    // Restart clock if game is in progress
    if (activeTimer) {
        clearInterval(activeTimer);
        startClock();
    }
}

// Add drag and drop handler functions
function handleDragStart(e) {
    if (!isWhiteTurn) {
        e.preventDefault();
        return;
    }

    const piece = board[e.target.parentNode.dataset.row][e.target.parentNode.dataset.col];
    if (piece.toLowerCase() === piece) {  // If it's a black piece
        e.preventDefault();
        return;
    }

    draggedPiece = e.target;
    startSquare = e.target.parentNode;
    e.target.style.opacity = '0.4';
}

function handleDragEnd(e) {
    draggedPiece.style.opacity = '1';
    draggedPiece = null;
    startSquare = null;
}

function handleDragOver(e) {
    e.preventDefault(); // Necessary to allow dropping
}

function handleDrop(e) {
    e.preventDefault();
    
    if (!draggedPiece || !startSquare) return;

    // Only allow white pieces to be moved on white's turn
    const piece = board[startSquare.dataset.row][startSquare.dataset.col];
    if (!isWhiteTurn || piece.toLowerCase() === piece) {
        return;
    }

    const fromRow = parseInt(startSquare.dataset.row);
    const fromCol = parseInt(startSquare.dataset.col);
    const toRow = parseInt(e.target.dataset.row || e.target.parentNode.dataset.row);
    const toCol = parseInt(e.target.dataset.col || e.target.parentNode.dataset.col);

    // If king is in check, validate that this move resolves the check
    if (isKingInCheck(true)) {
        if (!doesMoveResolveCheck(fromRow, fromCol, toRow, toCol, piece, true)) {
            document.getElementById('notifications').textContent = 'Invalid move: Must move king out of check';
            return;
        }
    }

    // Create move string and process the move
    const moveString = `${String.fromCharCode(97 + fromCol)}${8 - fromRow}${String.fromCharCode(97 + toCol)}${8 - toRow}`;
    const moveInput = document.getElementById('moveInput');
    moveInput.value = moveString;
    makeMove();
    moveInput.value = '';
}

// Add CSS for drag and drop visual feedback
function addDragStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .piece {
            cursor: grab;
        }
        .piece:active {
            cursor: grabbing;
        }
        .square.valid-drop {
            background-color: rgba(127, 166, 80, 0.4);
        }
    `;
    document.head.appendChild(style);
}

// Call this when initializing the game
document.addEventListener('DOMContentLoaded', () => {
    addDragStyles();
    initializeBoard();
    updateClocks();
    startClock();
});

// Add this test function at the bottom of the file
function testCheckDetection() {
    // Set up a test position where white king is in check
    board = [
        ['k', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', 'q', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', 'K', ' ', ' ', ' ', ' ']
    ];
    
    console.log("Testing check detection...");
    console.log("Is white king in check?", isKingInCheck(true));
    console.log("Is it checkmate?", isCheckmate(true));
    
    // Print the current board state
    console.log("Current board state:");
    board.forEach(row => console.log(row.join(' ')));
}

// Call this from the browser console to test
// testCheckDetection(); 