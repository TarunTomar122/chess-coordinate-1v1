# Chess Square Identification Game - Multiplayer

A web-based game to help chess players practice identifying squares on a chess board. Now with multiplayer support!

## How to Play

1. Enter your name and click "Find a Game"
2. Wait for another player to join, or share the link with a friend
3. The game shows a chess notation (e.g., "a2" or "g6") and you take turns finding the correct square
4. Click on the correct square on the chess board to score points
5. The faster you answer, the more points you earn (up to 5 points per correct answer)
6. Wrong answers reduce your potential points for that turn
7. The player with the most points at the end wins!

## Scoring System

- **Base score**: 5 points for each correct answer
- **Time penalty**: -1 point for every 2 seconds taken (maximum -3 points)
- **Mistake penalty**: -1 point for each wrong attempt (maximum -2 points)
- **Minimum score**: 1 point (you always get at least 1 point for a correct answer)

## Features

- **Multiplayer**: Play against your friends online
- **Turn-based gameplay**: Take turns finding the correct squares
- **Real-time updates**: See your opponent's moves instantly
- **Time-based scoring**: Faster answers earn more points
- **Score tracking**: Keep track of scores for both players
- **Visual feedback**: Animations for correct and incorrect moves
- **Responsive design**: Works on desktop and mobile devices

## Technologies Used

- HTML5
- CSS3 with animations
- JavaScript
- Tailwind CSS for styling
- Socket.io for real-time communication
- Express.js for the server

## Getting Started

### Prerequisites

- Node.js and npm installed

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

5. To play with a friend, they need to navigate to the same URL. You can play on the same network or deploy the game to a hosting service like Heroku, Render, or Vercel.

## Deployment

To deploy the game online so you can play with friends anywhere, you can use services like:

- [Render](https://render.com)
- [Heroku](https://heroku.com)
- [Vercel](https://vercel.com)
- [Railway](https://railway.app)

## License

MIT 
