function toCamelCase(text) {
  return text.replace(/(?:^|(\d)|[^a-zA-Z]+)([a-z])/g,(all,digit,lower)=>(digit??'')+lower.toUpperCase());
}
function toNiceText(name) {
  return name
    .replaceAll(/([-_]+)|(?:([a-z0-9])([A-Z]))/g,(m,p1,p2,p3)=>p1!=undefined?' ':p2+' '+p3)
    .replaceAll(/\b[A-Z]+\b/g,m=>m[0]+m.slice(1).toLowerCase());
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
  camelCase: toCamelCase, // better use 'toCamelCase'
  toCamelCase,
  toNiceText,
  splitJsonPath,
  resolveJsonHierarchy,
  resolveJsonPath,
  isValidIdentifier,
  buildJsonPath,
  renameObjectProperty,
  getAllPropertyNames,
}