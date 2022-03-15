import p5 from "p5";
import EntitySystem from "../entsys/ents";
import GameContext from "../game/ctx";

export default class RenderFBOService {
    /**
     * Render FBO service.
     * @param {GameContext} gameCtx Game context.
     * @param {EntitySystem} entSys Entity system.
     */
    constructor(gameCtx) {
        this._g2d = gameCtx.g2d;
    }

    /**
     * Draw output from a p5 graphics instance's FBO to the screen.
     * @param {p5.Graphics} graphics Graphics to draw from.
     */
    drawGraphicsFBO(graphics) {
        const g2d = this._g2d;

        g2d.resetMatrix();
        g2d.imageMode()
        g2d.imageMode(g2d.CENTER);
        g2d.image(
            graphics,
            graphics.width / 2,
            graphics.height / 2,
        )
    }
}