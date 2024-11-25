import { io, Socket } from 'socket.io-client';
import type { Vector3 } from 'three';

export class SocketService {
	private socket: Socket | null = null;

	connect() {
		this.socket = io('http://localhost:3000', {
			autoConnect: true
		});

		this.socket.on('connect', () => {
			throw new Error('Not implemented');
		});

		this.socket.on('disconnect', () => {
			throw new Error('Not implemented');
		});

		this.setupEventListeners();
	}

	private setupEventListeners() {
		if (!this.socket) return;

		this.socket.on('init', (data) => {
			throw new Error('Not implemented');
		});

		this.socket.on('playerJoined', (data) => {
			throw new Error('Not implemented');
		});

		this.socket.on('playerMoved', (data) => {
			throw new Error('Not implemented');
		});

		this.socket.on('playerLeft', (data) => {
			throw new Error('Not implemented');
		});
	}

	updatePosition(playerId: string, position: Vector3, rotation: Vector3) {
		if (this.socket?.connected) {
			this.socket.emit('updatePosition', {
				playerId,
				position,
				rotation
			});
		}
	}

	disconnect() {
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
		}
	}
}

export const socketService = new SocketService();
