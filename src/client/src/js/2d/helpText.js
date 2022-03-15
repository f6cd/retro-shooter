import GameContext from "../game/ctx";
import RenderUIService from "./renderUIService";
import p5 from "p5";
import EntitySystem from "../entsys/ents";
import NetService from "../lib/net";

export default class HelpText {
    /**
     * Help text.
     * @param {GameContext} gameCtx Game context.
     * @param {EntitySystem} entSys Entity system.
     */
    constructor(gameCtx, entSys) {
        this._entSys = entSys;
        this._drawCallback = this._draw.bind(this);
        this._netService = entSys.getService(NetService);
    }

    /**
     * Internal draw.
     * @param {p5.Graphics} g2d p5 graphics instance.
     */
    _draw(g2d) {
        g2d.rectMode(g2d.CENTER);
        const textGutter = 12;

        g2d.textAlign(g2d.RIGHT, g2d.TOP);
        g2d.rectMode(g2d.CORNER);

        if (!this._netService.open) {
            g2d.fill("red");
            g2d.textSize(32);
            g2d.textLeading(32);
            g2d.text("NOT CONNECTED", g2d.width - 800 - textGutter, textGutter, 800 + 20, 200);
            g2d.translate(0, 64);
        }

        g2d.fill("white");
        g2d.textSize(16);
        g2d.textLeading(24);
        g2d.text("W,A,S,D - use to move\nP - respawn if stuck\n", g2d.width - 800 - textGutter, textGutter, 800, 200);
    }

    draw() {
        this._entSys.getService(RenderUIService).submitDraw(this._drawCallback);
    }
}