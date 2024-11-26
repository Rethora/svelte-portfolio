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
		methods: ['GET', 'POST']
	}
});

// Track connected players
const players = new Map();

// Constants for timeout checks
const TIMEOUT_INTERVAL = 30000; // 30 seconds
const MIN_MOVEMENT_DISTANCE = 1; // Minimum distance player should move

// Calculate distance between two points
function getDistance(pos1, pos2) {
	return Math.sqrt(
		Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2) + Math.pow(pos2.z - pos1.z, 2)
	);
}

io.on('connection', (socket) => {
	console.log('connection', socket.id);
	const playerId = socket.id;

	// Initialize player
	const playerState = {
		id: playerId,
		position: { x: 0, y: 5, z: 0 },
		rotation: { x: 0, y: 0, z: 0 },
		isJumping: false,
		velocity: 0,
		lastPosition: { x: 0, y: 5, z: 0 },
		lastMoveTime: Date.now()
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
	socket.on('updatePosition', ({ position, rotation, velocity }) => {
		const player = players.get(playerId);
		if (player) {
			const distance = getDistance(player.lastPosition, position);

			if (distance > MIN_MOVEMENT_DISTANCE) {
				player.lastPosition = { ...player.position };
				player.lastMoveTime = Date.now();
			}

			player.position = position;
			player.rotation = rotation;
			player.velocity = velocity;
			socket.broadcast.emit('playerMoved', player);
		}
	});

	// Handle disconnection
	socket.on('disconnect', () => {
		players.delete(playerId);
		io.emit('playerLeft', playerId);
	});
});

// Check for inactive players periodically
setInterval(() => {
	const now = Date.now();
	for (const [playerId, player] of players.entries()) {
		if (now - player.lastMoveTime > TIMEOUT_INTERVAL) {
			// Player hasn't moved enough in the timeout period
			const socket = io.sockets.sockets.get(playerId);
			if (socket) {
				console.log(`Disconnecting inactive player: ${playerId}`);
				socket.disconnect(true);
			}
			players.delete(playerId);
			io.emit('playerLeft', playerId);
		}
	}
}, TIMEOUT_INTERVAL);

console.log('Server is running on port', port);

app.use(handler);

server.listen(port);
