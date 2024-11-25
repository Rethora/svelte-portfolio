import { io, Socket } from 'socket.io-client';
import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import type { PlayerState } from '$lib/game/types';
export class SocketService {
	private socket: Socket | null = null;
	private playerId: string | null = null;
	private onPlayerJoined: ((state: PlayerState) => void) | null = null;
	private onPlayerLeft: ((playerId: string) => void) | null = null;
	private onPlayerMoved: ((state: PlayerState) => void) | null = null;

	connect() {
		this.socket = io('http://localhost:3000', {
			autoConnect: true
		});

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
			// Initialize existing players
			players.forEach((player: PlayerState) => {
				if (this.onPlayerJoined) {
					this.onPlayerJoined(player);
				}
			});
		});

		this.socket.on('playerJoined', (playerState: PlayerState) => {
			if (this.onPlayerJoined) {
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

	updatePosition(position: CANNON.Vec3, rotation: THREE.Vector3) {
		if (this.socket?.connected) {
			this.socket.emit('updatePosition', {
				position,
				rotation
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
}

export const socketService = new SocketService();
