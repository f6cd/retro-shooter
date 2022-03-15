import { Vector } from "p5";
import GameContext from "./ctx";

const DEBUG_SHOW_SPAWNPOINTS = false;

export default class SpawnPoint {
    /**
     * Spawn point.
     * @param {GameContext} gameCtx Game context.
     * @param {EntitySystem} entSys Entity system.
     * @param {Vector} point Spawn point.
     */
    constructor(gameCtx, entSys, point) {
        this.pos = point;
    }
    
    draw() {
        if (!DEBUG_SHOW_SPAWNPOINTS) return;

        const g3d = this._gameCtx.g3d;

        g3d.push();
        g3d.translate(this.pos.x, this.pos.y, this.pos.z);
        g3d.fill("pink");
        g3d.sphere(2, 4, 2);
        g3d.pop();
    }
}
