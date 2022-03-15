// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#be_precise_with_glsl_precision_annotations
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;

uniform mat4 uProjectionMatrix;
uniform mat4 uTextureMatrix;
// Not currently set!
uniform mat4 uModelViewMatrix;
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat3 uTextureTransform;

uniform mat4 uLightSpaceMatrix;

varying highp vec2 vVertTexCoord;
varying vec3 vNormal;
varying vec4 vShadowPos;
varying vec3 vFragPos;
varying vec3 vPosition;

const mat4 texUnitConverter = mat4(0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.5, 0.5, 0.5, 1.0);

void main(void) {
  //! NOTE: THIS SHADER WILL NOT WORK FOR ANYTHING WITH A TRANSFORM!!!!
  // p5 merges the model and view matrix together. But we only want to multiply the vFragPos by the model matrix.
  // So for now, we just multiply by 'no transform' (a unit vector): being scale [1,1,1] at [0,0,0].
  // This works for our map, but for nothing else...

  // See: https://github.com/processing/p5.js/issues/5287
  // And: https://github.com/processing/p5.js-website/issues/1017#issuecomment-851041727

  vFragPos = vec3(uModelMatrix * vec4(aPosition, 1.0));

  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
  vVertTexCoord = vec2(uTextureTransform * vec3(aTexCoord, 1.0));;

  // uNormalMatrix is the inverse transpose.
  // https://github.com/processing/p5.js/blob/main/src/webgl/p5.Shader.js#L277
  vNormal = normalize(aNormal);

  vShadowPos = texUnitConverter * uLightSpaceMatrix * vec4(vFragPos, 1.0);
}