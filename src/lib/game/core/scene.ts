import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { createVisualMaterials } from '../utils/materials';
import type { PlayerState } from '$lib/game/types';

export class Scene {
	private scene: THREE.Scene;
	private camera: THREE.PerspectiveCamera;
	private renderer: THREE.WebGLRenderer;
	private boxMeshes: THREE.Mesh[] = [];
	private materials = createVisualMaterials();
	private remotePlayers: Map<string, THREE.Object3D> = new Map();

	constructor() {
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.init();
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
		this.renderer.render(this.scene, this.camera);
	}

	public handleResize() {
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
			this.boxMeshes[i].position.copy(bodies[i].position as any);
			this.boxMeshes[i].quaternion.copy(bodies[i].quaternion as any);
		}
	}

	public createRemotePlayer(playerState: PlayerState) {
		const geometry = new THREE.BoxGeometry(1, 2, 1);
		const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
		const playerMesh = new THREE.Mesh(geometry, material);

		playerMesh.position.copy(playerState.position);
		this.scene.add(playerMesh);
		this.remotePlayers.set(playerState.id, playerMesh);
	}

	public removeRemotePlayer(playerId: string) {
		const playerMesh = this.remotePlayers.get(playerId);
		if (playerMesh) {
			this.scene.remove(playerMesh);
			this.remotePlayers.delete(playerId);
		}
	}

	public updateRemotePlayer(playerState: PlayerState) {
		const playerMesh = this.remotePlayers.get(playerState.id);
		if (playerMesh) {
			playerMesh.position.copy(playerState.position);
			playerMesh.rotation.setFromVector3(playerState.rotation);
		}
	}
}
