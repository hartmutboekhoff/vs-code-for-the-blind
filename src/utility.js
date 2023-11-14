function camelCase(text) {
  return text.replace(/(?:^|(\d)|[^a-zA-Z]+)([a-z])/g,(all,digit,lower)=>(digit??'')+lower.toUpperCase());
}

function generateNonce() {
	let text = '';
	const Possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for( let i = 0 ; i < 32 ; i++ )
		text += Possible.charAt(Math.floor(Math.random() * Possible.length));

	return text;
}

const JsonPathSplitRx = /(?<!\[)(?<=\.|^)([a-zA-Z_$][a-zA-Z0-9_$]*)(?=[\.\[]|$)(?!\])|\[(\d+)\]|\["(.*?)(?<!\\)"\]|\['(.*?)(?<!\\)'\]/g;

function resolveJsonHierarchy(path,obj) {
  const hierarchy = [{key:'',data:obj}];
  let data = obj;
  for( const k of path.matchAll(JsonPathSplitRx) ) {
    const key = k[1] ?? k[2] ?? k[3] ?? k[4];
    if( data != undefined ) 
      data = data[key];
    hierarchy.push({key,data});
  }
  return hierarchy;
}

function resolveJsonPath(path,obj) {
  let data = obj;
  for( const k of path.matchAll(JsonPathSplitRx) )
    if( undefined == (data = data[k[1] ?? k[2] ?? k[3] ?? k[4]]) )
      break;
  return data;
}

function isValidIdentifier(str) {
  const validIdentifier = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  return validIdentifier.test(str);
}
function buildJsonPath(path, ...keys) {
  for( const key of keys ) {
    if( isValidIdentifier(key) )
      path = path==''? key : `${path}.${key}`;
    else if( Number.isInteger(+key) )
      path = `${path}[${key}]`;
    else
      path = `${path}["${key.replace('\\','\\\\').replace('"','\\"')}"]`;
  }
  return path;
}

function getAllPropertyNames(obj) {
  const names = new Set();
  const [isArray,stopper] = Array.isArray(obj)? [true,Array.prototype] : [false,Object.prototype];
  while( obj != stopper ) {
    const pds = Object.getOwnPropertyDescriptors(obj);
    for( const n in pds ) {
      const pd = pds[n];
      if( typeof pd.get == 'function' || ('value' in pd && typeof pd.value != 'function') )
        names.add(n);
    }
    obj = Object.getPrototypeOf(obj);
  }
  if( isArray ) names.delete('length');
  return  [...names]; 
}
/**
*   Deprecated! Use 'Traversion' instead
*
*   Traverses the values of an object or array recursively
*   and invokes a callback function on every node.
*
*   Syntaxx:
*      traverseObject(obj, callback)
*      traverseObject(obj, callback, options)
*      traverseObject(obj, callback, nest, options)
*      traverseObject(obj, callback, nest, unnest, options)
*
*   @param obj  the object to be traversed
*   @param callback  a callback function, that is invoked on every value and nested value in 'obj' 
*   @param nest  a callback function that gets invoked just before
*                the operation enters the next nesting-level
*   @param unnest  a callback function that gets invoked when all values of the 
*                  current parent-object are completed an before processing 
*                  continues on the next higher nesting-level
*   @param options  a group of values to control the methods behaviour 
*                     * parentFirst (default=true)
*                     * reverse (default=false)
*                     * rootPath (default='')
*                     * keys (default=undefined)
*                     * maxDepth (default=Infinity)
*/
/*
function traverseObject(obj,callback, nest, unnest, options) {
  function _callback(obj,path,key,depth) {
    try {
      callback?.(obj,path,key,depth);
    }
    catch (e) {
      console.debug('Exception user-code while traversing object-tree.', e)
    }
  }
  function _nest(obj,path,key,depth) {
    try {
      return nest?.(obj,path,key,depth) ?? obj;
    } 
    catch (e) {
      console.debug('Exception user-code while traversing object-tree.', e)
      return obj;
    }
  }
  function _unnest(obj,path,key,depth) {
    try {
      unnest?.(obj,path,key,depth);
    }
    catch (e) {
      console.debug('Exception user-code while traversing object-tree.', e)
    }
  }
  function traverseNested(obj,path,key,depth) {
    if( Object.keys(obj).length == 0 ) return;
    
    const nestedItems = _nest(obj,path,key,depth);
    let itemKeys = _options.keys != undefined
                    ? _options.keys.slice()
                    : nestedItems !== obj
                    ? Object.kys(nestedItems)
                    : Array.isArray(nestedItems)
                    ? getAllPropertyNames(obj).filter(n=>n!='length')
                    : getAllPropertyNames(obj);
                    
    if( _options.reverse == true )
      itemKeys.reverse();

    itemKeys.forEach(k=>{
      if( Array.isArray(nestedItems) && Number.isInteger(+k) )
        k = +k;

      traverseValue(nestedItems[k],buildJsonPath(path,k),k,depth+1);
    });

    _unnest(obj,path,key,depth) ?? obj;
  }
  function traverseValue(obj,path,key,depth) {
    if( recursionTracker.includes(obj) ) return;
    recursionTracker.push(obj);
    
    if( _options.parentFirst ) 
      _callback(obj,path,key,depth);
    
    if( typeof obj == 'object' && depth < _options.maxDepth )
      traverseNested(obj,path,key,depth);

    if( !_options.parentFirst ) 
      _callback(obj,path,key,depth);
    
    recursionTracker.pop();
  }
  function prepareArguments() {
    if( typeof options == 'object' )
      ; // ok
    else if( typeof unnest == 'object' ) {
      options = unnest;
      unnest = undefined;
    }
    else if( unnest == undefined && typeof nest == 'object' ) {
      options = nest;
      nest = undefined;
    }
    
    if( !typeof nest == 'function' ) nest = undefined;
    if( !typeof unnest == 'function' ) unnest = undefined;
    
    return {
      reverse: options?.reverse ?? false,
      parentFirst: options?.parentFirst ?? true,
      maxDepth: options?.maxDepth >= 0? options.maxDepth : Infinity,
      keys: options?.keys,    
      rootPath: options?.rootPath ?? '',
    };
  }
  
  const recursionTracker = [];
  const _options = prepareArguments();
  
  traverseValue(obj, _options.rootPath, '', 0);
}
*/

module.exports = {
  camelCase,
  generateNonce,
  resolveJsonHierarchy,
  resolveJsonPath,
  isValidIdentifier,
  buildJsonPath,
  getAllPropertyNames,
  //traverseObject,
}