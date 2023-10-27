const {getAllPropertyNames, buildJsonPath} = require('./utility');

class Traversion {
  #maxDepth = Infinity;
  #allowedKeys;
  #stack = [];
  #preventNesting = false;
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
  
  preventNesting() {
    this.#preventNesting = true;
  }
  abortNestingLevel(count) {
    this.#abort = count < 0? this.#stack.length + count : count;
    if( this.#abort < 0 ) this.#abort = 0;
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
    
    nested ??= obj;
      
    const nestedKeys = this.#preventNesting
                        ? []
                        : this.#allowedKeys != undefined
                        ? this.#allowedKeys.slice()
                        : nested !== obj
                        ? Object.kys(nested)
                        : Array.isArray(obj)
                        ? getAllPropertyNames(obj).filter(n=>n!='length')
                        : getAllPropertyNames(obj);
    return {
             obj: nested, 
             keys: this.reverse? nestedKeys.reverse() : nestedKeys
            }
  }
  #afterNesting(obj, key, path, aborted) {
    try {
      this.afterNesting(obj, key, path, this.#stack.length-1, aborted)
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
      if( this.parentFirst )
        this.#onValue(obj, key, path)

      if( this.#maxDepth >= this.#stack.length 
          && !this.#preventNesting 
          && typeof obj == 'object' ) {
        this.#traverseNested(obj, key, path);
      }

      if( !this.parentFirst )
        this.#onValue(obj, key, path)
      
      this.#stack.pop();
    }
    this.#preventNesting = false;
  }
  #traverseNested(obj, key, path) {
    const {obj:obj2, keys} = this.#beforeNesting(obj, key, path);
    const aborted = this.#preventNesting
                      ? true
                      :Array.isArray(obj2)
                      ? this.#traverseNestedArray(obj2, path, keys)
                      : this.#traverseNestedObject(obj2, path, keys);
    
    this.#afterNesting(obj2, key, path, aborted)
  }
  #traverseNestedArray(obj, path, keys) {
    for( const k of keys ) {
      if( this.#abort > 0 ) {
        --this.#abort;
        return true;
      }
      const nk = Number.isInteger(+k)? +k : k;
      if( nk in obj ) {
        this.#traverseValue(obj[nk], nk, buildJsonPath(path,nk))
      }
    }
    return false;
  }
  #traverseNestedObject(obj, path, keys) {
    for( const k of keys ) {
      if( this.#abort > 0 ) {
        --this.#abort;
        return true;
      }
      if( k in obj ) {
        this.#traverseValue(obj[k], k, buildJsonPath(path,k))
      }
      return false;
    }
    
  }
  start(obj) {
    if( this.#stack.length > 0 )
      throw 'Traversion is allready in progress';

    this.#abort = 0;
    this.#preventNesting = false;
    this.#traverseValue(obj, '', '');
  }
  onValue() {
    // override
  }
  beforeNesting() {
    //override
  }
  afterNesting() {
    // override
  }
  onRecursion() {
    // override
  }
}

module.exports = Traversion;