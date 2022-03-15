// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#be_precise_with_glsl_precision_annotations
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
precision mediump int;

varying vec4 vShadowPos;
varying vec2 vVertTexCoord;
varying vec3 vNormal;
varying vec3 vFragPos;
varying vec3 vPosition;

uniform sampler2D uSampler;
uniform sampler2D uDepthTexture;
uniform mat4 uProjectionMatrix;
uniform vec3 uLightPosition;

#define TEXTURE_SIZE 4096.0

void main() {
  vec3 lightDir = normalize(-uLightPosition + vFragPos);

  float bias = max(0.0001 * (1.0 - dot(vNormal, lightDir)), 0.0001);

  vec3 projectedTexcoord = vShadowPos.xyz / vShadowPos.w;
  float currentDepth = vShadowPos.z;

  float light = dot(lightDir, vNormal);
  float diff = max(light, 0.0);
  vec3 ambient = 0.53 * vec3(1.,0.6,0.6);
  vec3 lightColor = vec3(1, 0.8, 0.8) * 3.;
  vec3 diffuse = diff * lightColor;

  float shadow = 0.0;
  float texelSize = 1.0/TEXTURE_SIZE;
  for(int x = -1; x <= 1; ++x)
  {
      for(int y = -1; y <= 1; ++y)
      {
          float pcfDepth = texture2D(uDepthTexture, projectedTexcoord.xy + vec2(x, y) * texelSize).r; 
          shadow += currentDepth - bias > pcfDepth ? 0.7 : 0.0;        
      }    
  }
  shadow /= 9.0;
  
  // Lets just draw the texcoords to the screen
  vec3 color = texture2D(uSampler, vVertTexCoord).rgb;
  gl_FragColor = vec4((ambient + (1.0-shadow) * (diffuse)) * color, 1.0);
}