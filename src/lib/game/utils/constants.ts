export const PHYSICS = {
	TIME_STEP: 1 / 60,
	GRAVITY: -25,
	CONTACT_MATERIAL: {
		FRICTION: 0.3,
		RESTITUTION: 0.3,
		STIFFNESS: 1e9,
		RELAXATION: 4
	},
	SOLVER: {
		ITERATIONS: 7,
		TOLERANCE: 0.1
	}
};

export const PLAYER = {
	MASS: 5,
	RADIUS: 0.3,
	LINEAR_DAMPING: 0.9,
	START_POSITION: { x: 0, y: 5, z: 0 },
	HEIGHT: 2,

	// Character model constraints
	MODEL: {
		SCALE: 2,
		HEAD_HEIGHT: 1.6, // Height of head from ground
		NECK_HEIGHT: 1.4, // Height of neck from ground
		SPINE_TOP: 1.3, // Height of top spine from ground
		SPINE_MID: 1.1, // Height of mid spine from ground
		SPINE_BASE: 0.9, // Height of base spine from ground
		HEAD_FORWARD: 0.1, // How far forward the head is from center
		NECK_FORWARD: 0.05, // How far forward the neck is from center
		EYE_LEVEL: 1.55, // Exact eye level height
		EYE_FORWARD: 0.12 // How far forward eyes are from center
	},

	// Camera constraints
	CAMERA: {
		HEIGHT_OFFSET: 0.05, // Small offset above eye level
		FORWARD_OFFSET: 0.12, // Match to eye forward position
		PITCH_MIN: -Math.PI / 2, // Reduced down angle (-90 degrees)
		PITCH_MAX: Math.PI / 2, // Reduced up angle (90 degrees)
		HEAD_PITCH_RATIO: 0.5 // Reduced head follow ratio for more natural movement
	}
};

export const PROJECTILE = {
	RADIUS: 0.2,
	MASS: 5,
	VELOCITY: 15
};

export const CONTROLS = {
	VELOCITY_FACTOR: 0.2,
	JUMP_VELOCITY: 20,
	MOUSE_SENSITIVITY: 0.002
};
