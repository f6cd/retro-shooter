import p5 from "p5";

/**
 * Load a 3D model from a file.
 * @param {p5.Graphics} graphics Graphics instance. 
 * @param {string} relativePath File path (with extension) of model to load.
 * @returns {Promise.<p5.Geometry>} Loaded geometry.
 */
export const promiseLoadModel = (graphics, relativePath) => {
    return new Promise((resolve, reject) => {
        graphics.loadModel(relativePath, false, resolve, reject);
    });
};

/**
 * Load an image from a file.
 * @param {p5} p Processing instance. 
 * @param {string} relativePath File path (with extension) of image to load.
 * @returns {Promise.<p5.Image>} Promise loaded image.
 */
export const promiseLoadImage = (p, relativePath) => {
    // Doesn't actually need to be a promise, but syntactically cleaner.
    return new Promise((resolve, reject) => {
        p.loadImage(relativePath, resolve, reject);
    });
};

/**
 * Load a font from a file.
 * @param {p5} p Processing instance. 
 * @param {string} relativePath File path (with extension) of font to load.
 * @returns {p5.Font} Loaded font.
 */
export const promiseLoadFont = (p, relativePath) => {
    // Doesn't actually need to be a promise, but syntactically cleaner.
    return new Promise((resolve, reject) => {
        p.loadFont(relativePath, resolve, reject);
    });
};

/**
 * Load a shader from two files.
 * @param {p5} p Processing instance. 
 * @param {string} relativePath File path (with extension) of font to load.
 * @returns {p5.Font} Loaded font.
 */
 export const promiseLoadShader = (p, relativePathVert, relativePathFrag) => {
    // Doesn't actually need to be a promise, but syntactically cleaner.
    return new Promise((resolve, reject) => {
        p.loadShader(relativePathVert, relativePathFrag, resolve, reject);
    });
};