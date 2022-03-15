import { Body, Cylinder, Material, Sphere, Vec3 } from "cannon-es";
import createGenericBody from "./createGenericBody";

export const PLAYER_UNIT_SCALE = 0.05;
export const PLAYER_MASS = 1;
export const PLAYER_RADIUS = 32 * PLAYER_UNIT_SCALE / 2;
export const PLAYER_HEIGHT = 72 * PLAYER_UNIT_SCALE;

const PLAYER_BALL = new Sphere(PLAYER_RADIUS);
const PLAYER_CYL = new Cylinder(PLAYER_RADIUS, PLAYER_RADIUS, PLAYER_HEIGHT - PLAYER_RADIUS * 2, 8);

/**
 * Construct a new player body.
 * @param {Material} playerMaterial Player contact physics material.
 * @param {Vector} pos Start position.
 * @returns {Body} Player body.
 */
export function makePlayerBody(playerMaterial, pos) {
    // Dimensions stolen from the source engine: https://developer.valvesoftware.com/wiki/Player_Entity.
    /** @type {Body} */
    const body = createGenericBody(
        PLAYER_BALL,
        PLAYER_MASS,
        new Vec3(pos.x, pos.y - PLAYER_RADIUS * 2, pos.z + PLAYER_RADIUS)
    );

    body.addShape(
        PLAYER_BALL,
        new Vec3(0, -PLAYER_HEIGHT + PLAYER_RADIUS * 2, 0)
    )
    body.addShape(
        PLAYER_CYL,
        new Vec3(0, -PLAYER_HEIGHT / 2, 0)
    )

    body.fixedRotation = true;
    body.material = playerMaterial;
    body.angularFactor = new Vec3(0, 0, 0);
    body.allowSleep = false;
    body.linearDamping = 0.99;

    body.updateAABB();
    body.updateMassProperties();

    return body;
}