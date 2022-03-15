import p5 from "p5";
import EntitySystem from "../entsys/ents";
import GameContext from "../game/ctx";
import Player from "../game/player";
import RenderUIService from "./renderUIService";

const WIDTH = 350;
const HEIGHT = 50;
const GUTTER = 20;

export default class HealthBar {
    /**
     * Health bar.
     * @param {GameContext} gameCtx Game context.
     * @param {EntitySystem} entSys Entity system.
     */
    constructor(gameCtx, entSys) {
        this._entSys = entSys;
        this._drawCallback = this._draw.bind(this);

        entSys.observeEntitiesOfType(Player).subscribe(player => {
            player.healthChanged.subscribe(value => this.setValue(value));
        })
    }

    /**
     * Draw with service.
     * @param {p5.Graphics} g2d 2D graphics.
     */
    _draw(g2d) {
        g2d.rectMode(g2d.CENTER);
        g2d.fill("black");
        g2d.rect(g2d.width / 2, g2d.height - HEIGHT / 2 - GUTTER, WIDTH, HEIGHT);

        const calcWidth = this._value * (WIDTH - GUTTER / 2);
        g2d.fill("red");
        g2d.rect(
            g2d.width / 2,
            g2d.height - HEIGHT / 2 - GUTTER,
            calcWidth,
            HEIGHT - GUTTER / 2,
        );

        g2d.noStroke();
        g2d.fill("white");
        g2d.textAlign(g2d.LEFT);
        g2d.textSize(30);
        g2d.textLeading(0);
        g2d.textStyle(g2d.BOLD);
        g2d.text("HEALTH", g2d.width / 2, g2d.height - HEIGHT - GUTTER, WIDTH - GUTTER, HEIGHT);
    }

    draw() {
        this._entSys.getService(RenderUIService).submitDraw(this._drawCallback);
    }

    setValue(value) {
        this._value = Math.max(Math.min(1, value), 0);
    }
}