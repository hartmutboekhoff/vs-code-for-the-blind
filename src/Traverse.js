const {getAllPropertyNames, buildJsonPath} = require('./utility');

class Traversion {
  #maxDepth = Infinity;
  #allowedKeys;
  #stack = [];
  #preventNesting = false;
  #excludeNestingKeys = undefined;
  #abort = 0;
  
  constructor(options) {
    this.maxDepth = options?.maxDepth ?? Infinity;
    this.allowedKeys = options?.allowedKeys;
    this.parentFirst = options?.parentFirst ?? true;
    this.reverse = options?.reverse ?? false;
  }
  get maxDepth() { return this.#maxDepth; }
  set maxDepth(v) { this.#maxDepth = Number.isInteger(+v)? +v : Infinity; }
  get allowedKeys() { return this.#allowedKeys; }
  set allowedKeys(v) { this.#allowedKeys = Array.isArray(v)? v : undefined; }
  
  getRoot() {
    if( this.#stack.length == 0 )
      throw 'Traverse is not in progress';
    return this.#stack[0];
  }
  getParent(n=0) {
    if( this.#stack.length == 0 )
      throw 'Traverse is not in progress';
    return this.#stack[this.#stack.length - n - 1];
  }
  
  preventNesting(...keys) {
    if( keys.length == 0 )
      this.#preventNesting = true;
    else
      this.#excludeNestingKeys = (keys.length == 1 && Array.isArray(keys[0])? keys[0] : keys).slice();
  }  
  #resetNestingPrevention() {
    this.#preventNesting = false;
    this.#excludeNestingKeys = undefined;
  }
  
  #onValue(obj, key, path) {
    try {
      this.onValue(obj, key, path, this.#stack.length-1);
    }
    catch(e) {
      console.debug('Exception user-code while traversing object-tree.', e)
    }
  }
  #onRecursion(obj, key, path) {
    try {
      this.onRecursion(obj, key, path, this.#stack.length-1);
    }
    catch(e) {
      console.debug('Exception user-code while traversing object-tree.', e)
    }
  }
  #beforeNesting(obj, key, path) {
    let nested;
    try {
      nested = this.beforeNesting(obj, key, path, this.#stack.length-1);
    }
    catch(e) {
      console.debug('Exception user-code while traversing object-tree.', e)
    }
    
    return nested ?? obj;
  }
  #afterNesting(obj, key, path, aborted) {
    try {
      this.afterNesting(obj, key, path, this.#stack.length-1, aborted);
    }
    catch(e) {
      console.debug('Exception user-code while traversing object-tree.', e)
    }
  }
  #onNoNesting(obj, key, path) {
    try {
      this.onNoNesting(obj, key, path, this.#stack.length-1);
    }
    catch(e) {
      console.debug('Exception user-code while traversing object-tree.', e)
    }
  }
  #onAbortNesting(obj, key, path, processedKeys, abortedKeys) {
    try {
      this.onAbortNesting(obj, key, path, this.#stack.length-1, processedKeys, abortedKeys);
    }
    catch(e) {
      console.debug('Exception user-code while traversing object-tree.', e)
    }
  }

  #traverseValue(obj,key,path) {
    if( this.#stack.includes(obj) ) {
      this.#onRecursion(obj, key, path);
    }
    else {
      this.#stack.push(obj);
      
      this.#resetNestingPrevention();
      
      if( this.parentFirst )
        this.#onValue(obj, key, path)

      if( this.#maxDepth >= this.#stack.length 
          && typeof obj == 'object' ) {
        this.#traverseNested(obj, key, path);
      }
      else {
        this.#onNoNesting(obj, key, path);
      }

      if( !this.parentFirst )
        this.#onValue(obj, key, path)
      
      this.#stack.pop();
    }
  }
  #traverseNested(obj, key, path) {
    function filterExcludedKeys(keys,exclude) {
      if( exclude == undefined ) return keys;
      
      exclude.forEach(x=>{
        if( typeof x == 'string' ) {
          const ix = keys.indexOf(x);
          if( ix >= 0 ) keys.splice(ix,1)
        }
        else if( typeof x == 'object' && x.constructorName == 'RegExp' )
          keys = keys.filter(k=>!x.test(k));
      });
      return keys;
    }
    
    if( this.#preventNesting == true ) {
      this.#onNoNesting(obj, key, path)
      return;
    }
    
    let nestingKeys = this.#allowedKeys != undefined
                        ? this.#allowedKeys.slice()
                        : Array.isArray(obj)
                        ? getAllPropertyNames(obj).filter(n=>n!='length')
                        : getAllPropertyNames(obj);

    nestingKeys = filterExcludedKeys(nestingKeys, this.#excludeNestingKeys);

    if( nestingKeys.length == 0 ) {
      this.#onNoNesting(obj, key, path);
      return;
    }

    const excludeBackup = this.#excludeNestingKeys;

    const finalObj = this.#beforeNesting(obj, key, path);

    if( finalObj != obj )
      nestingKeys = filterExcludedKeys(Object.keys(finalObj), this.#excludeNestingKeys);
    else if( this.#excludeNestingKeys != excludeBackup )
      nestingKeys = filterExcludedKeys(nestingKeys, this.#excludeNestingKeys);

    let aborted;
    if( this.#preventNesting == true || nestingKeys.length == 0 ) {
      aborted = true;
      this.#onAbortNesting(obj, key, path, [], nestingKeys);
    }
    else {
      aborted = Array.isArray(finalObj)
                  ? this.#traverseNestedArray(finalObj, key, path, nestingKeys)
                  : this.#traverseNestedObject(finalObj, key, path, nestingKeys);
    }
    this.#afterNesting(finalObj, key, path, aborted);
  }
  #traverseNestedArray(obj, key, path, nestingKeys) {
    for( let i = 0 ; i < nestingKeys.length ; i++ ) {
      const k = nestingKeys[i];
      if( this.#abort > 0 ) {
        --this.#abort;
        this.#onAbortNesting(obj, key, path, nestingKeys.slice(0,i), nestingKeys.slice(i));
        return true;
      }
      const nk = Number.isInteger(+k)? +k : k;
      if( nk in obj ) {
        this.#traverseValue(obj[nk], nk, buildJsonPath(path,nk))
      }
    }
    return false;
  }
  #traverseNestedObject(obj, key, path, nestingKeys) {
    for( let i = 0 ; i < nestingKeys.length ; i++ ) {
      const k = nestingKeys[i];
      if( this.#abort > 0 ) {
        --this.#abort;
        this.#onAbortNesting(obj, key, path, nestingKeys.slice(0,i), nestingKeys.slice(i));
        return true;
      }
      if( k in obj ) {
        this.#traverseValue(obj[k], k, buildJsonPath(path,k))
      }
    }
    return false;
  }
  start(obj) {
    if( this.#stack.length > 0 )
      throw 'Traversion is allready in progress';

    this.#abort = 0;
    this.#traverseValue(obj, '', '');
  }
  onValue(/*obj, key, path, depth*/) {
    // override
  }
  beforeNesting(/*obj, key, path, depth*/) {
    //override
  }
  afterNesting(/*obj, key, path, depth*/) {
    // override
  }
  onRecursion(/*obj, key, path, depth*/) {
    // override
  }
  onNoNesting(/*obj, key, path, depth*/)  {
    // override
  }
  onAbortNesting(/*obj, key, path, depth, processedKeys, abortedKeys*/) {
    // override
  }
}

module.exports = Traversion;