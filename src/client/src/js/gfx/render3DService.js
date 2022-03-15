import MultiTexturedModel from "../lib/model";
import EntitySystem from "../entsys/ents";
import GameContext from "../game/ctx";
import { Framebuffer } from "./fbo";
import { mat4 } from "gl-matrix";
import p5 from "p5";
import { SUN_ORIGIN_INV, SUN_PROJVIEW_MATRIX } from "./sunConstants";
import RoverCam from "../lib/cam";
import ImageStream from "../lib/stream";
import { promiseLoadShader } from "../lib/assets";

/**
 * @typedef {Object} DrawEntry
 * @property {boolean} castShadow Whether this geometry casts a shadow.
 * @property {mat4} mat4 Model matrix.
 * @property {p5.Geometry | MultiTexturedModel | function} model Model to draw.
 * @property {p5.Image} texture Model texture.
 */

export default class Render3DService {
    /**
     * Render 3D service.
     * @param {GameContext} gameCtx Game context.
     * @param {EntitySystem} entSys Entity system.
     */
    constructor(gameCtx, entSys) {
        this._g3d = gameCtx.g3d;
        this._r3d = gameCtx.r3d;
        this._p = gameCtx._p;

        this._time = 0;

        this._entSys = entSys;

        Promise.all([
            promiseLoadShader(gameCtx._p, "./assets/shadowmap.vert", "./assets/shadowmap.frag"),
            promiseLoadShader(gameCtx._p, "./assets/depthOnly.vert", "./assets/depthOnly.frag")
        ]).then((shaders) => {
            [this._shadowShader, this._depthShader] = shaders;
            this._shadersLoaded = true;
        })

        this._shadowFBO = new Framebuffer(gameCtx.r3d, 4096, 4096, 1);

        /** @type {Array.<DrawEntry>} */
        this._drawCallbacks = [];

        this.ImageStream = new ImageStream(gameCtx._p, gameCtx.g3d, "../assets/textures/");
    }


    /**
     * Submit entry to draw with.
     * @param {DrawEntry} entry Draw entry.
     */
    submitDraw(entry) {
        this._drawCallbacks.push(entry);
    }

    /**
     * Run and flush all queued draws this frame.
     */
    runDraws() {
        this._time += this._p.deltaTime;

        // Clear callbacks first thing.
        // We do not want to stack up a ton of render calls if we run into some kind of error!
        const drawCallbacks = this._drawCallbacks;
        this._drawCallbacks = [];

        if (!this._shadersLoaded) return;

        const g3d = this._g3d;

        /** @type {WebGLRenderingContext} */
        const gl = this._r3d.GL;
        gl.enable(gl.CULL_FACE);
        gl.enableVertexAttribArray(0);

        // Depth buffer pass.
        this._shadowFBO.draw(() => {
            gl.cullFace(gl.FRONT);
            gl.clear(gl.DEPTH_BUFFER_BIT);

            drawCallbacks.forEach(entry => {
                if (!entry.castShadow) return;

                g3d.push();

                g3d.noStroke();
                g3d.shader(this._depthShader);

                g3d.resetMatrix();
                g3d.applyMatrix(...entry.mat4);
                this._depthShader.setUniform("uLightProjectionMatrix", SUN_PROJVIEW_MATRIX);

                const model = entry.model;

                if (model instanceof MultiTexturedModel) {
                    g3d.model(model.geometry);
                } else if (model instanceof p5.Geometry) {
                    g3d.model(model);
                } else if (typeof model === "function") {
                    // Unlit, raw G3D mode.
                    model(g3d);
                } else {
                    console.error("Unknown model type!", model);
                }

                g3d.pop();
            })

            gl.cullFace(gl.BACK);
        })
        g3d._renderer.getTexture(this._shadowFBO.depth).setInterpolation(gl.NEAREST, gl.NEAREST);

        // Colour pass.
        const camera = this._entSys.getEntities(RoverCam)[0];

        g3d.reset();
        g3d.background('rgba(25, 2, 2, 255)');

        drawCallbacks.forEach(entry => {
            g3d.push();
            g3d.resetMatrix();

            if (camera)
                camera.applyTransform(g3d);

            const model = entry.model;
            const litModel = (model instanceof MultiTexturedModel) || (model instanceof p5.Geometry);

            g3d.applyMatrix(...entry.mat4);

            if (litModel) {
                g3d.shader(this._shadowShader);
                this._shadowShader.setUniform("uDepthTexture", this._shadowFBO.depth);
                this._shadowShader.setUniform("uLightPosition", SUN_ORIGIN_INV);
                this._shadowShader.setUniform("uLightSpaceMatrix", SUN_PROJVIEW_MATRIX);
                this._shadowShader.setUniform("uModelMatrix", entry.mat4);
            }

            if (model instanceof MultiTexturedModel) {
                g3d.noStroke();
                model.draw(g3d, this.ImageStream, this._time);
            } else if (model instanceof p5.Geometry) {
                g3d.noStroke();
                this._shadowShader.setUniform("uSampler", entry.texture);
                g3d.model(model);
            } else if (typeof model === "function") {
                // Unlit, raw G3D mode.
                model(g3d);
            } else {
                console.error("Unknown model type!", model);
            }

            g3d.pop();
        })
    }
}