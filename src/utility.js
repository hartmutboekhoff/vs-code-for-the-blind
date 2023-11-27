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


function splitJsonPath(path) {
  const JsonPathSplitRx = /(?<!\[)(?<=\.|^)([a-zA-Z_$][a-zA-Z0-9_$]*)(?=[\.\[]|$)(?!\])|\[(\d+)\]|\["(.*?)(?<!\\)"\]|\['(.*?)(?<!\\)'\]/g;
  return [...path.matchAll(JsonPathSplitRx)]
    .map(m=>m.slice(1).find(v=>v));
}
function resolveJsonHierarchy(path,data) {
  return [{key:'',data}, 
          ...splitJsonPath(path)
               .map(key=>(data=data?.[key],{key,data}))
         ];
}

function resolveJsonPath(path,obj) {
  return splitJsonPath(path)
          .reduce((acc,k)=>acc?.[k], obj);
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

/**  
*    renames a property and preserves the properties order inside the object
*    instead of deleting the old property and appending the new one
*/
function renameObjectProperty(obj,oldKey,newKey) {
  const result = {};
  for( const k in obj )
    result[k==oldKey?newKey:k] = obj[k];
  return result;
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

module.exports = {
  camelCase,
  generateNonce,
  splitJsonPath,
  resolveJsonHierarchy,
  resolveJsonPath,
  isValidIdentifier,
  buildJsonPath,
  renameObjectProperty,
  getAllPropertyNames,
}