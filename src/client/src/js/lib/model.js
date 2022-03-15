import { loadMultiTexturedModelPromise } from "./loader";
import p5, { Renderer } from "p5";
import ImageStream from "./stream";
import { mat3, vec2 } from "gl-matrix";
import { Vec3 } from "cannon-es";

/**
 * Init new buffers for this p5.Geometry instance.
 * @param {p5.Geometry} geom Geometry to create buffers for.
 * @param {p5.Renderer} renderer p5 renderer instance.
 */
function makeBuffersFromIndexedGeometry(geom, renderer) {
    /** @type {WebGLRenderingContext} */
    const gl = renderer.GL;

    geom._makeTriangleEdges()._edgesToVertices();

    // Fork of p5._renderer._createBuffers(): https://github.com/processing/p5.js/blob/main/src/webgl/p5.RendererGL.Retained.js#L66
    const nBuffers = {};
    nBuffers.model = geom;

    // Allocate space for faces
    const indexBuffer = nBuffers.indexBuffer = gl.createBuffer();
    /** @type {Array} */
    const vals = p5.RendererGL.prototype._flatten(geom.faces);

    const hasVertexIndicesOverMaxUInt16 = vals.some(v => v > 65535);
    let type = hasVertexIndicesOverMaxUInt16 ? Uint32Array : Uint16Array;
    renderer._bindBuffer(indexBuffer, gl.ELEMENT_ARRAY_BUFFER, vals, type);

    nBuffers.indexBufferType = hasVertexIndicesOverMaxUInt16
        ? gl.UNSIGNED_INT
        : gl.UNSIGNED_SHORT;
    nBuffers.vertexCount = geom.faces.length * 3;

    nBuffers.lineVertexCount = geom.lineVertices ? geom.lineVertices.length : 0;

    return nBuffers
}

export default class MultiTexturedModel {
    /**
     * Static model that allows for multiple textures.
     * @param {string} modelPath Relative path to model file.
     * @param {p5.Renderer} renderer p5 renderer instance.
     * @param {ImageStream} imageStream Image stream.
     */
    constructor(modelPath) {
        this._modelPath = modelPath;
        this._gfxMap = new WeakMap();
    }

    /**
     * Promise loading this model's assets.
     * @param {ImageStream} imageStream 
     * @param {Vector} scale Model scale factor.
     * @returns {Promise.<void>} Promise loading completion.
     */
    async loadGeometry(imageStream, scale) {
        // Load geometry.
        return loadMultiTexturedModelPromise(this._modelPath, scale).then(result => {
            [this._stGeom, this._textureFaceRanges] = result;
            // Load used textures.
            this._textureFaceRanges.forEach(group => {
                imageStream.load(group[0]);
            });

            // We can't use async in a constructor! We can't yield until a promise resolves.
            // Very sad...
            this._ready = true;
        })
    }

    /**
     * First-time setup for a given renderer.
     * @param {p5.Graphics} graphics p5 graphics instance.
     * @param {ImageStream} imageStream Image stream.
     */
    _setupForRenderer(graphics, imageStream) {
        /** @type {p5.Renderer} */
        let renderer = graphics._renderer;

        /** @type {WebGLRenderingContext} */
        const gl = renderer.GL;

        // Make buffers!
        const buffers = makeBuffersFromIndexedGeometry(this._stGeom, renderer);
        const vertexStrideBytes = buffers.indexBufferType == gl.UNSIGNED_INT ? 4 : 2;

        // Texture scroll matrix.
        const textureScrollMatrix = mat3.create();
        const identMatrix = mat3.create();
        const scrollDist = new vec2.fromValues(1.4, 1);
        const tempVec = new vec2.create();

        return (time) => {
            // Sad...
            if (!this._ready) return;

            // Update tex scroll.
            mat3.rotate(textureScrollMatrix, textureScrollMatrix, (7e-9)*time);
            mat3.translate(textureScrollMatrix, textureScrollMatrix, vec2.scale(tempVec, scrollDist, (4e-8)*time));

            const fillShader = renderer._getRetainedFillShader();
            fillShader.bindShader();

            // Not sure what this does...
            // https://github.com/processing/p5.js/blob/main/src/webgl/p5.RenderBuffer.js#L19
            for (const buff of renderer.retainedMode.buffers.fill) {
                buff._prepareBuffer(buffers, fillShader);
            }

            // Draw with vertex index buffer.
            const indexBuffer = buffers.indexBuffer;
            if (indexBuffer) {
                renderer._bindBuffer(indexBuffer, gl.ELEMENT_ARRAY_BUFFER);
            }

            for (let fgi = 0; fgi < this._textureFaceRanges.length; fgi++) {
                const [texName, start, count] = this._textureFaceRanges[fgi];

                // REFERENCES:
                // Creating + using vertex buffers for geometry.
                // https://github.com/processing/p5.js/blob/main/src/webgl/p5.RendererGL.Retained.js#L66 Renderer._createBuffers()
                // https://github.com/processing/p5.js/blob/main/src/webgl/p5.RendererGL.Retained.js#L116 Renderer.drawBuffers()
                // https://github.com/processing/p5.js/blob/v1.4.0/src/webgl/loading.js#L588 p5.model()

                // https://github.com/processing/p5.js/blob/main/src/webgl/p5.RendererGL.Retained.js#L187 Renderer._drawElements()

                const image = imageStream.getImage(texName);

                if (image) {
                    // Load texture, set fill shader to sample it via uniforms.
                    graphics.texture(image);

                    // Apply texture scroll if wanted.
                    // console.log(texName);
                    if (texName === "_lavakelvin") {
                        fillShader.setUniform("uTextureTransform", textureScrollMatrix);
                    } else {
                        fillShader.setUniform("uTextureTransform", identMatrix);
                    }

                    renderer._setFillUniforms(fillShader);

                    // Apply overlay mode.
                    renderer._applyColorBlend(renderer.curFillColor);

                    // we're drawing faces
                    gl.drawElements(
                        gl.TRIANGLES,
                        count * 3,
                        buffers.indexBufferType,
                        (start) * vertexStrideBytes * 3
                    );
                }
            }
            fillShader.unbindShader();
        }
    }

    /**
     * Draw.
     * @param {p5.Graphics} graphics p5 graphics instance.
     * @param {ImageStream} imageStream Image stream.
     * @param {Number} time Total simulation time.
     */
    draw(graphics, imageStream, time) {
        if (!this._gfxMap.get(graphics))
            this._gfxMap.set(graphics, this._setupForRenderer(graphics, imageStream));

        return this._gfxMap.get(graphics)(time);
    }

    get geometry() {
        return this._stGeom;
    }
}
