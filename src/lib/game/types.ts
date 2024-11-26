import type { Vector3 } from 'three';

export interface PlayerState {
	id: string;
	position: Vector3;
	rotation: Vector3;
	isJumping: boolean;
	velocity: number;
}
