import p5, { Vector } from "p5";
import { packetTypes } from "shared";
import EntitySystem from "../entsys/ents";
import GameContext from "./ctx";
import Render3DService from "../gfx/render3DService";
import NetService from "../lib/net";
import RoverCam from "../lib/cam";

const STREAK_STAY_TIME = 200;

export default class BulletStreakSystem {
    /**
     * Render UI service.
     * @param {GameContext} gameCtx Game context.
     * @param {EntitySystem} entSys Entity system.
     */
    constructor(gameCtx, entSys) {
        const netService = entSys.getService(NetService);
        this._render3DService = entSys.getService(Render3DService);

        this._entSys = entSys;
        this._camera = entSys.getEntities(RoverCam)[0];

        this._bulletStreaks = [];
        netService.attachHandler(packetTypes.TYPE_SHOT, (obj) => {
            const [ox, oy, oz, px, py, pz] = obj;

            const streak = [
                new Vector(ox, oy, oz),
                new Vector(px, py, pz),
            ]
            this._bulletStreaks.push(streak);
            setTimeout(() => this._bulletStreaks = this._bulletStreaks.filter(e => e !== streak), STREAK_STAY_TIME);
        });
    }

    draw() {
        const g3d = this._render3DService._g3d;

        this._bulletStreaks.forEach(streak => {
            const [origin, hit] = streak;

            g3d.push();
            g3d.resetShader();
            g3d.resetMatrix();
            this._camera.applyTransform(g3d);
            g3d.stroke(255, 255, 255, 255);
            g3d.strokeWeight(5);
            g3d.line(origin.x, origin.y, origin.z, hit.x, hit.y, hit.z);
            g3d.pop();
        })
    }
}