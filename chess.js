let gameInstance;
let uiInstance;

function togglePause() {
    if (gameInstance) {
        const isPaused = gameInstance.togglePause();
        uiInstance.updatePauseButton(isPaused);
    }
}

function changeTimeControl() {
    if (gameInstance) {
        const timeControl = document.getElementById('timeControl');
        const [minutes, increment] = timeControl.value.split('+').map(Number);
        gameInstance.changeTimeControl(minutes, increment);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('Initializing chess game...');
        gameInstance = new ChessGame();
        uiInstance = new ChessUI(gameInstance);
        
        // Initialize game
        uiInstance.updateDisplay();
        console.log('Chess game initialized successfully');
    } catch (error) {
        console.error('Error initializing chess game:', error);
    }
}); 