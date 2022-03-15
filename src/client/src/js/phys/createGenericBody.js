import { Body, Shape, Vec3 } from "cannon-es";

/**
 * Create a new body with predefined settings from a collision shape, mass and position.
 * @param {Shape} colShape Collision shape to use.
 * @param {number} mass Mass. 
 * @param {Vec3} pos Initial position.
 * @returns {Body} Created physics body.
 */
export default function createGenericBody(colShape, mass, pos) {
    const body = new Body({
        mass: mass,
        linearDamping: 0.4,
        shape: colShape,
    });

    body.position.copy(pos);

    return body;
}