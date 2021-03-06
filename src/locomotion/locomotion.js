import * as THREE from 'three';
import {Teleportation} from './_teleportation';

/** Class for all general locomotion purposes */
class Locomotion {

	/** @property {number} velocity - translation velocity in m/s */
	get velocity() {
		if (!this._velocity) {
			this._velocity = 2;
		}
		return this._velocity;
	}

	set velocity(velocity) {
		this._velocity = velocity;
	}

	/** @property {number} angularVelocity - angular velocity */
	get angularVelocity() {
		if (!this._angularVelocity) {
			this._angularVelocity = 1;
		}
		return this._angularVelocity;
	}

	set angularVelocity(angularVelocity) {
		this._angularVelocity = angularVelocity;
	}

	/**
	 * @property {object} orientation - contains quaternion and euler angles
	 * @property {THREE.Quaternion} orientation.quaternion - Quaternion representing the orientation set by phi and theta
	 * @property {THREE.Euler} orientation.euler - Euler angles representing the orientation set by phi and theta
	 */
	get orientation() {
		if (!this._orientation) {
			this._orientation = {
				quaternion: new THREE.Quaternion(),
				euler: new THREE.Euler()
			};
		}
		return this._orientation;
	}

	set orientation(orientation) {
		this._orientation = orientation;
	}

	/** @property {THREE.Vector2} currentRotation - current rotation vector */
	get currentRotation() {
		if (!this._currentRotation) {
			this._currentRotation = new THREE.Vector2();
		}
		return this._currentRotation;
	}

	set currentRotation(currentRotation) {
		this._currentRotation = currentRotation;
	}

	/** @property {boolean} translationEnabled - is translation enabled */
	get translationEnabled() {
		if (typeof this._translationEnabled === 'undefined') {
			this._translationEnabled = true;
		}
		return this._translationEnabled;
	}

	set translationEnabled(translationEnabled) {
		this._translationEnabled = translationEnabled;
	}

	/** @property {boolean|number} translatingZ - is there translation in the Z axis and by how much */
	get translatingZ() {
		if (typeof this._translatingZ === 'undefined') {
			this._translatingZ = false;
		}
		return this._translatingZ;
	}

	set translatingZ(translatingZ) {
		this._translatingZ = translatingZ;
	}

	/** @property {boolean|number} translatingX - is there translation in the X axis and by how much */
	get translatingX() {
		if (typeof this._translatingX === 'undefined') {
			this._translatingX = false;
		}
		return this._translatingX;
	}

	set translatingX(translatingX) {
		this._translatingX = translatingX;
	}

	/** Initialises a Locomotion instance and teleportation */
	constructor() {
		this._phi = 0;
		this._theta = 0;

		this.teleportation = new Teleportation();
	}

	/**
	 * Gets all the meshes that serve as guides for the locomotion system
	 *
	 * @example
	 * const locomotionMeshes = locomotion.getMeshes();
	 * // Adds theses meshes to the scene
	 * simbol.addToScene(locomotionMeshes);
	 *
	 * @returns {array} meshes
	 */
	getMeshes() {
		return [this.teleportation.rayCurve, this.teleportation.hitCylinder];
	}

	/**
	 * Starts translating across the Z axis at the stated velocity
	 *
	 * @param {number} velocity - Value to translate by
	 *
	 * @example
	 * locomotion.translateZ(locomotion.velocity);
	 *
	 * @returns {undefined}
	 */
	translateZ(velocity) {
		if (!this.translationEnabled) {
			this.translatingZ = false;
			return;
		}
		this.translatingZ = velocity;
	}

	/**
	 * Starts translating across the X axis at the stated velocity
	 *
	 * @param {number} velocity - Value to translate by
	 *
	 * @example
	 * locomotion.translateX(locomotion.velocity);
	 *
	 * @returns {undefined}
	 */
	translateX(velocity) {
		if (!this.translationEnabled) {
			this.translatingZ = false;
			return;
		}
		this.translatingX = velocity;
	}

	/**
	 * Stops translating across the Z axis
	 *
	 * @example
	 * locomotion.stopTranslateZ();
	 *
	 * @returns {undefined}
	 */
	stopTranslateZ() {
		this.translatingZ = false;
	}

	/**
	 * Stops translating across the X axis
	 *
	 * @example
	 * locomotion.stopTranslateX();
	 *
	 * @returns {undefined}
	 */
	stopTranslateX() {
		this.translatingX = false;
	}

	/**
	 * Allows translation to occur
	 *
	 * @returns {undefined}
	 */
	enableTranslation() {
		this.translationEnabled = true;
	}

	/**
	 * Disables translation from happening
	 *
	 * @returns {undefined}
	 */
	disableTranslation() {
		this.translationEnabled = false;
	}

	/**
	 * Calculates and sets this.orientation based on the provided rotation
	 * It also debounces Teleportation#activateTeleport
	 *
	 * @param {THREE.Vector2} rotation - Vector for X and Y axis rotation
	 *
	 * @example
	 * locomotion.orient(new THREE.Vector2(0, 1));
	 *
	 * @returns {undefined}
	 */
	orient(rotation) {
		// Calculates the delta between the current move event and the previous one
		const rotationDelta = new THREE.Vector2();
		// TODO: What about when currentRotation isn't initialised?
		rotationDelta.subVectors(rotation, this.currentRotation);

		// Saves current rotation for next move event
		this.currentRotation.copy(rotation);

		// Calculates cumulative euler angles
		const phi = this._phi + 2 * Math.PI * rotationDelta.y / screen.height * this.angularVelocity;
		this._phi = Math.max(-Math.PI/2, Math.min(phi, Math.PI/2));
		this._theta += 2 * Math.PI * rotationDelta.x / screen.width * this.angularVelocity;

		this.orientation.euler.set(this._phi, this._theta, 0, 'YXZ');
		this.orientation.quaternion.setFromEuler(this.orientation.euler);

		if (this.teleportation.hitPoint) {
			// Debounced function
			this.teleportation.activateTeleport();
		}
	}

	/**
	 * It triggers teleportation. If the Ray Curve is active, it resets it,
	 * otherwise, it activates it
	 *
	 * @example
	 * locomotion.teleport();
	 *
	 * @returns {undefined}
	 */
	teleport() {
		if (this.teleportation.isRayCurveActive || this._cancelTeleportation) {
			this._cancelTeleportation = false;
			this.teleportation.resetTeleport();
		} else {
			this._handleTeleportation();
		}
	}

	/**
	 * Handles teleportation
	 *
	 * @returns {undefined}
	 * @private
	 */
	_handleTeleportation() {
		this.teleportation.setRayCurveState(true);
	}

	/**
	 * Adds Locomotion handlers to a Controllers and an Interactions emitter
	 *
	 * @param {Simbol.Controllers} controllers - A Controllers instance that is an EventEmitter
	 * @param {Simbol.Interactions} interactions - An Interactions instance that is an EventEmitter
	 *
	 * @example
	 * // Passes in the Controllers and Interactions instances that Simbol creates
	 * locomotion.setUpEventListeners(simbol.controllers, simbol.interactions);
	 *
	 * @returns {undefined}
	 */
	setUpEventListeners(controllers, interactions) {
		controllers.on('ztranslationstart', (event) => {
			this.translateZ(event.direction * this.velocity);
		});

		controllers.on('xtranslationstart', (event) => {
			this.translateX(event.direction * this.velocity);
		});

		controllers.on('ztranslationend', this.stopTranslateZ.bind(this));

		controllers.on('xtranslationend', this.stopTranslateX.bind(this));

		controllers.on('orientation', (event) => {
			this.orient(event.rotation);
		});

		controllers.on('currentorientation', (event) => {
			this.currentRotation.set(...event.rotation);
		});

		controllers.on('triggerpressed', (event) => {
			if (!event || !event.touch) {
				this.teleport();
			}
		});

		controllers.on('thumbpadpressed', () => {
			this.teleport();
			if (!this.teleportation.isRayCurveActive) {
				clearTimeout(this._thumbpadTouchedTimeout);
				this.stopTranslateZ();
			}
		});

		controllers.on('thumbpadtouched', () => {
			if (!this.teleportation.isRayCurveActive) {
				this._thumbpadTouchedTimeout = setTimeout(() => {
					this.translateZ(-this.velocity);
				}, 500);
			}
		});

		controllers.on('thumbpaduntouched', () => {
			clearTimeout(this._thumbpadTouchedTimeout);
			this.stopTranslateZ();
		});

		if (interactions) {
			interactions.selection.on('selected', () => {
				if (this.teleportation.isRayCurveActive) {
					this.teleportation.resetTeleport();
				} else {
					this._cancelTeleportation = true;
				}
			});
		}
	}
}

export {Locomotion};
