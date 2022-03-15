/*
 *
 * The p5.RoverCam library - First-Person 3D CameraControl for p5.js and WEBGL.
 *
 *   Copyright © 2020 by p5.RoverCam authors
 *
 *   Source: https://github.com/freshfork/p5.RoverCam
 *
 *   MIT License: https://opensource.org/licenses/MIT
 *
 *
 * explanatory note:
 *
 * p5.RoverCam is a derivative of the QueasyCam Library by Josh Castle,
 * ported to JavaScript for p5.js from github.com/jrc03c/queasycam
 *
 * updates
 * 20200628 incorporate pointerLock and overridable controller method
 * 20200629 add support for switching between multiple cameras
 * 20200701 v1.1.0 fix registerMethod and allow for p5js instance mode
 * 20200702 v1.1.1 moved pointerLock; added keymap and ocular offsetting
 */

/**
 * Heavily modified to use the cannon.js library!
 * Lots of unused code has been removed.
 */

import { Vec3, Quaternion } from "cannon-es";
import p5, { Renderer } from "p5";
import GameContext from "../game/ctx";
import { PLAYER_UNIT_SCALE } from "../phys/playerBody";

const CAMERA_NEAR_Z = 0.01;
const CAMERA_FAR_Z = Math.floor(2048 * PLAYER_UNIT_SCALE);

export default class RoverCam {
    /**
     * RoverCam.
     * @param {GameContext} gameCtx Game context.
     * @param {EntitySystem} entSys Entity system.
     */
    constructor(gameCtx, entSys) {
        const canvasRenderer = gameCtx.canvasRenderer;

        this.xRotation = 0;
        this.yRotation = 0;

        this.forward = new Vec3();
        this.up = new Vec3();
        this.position = new Vec3();

        this._fov = 75 * (Math.PI / 180);

        this.viewQuaternion = new Quaternion();

        document.addEventListener("mousemove", (event) => {
            if (!this.pointerLock) return;

            const { movementX, movementY } = event;

            this.yRotation -= movementX * 0.002;
            this.xRotation += movementY * 0.002;

            // Clamp up/down rotation.
            this.xRotation = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.xRotation));
        });

        const attemptFocusHandler = () => {
            if (!this.pointerLock) {
                document.body.requestPointerLock();
            }
        }

        canvasRenderer.elt.addEventListener("click", attemptFocusHandler);

        document.addEventListener("pointerlockchange", () => {
            if (document.pointerLockElement) {
                this.pointerLock = true;
            } else {
                this.pointerLock = false;
            }
        });
    }

    set fov(value) {
        this._fov = value;
        this._cachedWidth = 0; // trigger a perspective call in the draw loop
    }

    /**
     * Use camera looking.
     * @param {p5.Graphics} graphics Graphics instance.
     */
    applyTransform(graphics) {
        // 'width' and 'height' are poorly named p5 properties that hold the width+height of the canvas.
        if (graphics.width !== this._cachedWidth || p5.height !== this._cachedHeight) {
            graphics.perspective(this._fov, graphics.width / graphics.height, CAMERA_NEAR_Z, CAMERA_FAR_Z);
            this._cachedWidth = graphics.width;
            this._cachedHeight = graphics.height;
        }

        const viewQuaternion = this.viewQuaternion.setFromEuler(0, this.yRotation, this.xRotation, "XYZ");
        viewQuaternion.vmult(Vec3.UNIT_X, this.forward);
        viewQuaternion.vmult(Vec3.UNIT_Y, this.up);

        const center = this.position.vadd(this.forward.scale(10000));

        graphics.camera(this.position.x, this.position.y, this.position.z, center.x, center.y, center.z, this.up.x, this.up.y, this.up.z);
    }
}