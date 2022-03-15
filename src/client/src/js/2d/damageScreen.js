import EntitySystem from "../entsys/ents";
import GameContext from "../game/ctx";
import RenderUIService from "./renderUIService";
import p5 from "p5";
import Player from "../game/player";

export default class DamageScreen {
    /**
     * Damage screen.
     * @param {GameContext} gameCtx Game context.
     * @param {EntitySystem} entSys Entity system.
     */
    constructor(gameCtx, entSys) {
        this._entSys = entSys;
        this._drawCallback = this._draw.bind(this);
        this._transparency = 0.;

        entSys.observeEntitiesOfType(Player).subscribe(player => {
            player.tookDamage.subscribe(() => this.knock());
        });
    }

    knock() {
        this._transparency += 0.5;
    }

    /**
     * Draw with service.
     * @param {p5.Graphics} g2d 2D graphics.
     */
    _draw(g2d) {
        this._transparency *= (1 - g2d.deltaTime / 1000);
        this._transparency = Math.max(0, this._transparency);
        this._transparency = Math.min(0.8, this._transparency);

        g2d.rectMode(g2d.CENTER);
        g2d.fill(130, 0, 0, this._transparency * 255);
        g2d.rect(g2d.width / 2, g2d.height / 2, g2d.width, g2d.height);
    }

    draw() {
        this._entSys.getService(RenderUIService).submitDraw(this._drawCallback);
    }
}
