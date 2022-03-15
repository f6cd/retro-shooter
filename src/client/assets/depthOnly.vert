attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;

uniform mat4 uLightProjectionMatrix;

uniform mat4 uLightSpaceMatrix;
uniform mat4 uModelViewMatrix;

varying highp vec2 vVertTexCoord;
varying vec3 vNormal;
varying vec4 vShadowPos;
varying vec3 vFragPos;

const mat4 texUnitConverter = mat4(0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 
0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.5, 0.5, 0.5, 1.0);

void main(void) {
    gl_Position = uLightProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
}