import { mat4, vec3 } from "gl-matrix"

export class Camera {
  private position = {
    x: 0,
    y: 0,
    z: 0 
  }

  private rotation = {
    yaw: 0,
    pitch: 0,
    roll: 0
  }

  private position_vector = vec3.create()
  private up_vector       = vec3.fromValues( 0, 1, 0 )
  private forward_vector  = vec3.create()

  private camera_front_vector = vec3.create()

  private view_matrix = mat4.create()

  setPosition( x: number, y: number, z: number ) {
    this.position.x = x
    this.position.y = y
    this.position.z = z
  }

  getPosition() {
    return this.position
  }

  setRotation( yaw: number, pitch: number, roll: number ) {
    this.rotation.yaw = yaw
    this.rotation.pitch = pitch
    this.rotation.roll = roll
  }

  getRotation() {
    return this.rotation
  }

  getPositionVector() {
    vec3.set( this.position_vector, this.position.x, this.position.y, this.position.z )

    return this.position_vector
  }

  getUpVector() {
    return this.up_vector
  }

  getForwardVector() {
    vec3.set(
      this.forward_vector,
      Math.sin( this.rotation.yaw ) * Math.cos( this.rotation.pitch ),
      Math.sin( this.rotation.pitch ),
      Math.cos( this.rotation.yaw ) * Math.cos( this.rotation.pitch )
    )

    return this.forward_vector
  }

  getViewMatrix() {
    const eye = this.getPositionVector()
    const forward = this.getForwardVector()
    const up = this.getUpVector()

    vec3.add( this.camera_front_vector, eye, forward )

    mat4.lookAt( this.view_matrix, eye, this.camera_front_vector, up )

    return this.view_matrix
  }
}