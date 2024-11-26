import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { CONTROLS, PLAYER } from '$lib/game/utils/constants';
import { socketService } from '$lib/game/core/socket';
import { Character } from '$lib/game/models/character';

export class Controls extends THREE.EventDispatcher {
	private enabled = false;
	private isLocked = false;
	private cannonBody: CANNON.Body;
	private pitchObject = new THREE.Object3D();
	private yawObject = new THREE.Object3D();
	private quaternion = new THREE.Quaternion();
	private moveForward = false;
	private moveBackward = false;
	private moveLeft = false;
	private moveRight = false;
	private canJump = false;
	private velocityFactor = CONTROLS.VELOCITY_FACTOR;
	private jumpVelocity = CONTROLS.JUMP_VELOCITY;
	private inputVelocity = new THREE.Vector3();
	private euler = new THREE.Euler();
	private lockEvent = { type: 'lock' };
	private unlockEvent = { type: 'unlock' };
	private velocity = new CANNON.Vec3();
	private character: Character | null = null;
	private minPitch = -Math.PI / 6;
	private maxPitch = Math.PI / 6;
	private pov: 'first' | 'third' = 'third';
	private eyeWorldPosition = new THREE.Vector3();
	private eyeForwardVector = new THREE.Vector3();
	private boneRotations = {
		spine1: 0,
		spine2: 0,
		spine3: 0,
		neck: 0,
		head: 0
	};

	constructor(camera: THREE.Camera, cannonBody: CANNON.Body) {
		super();
		this.cannonBody = cannonBody;

		const baseEyeHeight = PLAYER.MODEL.EYE_LEVEL * PLAYER.MODEL.SCALE;

		if (this.pov === 'first') {
			camera.position.set(0, 0, PLAYER.CAMERA.FORWARD_OFFSET);
			this.pitchObject.position.set(0, baseEyeHeight, 0);
		} else if (this.pov === 'third') {
			camera.position.set(0, 4, 4);
			camera.lookAt(0, 0, -3);
		}

		this.pitchObject.add(camera);

		this.minPitch = PLAYER.CAMERA.PITCH_MIN;
		this.maxPitch = PLAYER.CAMERA.PITCH_MAX;

		this.yawObject.add(this.pitchObject);

		const contactNormal = new CANNON.Vec3(); // Normal in the contact, pointing *out* of whatever the player touched
		const upAxis = new CANNON.Vec3(0, 1, 0);
		this.cannonBody.addEventListener(
			'collide',
			(event: { contact: { bi: { id: number }; bj: { id: number }; ni: CANNON.Vec3 } }) => {
				const { contact } = event;

				// contact.bi and contact.bj are the colliding bodies, and contact.ni is the collision normal.
				// We do not yet know which one is which! Let's check.
				if (contact.bi.id === this.cannonBody.id) {
					// bi is the player body, flip the contact normal
					contact.ni.negate(contactNormal);
				} else {
					// bi is something else. Keep the normal as it is
					contactNormal.copy(contact.ni);
				}

				// If contactNormal.dot(upAxis) is between 0 and 1, we know that the contact normal is somewhat in the up direction.
				if (contactNormal.dot(upAxis) > 0.5) {
					// Use a "good" threshold value between 0 and 1 here!
					this.canJump = true;
				}
			}
		);

		this.velocity = this.cannonBody.velocity;

		// Moves the camera to the cannon.js object position and adds velocity to the object if the run key is down
		this.inputVelocity = new THREE.Vector3();
		this.euler = new THREE.Euler();

		this.connect();
	}

	connect() {
		document.addEventListener('mousemove', this.onMouseMove);
		document.addEventListener('pointerlockchange', this.onPointerlockChange);
		document.addEventListener('pointerlockerror', this.onPointerlockError);
		document.addEventListener('keydown', this.onKeyDown);
		document.addEventListener('keyup', this.onKeyUp);
	}

	disconnect() {
		document.removeEventListener('mousemove', this.onMouseMove);
		document.removeEventListener('pointerlockchange', this.onPointerlockChange);
		document.removeEventListener('pointerlockerror', this.onPointerlockError);
		document.removeEventListener('keydown', this.onKeyDown);
		document.removeEventListener('keyup', this.onKeyUp);
	}

	dispose() {
		this.disconnect();
	}

	lock() {
		document.body.requestPointerLock();
	}

	unlock() {
		document.exitPointerLock();
	}

	onPointerlockChange = () => {
		if (document.pointerLockElement) {
			// @ts-expect-error Event type is not correct
			this.dispatchEvent(this.lockEvent);

			this.isLocked = true;
		} else {
			// @ts-expect-error Event type is not correct
			this.dispatchEvent(this.unlockEvent);

			this.isLocked = false;
		}
	};

	onPointerlockError = () => {
		console.error('PointerLockControlsCannon: Unable to use Pointer Lock API');
	};

	onMouseMove = (event: MouseEvent) => {
		if (!this.enabled) {
			return;
		}

		const { movementX, movementY } = event;

		this.yawObject.rotation.y -= movementX * CONTROLS.MOUSE_SENSITIVITY;

		const pitchSensitivity = CONTROLS.MOUSE_SENSITIVITY * 0.8;
		const newPitch = this.pitchObject.rotation.x - movementY * pitchSensitivity;

		this.pitchObject.rotation.x = Math.max(this.minPitch, Math.min(this.maxPitch, newPitch));
	};

	onKeyDown = (event: KeyboardEvent) => {
		switch (event.code) {
			case 'KeyW':
			case 'ArrowUp':
				this.moveForward = true;
				break;

			case 'KeyA':
			case 'ArrowLeft':
				this.moveLeft = true;
				break;

			case 'KeyS':
			case 'ArrowDown':
				this.moveBackward = true;
				break;

			case 'KeyD':
			case 'ArrowRight':
				this.moveRight = true;
				break;

			case 'Space':
				if (this.canJump) {
					this.velocity.y = this.jumpVelocity;
				}
				this.canJump = false;
				break;
		}
	};

	onKeyUp = (event: KeyboardEvent) => {
		switch (event.code) {
			case 'KeyW':
			case 'ArrowUp':
				this.moveForward = false;
				break;

			case 'KeyA':
			case 'ArrowLeft':
				this.moveLeft = false;
				break;

			case 'KeyS':
			case 'ArrowDown':
				this.moveBackward = false;
				break;

			case 'KeyD':
			case 'ArrowRight':
				this.moveRight = false;
				break;
		}
	};

	getObject() {
		return this.yawObject;
	}

	getDirection() {
		const vector = new CANNON.Vec3(0, 0, -1);
		// vector.applyQuaternion(this.quaternion);
		return vector;
	}

	getEnabled() {
		return this.enabled;
	}

	setEnabled(enabled: boolean) {
		this.enabled = enabled;
	}

	public setCharacter(character: Character) {
		this.character = character;
	}

	public updateBoneRotations(rotations: {
		spine1: number;
		spine2: number;
		spine3: number;
		neck: number;
		head: number;
	}) {
		this.boneRotations = rotations;
	}

	private calculateEyePosition(): THREE.Vector3 {
		const spineHeight = PLAYER.MODEL.SPINE_BASE * PLAYER.MODEL.SCALE;

		// Start from base position
		const position = new THREE.Vector3(0, spineHeight, 0);

		// Apply spine1 rotation
		position.y += Math.cos(this.boneRotations.spine1) * 0.2;
		position.z += Math.sin(this.boneRotations.spine1) * 0.2;

		// Apply spine2 rotation
		position.y += Math.cos(this.boneRotations.spine2) * 0.2;
		position.z += Math.sin(this.boneRotations.spine2) * 0.2;

		// Apply spine3 rotation
		position.y += Math.cos(this.boneRotations.spine3) * 0.2;
		position.z += Math.sin(this.boneRotations.spine3) * 0.2;

		// Apply neck rotation
		position.y += Math.cos(this.boneRotations.neck) * 0.15;
		position.z += Math.sin(this.boneRotations.neck) * 0.15;

		// Apply head rotation and eye offset
		position.y += Math.cos(this.boneRotations.head) * 0.1;
		position.z += Math.sin(this.boneRotations.head) * 0.1;

		// Add eye forward offset
		position.z += PLAYER.MODEL.EYE_FORWARD;

		return position;
	}

	update(dt: number): void {
		if (this.enabled === false) {
			return;
		}

		dt *= 1000;
		dt *= 0.1;

		this.inputVelocity.set(0, 0, 0);

		if (this.moveForward) {
			this.inputVelocity.z = -this.velocityFactor * dt;
		}
		if (this.moveBackward) {
			this.inputVelocity.z = this.velocityFactor * dt;
		}

		if (this.moveLeft) {
			this.inputVelocity.x = -this.velocityFactor * dt;
		}
		if (this.moveRight) {
			this.inputVelocity.x = this.velocityFactor * dt;
		}

		// Convert velocity to world coordinates
		this.euler.x = 0;
		this.euler.y = this.yawObject.rotation.y;
		this.euler.order = 'XYZ';
		this.quaternion.setFromEuler(this.euler);
		this.inputVelocity.applyQuaternion(this.quaternion);

		// Add to the object
		this.velocity.x += this.inputVelocity.x;
		this.velocity.z += this.inputVelocity.z;

		// Update character position and rotation
		if (this.character) {
			const characterPosition = new THREE.Vector3(
				this.cannonBody.position.x,
				this.cannonBody.position.y,
				this.cannonBody.position.z
			);

			this.character.setPosition(characterPosition);
			this.character.setRotation(new THREE.Vector3(0, this.yawObject.rotation.y, 0));

			const normalizedPitch = this.pitchObject.rotation.x * PLAYER.CAMERA.HEAD_PITCH_RATIO;
			this.character.updateRotations(normalizedPitch);

			// Get bone rotations back from character for camera sync
			if (this.pov === 'first') {
				// Calculate new eye position based on bone chain
				const eyePosition = this.calculateEyePosition();

				// Update pitch object position to match eye position
				this.pitchObject.position.copy(eyePosition);

				// Get the camera
				const camera = this.pitchObject.children[0] as THREE.Camera;

				// Update camera local position to maintain eye alignment
				camera.position.set(0, 0, PLAYER.CAMERA.FORWARD_OFFSET);
			}

			const velocity = Math.sqrt(
				this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z
			);

			if (!this.canJump) {
				this.character.jump();
			} else if (velocity > 5) {
				this.character.run();
			} else if (velocity > 0.1) {
				this.character.walk();
			} else {
				this.character.idle();
			}
		}

		// Update yaw object position
		this.yawObject.position.copy(this.cannonBody.position);

		// Calculate velocity magnitude for animation state
		const velocity = Math.sqrt(
			this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z
		);

		// Send position update to server
		socketService.updatePosition(
			this.cannonBody.position,
			new CANNON.Vec3(0, this.yawObject.rotation.y, 0),
			!this.canJump,
			velocity
		);
	}
}
