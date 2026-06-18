import { Camera } from "./camera"

export class DOMControl {
  private keys: Set<string> = new Set()

  private pointer_locked = false

  private speed = 5
  private sensitivity = -0.005
  private scroll_multi = 1.1 // multi when scrolling up, inverse when down

  constructor( 
    private element: HTMLElement,
    private camera: Camera
  ) {
    this.bindOwnEvents()
  }

  private bindOwnEvents() {
    document.addEventListener( "keydown", this.onKeyDown.bind( this ) )
    document.addEventListener( "keyup",   this.onKeyUp.bind( this ) )

    document.addEventListener( "pointerlockchange", this.onPointerLockChange.bind( this ) )

    this.element.addEventListener( "mousedown", this.onMouseDown.bind( this ) )
    this.element.addEventListener( "mousemove", this.onMouseMove.bind( this ) )
    this.element.addEventListener( "wheel",     this.onMouseWheel.bind( this ) )

    this.element.addEventListener( "contextmenu", event => event.preventDefault() )
    
  }

  private onKeyDown( event: KeyboardEvent ) {
    this.keys.add( event.code )
  }

  private onKeyUp( event: KeyboardEvent ) {
    this.keys.delete( event.code )
  }

  private onMouseDown( event: MouseEvent ) {
    console.log( event.button )

    if( !this.pointer_locked && event.button === 2 ) {
      this.lockPointer()
    }
  }

  private onMouseWheel( event: WheelEvent ) {
    if( event.deltaY < 0 ) {
      this.speed *= this.scroll_multi
    } else if ( event.deltaY > 0 ) {
      this.speed /= this.scroll_multi
    }
  }

  private onMouseMove( event: MouseEvent ) {
    if( !this.pointer_locked ) return;

    const x = event.movementX
    const y = event.movementY

    console.log( x, y)

    const rotation = this.camera.getRotation()

    let new_pitch = rotation.pitch + y * this.sensitivity
    const epsilon = 0.001

    if( new_pitch > Math.PI / 2 - epsilon ) {
      new_pitch = Math.PI / 2 - epsilon
    } else if( new_pitch < -Math.PI / 2 + epsilon ) {
      new_pitch = -Math.PI / 2 + epsilon
    }

    this.camera.setRotation(
      rotation.yaw + x * this.sensitivity,
      new_pitch,
      rotation.roll
    )
  }

  private lockPointer() {
    this.element.requestPointerLock()
  }

  private onPointerLockChange( event: Event ) {
    this.pointer_locked = document.pointerLockElement === this.element

    if( this.pointer_locked ) {
      this.element.classList.add( "locked" )
    } else {
      this.element.classList.remove( "locked" )
    }
  }

  isKeyPressed( key: string ) {
    return this.keys.has( key )
  }

  updateCameraPosition( delta_time_ms: number ) {
    if( !this.pointer_locked ) return;

    const position = this.camera.getPosition()
    const rotation = this.camera.getRotation()

    let distance = this.speed * delta_time_ms / 1000

    let x = 0;
    let y = 0;
    let z = 0;

    if( this.isKeyPressed( "KeyA" ) ) x += 1
    if( this.isKeyPressed( "KeyD" ) ) x -= 1

    if( this.isKeyPressed( "Space" ) ) y += 1
    if( this.isKeyPressed( "ShiftLeft" ) ) y -= 1

    if( this.isKeyPressed( "KeyW" ) ) z += 1
    if( this.isKeyPressed( "KeyS" ) ) z -= 1


    if( x !== 0 || z !== 0 ) {
      const len = Math.hypot( x, z )
      x /= len
      z /= len
    }

    const cos = Math.cos( -rotation.yaw )
    const sin = Math.sin( -rotation.yaw )

    const move_x = x * cos - z * sin
    const move_z = x * sin + z * cos

    this.camera.setPosition(
      position.x + move_x * distance,
      position.y + y      * distance,
      position.z + move_z * distance
    )
  }
}