// Very very dangerous fork! Hopefully we don't lose any functionality over time...
// https://github.com/processing/p5.js/blob/master/src/webgl/loading.js#L190

import p5, { Geometry, Vector } from "p5";

/**
 * Generates a random UUID. Not guaranteed to be unique, but should be good enough!
 * @returns {string} UUID string.
 */
function genUUID() {
    return '_' + Math.random().toString(36).substring(2, 9);
}

/**
 * Splits a one-line string by its whitespace characters. 
 * @param {string} line Input line.
 * @returns {Array.string>} Split tokens.
 */
function getTokens(line) {
    return line.trim().split(/\b\s+/)
}

/**
 * Given an OBJ with multiple textures, parse each texture group into its own geometry buffer/object.
 * @param {Array.<string>} lines Input .OBJ file lines.
 * @param {string} skipMaterial Skip adding faces with this material. Nice optimization!
 * @param {Vector} scale Model scale factor.
 * @returns {Array.<Object.<string, Geometry>, Array.<Array.<string, number, number>>>} Geometry and face index.
 */
function parseMultiTextureObj(lines, skipMaterial, scale) {
    // Models by texture.
    const facesByTex = {};

    // OBJ allows a face to specify an index for a vertex (in the above example),
    // but it also allows you to specify a custom combination of vertex, UV
    // coordinate, and vertex normal. So, "3/4/3" would mean, "use vertex 3 with
    // UV coordinate 4 and vertex normal 3". In WebGL, every vertex with different
    // parameters must be a different vertex, so loadedVerts is used to
    // temporarily store the parsed vertices, normals, etc., and indexedVerts is
    // used to map a specific combination (keyed on, for example, the string
    // "3/4/3"), to the actual index of the newly created vertex in the final
    // object.
    const loadedVerts = {
        v: [],
        vt: [],
        vn: []
    };
    const indexedVerts = {};

    const model = new Geometry();

    for (let line = 0; line < lines.length; ++line) {
        // Each line is a separate object (vertex, face, vertex normal, etc)
        // For each line, split it into tokens on whitespace. The first token
        // describes the type.
        const tokens = getTokens(lines[line]);

        if (tokens.length > 0) {
            if (tokens[0] === 'v' || tokens[0] === 'vn') {
                // Check if this line describes a vertex or vertex normal.
                // It will have three numeric parameters.
                const vertex = new Vector(
                    parseFloat(tokens[1] * scale.x),
                    parseFloat(tokens[2] * scale.y),
                    parseFloat(tokens[3] * scale.z)
                );
                loadedVerts[tokens[0]].push(vertex);
            } else if (tokens[0] === 'vt') {
                // Check if this line describes a texture coordinate.
                // It will have two numeric parameters U and V (W is omitted).
                // Because of WebGL texture coordinates rendering behaviour, the V
                // coordinate is inversed.
                const texVertex = [parseFloat(tokens[1]), 1 - parseFloat(tokens[2])];
                loadedVerts[tokens[0]].push(texVertex);
            } else if (tokens[0] === 'f') {
                // Get the model using the texture.
                const textureTokens = getTokens(lines[line - 1]);
                //! We could error here if the first token isn't 'usemtl'!
                // However, we don't want to slow down the parsing...
                const textureName = textureTokens[1].toLowerCase();
                // Skip this face!
                if (textureName === skipMaterial.toLowerCase()) continue;

                // Check if this line describes a face.
                // OBJ faces can have more than three points. Triangulate points.
                for (let tri = 3; tri < tokens.length; ++tri) {
                    const face = [];

                    const vertexTokens = [1, tri - 1, tri];

                    for (let tokenInd = 0; tokenInd < vertexTokens.length; ++tokenInd) {
                        // Now, convert the given token into an index
                        const vertString = tokens[vertexTokens[tokenInd]];
                        let vertIndex = 0;

                        // TODO: Faces can technically use negative numbers to refer to the
                        // previous nth vertex. I haven't seen this used in practice, but
                        // it might be good to implement this in the future.

                        if (indexedVerts[vertString] !== undefined) {
                            vertIndex = indexedVerts[vertString];
                        } else {
                            const vertParts = vertString.split('/');
                            for (let i = 0; i < vertParts.length; i++) {
                                vertParts[i] = parseInt(vertParts[i]) - 1;
                            }

                            vertIndex = indexedVerts[vertString] = model.vertices.length;
                            model.vertices.push(loadedVerts.v[vertParts[0]].copy());
                            if (loadedVerts.vt[vertParts[1]]) {
                                model.uvs.push(loadedVerts.vt[vertParts[1]].slice());
                            } else {
                                model.uvs.push([0, 0]);
                            }

                            if (loadedVerts.vn[vertParts[2]]) {
                                model.vertexNormals.push(loadedVerts.vn[vertParts[2]].copy());
                            }
                        }

                        face.push(vertIndex);
                    }

                    if (
                        face[0] !== face[1] &&
                        face[0] !== face[2] &&
                        face[1] !== face[2]
                    ) {
                        let faceArray = facesByTex[textureName]
                        if (!faceArray) faceArray = facesByTex[textureName] = [];
                        faceArray.push(face);
                    }
                }
            }
        }
    }

    // If a model doesn't have normals, compute the normals
    if (model.vertexNormals.length === 0) {
        model.computeNormals();
    }

    // Assign an ID by the texture, to prevent hash collisions when rendering with similar geometry.
    model.gid = genUUID();

    const faceRanges = [];
    let fI = 0;

    for (const [texName, faces] of Object.entries(facesByTex)) {
        const start = fI;
        model.faces = model.faces.concat(faces);
        fI += faces.length;
        faceRanges.push([texName, start, faces.length]);
    }

    return [model, faceRanges];
}

/**
 * Load a 3D model with multiple textures from a file.
 * @param {p5} p Processing instance. 
 * @param {string} relativePath File path (with extension) of model to load.
 * @param {Vector} scale Model scale factor.
 * @returns {Promise.<Array.<Object.<string, Geometry>, Array.<Array.<string, number, number>>>>} Loaded geometry.
 */
export const loadMultiTexturedModelPromise = (relativePath, scale) => {
    return fetch(relativePath)
        .then(response => {
            return response.text()
        })
        .then(text => parseMultiTextureObj(text.split("\n"), "__TB_empty", scale))
};