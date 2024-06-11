require('./Set');
const {getAllPropertyNames, buildJsonPath} = require('./utility');

class NestingOptions {
  #version = 0;
  #nesting;
  #included; #excluded; #required;
  
  constructor(opts) {
    this.#nesting = opts?.nesting ?? true;
    this.#included = this.#createTrackkableArray(opts?.included);
    this.#excluded = this.#createTrackkableArray(opts?.excluded);
    this.#required = this.#createTrackkableArray(opts?.required);
  }
  #createTrackkableArray(data) {
    const a = data?.slice() ?? [];
    return new Proxy(a, {
      deleteProperty: (target, property)=>{
        delete target[property];
        ++this.#version;
        return true;
      },
      set: (target, property, value, receiver)=>{      
        target[property] = value;
        ++this.#version;
        return true;
      }
      
    });
  }
  
  get nesting() { 
    return this.#nesting; 
  }
  set nesting(v) {
    ++this.#version;
    this.#nesting = v == true;
  }
  get included() {
    return this.#included;
  }
  set included(v) {
    this.#included.splice(0,Infinity,...v);
  }
  get excluded() {
    return this.#excluded;
  }
  set excluded(v) {
    this.#excluded.splice(0,Infinity,...v);
  }  
  get required() {
    return this.#required;
  }
  set required(v) {
    this.#required.splice(0,Infinity,...v);
  }  
  get changeCount() {
    return this.#version;
  }
  reset() {
    this.#nesting = true;
    this.#included.splice(0);
    this.#excluded.splice(0);
    this.#required.splice(0);
    ++this.#version;
  }
}
class Stack extends Array {
  constructor(...args) {
    super(...args);
  }
  
  get current() {
    return this.at(-1);
  }
  
  includes(obj) {
    return this.find(i=>i.obj==obj) != undefined;
  }
  push(obj,key,path) {
    const stackItem = {obj, key, path, options:new NestingOptions()};
    super.push(stackItem);
    return stackItem;
  }
}

class Traversion {
  #maxDepth = Infinity;
  #globallyIncludedKeys;
  #globallyExcludedKeys;
  #stack = new Stack();
  #nestingOptions;
  #abort = 0;
  
  constructor(options) {
    this.maxDepth = options?.maxDepth ?? Infinity;
    this.includedKeys = options?.includedKeys ?? options?.allowedKeys;
    this.excludedKeys = options?.excludedKeys;
    this.parentFirst = options?.parentFirst ?? true;
    this.reverse = options?.reverse ?? false;
  }
  get maxDepth() { return this.#maxDepth; }
  set maxDepth(v) { this.#maxDepth = Number.isInteger(+v)? +v : Infinity; }
  get includedKeys() { return this.#globallyIncludedKeys; }
  set includedKeys(v) { this.#globallyIncludedKeys = Array.isArray(v)? v : undefined; }
  get excludedKeys() { return this.#globallyExcludedKeys; }
  set excludedKeys(v) { this.#globallyExcludedKeys = Array.isArray(v)? v : undefined; }
  
  getRoot() {
    if( this.#stack.length == 0 )
      throw 'Traverse is not in progress';
    return this.#stack[0].data;
  }
  getParent(n=0) {
    if( this.#stack.length == 0 )
      throw 'Traverse is not in progress';
    return this.#stack.at(-2-n)?.data;
  }
  
  get nestingOptions() {
    return this.#stack.current.options;
  }
  set nestingOptions(options) {
    const current = this.#stack.current;
    switch( typeof options ) {
      case 'object':
        current.options.nesting = true;
        current.options.included = options.included ?? [];
        current.options.excluded = options.excluded ?? [];
        current.options.required = options.required ?? [];
        break;
      case 'boolean':
        current.options.nesting = options;
        break;
      default:
        this.#stack.current.options.reset();
    }          
  }
  preventNesting(...keys) {
    const current = this.#stack.current;
    if( keys.length == 0 )
      current.options.nesting = false;
    else
      current.options.nesting = true;
      current.options.excluded = keys.length == 1 && Array.isArray(keys[0])? keys[0] : keys;
  }  
  
  #onValue(obj, key, path) {
    try {
      return this.onValue(obj, key, path, this.#stack.length-1);
    }
    catch(e) {
      console.error('Exception in user-code while traversing object-tree.', 'onValue', path, '\n', e)
    }
  }
  #onRecursion(obj, key, path) {
    try {
      this.onRecursion(obj, key, path, this.#stack.length-1);
    }
    catch(e) {
      console.debug('Exception user-code while traversing object-tree.', 'onRecursion', path, e)
    }
  }
  #beforeNesting(obj, key, path) {
    let nested;
    try {
      nested = this.beforeNesting(obj, key, path, this.#stack.length-1);
    }
    catch(e) {
      console.debug('Exception user-code while traversing object-tree.', 'beforeNesting', path, e)
    }
    
    return nested ?? obj;
  }
  #afterNesting(obj, key, path, aborted) {
    try {
      this.afterNesting(obj, key, path, this.#stack.length-1, aborted);
    }
    catch(e) {
      console.debug('Exception user-code while traversing object-tree.', 'afterNesting', path, e)
    }
  }
  #onNoNesting(obj, key, path) {
    try {
      this.onNoNesting(obj, key, path, this.#stack.length-1);
    }
    catch(e) {
      console.debug('Exception user-code while traversing object-tree.', 'onNoNesting', path, e)
    }
  }
  #onAbortNesting(obj, key, path, processedKeys, abortedKeys) {
    try {
      this.onAbortNesting(obj, key, path, this.#stack.length-1, processedKeys, abortedKeys);
    }
    catch(e) {
      console.debug('Exception user-code while traversing object-tree.', 'onAbortNesting', path, e)
    }
  }

  #traverseValue(obj,key,path) {
    if( typeof obj == 'object' && this.#stack.includes(obj) )
      return void this.#onRecursion(obj, key, path);

    const current = this.#stack.push(obj, key, path);
    if( this.parentFirst )
      current.objForNesing = this.#onValue(obj, key, path);
    current.objForNesting ??= obj;

    if( this.#stack.length <= this.#maxDepth 
        && typeof current.objForNesting == 'object' 
        && current.options.nesting ) {
      this.#traverseNested();
    }
    else {
      this.#onNoNesting(obj, key, path);
    }

    if( !this.parentFirst )
      this.#onValue(obj, key, path)
    
    this.#stack.pop();
  }
  #traverseNested() {
    const current = this.#stack.current;

    const getNestingKeys=(objKeys)=>{
      const nestingKeys = 
        (new Set(this.#globallyIncludedKeys))
          .union(new Set(current.options.required))
          .union(current.options.included.length > 0
                   ? new Set(current.options.included)
                   : new Set(objKeys));

      const excludedKeys = 
        (new Set(current.options.excluded))
          .union(new Set(this.#globallyExcludedKeys))
          .difference(new Set(current.options.required));

      return [...nestingKeys.difference(excludedKeys)];
    };

    const objKeys = current.obj == current.objForNesting
                      ? getAllPropertyNames(current.obj)
                      : Object.keys(current.objForNesting);
    let nestingKeys = getNestingKeys(objKeys);

    if( nestingKeys.length == 0 ) {
      this.#onNoNesting(current.obj, current.key, current.path);
      return;
    }

    const optsVersion = current.options.changeCount;
    const adjustedObj = this.#beforeNesting(current.objForNesting, current.key, current.path);

    if( adjustedObj != current.objForNesting )
      nestingKeys = getNestingKeys(Object.keys(adjustedObj));
    else if( optsVersion != current.options.changeCount )
      nestingKeys = getNestingKeys(objKeys);

    let aborted;
    if( current.options.nesting === false || nestingKeys.length == 0 ) {
      aborted = true;
      this.#onAbortNesting(adjustedObj, current.key, current.path, [], nestingKeys);
    }
    else {
      aborted = Array.isArray(adjustedObj)
                  ? this.#traverseNestedArray(adjustedObj, current.key, current.path, nestingKeys)
                  : this.#traverseNestedObject(adjustedObj, current.key, current.path, nestingKeys);
    }
    this.#afterNesting(adjustedObj, current.key, current.path, aborted);
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
      if( this.#abort > 0 ) {
        --this.#abort;
        this.#onAbortNesting(obj, key, path, nestingKeys.slice(0,i), nestingKeys.slice(i));
        return true;
      }
      const k = nestingKeys[i];
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