<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { Scene } from '$lib/game/core/scene';
	import { PhysicsWorld } from '$lib/game/core/world';
	import { Engine } from '$lib/game/core/engine';
	import { Controls } from '$lib/game/systems/controls';
	import { createPhysicsMaterial, createVisualMaterials } from '$lib/game/utils/materials';
	import { PLAYER, PHYSICS } from '$lib/game/utils/constants';
	import * as CANNON from 'cannon-es';
	import { socketService } from '$lib/game/core/socket';

	let scene: Scene;
	let world: PhysicsWorld;
	let engine: Engine;
	let controls: Controls;

	function createRandomBoxes(count: number) {
		for (let i = 0; i < count; i++) {
			const x = 0;
			const y = 0;
			const z = i * -6;

			const boxBody = world.createBox({ x, y, z });
			scene.createBoxMesh();
		}
	}

	onMount(() => {
		scene = new Scene();
		world = new PhysicsWorld();

		// Initialize player physics
		const physicsMaterial = createPhysicsMaterial();
		world.createContactMaterial(physicsMaterial);
		const playerBody = createPlayerBody(physicsMaterial);
		world.addBody(playerBody);

		// Initialize controls
		controls = new Controls(scene.getCamera(), playerBody);
		scene.add(controls.getObject());

		// Initialize engine
		engine = new Engine(scene, world, controls);

		// Connect to socket server first
		socketService.connect();

		// Set up socket handlers
		socketService.setOnPlayerJoined((playerState) => {
			scene.createRemotePlayer(playerState);
		});

		socketService.setOnPlayerLeft((playerId) => {
			scene.removeRemotePlayer(playerId);
		});

		socketService.setOnPlayerMoved((playerState) => {
			scene.updateRemotePlayer(playerState);
		});

		// Wait for socket connection and then create local player
		const socket = socketService.getSocket();
		if (socket) {
			socket.on('connect', async () => {
				// Create local player character after connection
				const localPlayer = await scene.createLocalPlayer();
				controls.setCharacter(localPlayer);
			});
		}

		// Create some random boxes
		createRandomBoxes(7);

		// Start animation loop
		engine.animate();

		// Setup event listeners
		initPointerLock();
		window.addEventListener('resize', scene.handleResize);

		return () => {
			controls.dispose();
			window.removeEventListener('resize', scene.handleResize);
			socketService.disconnect();
		};
	});

	function createPlayerBody(material: CANNON.Material) {
		const shape = new CANNON.Sphere(PLAYER.RADIUS);
		const body = new CANNON.Body({
			mass: PLAYER.MASS,
			material
		});
		body.addShape(shape);
		body.position.set(PLAYER.START_POSITION.x, PLAYER.START_POSITION.y, PLAYER.START_POSITION.z);
		body.linearDamping = PLAYER.LINEAR_DAMPING;
		return body;
	}

	function initPointerLock() {
		if (!browser) return;

		const instructions = document.getElementById('instructions');
		if (!instructions) return;

		instructions.addEventListener('click', () => {
			controls.lock();
		});

		// @ts-expect-error Event type is never
		controls.addEventListener('lock', () => {
			controls.setEnabled(true);
			if (browser) {
				instructions.style.display = 'none';
			}
		});

		// @ts-expect-error Event type is never
		controls.addEventListener('unlock', () => {
			controls.setEnabled(false);
			if (browser) {
				instructions.style.display = '';
			}
		});
	}
</script>

<div id="instructions">
	<span>Click to play</span>
	<br />
	(W,A,S,D = Move, SPACE = Jump, MOUSE = Look)
</div>

<style>
	#instructions {
		position: fixed;
		left: 0;
		top: 0;

		width: 100%;
		height: 100%;

		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;

		background-color: rgba(0, 0, 0, 0.5);
		color: #ffffff;
		text-align: center;

		cursor: pointer;
	}
	#instructions span {
		font-size: 40px;
	}
</style>
