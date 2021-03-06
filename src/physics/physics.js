import * as THREE from 'three';

/** Utility class for the physics system*/
class Physics {

	/**
	 * Checks if a mesh collides with a RayCaster
	 *
	 * @param {THREE.RayCaster} rayCaster - RayCaster that we want to see if it intersects
	 * @param {THREE.Object3D} mesh - Mesh that we want to check if rayCaster intersects with
	 *
	 * @example
	 * // In this case, scene would be the Three.JS scene
	 * Physics.checkRayCollision(new THREE.Raycaster(), scene);
	 *
	 * @returns {boolean|Object} If it intersects, it returns the intersection, if not, false
	 * @static
	 */
	static checkRayCollision(rayCaster, mesh) {
		const isGroup = mesh instanceof THREE.Scene || mesh.children.length > 0;
		const intersections = isGroup ? rayCaster.intersectObjects(mesh.children, true) : rayCaster.intersectObject(mesh, true);

		if (intersections.length > 0) {
			return intersections[0];
		} else {
			return false;
		}
	}

	/**
	 * Checks if two meshes intersect
	 *
	 * @param {THREE.Mesh} mesh - Mesh to check if it intersects
	 * @param {array} collisionArray - Meshes array to check if the mesh intersects with them
	 * @param {number} height - Height up to which collisions are ignored
	 * @param {THREE.Vector3} direction - Direction in which the mesh is currently moving
	 *
	 * @example
	 * // Checks if the Virtual Persona collisions with an array of meshes in the direction it's moving
	 * const direction = new THREE.Vector3();
	 * // Moving on the +X axis
	 * direction.set(1, 0, 0);
	 * direction.applyQuaternion(simbol.vpMesh.quaternion);
	 * Physics.checkMeshCollision(simbol.vpMesh, [mesh1, mesh2], 5, direction);
	 * @returns {boolean}  Whether they intersect or not
	 * @static
	 */
	static checkMeshCollision(mesh, collisionArray, height, direction) {
		const box = new THREE.Box3();
		box.setFromObject(mesh);
		const boxMesh = new THREE.Box3Helper(box);

		if (!this.raycaster) {
			this.raycaster = new THREE.Raycaster();
		}

		// Convert bufferGeometry vertices to an easier to manipular vertices array
		const vertices = [];
		const boundingBoxVertices = boxMesh.geometry.attributes.position.array;
		for (let i = 0; i < boundingBoxVertices.length - 2; i = i + 3) {
			vertices.push(new THREE.Vector3(boundingBoxVertices[i],
				boundingBoxVertices[i + 1],
				boundingBoxVertices[i + 2]));
		}

		for (const vertex of vertices) {
			const globalVertex = vertex.applyMatrix4(mesh.matrix);
			const directionVector = globalVertex.sub(mesh.position);
			const angle = direction.angleTo(directionVector);

			if (angle <= Math.PI / 2) {
				this.raycaster.set(mesh.position, directionVector.clone().normalize());
				this.raycaster.far = directionVector.length();
				const collisionResults = this.raycaster.intersectObjects(collisionArray);

				for (const collision of collisionResults) {
					// Checks if the collision result is positioned taller than the set height
					if (typeof height === 'undefined' || collision.point.y > box.min.y + height) {
						return collision;
					}
				}
			}
		}

		return false;
	}
}

export {Physics};
