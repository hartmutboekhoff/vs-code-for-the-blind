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
  const hierarchy = [];
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



module.exports = {
  camelCase,
  generateNonce,
  resolveJsonHierarchy,
  resolveJsonPath,
}