class ChessRules {
    static isValidMove(fromRow, fromCol, toRow, toCol, piece, board) {
        const pieceType = piece.toLowerCase();
        const isWhite = piece === piece.toUpperCase();

        if (!this.isWithinBoard(fromRow, fromCol) || !this.isWithinBoard(toRow, toCol)) {
            return { valid: false, error: "Move outside board" };
        }

        // Can't capture your own pieces
        const targetPiece = board[toRow][toCol];
        if (targetPiece !== ' ' && 
            (isWhite === (targetPiece === targetPiece.toUpperCase()))) {
            return { valid: false, error: "Cannot capture your own piece" };
        }

        let validation;
        switch (pieceType) {
            case 'p': validation = this.isValidPawnMove(fromRow, fromCol, toRow, toCol, isWhite, board); break;
            case 'r': validation = this.isValidRookMove(fromRow, fromCol, toRow, toCol, board); break;
            case 'n': validation = this.isValidKnightMove(fromRow, fromCol, toRow, toCol); break;
            case 'b': validation = this.isValidBishopMove(fromRow, fromCol, toRow, toCol, board); break;
            case 'q': validation = this.isValidQueenMove(fromRow, fromCol, toRow, toCol, board); break;
            case 'k': validation = this.isValidKingMove(fromRow, fromCol, toRow, toCol, board); break;
            default: return { valid: false, error: "Invalid piece" };
        }

        if (!validation.valid) return validation;

        // Check if move would leave/put own king in check
        const tempBoard = board.map(row => [...row]);
        tempBoard[toRow][toCol] = piece;
        tempBoard[fromRow][fromCol] = ' ';
        
        if (this.isKingInCheck(isWhite, tempBoard)) {
            return { valid: false, error: "Move would leave/put own king in check" };
        }

        return { valid: true };
    }

    static isKingInCheck(isWhiteKing, board) {
        const kingPos = this.findKing(isWhiteKing, board);
        if (!kingPos) return false;

        return this.isSquareUnderAttack(kingPos.row, kingPos.col, isWhiteKing, board);
    }

    static isCheckmate(isWhiteKing, board) {
        if (!this.isKingInCheck(isWhiteKing, board)) return false;

        // Try all possible moves for all pieces
        for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
                const piece = board[fromRow][fromCol];
                if (piece === ' ' || (isWhiteKing !== (piece === piece.toUpperCase()))) continue;
                
                for (let toRow = 0; toRow < 8; toRow++) {
                    for (let toCol = 0; toCol < 8; toCol++) {
                        if (fromRow === toRow && fromCol === toCol) continue;
                        if (this.isValidMove(fromRow, fromCol, toRow, toCol, piece, board).valid) {
                            return false;
                        }
                    }
                }
            }
        }
        return true;
    }

    static isValidPawnMove(fromRow, fromCol, toRow, toCol, isWhite, board) {
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
        if (Math.abs(deltaCol) === 1 && deltaRow === direction) {
            const targetPiece = board[toRow][toCol];
            if (targetPiece !== ' ' && isWhite !== (targetPiece === targetPiece.toUpperCase())) {
                return { valid: true };
            }
        }

        return { valid: false, error: "Invalid pawn move" };
    }

    static isValidRookMove(fromRow, fromCol, toRow, toCol, board) {
        if (fromRow !== toRow && fromCol !== toCol) {
            return { valid: false, error: "Rook must move in straight lines" };
        }

        const rowStep = fromRow === toRow ? 0 : (toRow - fromRow) / Math.abs(toRow - fromRow);
        const colStep = fromCol === toCol ? 0 : (toCol - fromCol) / Math.abs(toCol - fromCol);
        
        let currentRow = fromRow + rowStep;
        let currentCol = fromCol + colStep;
        
        while (currentRow !== toRow || currentCol !== toCol) {
            if (board[currentRow][currentCol] !== ' ') {
                return { valid: false, error: "Path is blocked" };
            }
            currentRow += rowStep;
            currentCol += colStep;
        }

        return { valid: true };
    }

    static isValidKnightMove(fromRow, fromCol, toRow, toCol) {
        const deltaRow = Math.abs(toRow - fromRow);
        const deltaCol = Math.abs(toCol - fromCol);
        
        if ((deltaRow === 2 && deltaCol === 1) || (deltaRow === 1 && deltaCol === 2)) {
            return { valid: true };
        }
        return { valid: false, error: "Invalid knight move" };
    }

    static isValidBishopMove(fromRow, fromCol, toRow, toCol, board) {
        const deltaRow = Math.abs(toRow - fromRow);
        const deltaCol = Math.abs(toCol - fromCol);
        
        if (deltaRow !== deltaCol) {
            return { valid: false, error: "Bishop must move diagonally" };
        }

        const rowStep = (toRow - fromRow) / deltaRow;
        const colStep = (toCol - fromCol) / deltaCol;
        
        let currentRow = fromRow + rowStep;
        let currentCol = fromCol + colStep;
        
        while (currentRow !== toRow) {
            if (board[currentRow][currentCol] !== ' ') {
                return { valid: false, error: "Path is blocked" };
            }
            currentRow += rowStep;
            currentCol += colStep;
        }

        return { valid: true };
    }

    static isValidQueenMove(fromRow, fromCol, toRow, toCol, board) {
        const rookValid = this.isValidRookMove(fromRow, fromCol, toRow, toCol, board);
        const bishopValid = this.isValidBishopMove(fromRow, fromCol, toRow, toCol, board);
        
        if (rookValid.valid || bishopValid.valid) {
            return { valid: true };
        }
        return { valid: false, error: "Invalid queen move" };
    }

    static isValidKingMove(fromRow, fromCol, toRow, toCol, board) {
        const deltaRow = Math.abs(toRow - fromRow);
        const deltaCol = Math.abs(toCol - fromCol);
        
        if (deltaRow <= 1 && deltaCol <= 1) {
            return { valid: true };
        }
        return { valid: false, error: "Invalid king move" };
    }

    static isWithinBoard(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    static findKing(isWhiteKing, board) {
        const kingPiece = isWhiteKing ? 'K' : 'k';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col] === kingPiece) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    static isSquareUnderAttack(row, col, isWhiteKing, board) {
        for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
                const piece = board[fromRow][fromCol];
                if (piece === ' ' || (isWhiteKing === (piece === piece.toUpperCase()))) {
                    continue;
                }
                
                const validation = this.isValidMove(fromRow, fromCol, row, col, piece, board);
                if (validation.valid) {
                    return true;
                }
            }
        }
        return false;
    }
} 