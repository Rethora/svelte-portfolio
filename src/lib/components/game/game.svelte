<script lang="ts">
	import * as CANNON from 'cannon-es';
	import * as THREE from 'three';
	import Stats from 'three/addons/libs/stats.module.js';
	import { Controls } from '$lib/game/systems/controls';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	/**
	 * Example of a really barebones version of a fps game.
	 */

	// three.js variables
	let camera: THREE.PerspectiveCamera;
	let scene: THREE.Scene;
	let renderer: THREE.WebGLRenderer;
	let stats: Stats;
	let material: THREE.MeshLambertMaterial;
	let floorMaterial: THREE.MeshLambertMaterial;

	// cannon.js variables
	let world: CANNON.World;
	let controls: Controls;
	const timeStep = 1 / 60;
	let lastCallTime = performance.now();
	let bodyShape: CANNON.Sphere;
	let body: CANNON.Body;
	let physicsMaterial: CANNON.Material;
	const balls: CANNON.Body[] = [];
	const ballMeshes: THREE.Mesh[] = [];
	const boxes: CANNON.Body[] = [];
	const boxMeshes: THREE.Mesh[] = [];

	onMount(() => {
		initThree();
		initCannon();
		initPointerLock();
		animate();
	});

	function initThree() {
		// Camera
		camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

		// Scene
		scene = new THREE.Scene();
		scene.fog = new THREE.Fog(0x000000, 0, 500);

		// Renderer
		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setClearColor(scene.fog.color);

		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;

		document.body.appendChild(renderer.domElement);

		// Stats.js
		stats = new Stats();
		document.body.appendChild(stats.dom);

		// Lights
		const ambientLight = new THREE.AmbientLight(0x404040);
		scene.add(ambientLight);

		const light = new THREE.DirectionalLight(0xffffff);
		light.position.set(10, 10, 10);
		light.target.position.set(0, 0, 0);
		light.castShadow = true;
		// const spotlight = new THREE.SpotLight(0xffffff, 0.9, 0);
		// spotlight.position.set(10, 30, 20);
		// spotlight.target.position.set(0, 0, 0);

		// spotlight.castShadow = true;

		// spotlight.shadow.camera.near = 10;
		// spotlight.shadow.camera.far = 100;
		// spotlight.shadow.camera.fov = 30;

		// // spotlight.shadow.bias = -0.0001
		// spotlight.shadow.mapSize.width = 2048;
		// spotlight.shadow.mapSize.height = 2048;

		scene.add(light);

		// Generic material
		material = new THREE.MeshLambertMaterial({ color: 0xafefee });
		floorMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });

		// Floor
		const floorGeometry = new THREE.PlaneGeometry(300, 300, 100, 100);
		floorGeometry.rotateX(-Math.PI / 2);
		const floor = new THREE.Mesh(floorGeometry, floorMaterial);
		floor.receiveShadow = true;
		scene.add(floor);

		window.addEventListener('resize', onWindowResize);
	}

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	}

	function initCannon() {
		world = new CANNON.World();

		// Tweak contact properties.
		// Contact stiffness - use to make softer/harder contacts
		world.defaultContactMaterial.contactEquationStiffness = 1e9;

		// Stabilization time in number of timesteps
		world.defaultContactMaterial.contactEquationRelaxation = 4;

		const solver = new CANNON.GSSolver();
		solver.iterations = 7;
		solver.tolerance = 0.1;
		world.solver = new CANNON.SplitSolver(solver);
		// use this to test non-split solver
		// world.solver = solver

		world.gravity.set(0, -20, 0);

		// Create a slippery material (friction coefficient = 0.0)
		physicsMaterial = new CANNON.Material('physics');
		const physics_physics = new CANNON.ContactMaterial(physicsMaterial, physicsMaterial, {
			friction: 0.3,
			restitution: 0.3,
			contactEquationStiffness: 1e9,
			contactEquationRelaxation: 4
		});

		// We must add the contact materials to the world
		world.addContactMaterial(physics_physics);

		// Create the user collision sphere
		const radius = 1.3;
		bodyShape = new CANNON.Sphere(radius);
		body = new CANNON.Body({ mass: 5, material: physicsMaterial });
		body.addShape(bodyShape);
		body.position.set(0, 5, 0);
		body.linearDamping = 0.9;
		world.addBody(body);

		// Create the ground plane
		const groundShape = new CANNON.Plane();
		const groundBody = new CANNON.Body({ mass: 0, material: physicsMaterial });
		groundBody.addShape(groundShape);
		groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
		world.addBody(groundBody);

		// Add boxes both in cannon.js and three.js
		const halfExtents = new CANNON.Vec3(1, 1, 1);
		const boxShape = new CANNON.Box(halfExtents);
		const boxGeometry = new THREE.BoxGeometry(
			halfExtents.x * 2,
			halfExtents.y * 2,
			halfExtents.z * 2
		);

		for (let i = 0; i < 7; i++) {
			const boxBody = new CANNON.Body({ mass: 5 });
			boxBody.addShape(boxShape);
			const boxMesh = new THREE.Mesh(boxGeometry, material);

			const x = (Math.random() - 0.5) * 20;
			const y = (Math.random() - 0.5) * 1 + 1;
			const z = (Math.random() - 0.5) * 20;

			boxBody.position.set(x, y, z);
			boxMesh.position.copy(boxBody.position);

			boxMesh.castShadow = true;
			boxMesh.receiveShadow = true;

			world.addBody(boxBody);
			scene.add(boxMesh);
			boxes.push(boxBody);
			boxMeshes.push(boxMesh);
		}

		// Add linked boxes
		const size = 0.5;
		const mass = 0.3;
		const space = 0.1 * size;
		const N = 5;
		const halfExtents2 = new CANNON.Vec3(size, size, size * 0.1);
		const boxShape2 = new CANNON.Box(halfExtents2);
		const boxGeometry2 = new THREE.BoxGeometry(
			halfExtents2.x * 2,
			halfExtents2.y * 2,
			halfExtents2.z * 2
		);

		let last;
		for (let i = 0; i < N; i++) {
			// Make the fist one static to support the others
			const boxBody = new CANNON.Body({ mass: i === 0 ? 0 : mass });
			boxBody.addShape(boxShape2);
			const boxMesh = new THREE.Mesh(boxGeometry2, material);
			boxBody.position.set(5, (N - i) * (size * 2 + 2 * space) + size * 2 + space, 0);
			boxBody.linearDamping = 0.01;
			boxBody.angularDamping = 0.01;

			boxMesh.castShadow = true;
			boxMesh.receiveShadow = true;

			world.addBody(boxBody);
			scene.add(boxMesh);
			boxes.push(boxBody);
			boxMeshes.push(boxMesh);

			if (i > 0) {
				// Connect the body to the last one
				const constraint1 = new CANNON.PointToPointConstraint(
					boxBody,
					new CANNON.Vec3(-size, size + space, 0),
					last!,
					new CANNON.Vec3(-size, -size - space, 0)
				);
				const constraint2 = new CANNON.PointToPointConstraint(
					boxBody,
					new CANNON.Vec3(size, size + space, 0),
					last!,
					new CANNON.Vec3(size, -size - space, 0)
				);
				world.addConstraint(constraint1);
				world.addConstraint(constraint2);
			}

			last = boxBody;
		}

		// The shooting balls
		const shootVelocity = 15;
		const ballShape = new CANNON.Sphere(0.2);
		const ballGeometry = new THREE.SphereGeometry(ballShape.radius, 32, 32);

		// Returns a vector pointing the the diretion the camera is at
		function getShootDirection() {
			const vector = new THREE.Vector3(0, 0, 1);
			vector.unproject(camera);
			const ray = new THREE.Ray(
				new THREE.Vector3().copy(body.position),
				vector.sub(body.position).normalize()
			);
			return ray.direction;
		}

		window.addEventListener('click', (event) => {
			if (!controls.getEnabled()) {
				return;
			}

			const ballBody = new CANNON.Body({ mass: 5 });
			ballBody.addShape(ballShape);
			const ballMesh = new THREE.Mesh(ballGeometry, material);

			ballMesh.castShadow = true;
			ballMesh.receiveShadow = true;

			world.addBody(ballBody);
			scene.add(ballMesh);
			balls.push(ballBody);
			ballMeshes.push(ballMesh);

			const shootDirection = getShootDirection();
			ballBody.velocity.set(
				shootDirection.x * shootVelocity,
				shootDirection.y * shootVelocity,
				shootDirection.z * shootVelocity
			);

			// Move the ball outside the player sphere
			const x = body.position.x + shootDirection.x * (bodyShape.radius * 1.02 + ballShape.radius);
			const y = body.position.y + shootDirection.y * (bodyShape.radius * 1.02 + ballShape.radius);
			const z = body.position.z + shootDirection.z * (bodyShape.radius * 1.02 + ballShape.radius);
			ballBody.position.set(x, y, z);
			ballMesh.position.copy(ballBody.position);
		});
	}

	function initPointerLock() {
		controls = new Controls(camera, body);
		scene.add(controls.getObject());

		if (!browser) {
			return;
		}

		const instructions = document.getElementById('instructions');

		if (!instructions) {
			return;
		}

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

	function animate() {
		requestAnimationFrame(animate);

		const time = performance.now() / 1000;
		const dt = time - lastCallTime;
		lastCallTime = time;

		if (controls.getEnabled()) {
			world.step(timeStep, dt);

			// Update ball positions
			for (let i = 0; i < balls.length; i++) {
				ballMeshes[i].position.copy(balls[i].position);
				ballMeshes[i].quaternion.copy(balls[i].quaternion);
			}

			// Update box positions
			for (let i = 0; i < boxes.length; i++) {
				boxMeshes[i].position.copy(boxes[i].position);
				boxMeshes[i].quaternion.copy(boxes[i].quaternion);
			}
		}

		controls.update(dt);
		renderer.render(scene, camera);
		stats.update();
	}
</script>

<div id="instructions">
	<span>Click to play</span>
	<br />
	(W,A,S,D = Move, SPACE = Jump, MOUSE = Look, CLICK = Shoot)
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
