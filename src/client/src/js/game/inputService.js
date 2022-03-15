import { Vec3 } from "cannon-es";
import EntitySystem from "../entsys/ents";
import GameContext from "./ctx";
import Player from "./player";

const JUMP_MIN_FRAMES = 2;

export default class InputService {
    /**
     * Player input service.
     * @param {GameContext} gameCtx Game context.
     * @param {EntitySystem} entSys Entity system.
     */
    constructor(gameCtx, entSys) {
        this._p = gameCtx._p;
        this._entSys = entSys;
        
        this._lastJumpFrame = -JUMP_MIN_FRAMES;
        this._wishVel = new Vec3();
    }

    updateInput() {
        const p = this._p;
        const wishVel = this._wishVel;

        this._entSys.getEntities(Player).forEach(player => {
            wishVel.setZero();

            // W / S movement.
            if (p.keyIsDown(87))
                wishVel.addScaledVector(60, Vec3.UNIT_Z, wishVel);
            else if (p.keyIsDown(83))
                wishVel.addScaledVector(-60, Vec3.UNIT_Z, wishVel);

            // A / D movement.
            if (p.keyIsDown(65))
                wishVel.addScaledVector(-35, Vec3.UNIT_X, wishVel);
            else if (p.keyIsDown(68))
                wishVel.addScaledVector(35, Vec3.UNIT_X, wishVel);

            // Jumping.
            if (p.keyIsDown(32)) {
                if (p.frameCount - this._lastJumpFrame >= JUMP_MIN_FRAMES) {
                    // Only do checks if there's the *possibility* that our jump check could succeed, as we're not debounced.
                    if (player.onFloor) {
                        // Frame debounce.
                        this._lastJumpFrame = p.frameCount;
                        player.jump();
                    }
                }
            }

            // Emergency reset button! Key 'P'!
            if (p.keyIsDown(80))
                player.reset();

            player.setVelocityVector(wishVel);
        });
    }
}