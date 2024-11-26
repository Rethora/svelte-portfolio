import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PLAYER } from '$lib/game/utils/constants';
import { Controls } from '$lib/game/systems/controls';

export class Character {
	private model: THREE.Group | null = null;
	private mixer: THREE.AnimationMixer | null = null;
	private animations: Map<string, THREE.AnimationAction> = new Map();
	private currentAnimation: THREE.AnimationAction | null = null;
	private headBone: THREE.Bone | null = null;
	private neckBone: THREE.Bone | null = null;
	private spine3Bone: THREE.Bone | null = null;
	private spine2Bone: THREE.Bone | null = null;
	private spine1Bone: THREE.Bone | null = null;
	private headRotation: number = 0;
	private controls: Controls | null = null;

	constructor() {
		// Initialize empty group to hold the model
		this.model = new THREE.Group();
	}

	async init(): Promise<void> {
		try {
			const gltf = await this.loadModel('https://threejs.org/examples/models/gltf/Xbot.glb');
			this.model = gltf.scene;

			// Find and store references to important bones
			this.model.traverse((object) => {
				if (object instanceof THREE.Bone) {
					const name = object.name.toLowerCase();
					// Be more specific with bone names
					if (name === 'mixamorighead' || name === 'head') {
						this.headBone = object;
					} else if (name === 'mixamorigneck' || name === 'neck') {
						this.neckBone = object;
					} else if (name === 'mixamorigspine3' || name === 'spine.003') {
						this.spine3Bone = object;
					} else if (name === 'mixamorigspine2' || name === 'spine.002') {
						this.spine2Bone = object;
					} else if (name === 'mixamorigspine1' || name === 'spine.001') {
						this.spine1Bone = object;
					}
				}
			});

			// Setup animations
			this.mixer = new THREE.AnimationMixer(this.model);

			this.model.scale.set(PLAYER.HEIGHT, PLAYER.HEIGHT, PLAYER.HEIGHT);

			// Store all animations
			gltf.animations.forEach((clip) => {
				const action = this.mixer!.clipAction(clip);
				this.animations.set(clip.name, action);
			});

			// Set default animation
			this.playAnimation('idle');
		} catch (error) {
			console.error('Failed to load character model:', error);
		}
	}

	private loadModel(url: string): Promise<GLTF> {
		const loader = new GLTFLoader();
		return new Promise((resolve, reject) => {
			loader.load(
				url,
				(gltf) => resolve(gltf),
				undefined,
				(error) => reject(error)
			);
		});
	}

	public update(delta: number): void {
		if (this.mixer) {
			this.mixer.update(delta);
		}

		// Apply graduated rotations to create a natural spine curve
		this.updateSpineChain();
	}

	private updateSpineChain(): void {
		if (!this.headRotation) return;

		// Adjust distribution weights to create a hunching motion
		const rotationDistribution = {
			spine1: 0.4, // Increased significantly for hunching
			spine2: 0.3, // Mid spine follows the hunch
			spine3: 0.2, // Upper spine less rotation
			neck: 0.2, // Neck follows naturally
			head: 0.3 // Head completes the motion
		};

		// Apply rotations in sequence, each building on the previous
		if (this.spine1Bone) {
			// Base of spine rotates the most for hunching
			const rotation = this.headRotation * rotationDistribution.spine1;
			this.spine1Bone.rotation.x = rotation;
		}

		if (this.spine2Bone) {
			// Mid spine follows the hunch
			const rotation = this.headRotation * rotationDistribution.spine2;
			this.spine2Bone.rotation.x = rotation;
		}

		if (this.spine3Bone) {
			// Upper spine maintains posture
			const rotation = this.headRotation * rotationDistribution.spine3;
			this.spine3Bone.rotation.x = rotation;
		}

		if (this.neckBone) {
			// Neck follows the motion
			const rotation = this.headRotation * rotationDistribution.neck;
			this.neckBone.rotation.x = rotation;
		}

		if (this.headBone) {
			// Head completes the motion
			const rotation = this.headRotation * rotationDistribution.head;
			this.headBone.rotation.x = rotation;
		}

		// Collect all rotations
		const rotations = {
			spine1: this.spine1Bone?.rotation.x || 0,
			spine2: this.spine2Bone?.rotation.x || 0,
			spine3: this.spine3Bone?.rotation.x || 0,
			neck: this.neckBone?.rotation.x || 0,
			head: this.headBone?.rotation.x || 0
		};

		// Send rotations to controls for camera sync
		if (this.controls) {
			this.controls.updateBoneRotations(rotations);
		}
	}

	public updateRotations(pitch: number): void {
		// Invert and amplify the pitch slightly for more pronounced hunching
		const invertedPitch = -pitch * 1.2;

		// Clamp the pitch rotation with wider range for hunching
		this.headRotation = Math.max(Math.min(invertedPitch, Math.PI / 2), -Math.PI / 2);
	}

	public getObject(): THREE.Group {
		return this.model!;
	}

	public setPosition(position: THREE.Vector3): void {
		if (this.model) {
			// Adjust model position to be on the ground
			const modelPosition = new THREE.Vector3().copy(position);
			modelPosition.y -= PLAYER.RADIUS; // Use physics radius for offset
			this.model.position.copy(modelPosition);
		}
	}

	public setRotation(rotation: THREE.Vector3): void {
		if (this.model) {
			this.model.rotation.y = rotation.y + Math.PI;
		}
	}

	public playAnimation(name: string, crossFadeDuration: number = 0.2): void {
		const newAction = this.animations.get(name);
		const oldAction = this.currentAnimation;

		if (newAction && newAction !== oldAction) {
			// Fade out old animation
			if (oldAction) {
				oldAction.fadeOut(crossFadeDuration);
			}

			// Fade in new animation
			newAction
				.reset()
				.setEffectiveTimeScale(1)
				.setEffectiveWeight(1)
				.fadeIn(crossFadeDuration)
				.play();

			this.currentAnimation = newAction;
		}
	}

	public idle(): void {
		this.playAnimation('idle');
	}

	public walk(): void {
		this.playAnimation('walk');
	}

	public run(): void {
		this.playAnimation('run');
	}

	public jump(): void {
		this.playAnimation('jump');
	}

	public setControls(controls: Controls) {
		this.controls = controls;
	}
}
