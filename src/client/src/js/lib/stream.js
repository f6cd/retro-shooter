import { promiseLoadImage } from "./assets";
import p5, { Image } from "p5";

export default class ImageStream {
    /**
     * Class that dynamically loads in and mipmaps images.
     * @param {p5} p p5 instance.
     * @param {p5.Graphics} graphics p5 graphics instance.
     * @param {string} texturePath Relative offset path to texture.
     */
    constructor(p, graphics, texturePath) {
        this._p = p;
        this._graphics = graphics;
        this._renderer = graphics._renderer;

        this._path = texturePath;

        this._loadedTextures = [];
        this._loadedImages = [];
    }

    /**
     * Load an image/texture relative to the asset folder.
     * @param {string} relName Asset path relative to the texture folder. 
     * @returns {Promise.<Image>}
     */
    load(relName) {
        /** @type {WebGLRenderingContext} */
        const gl = this._renderer.GL;

        return promiseLoadImage(this._p, `${this._path + relName}.png`)
            .then((image) => {
                // See: https://github.com/processing/p5.js/blob/main/src/webgl/p5.Texture.js.
                // This part of the p5 API is undocumented!

                this._loadedImages[relName] = image;

                /** @type {p5.TEXTURE} */
                const texture = this._renderer.getTexture(image);
                texture.update();

                // Tile the texture.
                texture.setWrapMode(this._graphics.REPEAT, this._graphics.REPEAT);

                // Generate and set mipmaps.
                texture.mipmaps = true;
                texture.bindTexture();
                gl.generateMipmap(gl.TEXTURE_2D);
                texture.glMinFilter = gl.NEAREST_MIPMAP_LINEAR;
                texture.glMagFilter = gl.LINEAR;
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                texture.unbindTexture();

                return image;
            })
            .catch(() => console.error(`Couldn't load texture ${relName}!`))
    }

    /**
     * Load an image from a relative path.
     * @param {string} relName Relative path.
     * @returns {Image} Cached image.
     */
    getImage(relName) {
        return this._loadedImages[relName];
    }

    /**
     * Load a texture from a relative path.
     * @param {string} relName Relative path.
     * @returns {import("p5").TEXTURE} Cached texture.
     */
    getTexture(relName) {
        return this._loadedTextures[relName];
    }
}