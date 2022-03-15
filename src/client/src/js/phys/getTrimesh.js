import { Trimesh } from "cannon-es";
import { Geometry } from "p5";

/**
 * Create an expensive trimesh from given geometry.
 * @param {Geometry} geom Geometry to create collision for.
 * @returns {Trimesh} New colliding trimesh.
 */
export default function makeTrimesh(geom) {
    const vertices = [];

    geom.vertices.forEach(vertex => {
        vertices.push(vertex.x, vertex.y, vertex.z);
    });

    const indices = [];

    for (let i = 0; i < geom.faces.length; i++) {
        indices.push(...geom.faces[i]);
    }

    return new Trimesh(vertices, indices);
}