#version 300 es

precision highp float;

uniform vec3 u_lightDirection;

in vec3 v_normal;

out vec4 outColor;

void main() {
  vec3 normal = normalize( v_normal );
  vec3 light  = normalize( u_lightDirection );

  float brightness = max( dot( normal, light ), 0.0 ) * 0.7 + 0.3;

  vec3 color = vec3( 0.8, 0.1, 0.8 );

  outColor = vec4( brightness * color, 1.0);
}