#version 300 es

uniform mat4 u_projection;

in vec3 a_normal;
in vec3 a_position;

out vec3 v_normal;

void main() {    
  gl_Position = u_projection * vec4( a_position, 1.0 );
  v_normal = a_normal;
}