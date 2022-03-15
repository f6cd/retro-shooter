import p5 from "p5";

export default class GameContext {
    /**
     * Holds important resources + state for the game.
     * @param {p5} p p5 instance.
     */
    constructor(p) {
        this.entities = {};

        p.pixelDensity(1);
        this.canvasRenderer = p.createCanvas(p.windowWidth, p.windowHeight, p.P2D);
        /** @type {p5.Graphics} */
        this.g3d = p.createGraphics(p.width, p.height, p.WEBGL);
        /** @type {p5.Renderer} */
        this.r3d = this.g3d._renderer;
        /** @type {p5.Graphics} */
        this.g2d = p;
        /** @type {p5} */
        this._p = p;
    }
}