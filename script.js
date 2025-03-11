document.addEventListener('DOMContentLoaded', () => {
    const chessboard = document.getElementById('chessboard');
    const scoreElement = document.getElementById('score');
    const targetNotation = document.getElementById('target-notation');
    const targetDisplay = document.getElementById('target-display');
    const backButton = document.getElementById('back-button');
    
    let score = 0;
    let currentTarget = null;
    
    // Chess board setup
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']; // Reversed for correct visual orientation
    
    // Create the chess board squares
    function createChessboard() {
        chessboard.innerHTML = ''; // Clear existing squares
        
        // Add the target square overlay back
        const targetSquare = document.createElement('div');
        targetSquare.id = 'target-square';
        targetSquare.className = 'absolute text-8xl font-bold text-white opacity-80 pointer-events-none flex items-center justify-center w-full h-full';
        const span = document.createElement('span');
        span.id = 'target-notation';
        targetSquare.appendChild(span);
        
        // Create the 64 squares
        for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
            for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
                const square = document.createElement('div');
                const isLightSquare = (fileIndex + rankIndex) % 2 === 1;
                
                // Set square attributes
                square.className = `chess-square ${isLightSquare ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'}`;
                square.dataset.file = files[fileIndex];
                square.dataset.rank = ranks[rankIndex];
                square.dataset.notation = files[fileIndex] + ranks[rankIndex];
                
                // Add click event
                square.addEventListener('click', () => handleSquareClick(square));
                
                chessboard.appendChild(square);
            }
        }
        
        chessboard.appendChild(targetSquare);
    }
    
    // Generate a random square notation
    function generateRandomSquare() {
        const randomFile = files[Math.floor(Math.random() * 8)];
        const randomRank = ranks[Math.floor(Math.random() * 8)];
        return randomFile + randomRank;
    }
    
    // Handle square click
    function handleSquareClick(square) {
        if (!currentTarget) return;
        
        const clickedNotation = square.dataset.notation;
        
        if (clickedNotation === currentTarget) {
            // Correct square
            score++;
            scoreElement.textContent = score;
            square.classList.add('correct');
            
            // Generate new target after animation
            setTimeout(() => {
                square.classList.remove('correct');
                setNewTarget();
            }, 500);
        } else {
            // Wrong square
            square.classList.add('wrong');
            
            // Remove animation class after it completes
            setTimeout(() => {
                square.classList.remove('wrong');
            }, 500);
        }
    }
    
    // Set a new target square
    function setNewTarget() {
        currentTarget = generateRandomSquare();
        targetNotation.textContent = currentTarget;
        targetDisplay.textContent = currentTarget;
    }
    
    // Initialize the game
    function initGame() {
        createChessboard();
        score = 0;
        scoreElement.textContent = score;
        setNewTarget();
    }
    
    // Back button (just resets the game for now)
    backButton.addEventListener('click', initGame);
    
    // Start the game
    initGame();
}); 