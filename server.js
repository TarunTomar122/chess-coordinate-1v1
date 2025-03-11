const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname, '/')));

// Game state management
const rooms = new Map();

// Handle socket connections
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Player wants to join a room
  socket.on('joinRoom', ({ playerName, roomName }) => {
    console.log(`${playerName} (${socket.id}) is trying to join room: ${roomName}`);
    
    // Sanitize room name to avoid special characters
    const sanitizedRoomName = roomName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    
    if (!sanitizedRoomName) {
      socket.emit('roomError', { message: 'Invalid room name' });
      return;
    }
    
    // Check if room exists
    if (!rooms.has(sanitizedRoomName)) {
      // Create new room with first player
      const room = {
        id: sanitizedRoomName,
        players: [
          { id: socket.id, name: playerName, score: 0, mistakes: 0 }
        ],
        currentPlayerIndex: 0,
        targetSquare: generateRandomSquare(),
        targetTimestamp: Date.now(),
        active: true,
        full: false
      };
      
      rooms.set(sanitizedRoomName, room);
      
      // Join socket to room
      socket.join(sanitizedRoomName);
      
      // Notify player they're waiting for an opponent
      socket.emit('waitingForOpponent', { roomName: sanitizedRoomName });
      console.log(`Created new room: ${sanitizedRoomName} with player: ${playerName}`);
      
    } else {
      // Room exists, try to join
      const room = rooms.get(sanitizedRoomName);
      
      // Check if room is full
      if (room.players.length >= 2 || room.full) {
        socket.emit('roomError', { message: 'Room is full' });
        return;
      }
      
      // Check for duplicate names and modify if needed
      let uniquePlayerName = playerName;
      const existingPlayer = room.players.find(p => p.name === playerName);
      if (existingPlayer) {
        uniquePlayerName = `${playerName}_2`;
      }
      
      // Add second player to room
      room.players.push({ id: socket.id, name: uniquePlayerName, score: 0, mistakes: 0 });
      room.full = true;
      
      // Join socket to room
      socket.join(sanitizedRoomName);
      
      // Send game start to first player
      io.to(room.players[0].id).emit('gameStart', {
        roomId: sanitizedRoomName,
        playerInfo: {
          name: room.players[0].name,
          isFirstPlayer: true
        },
        opponentInfo: {
          name: uniquePlayerName
        },
        targetSquare: room.targetSquare,
        currentPlayer: room.players[0].name
      });
      
      // Send game start to second player
      socket.emit('gameStart', {
        roomId: sanitizedRoomName,
        playerInfo: {
          name: uniquePlayerName,
          isFirstPlayer: false
        },
        opponentInfo: {
          name: room.players[0].name
        },
        targetSquare: room.targetSquare,
        currentPlayer: room.players[0].name
      });
      
      console.log(`Player ${uniquePlayerName} joined existing room: ${sanitizedRoomName}`);
    }
  });

  // Handle player moves
  socket.on('makeMove', ({ roomId, square }) => {
    const room = rooms.get(roomId);
    if (!room || !room.active) return;

    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    if (playerIndex === -1) return;

    const currentPlayer = room.players[room.currentPlayerIndex];
    
    // Verify it's the player's turn
    if (currentPlayer.id !== socket.id) {
      socket.emit('notYourTurn');
      return;
    }

    // Check if move is correct
    const isCorrect = square === room.targetSquare;
    
    // Initialize points earned
    let pointsEarned = 0;
    let timeTaken = 0;
    let mistakePenalty = 0;
    
    if (isCorrect) {
      // Calculate time-based score
      timeTaken = (Date.now() - room.targetTimestamp) / 1000; // Time in seconds
      const baseScore = 5; // Maximum possible score
      
      // Calculate time penalty (faster = less penalty)
      // Time penalty increases as time increases, capped at 3 points
      const timePenalty = Math.min(3, Math.floor(timeTaken / 2));
      
      // Calculate mistake penalty (1 point per mistake, max 2 points)
      mistakePenalty = Math.min(2, currentPlayer.mistakes);
      
      // Calculate final score (minimum 1 point for correct answer)
      pointsEarned = Math.max(1, baseScore - timePenalty - mistakePenalty);
      
      // Update score
      currentPlayer.score += pointsEarned;
      
      // Reset mistakes counter for next turn
      currentPlayer.mistakes = 0;
      
      console.log(`${currentPlayer.name} earned ${pointsEarned} points (time: ${timeTaken.toFixed(1)}s, mistakes: ${mistakePenalty})`);
    } else {
      // Increment mistake counter for wrong answers
      currentPlayer.mistakes += 1;
    }
    
    // Switch turns
    room.currentPlayerIndex = (room.currentPlayerIndex + 1) % 2;
    const nextPlayer = room.players[room.currentPlayerIndex];

    // Generate new target square for next turn
    const newTargetSquare = generateRandomSquare();
    room.targetSquare = newTargetSquare;
    room.targetTimestamp = Date.now(); // Reset timestamp for new target

    // Create update payload
    const updatePayload = {
      moveResult: {
        player: currentPlayer.name,
        correct: isCorrect,
        pointsEarned: pointsEarned
      },
      scores: {
        [room.players[0].name]: room.players[0].score,
        [room.players[1].name]: room.players[1].score
      },
      currentPlayer: nextPlayer.name,
      targetSquare: newTargetSquare
    };

    // Broadcast to all players in the room
    io.in(roomId).emit('gameStateUpdate', updatePayload);
    
    // Log the broadcast
    console.log('Broadcasting update to room:', roomId, updatePayload);
  });

  // Handle disconnections
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Check all rooms
    for (const [roomId, room] of rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex !== -1) {
        // If room has only one player, just remove the room
        if (room.players.length === 1) {
          rooms.delete(roomId);
          console.log(`Removed room ${roomId} as the only player left`);
          return;
        }
        
        // Otherwise, notify the other player
        const otherPlayerIndex = (playerIndex + 1) % 2;
        const otherPlayer = room.players[otherPlayerIndex];
        
        // Notify other player
        io.to(otherPlayer.id).emit('opponentLeft', {
          winner: otherPlayer.name,
          finalScores: {
            [otherPlayer.name]: otherPlayer.score,
            [room.players[playerIndex].name]: room.players[playerIndex].score
          }
        });
        
        room.active = false;
        rooms.delete(roomId);
        console.log(`Player ${room.players[playerIndex].name} left room ${roomId}, notified ${otherPlayer.name}`);
        break;
      }
    }
  });
});

// Generate random chess square
function generateRandomSquare() {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
  return files[Math.floor(Math.random() * 8)] + ranks[Math.floor(Math.random() * 8)];
}

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 