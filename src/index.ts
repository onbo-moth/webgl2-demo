import { mat4, vec3 } from "gl-matrix";
import { WavefrontOBJParser } from "./parser";
import { load } from "./loader";
import { Camera } from "./camera";
import { DOMControl } from "./control";

const width  = 800
const height = 600
const aspect = width / height

const fov = Math.PI / 4

const near_plane = 0.1
const far_plane  = 100

const projection_matrix = mat4.create()
const model_matrix      = mat4.create()

mat4.perspective( projection_matrix, fov, aspect, near_plane, far_plane )
mat4.identity( model_matrix )

const mvp_matrix = mat4.create()


function createCanvasAndContext( parent: HTMLElement, width: number, height: number ): { canvas: HTMLCanvasElement, gl: WebGL2RenderingContext } {
  const canvas = document.createElement( "canvas" )

  canvas.width  = width
  canvas.height = height

  parent.appendChild( canvas )

  const gl = canvas.getContext( "webgl2" ) as WebGL2RenderingContext;

  if ( !gl ) {
    throw new Error( "WebGL 2 not supported" );
  }

  return { canvas, gl }
}

function createShader( gl: WebGL2RenderingContext, type: number, code: string ): WebGLShader {
  const type_name = type === gl.VERTEX_SHADER ? "VERTEX" : "FRAGMENT"

  console.log( `COMPILING ${ type_name } SHADER` )
  console.log( code )

  const shader = gl.createShader( type ) as WebGLShader

  if( !shader ) {
    throw new Error( `Failed to create ${ type_name } shader` )
  }

  gl.shaderSource( shader, code )
  gl.compileShader( shader )

  if( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ) {
    console.error( `ERROR IN ${ type_name } SHADER COMPILATION`)
    console.error( gl.getShaderInfoLog( shader ) )
  }

  return shader
}

function createProgram( gl: WebGL2RenderingContext, vertex_code: string, fragment_code: string ): WebGLProgram {
  const vertex_shader   = createShader( gl, gl.VERTEX_SHADER,   vertex_code ) as WebGLShader
  const fragment_shader = createShader( gl, gl.FRAGMENT_SHADER, fragment_code ) as WebGLShader

  const program = gl.createProgram()

  gl.attachShader( program, vertex_shader )
  gl.attachShader( program, fragment_shader )

  gl.linkProgram( program )
  gl.useProgram( program )

  return program
}

function getModelViewProjectionMatrix( camera: Camera ): mat4 {
  const view_matrix = camera.getViewMatrix()

  mat4.multiply( mvp_matrix, projection_matrix, view_matrix )
  mat4.multiply( mvp_matrix, mvp_matrix, model_matrix )

  return mvp_matrix
}

function setDiffuseLightingUniform( gl: WebGL2RenderingContext, program: WebGLProgram, direction: vec3 ): void {
  const u_light = gl.getUniformLocation( program, "u_lightDirection" )

  gl.uniform3fv( u_light, direction )
}

const canvas_parent = document.querySelector( ".wrapper" ) as HTMLElement

const fs_promise = fetch( "./glsl/fragment.c" ).then( response => response.text() );
const vs_promise = fetch( "./glsl/vertex.c" ).then( response => response.text() );

const model_promise = fetch( "./models/teapot.obj" ).then( response => response.text() );

load( {
  fs_source: fs_promise,
  vs_source: vs_promise,
  model_source: model_promise
} ).then( ( { 
  fs_source, 
  vs_source,
  model_source
} ) => {

  const { canvas, gl } = createCanvasAndContext( canvas_parent, width, height )

  const program = createProgram( gl, vs_source, fs_source )

  gl.viewport( 0, 0, canvas.width, canvas.height )
  gl.enable( gl.DEPTH_TEST )
  gl.clearColor( 0, 0, 0, 0 )


  const position_buffer = gl.createBuffer()
  const normal_buffer   = gl.createBuffer()

  const model_data = WavefrontOBJParser.parse( model_source )

  console.log( model_data )

  const faces = model_data.faces_expanded
  const normals = model_data.normals_expanded

  gl.bindBuffer( gl.ARRAY_BUFFER, position_buffer )
  gl.bufferData( gl.ARRAY_BUFFER, faces, gl.STATIC_DRAW )

  gl.bindBuffer( gl.ARRAY_BUFFER, normal_buffer )
  gl.bufferData( gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW )

  const position_location = gl.getAttribLocation( program, "a_position" )

  gl.enableVertexAttribArray( position_location )
  gl.vertexAttribPointer( position_location, 3, gl.FLOAT, false, 0, 0 )

  const normal_location = gl.getAttribLocation( program, "a_normal" )

  gl.enableVertexAttribArray( normal_location )
  gl.vertexAttribPointer( normal_location, 3, gl.FLOAT, false, 0, 0 )

  // #endregion

  const camera = new Camera()
	
	camera.setPosition( 0, 3, -12 )

  const control = new DOMControl( canvas, camera )

  const projection_location = gl.getUniformLocation( program, "u_projection" )

  const light_direction = vec3.fromValues( 0, 0, 0 )

  setDiffuseLightingUniform( gl, program, light_direction )

  const start = Date.now()

  let t = 0
  let last_draw = start

  function draw() {
    const now = Date.now()
    const delta_time_ms = now - last_draw
    t += delta_time_ms / 1000

    control.updateCameraPosition( delta_time_ms )

    gl.bindBuffer( gl.ARRAY_BUFFER, position_buffer )
    gl.bufferData( gl.ARRAY_BUFFER, faces, gl.STATIC_DRAW )
    gl.vertexAttribPointer( position_location, 3, gl.FLOAT, false, 0, 0 )

    gl.bindBuffer( gl.ARRAY_BUFFER, normal_buffer )
    gl.bufferData( gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW )
    gl.vertexAttribPointer( normal_location, 3, gl.FLOAT, false, 0, 0 )

    setDiffuseLightingUniform( gl, program, [ Math.cos( t / 2 ) * 5, 5, Math.sin( t / 2 ) * 5 ] )

    const mvp = getModelViewProjectionMatrix( camera )

    gl.uniformMatrix4fv( projection_location, false, mvp )
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT )
    gl.drawArrays( gl.TRIANGLES, 0, faces.length / 3 )

    last_draw = now

    requestAnimationFrame( draw )
  }

  requestAnimationFrame( draw )
} )
