import * as THREE from 'three';
import * as CANNON from 'cannon-es';

class Controls extends THREE.EventDispatcher {
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
	private velocityFactor = 0.2;
	private jumpVelocity = 20;
	private inputVelocity = new THREE.Vector3();
	private euler = new THREE.Euler();
	private lockEvent = { type: 'lock' };
	private unlockEvent = { type: 'unlock' };
	private velocity = new CANNON.Vec3();

	constructor(camera: THREE.Camera, cannonBody: CANNON.Body) {
		super();
		this.cannonBody = cannonBody;

		this.pitchObject.add(camera);

		this.yawObject.position.y = 2;
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

		this.yawObject.rotation.y -= movementX * 0.002;
		this.pitchObject.rotation.x -= movementY * 0.002;

		this.pitchObject.rotation.x = Math.max(
			-Math.PI / 2,
			Math.min(Math.PI / 2, this.pitchObject.rotation.x)
		);
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

	update(delta: number) {
		if (this.enabled === false) {
			return;
		}

		delta *= 1000;
		delta *= 0.1;

		this.inputVelocity.set(0, 0, 0);

		if (this.moveForward) {
			this.inputVelocity.z = -this.velocityFactor * delta;
		}
		if (this.moveBackward) {
			this.inputVelocity.z = this.velocityFactor * delta;
		}

		if (this.moveLeft) {
			this.inputVelocity.x = -this.velocityFactor * delta;
		}
		if (this.moveRight) {
			this.inputVelocity.x = this.velocityFactor * delta;
		}

		// Convert velocity to world coordinates
		this.euler.x = this.pitchObject.rotation.x;
		this.euler.y = this.yawObject.rotation.y;
		this.euler.order = 'XYZ';
		this.quaternion.setFromEuler(this.euler);
		this.inputVelocity.applyQuaternion(this.quaternion);

		// Add to the object
		this.velocity.x += this.inputVelocity.x;
		this.velocity.z += this.inputVelocity.z;

		this.yawObject.position.copy(this.cannonBody.position);
	}
}

export { Controls };
