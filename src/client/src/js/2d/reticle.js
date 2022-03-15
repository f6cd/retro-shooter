import p5, { Vector } from "p5";
import EntitySystem from "../entsys/ents";
import GameContext from "../game/ctx";
import Player from "../game/player";
import RenderUIService from "./renderUIService";

const RETICLE_HAIRS = 6;

const MIN_DIST = 10;
const END_DIST = 20;
const WEIGHT = 2;

export default class Reticle {
    /**
     * Aiming reticle.
     * @param {GameContext} gameCtx Game context.
     * @param {EntitySystem} entSys Entity system.
     */
    constructor(gameCtx, entSys) {
        this._entSys = entSys;
        this._drawCallback = this._draw.bind(this);

        this._min = MIN_DIST;
        this._end = END_DIST;

        this._knockFactorA = 0.;
        this._knockFactorB = 0.;
        this._knockFactorW = 0.;

        this._origin = new Vector();

        entSys.observeEntitiesOfType(Player).subscribe(player => {
            player.shotGun.subscribe(value => this.knock());
        });
    }

    /**
     * Draw with service.
     * @param {p5.Graphics} g2d 2D graphics.
     */
    _draw(g2d) {
        // Interpolate...
        const animSpeed = 1.5;

        this._knockFactorA *= (1 - (g2d.deltaTime * 0.01 * animSpeed));
        this._knockFactorA = Math.max(1e-10, this._knockFactorA);

        this._knockFactorB *= (1 - (g2d.deltaTime * 0.01 * animSpeed));
        this._knockFactorB = Math.max(1e-10, this._knockFactorB);

        this._knockFactorW *= (1 - (g2d.deltaTime * 0.01 * animSpeed));
        this._knockFactorW = Math.max(1e-10, this._knockFactorW);

        this._origin.set(g2d.width / 2, g2d.height / 2);

        // Draw!
        for (let i = 0; i < RETICLE_HAIRS; i++) {
            // Basic angle around the centre.
            let angle = (i / (RETICLE_HAIRS)) * g2d.PI * 2;
            // Add an offset with odd-spoked reticles to align the first point vertically.
            angle += (RETICLE_HAIRS % 2) * Math.max(RETICLE_HAIRS - 2, 0) * g2d.PI / RETICLE_HAIRS / 2;

            const angleVec = Vector.fromAngle(angle, 1);
            const lP = Vector.add(this._origin, Vector.mult(angleVec, this._min + this._knockFactorA));
            const eP = Vector.add(this._origin, Vector.mult(angleVec, this._end + this._knockFactorB));

            g2d.push();

            g2d.colorMode(g2d.RGB);
            g2d.stroke(150, 0, 0, 255);
            g2d.strokeCap(g2d.SQUARE);
            g2d.strokeWeight(WEIGHT + this._knockFactorW);
            g2d.line(lP.x, lP.y, eP.x, eP.y);

            g2d.pop();
        }
    }

    draw() {
        this._entSys.getService(RenderUIService).submitDraw(this._drawCallback);
    }

    knock() {
        this._knockFactorA += 70;
        this._knockFactorB += 50;
        this._knockFactorW += 50;
    }
}
