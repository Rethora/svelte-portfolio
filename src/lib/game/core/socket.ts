import { io, Socket } from 'socket.io-client';
import * as CANNON from 'cannon-es';
import type { PlayerState } from '$lib/game/types';
export class SocketService {
	private socket: Socket | null = null;
	private playerId: string | null = null;
	private onPlayerJoined: ((state: PlayerState) => void) | null = null;
	private onPlayerLeft: ((playerId: string) => void) | null = null;
	private onPlayerMoved: ((state: PlayerState) => void) | null = null;

	connect() {
		this.socket = io('http://localhost:3000');

		this.socket.on('connect', () => {
			console.log('Connected to server');
		});

		this.socket.on('disconnect', () => {
			console.log('Disconnected from server');
		});

		this.setupEventListeners();
	}

	private setupEventListeners() {
		if (!this.socket) return;

		this.socket.on('init', ({ playerId, players }) => {
			this.playerId = playerId;
			console.log('playerId init', this.playerId);
			// Initialize existing players, excluding self
			players.forEach((player: PlayerState) => {
				console.log('playerId init', player.id, this.playerId);
				if (player.id !== this.playerId && this.onPlayerJoined) {
					this.onPlayerJoined(player);
				}
			});
		});

		this.socket.on('playerJoined', (playerState: PlayerState) => {
			// Only create remote player if it's not the local player
			console.log('playerId joined', playerState.id, this.playerId);
			if (playerState.id !== this.playerId && this.onPlayerJoined) {
				this.onPlayerJoined(playerState);
			}
		});

		this.socket.on('playerMoved', (playerState: PlayerState) => {
			if (this.onPlayerMoved) {
				this.onPlayerMoved(playerState);
			}
		});

		this.socket.on('playerLeft', (playerId: string) => {
			if (this.onPlayerLeft) {
				this.onPlayerLeft(playerId);
			}
		});
	}

	updatePosition(
		position: CANNON.Vec3,
		rotation: CANNON.Vec3,
		isJumping: boolean,
		velocity: number
	) {
		if (this.socket?.connected) {
			this.socket.emit('updatePosition', {
				position,
				rotation,
				isJumping,
				velocity
			});
		}
	}

	setOnPlayerJoined(callback: (state: PlayerState) => void) {
		this.onPlayerJoined = callback;
	}

	setOnPlayerLeft(callback: (playerId: string) => void) {
		this.onPlayerLeft = callback;
	}

	setOnPlayerMoved(callback: (state: PlayerState) => void) {
		this.onPlayerMoved = callback;
	}

	getPlayerId() {
		return this.playerId;
	}

	disconnect() {
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
		}
	}

	getSocket() {
		return this.socket;
	}
}

export const socketService = new SocketService();
