import { Vec3 } from "cannon-es";
import { mat4 } from "gl-matrix";
import p5 from "p5";
import EntitySystem from "../entsys/ents";
import Render3DService from "../gfx/render3DService";
import getRandomInRange from "../lib/getRandomInRange";
import GameContext from "./ctx";

const MAX_PARTICLES = 200;
const GLOBAL_ACCELERATION = new Vec3(0, 0.02);

class Particle {
    constructor(position) {
        this.velocity = new Vec3(getRandomInRange(-1, 1), getRandomInRange(-5, 0), getRandomInRange(-1, 1)).scale(.1);
        this.position = position.clone();
        this.lifespan = 100;
    }

    update() {
        this.velocity.vadd(GLOBAL_ACCELERATION, this.velocity);
        this.position.vadd(this.velocity, this.position);
        this.lifespan -= 2;
    }

    /**
     * Draw the object to the screen.
     * @param {p5.Graphics} g3d Graphics instance.
     */
    draw(g3d) {
        const sideLength = Math.max(0, this.lifespan / 255);

        g3d.push();
        g3d.noStroke();
        g3d.fill(255, 0, 0);
        g3d.translate(...this.position.toArray());
        g3d.box(sideLength, sideLength, sideLength);
        g3d.pop();
    }

    get dead() {
        return this.lifespan < 0;
    }
}

export default class BloodSystem {
    /**
     * Blood system.
     * @param {GameContext} gameCtx Game context.
     * @param {EntitySystem} entSys Entity system.
     * @param {Vec3} pos Initial position.
     * @param {boolean} startEnabled Whether to start with spraying blood.
     */
    constructor(gameCtx, entSys, pos, startEnabled) {
        this._render3DService = entSys.getService(Render3DService);

        this._particles = [];
        this._enabled = startEnabled;
        this._pos = pos.clone();
        this._g3d = gameCtx.g3d;

        this._drawCallback = this._draw.bind(this);
    }

    set enabled(value) {
        this._enabled = value;
    }

    /**
     * Update particle emitter position.
     * @param {Vec3} spawnPos Particle origin point.
     */
    setPos(pos) {
        this._pos.set(...pos.toArray());
    }

    update() {
        for (let i = 0; i < this._particles.length; i++) {
            const particle = this._particles[i];
            particle.update();
            if (particle.dead) this._particles.splice(i, 1);
        }

        for (let i = 0; i < 7; i++) {
            if (this._enabled && this._particles.length < MAX_PARTICLES)
                this._particles.push(new Particle(this._pos));
        }
    }

    /**
     * Internal draw.
     * @param {p5.Graphics} g3d Graphics instance.
     */
    _draw() {
        for (let i = 0; i < this._particles.length; i++) {
            this._particles[i].draw(this._g3d);
        }
    }

    /**
     * Draw the object to the screen.
     * @param {p5.Graphics} g3d Graphics instance.
     */
    draw() {
        this._render3DService.submitDraw({
            castShadow: true,
            mat4: mat4.create(),
            model: this._drawCallback,
        });
    }
}