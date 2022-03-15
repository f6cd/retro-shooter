import { Vec3 } from "cannon-es";
import p5, { Vector } from "p5";
import BloodSystem from "./bloodSystem";
import { makePlayerBody, PLAYER_RADIUS, PLAYER_UNIT_SCALE } from "../phys/playerBody";
import EntitySystem from "../entsys/ents";
import PhysicsService from "../phys/physService";
import { mat4 } from "gl-matrix";
import Render3DService from "../gfx/render3DService";

const BLEED_TIME = 70;

// https://stackoverflow.com/a/47593316
// What does it do???? Mystery box.
function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

export default class PlayerPuppet {
    /**
     * Puppet representing another player.
     * @param {GameContext} gameCtx Game context.
     * @param {Vec3} pos Start pos.
     * @param {EntitySystem} entSys Entity system.
     */
    constructor(gameCtx, entSys, pos, userId, model) {
        const physicsService = entSys.getService(PhysicsService);
        this._render3DService = entSys.getService(Render3DService);

        this._colorRotate = mulberry32(userId)()*255;
        this._model = model;
        this._pos = pos;
        this.userId = userId;
        this._health = 1;

        this._bloodSystem = entSys.instantiate(BloodSystem, pos, false);

        const body = makePlayerBody(physicsService.playerPhysMaterial, pos);
        body.linearDamping = 1;
        // Assign some arbitrary mask, stopping us from locally simulating physics collisions for other players.
        // This saves an insane amount of performance, as this is typically very slow.
        body.collisionFilterMask = 2;
        this.body = body;
        physicsService.add(body);

        this._drawCallback = this._draw.bind(this);
    }

    get position() {
        return this._pos;
    }

    get alive() {
        return this._health > 0;
    }

    set health(value) {
        this._health = value;
    }

    /**
     * Transform puppet to player location.
     * @param {Number} x X position component.
     * @param {Number} y Y position component.
     * @param {Number} z Z position component.
     * @param {Number} angle Rotation around Y axis.
     */
    setTransform(x, y, z, angle) {
        this.body.position.set(x, y, z);
        this._pos.set(x, y, z);
        this._angle = angle;
    }

    update() {
        if (this.alive) {
            this.body.wakeUp();
            this.body.position.set(...this._pos.toArray());
        } else {
            this.body.position.set(0, -1e8, 0);
            this.body.sleep();
        }

        this._bloodSystem.setPos(this._pos.addScaledVector(-32*PLAYER_UNIT_SCALE, Vec3.UNIT_Y));
    }

    /**
     * Internal draw.
     * @param {p5.Graphics} g3d Graphics instance.
     */
    _draw(g3d) {
        g3d.colorMode(g3d.HSB);
        g3d.fill(this._colorRotate, 100, 100);
        g3d.model(this._model);
    }

    /**
     * Draw the player puppet.
     * @param {p5.Graphics} g3d 3D graphics instance.
     */
    draw() {
        if (this.alive) {
            const trans = mat4.create();
            mat4.translate(trans, trans, [this.body.position.x, this.body.position.y + PLAYER_RADIUS, this.body.position.z]);
            mat4.rotateY(trans, trans, this._angle);
            mat4.scale(trans, trans, [-PLAYER_UNIT_SCALE, -PLAYER_UNIT_SCALE, -PLAYER_UNIT_SCALE]);
            this._render3DService.submitDraw({
                castShadow: true,
                mat4: trans,
                model: this._drawCallback,
            });
        }
    }

    /**
     * Play hit effect.
     */
    playHitEffect() {
        this._bloodSystem.enabled = true;
        setTimeout(() => {
            this._bloodSystem.enabled = false;
        }, BLEED_TIME);
    }
}