import GameContext from "../game/ctx";
import RenderUIService from "./renderUIService";
import p5 from "p5";
import EntitySystem from "../entsys/ents";
import Player, { TIME_TO_RESPAWN } from "../game/player";
import getTimeMs from "../lib/getTimeMs";

export default class DeathScreen {
    /**
     * Damage screen.
     * @param {GameContext} gameCtx Game context.
     * @param {EntitySystem} entSys Entity system.
     */
    constructor(gameCtx, entSys) {
        this._entSys = entSys;
        this._drawCallback = this._draw.bind(this);

        entSys.observeEntitiesOfType(Player).subscribe(player => {
            player.died.subscribe(() => this.setVisible(true));
            player.respawned.subscribe(() => this.setVisible(false));
        })
    }

    /**
     * Internal draw.
     * @param {p5.Graphics} g2d p5 graphics instance.
     */
    _draw(g2d) {
        g2d.rectMode(g2d.CENTER);

        g2d.translate(Math.random() * 2, Math.random());

        g2d.fill("black");
        g2d.rect(g2d.width / 2, g2d.height / 2, g2d.width, g2d.height);

        g2d.fill("red");
        g2d.textSize(80);
        g2d.textAlign(g2d.CENTER);
        g2d.text("YOU DIED", g2d.width / 2, g2d.height / 2);
        g2d.textSize(20);
        g2d.translate(0, 45);
        g2d.text("respawning...", g2d.width / 2, g2d.height / 2);

        const animFac = 1 - Math.min(1, (this._respawnTime - getTimeMs()) / TIME_TO_RESPAWN);
        g2d.noStroke();
        g2d.resetMatrix();
        g2d.rect(g2d.width / 2, 0, g2d.width * animFac, 8);
        g2d.rect(g2d.width / 2, g2d.height, g2d.width * animFac, 8);
    }

    draw() {
        if (this._visible)
            this._entSys.getService(RenderUIService).submitDraw(this._drawCallback);
    }

    setVisible(value) {
        if (this._visible != value && value)
            this._respawnTime = getTimeMs() + TIME_TO_RESPAWN;
        this._visible = value;
    }
}