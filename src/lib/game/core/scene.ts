import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Character } from '$lib/game/models/character';
import { createVisualMaterials } from '$lib/game/utils/materials';
import type { PlayerState } from '$lib/game/types';

export class Scene {
	private scene: THREE.Scene;
	private camera: THREE.PerspectiveCamera;
	private renderer: THREE.WebGLRenderer;
	private boxMeshes: THREE.Mesh[] = [];
	private materials = createVisualMaterials();
	private remotePlayers: Map<string, Character> = new Map();
	private lastTime: number = 0;
	private localPlayer: Character | null = null;

	constructor() {
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(
			90,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.init();
		window.addEventListener('resize', () => this.handleResize());
		document.body.appendChild(this.renderer.domElement);
	}

	private init() {
		this.scene.fog = new THREE.Fog(0x000000, 0, 500);
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setClearColor(this.scene.fog.color);
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

		this.setupLights();

		const floorGeometry = new THREE.PlaneGeometry(300, 300, 100, 100);
		floorGeometry.rotateX(-Math.PI / 2);
		const floorMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
		const floor = new THREE.Mesh(floorGeometry, floorMaterial);
		floor.receiveShadow = true;
		this.scene.add(floor);
	}

	private setupLights() {
		const ambientLight = new THREE.AmbientLight(0x404040);
		this.scene.add(ambientLight);

		const light = new THREE.DirectionalLight(0xffffff);
		light.position.set(10, 10, 10);
		light.target.position.set(0, 0, 0);
		light.castShadow = true;
		this.scene.add(light);
	}

	public getScene() {
		return this.scene;
	}

	public getCamera() {
		return this.camera;
	}

	public getRenderer() {
		return this.renderer;
	}

	public add(object: THREE.Object3D) {
		this.scene.add(object);
	}

	public render() {
		const time = performance.now();
		const delta = (time - this.lastTime) / 1000;

		// Update local player animation if it exists
		if (this.localPlayer) {
			this.localPlayer.update(delta);
		}

		// Update remote players
		this.remotePlayers.forEach((character) => {
			character.update(delta);
		});

		this.renderer.render(this.scene, this.camera);
		this.lastTime = time;
	}

	public handleResize() {
		if (!this.camera || !this.renderer) return;

		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}

	public createBoxMesh(size = 1) {
		const boxGeometry = new THREE.BoxGeometry(size * 2, size * 2, size * 2);
		const boxMesh = new THREE.Mesh(boxGeometry, this.materials.default);
		boxMesh.castShadow = true;
		boxMesh.receiveShadow = true;
		this.scene.add(boxMesh);
		this.boxMeshes.push(boxMesh);
		return boxMesh;
	}

	public updateBoxes(bodies: CANNON.Body[]) {
		for (let i = 0; i < bodies.length; i++) {
			this.boxMeshes[i].position.copy(bodies[i].position);
			this.boxMeshes[i].quaternion.copy(bodies[i].quaternion);
		}
	}

	public async createRemotePlayer(playerState: PlayerState) {
		const character = new Character();
		await character.init();

		character.setPosition(playerState.position);
		character.setRotation(playerState.rotation);

		this.scene.add(character.getObject());
		this.remotePlayers.set(playerState.id, character);
	}

	public removeRemotePlayer(playerId: string) {
		const character = this.remotePlayers.get(playerId);
		if (character) {
			this.scene.remove(character.getObject());
			this.remotePlayers.delete(playerId);
		}
	}

	public updateRemotePlayer(playerState: PlayerState) {
		console.log('playerState', playerState);
		const character = this.remotePlayers.get(playerState.id);
		if (character) {
			character.setPosition(playerState.position);
			character.setRotation(playerState.rotation);

			// Update animation based on state
			if (playerState.isJumping) {
				character.jump();
			} else if (playerState.velocity > 5) {
				character.run();
			} else if (playerState.velocity > 0.1) {
				character.walk();
			} else {
				character.idle();
			}
		}
	}

	public async createLocalPlayer() {
		this.localPlayer = new Character();
		await this.localPlayer.init();

		// Add character to scene
		this.scene.add(this.localPlayer.getObject());

		return this.localPlayer;
	}
}
