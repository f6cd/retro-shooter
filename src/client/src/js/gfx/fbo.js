import p5 from "p5"

// Really helpful article: https://www.davepagurek.com/blog/depth-of-field/ !!
// Code stolen from: https://editor.p5js.org/davepagurek/sketches/cmcqbj1II.

export class RawTextureWrapper extends p5.Texture {
    constructor(renderer, obj, w, h) {
        super(renderer, obj)
        this.width = w
        this.height = h
        return this
    }

    _getTextureDataFromSource() {
        return this.src
    }

    init(tex) {
        const gl = this._renderer.GL
        this.glTex = tex

        this.glWrapS = this._renderer.textureWrapX
        this.glWrapT = this._renderer.textureWrapY

        this.setWrapMode(this.glWrapS, this.glWrapT)
        this.setInterpolation(this.glMinFilter, this.glMagFilter)
    }

    update() {
        return false
    }
}

export class Framebuffer {
    /**
     * Construct a new framebuffer.
     * @param {p5.Renderer} renderer p5 renderer instance.
     */
    constructor(renderer, width, height) {
        this._renderer = renderer;

        /** @type {WebGLRenderingContext} */
        const gl = this._renderer.GL;

        // Enable depth texture extension.
        gl.getExtension('WEBGL_depth_texture');

        this._width = width;
        this._height = height;

        const density = 1;

        const colorTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, colorTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width * density, height * density, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        // Create the depth texture
        const depthTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, depthTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, width * density, height * density, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);

        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);

        const depthP5Texture = new RawTextureWrapper(this._renderer, depthTexture, width * density, height * density);
        this._renderer.textures.push(depthP5Texture);

        const colorP5Texture = new RawTextureWrapper(this._renderer, colorTexture, width * density, height * density);
        this._renderer.textures.push(colorP5Texture);

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        this.framebuffer = framebuffer;
        this.depth = depthTexture;
        this.color = colorTexture;
    }

    draw(callback) {
        this._renderer.GL.bindFramebuffer(this._renderer.GL.FRAMEBUFFER, this.framebuffer);
        this._renderer.GL.viewport(0, 0, this._width, this._height); // Resize to our render target size.
        callback();
        this._renderer.GL.bindFramebuffer(this._renderer.GL.FRAMEBUFFER, null);
        this._renderer.GL.viewport(0, 0, this._renderer.width, this._renderer.height); // Resize back to our expected p5 window size.
    }
}