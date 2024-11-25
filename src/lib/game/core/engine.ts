import Stats from 'three/addons/libs/stats.module.js';
import { Scene } from './scene';
import { PhysicsWorld } from './world';
import { Controls } from '../systems/controls';
import { PHYSICS } from '../utils/constants';

export class Engine {
	private scene: Scene;
	private world: PhysicsWorld;
	private controls: Controls;
	private stats: Stats;
	private lastCallTime: number;

	constructor(scene: Scene, world: PhysicsWorld, controls: Controls) {
		this.scene = scene;
		this.world = world;
		this.controls = controls;
		this.stats = new Stats();
		this.lastCallTime = performance.now();

		document.body.appendChild(this.stats.dom);
	}

	public animate = () => {
		requestAnimationFrame(this.animate);

		const time = performance.now() / 1000;
		const dt = time - this.lastCallTime;
		this.lastCallTime = time;

		if (this.controls.getEnabled()) {
			this.world.step(PHYSICS.TIME_STEP, dt);
			this.scene.updateBoxes(this.world.getBoxes());
		}

		this.controls.update(dt);
		this.scene.render();
		this.stats.update();
	};
}
