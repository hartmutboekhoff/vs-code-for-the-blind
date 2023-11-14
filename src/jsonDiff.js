const {diff:diffJson} = require('deep-diff');

function comparePaths(left, right, depth) {
  let maxDepth = left.length < right.length? left.length : right.length;
  if( depth < 0 ) 
    maxDepth += depth;
  else if( maxDepth > depth )
    maxDepth = depth;

  for( let i = 0 ; i < maxDepth ; i++ )
    if( left[i] != right[i] ) return false;

  return true;
}
function deepCompareValue(left, right) {
  if( typeof left != typeof right ) return false;
  if( typeof left != 'object' ) return left == right;
  
  const lkeys = Object.keys(left);
  const rkeys = Object.keys(right);
  if( lkeys.length != rkeys.length ) return false;
  for( const k of lkeys )
    if( !(k in right) || !deepCompareValue(left[k], right[k]) ) 
      return false;
  return true;  
}

function diff(obj1, obj2) {
  const diffs = diffJson(obj1, obj2);
console.log(diffs);

  const final = [];
  const deletedNodes = [];
  const newNodes = [];

  diffs.forEach(d=>{
    switch( d.kind ) {
      case 'D':
        deletedNodes.push(d);
        break;
      case 'N':
        newNodes.push(d);
        break;
      default:
        final.push({kind:d.kind, lpath:d.path, rpath:d.path, lhs:d.lhs, rhs:d.rhs});
    }
  });

  for( let dix = 0 ; dix < deletedNodes.length ; dix++ ) {
    const delNode = deletedNodes[dix];
    for( let nix = 0 ; nix < newNodes.length ; nix++ ) {
      const newNode = newNodes[nix];
      if( newNode != undefined ) {
        if( comparePaths(delNode.path, newNode.path, -1)
            && deepCompareValue(delNode.lhs, newNode.rhs)  ) {
          final.push({kind:'R', lpath: delNode.path, rpath: newNode.path, lhs: delNode.lhs, rhs: newNode.rhs});
          deletedNodes[dix] = undefined;
          newNodes[nix] = undefined;
        }
      }
    }
  }
  return final.concat(
            ...deletedNodes
                  .filter(n=>n!=undefined)
                  .map(n=>({kind:n.kind, lpath:n.path, lhs:n.lhs, rpath:undefined, rhs:undefined})),
            ...newNodes
                  .filter(n=>n!=undefined)
                  .map(n=>({kind:n.kind, lpath:undefined, lhs:undefined, rpath: n.path, rhs: n.rhs}))
         );
}


exports.diff = diff;