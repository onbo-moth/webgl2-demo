export type WavefrontOBJData = {
  vertices: Float32Array,
  faces_indexed: Uint16Array,
  normals_indexed: Uint16Array,

  faces_expanded: Float32Array,
  normals_expanded: Float32Array,

  lines: Float32Array,

  normal_table: number[][]
}

export class WavefrontOBJParser {
  static parse( data: string ): WavefrontOBJData {
    const normal_table: number[][] = []

    const vertices: number[] = []

    const face_indexes:    number[] = []
    const normal_indexes:  number[] = []

    const faces_expanded: number[] = []
    const normals_expanded: number[] = []

    const face_lines: number[] = []

    const lines = data.split( "\n" )

    for( const [ index, line ] of lines.entries() ) {
      const code = line.split( "#", 1 )[0].trim()

      if( code === "" ) continue;

      const segments = code.split( " " ).filter( segment => segment.length != 0 )

      const keyword = segments[0]

      try {
        switch( keyword ) {
          case "v": {
            const x = parseFloat( segments[1] )
            const y = parseFloat( segments[2] )
            const z = parseFloat( segments[3] )

            vertices.push( x, y, z )

            break;
          }

          case "vn": {
            const nx = parseFloat( segments[1] )
            const ny = parseFloat( segments[2] )
            const nz = parseFloat( segments[3] )

            normal_table.push( [ nx, ny, nz ] )

            break;
          }

          case "f": {
            // const a = parseInt( segments[1] ) - 1 
            // const b = parseInt( segments[2] ) - 1 
            // const c = parseInt( segments[3] ) - 1

            const [ fa, na ] = segments[ 1 ].split( "//" )
            const [ fb, nb ] = segments[ 2 ].split( "//" )
            const [ fc, nc ] = segments[ 3 ].split( "//" )

            // index faces
            const ifa = parseInt( fa ) - 1
            const ifb = parseInt( fb ) - 1
            const ifc = parseInt( fc ) - 1

            face_indexes.push( ifa, ifb, ifc )

            faces_expanded.push(
              vertices[ ifa * 3     ],
              vertices[ ifa * 3 + 1 ],
              vertices[ ifa * 3 + 2 ],
              vertices[ ifb * 3     ],
              vertices[ ifb * 3 + 1 ],
              vertices[ ifb * 3 + 2 ],
              vertices[ ifc * 3     ],
              vertices[ ifc * 3 + 1 ],
              vertices[ ifc * 3 + 2 ],
            )

            // add lines
            for( const indices of [ [ ifa, ifb ], [ ifb, ifc ], [ ifc, ifa ] ] ) {
              const [ i1, i2 ] = indices              
              
              face_lines.push(
                vertices[ i1 * 3     ],
                vertices[ i1 * 3 + 1 ],
                vertices[ i1 * 3 + 2 ],
                vertices[ i2 * 3     ],
                vertices[ i2 * 3 + 1 ], 
                vertices[ i2 * 3 + 2 ]
              )
            }

            if( !na || !nb || !nc ) break;

            // index normals
            const ina = parseInt( na ) - 1
            const inb = parseInt( nb ) - 1
            const inc = parseInt( nc ) - 1

            normal_indexes.push( ina, inb, inc )

            normals_expanded.push(
              normal_table[ ina ][ 0 ],
              normal_table[ ina ][ 1 ],
              normal_table[ ina ][ 2 ],
              normal_table[ inb ][ 0 ],
              normal_table[ inb ][ 1 ],
              normal_table[ inb ][ 2 ],
              normal_table[ inc ][ 0 ],
              normal_table[ inc ][ 1 ],
              normal_table[ inc ][ 2 ],
            )


            break;
          }

          default: {
            console.log( `unknown keyword '${keyword}', ignoring.`)
          }
        }
      } catch ( exception ) {
        console.error( `error in parsing code (line ${ index }): ${ line }`)
        console.error( exception )
        throw new Error( ":3" ) // to stop program
      }
    } 

    return {
      vertices: new Float32Array( vertices ),
      normal_table,
      faces_indexed:   new Uint16Array( face_indexes ),
      normals_indexed: new Uint16Array( normal_indexes ),
      faces_expanded: new Float32Array( faces_expanded ),
      normals_expanded: new Float32Array( normals_expanded ),
      lines: new Float32Array( face_lines )
    }
  }
}