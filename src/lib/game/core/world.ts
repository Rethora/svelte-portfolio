import * as CANNON from 'cannon-es';
import { PHYSICS } from '../utils/constants';

export class PhysicsWorld {
	private world: CANNON.World;
	private boxes: CANNON.Body[] = [];

	constructor() {
		this.world = new CANNON.World();
		this.init();
		this.initGroundPlane();
	}

	private init() {
		this.world.defaultContactMaterial.contactEquationStiffness = PHYSICS.CONTACT_MATERIAL.STIFFNESS;
		this.world.defaultContactMaterial.contactEquationRelaxation =
			PHYSICS.CONTACT_MATERIAL.RELAXATION;

		const solver = new CANNON.GSSolver();
		solver.iterations = PHYSICS.SOLVER.ITERATIONS;
		solver.tolerance = PHYSICS.SOLVER.TOLERANCE;
		this.world.solver = new CANNON.SplitSolver(solver);

		this.world.gravity.set(0, PHYSICS.GRAVITY, 0);
	}

	private initGroundPlane() {
		const groundShape = new CANNON.Plane();
		const groundBody = new CANNON.Body({ mass: 0 });
		groundBody.addShape(groundShape);
		groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
		this.world.addBody(groundBody);
	}

	public getWorld() {
		return this.world;
	}

	public step(timeStep: number, dt: number) {
		this.world.step(timeStep, dt);
	}

	public addBody(body: CANNON.Body) {
		this.world.addBody(body);
	}

	public addContactMaterial(material: CANNON.ContactMaterial) {
		this.world.addContactMaterial(material);
	}

	public addConstraint(constraint: CANNON.Constraint) {
		this.world.addConstraint(constraint);
	}

	public createContactMaterial(material: CANNON.Material) {
		const physics_physics = new CANNON.ContactMaterial(material, material, {
			friction: PHYSICS.CONTACT_MATERIAL.FRICTION,
			restitution: PHYSICS.CONTACT_MATERIAL.RESTITUTION,
			contactEquationStiffness: PHYSICS.CONTACT_MATERIAL.STIFFNESS,
			contactEquationRelaxation: PHYSICS.CONTACT_MATERIAL.RELAXATION
		});
		this.world.addContactMaterial(physics_physics);
		return physics_physics;
	}

	public createBox(position: { x: number; y: number; z: number }, size = 1) {
		const halfExtents = new CANNON.Vec3(size, size, size);
		const boxShape = new CANNON.Box(halfExtents);
		const boxBody = new CANNON.Body({ mass: 5 });
		boxBody.addShape(boxShape);
		boxBody.position.set(position.x, position.y, position.z);
		this.world.addBody(boxBody);
		this.boxes.push(boxBody);
		return boxBody;
	}

	public getBoxes() {
		return this.boxes;
	}
}
