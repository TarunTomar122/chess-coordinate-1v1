document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loginScreen = document.getElementById('login-screen');
    const waitingScreen = document.getElementById('waiting-screen');
    const gameScreen = document.getElementById('game-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const statusToast = document.getElementById('status-toast');
    const statusMessage = document.getElementById('status-message');
    
    const playerNameInput = document.getElementById('player-name');
    const roomNameInput = document.getElementById('room-name');
    const findGameBtn = document.getElementById('find-game-btn');
    const playerNameDisplay = document.getElementById('player-name-display');
    const opponentNameDisplay = document.getElementById('opponent-name-display');
    const playerScore = document.getElementById('player-score');
    const opponentScore = document.getElementById('opponent-score');
    const currentPlayerDisplay = document.getElementById('current-player');
    const targetDisplay = document.getElementById('target-display');
    const targetNotation = document.getElementById('target-notation');
    const chessboard = document.getElementById('chessboard');
    const backButton = document.getElementById('back-button');
    const playAgainBtn = document.getElementById('play-again-btn');
    const waitingRoomName = document.getElementById('waiting-room-name');
    
    const winnerDisplay = document.getElementById('winner-display');
    const finalPlayerName = document.getElementById('final-player-name');
    const finalOpponentName = document.getElementById('final-opponent-name');
    const finalPlayerScore = document.getElementById('final-player-score');
    const finalOpponentScore = document.getElementById('final-opponent-score');
    
    // Game state
    let socket;
    let gameState = {
        playerName: '',
        opponentName: '',
        roomId: '',
        isPlayerTurn: false,
        targetSquare: '',
        scores: {
            player: 0,
            opponent: 0
        }
    };
    
    // Chess board setup
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']; // Reversed for correct visual orientation
    
    function initializeSocket() {
        socket = io();
        
        socket.on('connect', () => {
            console.log('Connected to server');
        });
        
        socket.on('waitingForOpponent', ({ roomName }) => {
            waitingRoomName.textContent = roomName;
            showScreen(waitingScreen);
        });
        
        socket.on('roomError', ({ message }) => {
            showToast(message);
        });
        
        socket.on('gameStart', ({ roomId, playerInfo, opponentInfo, targetSquare, currentPlayer }) => {
            // Initialize game state
            gameState.roomId = roomId;
            gameState.playerName = playerInfo.name;
            gameState.opponentName = opponentInfo.name;
            gameState.targetSquare = targetSquare;
            gameState.isPlayerTurn = currentPlayer === playerInfo.name;
            
            // Update UI
            playerNameDisplay.textContent = playerInfo.name;
            opponentNameDisplay.textContent = opponentInfo.name;
            targetDisplay.textContent = targetSquare;
            
            // Update target notation if it exists
            const targetNotationElement = document.getElementById('target-notation');
            if (targetNotationElement) {
                targetNotationElement.textContent = targetSquare;
            }
            
            // Reset scores
            updateScores({
                [playerInfo.name]: 0,
                [opponentInfo.name]: 0
            });
            
            // Update turn highlighting
            updateTurnHighlight();
            
            showScreen(gameScreen);
            showToast(`Game started! ${currentPlayer}'s turn`);
        });
        
        socket.on('gameStateUpdate', ({ moveResult, scores, currentPlayer, targetSquare }) => {
            console.log('Game state update received:', { moveResult, scores, currentPlayer, targetSquare });
            
            // Update game state
            gameState.isPlayerTurn = currentPlayer === gameState.playerName;
            gameState.targetSquare = targetSquare;
            
            console.log('Updated game state:', {
                isPlayerTurn: gameState.isPlayerTurn,
                playerName: gameState.playerName,
                currentPlayer: currentPlayer,
                targetSquare: gameState.targetSquare
            });
            
            // Force immediate UI updates
            requestAnimationFrame(() => {
                // Update target square display
                targetDisplay.textContent = targetSquare;
                const targetNotationElement = document.getElementById('target-notation');
                if (targetNotationElement) {
                    targetNotationElement.textContent = targetSquare;
                }
                
                // Update scores
                if (scores) {
                    playerScore.textContent = scores[gameState.playerName] || 0;
                    opponentScore.textContent = scores[gameState.opponentName] || 0;
                    gameState.scores = {
                        player: scores[gameState.playerName] || 0,
                        opponent: scores[gameState.opponentName] || 0
                    };
                }
                
                // Update turn display and highlighting
                updateTurnHighlight();
                
                // Show toast notification for turn change
                if (gameState.isPlayerTurn) {
                    showToast("It's your turn!", 2000);
                } else {
                    showToast(`It's ${gameState.opponentName}'s turn`, 2000);
                }
            });
            
            // Show appropriate message based on the move result
            if (moveResult.correct) {
                if (moveResult.player === gameState.playerName) {
                    showToast(`Correct! +${moveResult.pointsEarned} points. Your opponent's turn`);
                } else {
                    showToast(`${moveResult.player} found the correct square! +${moveResult.pointsEarned} points. Your turn`);
                }
            } else {
                if (moveResult.player === gameState.playerName) {
                    showToast('Wrong square. Your opponent\'s turn');
                } else {
                    showToast(`${moveResult.player} clicked the wrong square! Your turn`);
                }
            }
        });
        
        socket.on('notYourTurn', () => {
            showToast("It's not your turn!");
        });
        
        socket.on('opponentLeft', ({ winner, finalScores }) => {
            winnerDisplay.textContent = `${winner} wins! (Opponent left)`;
            finalPlayerName.textContent = gameState.playerName;
            finalOpponentName.textContent = gameState.opponentName;
            finalPlayerScore.textContent = finalScores[gameState.playerName];
            finalOpponentScore.textContent = finalScores[gameState.opponentName];
            
            showScreen(gameOverScreen);
        });
        
        socket.on('disconnect', () => {
            showToast('Disconnected from server');
        });
    }
    
    function updateScores(scores) {
        if (!scores) return;
        
        // Update scores based on player names
        playerScore.textContent = scores[gameState.playerName] || 0;
        opponentScore.textContent = scores[gameState.opponentName] || 0;
        
        // Update game state
        gameState.scores = {
            player: scores[gameState.playerName] || 0,
            opponent: scores[gameState.opponentName] || 0
        };
    }
    
    function updateTurnHighlight() {
        const chessboard = document.getElementById('chessboard');
        
        if (gameState.isPlayerTurn) {
            playerNameDisplay.classList.add('text-yellow-300');
            opponentNameDisplay.classList.remove('text-yellow-300');
            currentPlayerDisplay.textContent = gameState.playerName;
            
            // Add active-turn class to the chessboard when it's the player's turn
            chessboard.classList.add('active-turn');
            chessboard.classList.remove('inactive-turn');
        } else {
            playerNameDisplay.classList.remove('text-yellow-300');
            opponentNameDisplay.classList.add('text-yellow-300');
            currentPlayerDisplay.textContent = gameState.opponentName;
            
            // Add inactive-turn class when it's not the player's turn
            chessboard.classList.remove('active-turn');
            chessboard.classList.add('inactive-turn');
        }
    }
    
    function handleSquareClick(square) {
        if (!gameState.isPlayerTurn) {
            showToast("It's not your turn!");
            return;
        }
        
        const clickedNotation = square.dataset.notation;
        const isCorrect = clickedNotation === gameState.targetSquare;
        
        // Show visual feedback immediately
        if (isCorrect) {
            square.classList.add('correct');
            setTimeout(() => square.classList.remove('correct'), 500);
        } else {
            square.classList.add('wrong');
            setTimeout(() => square.classList.remove('wrong'), 500);
        }
        
        // Send move to server
        socket.emit('makeMove', {
            roomId: gameState.roomId,
            square: clickedNotation
        });
    }
    
    function createChessboard() {
        chessboard.innerHTML = '';
        
        // Add the target square overlay first
        const targetSquareOverlay = document.createElement('div');
        targetSquareOverlay.id = 'target-square';
        targetSquareOverlay.className = 'absolute text-8xl font-bold text-white opacity-80 pointer-events-none flex items-center justify-center w-full h-full';
        const targetSpan = document.createElement('span');
        targetSpan.id = 'target-notation';
        targetSquareOverlay.appendChild(targetSpan);
        chessboard.appendChild(targetSquareOverlay);
        
        // Create the 64 squares
        for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
            for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
                const square = document.createElement('div');
                const isLightSquare = (fileIndex + rankIndex) % 2 === 1;
                
                square.className = `chess-square ${isLightSquare ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'}`;
                square.dataset.file = files[fileIndex];
                square.dataset.rank = ranks[rankIndex];
                square.dataset.notation = files[fileIndex] + ranks[rankIndex];
                
                square.addEventListener('click', () => handleSquareClick(square));
                
                chessboard.appendChild(square);
            }
        }
    }
    
    function showToast(message, duration = 3000) {
        statusMessage.textContent = message;
        statusToast.classList.remove('hidden');
        
        setTimeout(() => {
            statusToast.classList.add('hidden');
        }, duration);
    }
    
    function showScreen(screen) {
        loginScreen.classList.add('hidden');
        waitingScreen.classList.add('hidden');
        gameScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        
        screen.classList.remove('hidden');
    }
    
    // Event listeners
    findGameBtn.addEventListener('click', () => {
        const name = playerNameInput.value.trim();
        const room = roomNameInput.value.trim();
        
        if (!name) {
            showToast('Please enter your name');
            return;
        }
        
        if (!room) {
            showToast('Please enter a room name');
            return;
        }
        
        gameState.playerName = name;
        initializeSocket();
        socket.emit('joinRoom', { playerName: name, roomName: room });
    });
    
    backButton.addEventListener('click', () => {
        if (socket) {
            socket.disconnect();
        }
        showScreen(loginScreen);
    });
    
    playAgainBtn.addEventListener('click', () => {
        if (socket) {
            socket.disconnect();
        }
        
        // Reset game state
        gameState = {
            playerName: '',
            opponentName: '',
            roomId: '',
            isPlayerTurn: false,
            targetSquare: '',
            scores: {
                player: 0,
                opponent: 0
            }
        };
        
        showScreen(loginScreen);
    });
    
    // Initialize the game
    createChessboard();
    showScreen(loginScreen);
}); 