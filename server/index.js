import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { handler } from '../build/handler.js';

const port = 3000;
const app = express();
const server = createServer(app);

const io = new SocketIOServer(server, {
	cors: {
		origin: ['http://localhost:3000', 'http://localhost:4173', 'http://localhost:5173'],
		methods: ['GET', 'POST'],
		credentials: true
	}
});

// Track connected players
const players = new Map();

io.on('connection', (socket) => {
	const playerId = socket.id;

	// Initialize player
	const playerState = {
		id: playerId,
		position: { x: 0, y: 5, z: 0 },
		rotation: { x: 0, y: 0, z: 0 },
		isJumping: false
	};

	players.set(playerId, playerState);

	// Send initial state to new player
	socket.emit('init', {
		playerId,
		players: Array.from(players.values())
	});

	// Broadcast new player to others
	socket.broadcast.emit('playerJoined', playerState);

	// Handle position updates
	socket.on('updatePosition', ({ position, rotation }) => {
		const player = players.get(playerId);
		if (player) {
			player.position = position;
			player.rotation = rotation;
			socket.broadcast.emit('playerMoved', player);
		}
	});

	// Handle disconnection
	socket.on('disconnect', () => {
		players.delete(playerId);
		io.emit('playerLeft', playerId);
	});
});

console.log('Server is running on port', port);

app.use(handler);

server.listen(port);
