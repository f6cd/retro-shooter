import { mat4 } from "gl-matrix";

const PROJ_SIDE_LENGTH = 130;
const PROJ_NEAR_Z = 0.1;
const PROJ_FAR_Z = 180;

export const SUN_ORIGIN = [20, -90, -5];
export const SUN_ORIGIN_INV = [-SUN_ORIGIN[0], -SUN_ORIGIN[1], -SUN_ORIGIN[2]];

const SUN_PROJ = mat4.create();
mat4.ortho(
    SUN_PROJ,
    -PROJ_SIDE_LENGTH / 2,
    PROJ_SIDE_LENGTH / 2,
    PROJ_SIDE_LENGTH / 2,
    -PROJ_SIDE_LENGTH / 2,
    PROJ_NEAR_Z,
    PROJ_FAR_Z,
);

export const SUN_VIEW = mat4.create();
mat4.lookAt(SUN_VIEW, SUN_ORIGIN, [0, 0, 0], [0, -1., 0]);

export const SUN_PROJVIEW_MATRIX = mat4.create();
mat4.mul(SUN_PROJVIEW_MATRIX, SUN_PROJ, SUN_VIEW);