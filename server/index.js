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

io.on('connection', (socket) => {
	socket.emit('eventFromServer', 'Hello, World 👋');
});

console.log('Server is running on port', port);

app.use(handler);

server.listen(port);
