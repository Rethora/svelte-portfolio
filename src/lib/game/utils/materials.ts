import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export const createPhysicsMaterial = () => {
	return new CANNON.Material('physics');
};

export const createVisualMaterials = () => {
	return {
		default: new THREE.MeshLambertMaterial({ color: 0xafefee }),
		floor: new THREE.MeshLambertMaterial({ color: 0xffffff })
	};
};
