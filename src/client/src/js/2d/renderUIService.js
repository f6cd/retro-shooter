import p5 from "p5";
import EntitySystem from "../entsys/ents";
import GameContext from "../game/ctx";

export default class RenderUIService {
    /**
     * Render UI service.
     * @param {GameContext} gameCtx Game context.
     * @param {EntitySystem} entSys Entity system.
     */
    constructor(gameCtx, entSys) {
        const g2d = this._g2d = gameCtx.g2d;
        this._entSys = entSys;
        
        this._font = g2d.loadFont("../assets/FiveByFive.ttf");
        this._drawCallbacks = [];
    }

    /**
     * 
     * @param {Function.<p5.Graphics>} callback 
     */
    submitDraw(callback) {
        this._drawCallbacks.push(callback);
    }

    /**
     * Run and flush all queued draws this frame.
     */
    runDraws() {
        const g2d = this._g2d;
        g2d.textFont(this._font);

        // Clear callbacks first thing.
        // We do not want to stack up a ton of render calls if we run into some kind of error!
        const drawCallbacks = this._drawCallbacks;
        this._drawCallbacks = [];

        drawCallbacks.forEach(callback => {
            g2d.push();
            callback(g2d);
            g2d.pop();
        })
    }
}