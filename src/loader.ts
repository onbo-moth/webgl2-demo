const loading_dialog  = document.querySelector( "#loading-dialog" ) as HTMLDialogElement
const console_element = document.querySelector( "#console" ) as HTMLDivElement

function print( text: string ) {
  console_element.innerHTML += "<br>" + text 
}

function updateLoadingBar( value: number, max: number ) {
  loading_dialog.querySelector( "progress" )!.value = value / max * 100
}

export function load< T extends { [ key: string ]: Promise<any> } >(
  promises: T
): Promise< { [ key in keyof T ]: Awaited< T[ key ] > } > {
  const promise_array = Object.values( promises )

  let total = 0
  const max = promise_array.length

  for( const [ key, promise ] of Object.entries( promises ) ) {
    promise.then( value => {
      total += 1
      updateLoadingBar( total, max )
      print( `Loaded ${ key }` )
    } ).catch( error => {
      updateLoadingBar( total, max )
      print( `Failed to load ${ key }` )
      print( error )
    } )
  }

  return Promise.all( promise_array ).then( values => {
    print( "Successfully loaded all assets." )

    loading_dialog.close()

    return values.reduce( ( obj, value, index ) => {
      obj[ Object.keys( promises )[ index ] ] = value
      return obj
    }, {} )
  } )
}
