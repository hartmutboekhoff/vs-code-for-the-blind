const {getAllPropertyNames, buildJsonPath} = require('./utility');

class Traversion {
  #maxDepth = Infinity;
  #includedKeys;
  #excludedKeys;
  #stack = [];
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
  get includedKeys() { return this.#includedKeys; }
  set includedKeys(v) { this.#includedKeys = Array.isArray(v)? v : undefined; }
  get excludedKeys() { return this.#excludedKeys; }
  set excludedKeys(v) { this.#excludedKeys = Array.isArray(v)? v : undefined; }
  
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
  
  set nestedElements(options) {
    switch( typeof option ) {
      case 'object':
        this.#nestingOptions = {
          nesting:true,
          include: options.include ?? [],
          exclude: options.exclude ?? [],
          require: options.required ?? [],
        };
        break;
      case 'boolean':
        this.#nestingOptions = {
          nesting: options,
          include: [],
          exclude: [],
          require: [],
        };
        break;
      default:
        this.#setDefaultNestingOptions();
    }          
  }
  #setDefaultNestingOptions() {
    this.#nestingOptions = {
      nesting: true,
      include: [],
      exclude: [],
      require: [],
    };
  }
  preventNesting(...keys) {
    if( keys.length == 0 )
      this.#nestingOptions = {
        nesting: false,
        include: [],
        exclude: [],
        require: [],
      };
    else
      this.#nestingOptions = {
        nesting: true,
        include: [],
        exclude: (keys.length == 1 && Array.isArray(keys[0])? keys[0] : keys).slice(),
        require: [],
      }
  }  
  
  #onValue(obj, key, path) {
    try {
      return this.onValue(obj, key, path, this.#stack.length-1);
    }
    catch(e) {
      console.debug('Exception user-code while traversing object-tree.', 'onValue', path, e)
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
    if( obj != undefined && this.#stack.includes(obj) ) {
      this.#onRecursion(obj, key, path);
    }
    else {
      this.#stack.push(obj);
      
      this.#setDefaultNestingOptions();
      
      const originalObj = obj;
      if( this.parentFirst )
        obj = this.#onValue(obj, key, path) ?? obj;

      if( this.#stack.length <= this.#maxDepth 
          && typeof obj == 'object' 
          && this.#nestingOptions.nesting != false ) {
        this.#traverseNested(obj, key, path, obj !== originalObj);
      }
      else {
        this.#onNoNesting(obj, key, path);
      }

      if( !this.parentFirst )
        this.#onValue(obj, key, path)
      
      this.#stack.pop();
    }
  }
  #traverseNested(obj, key, path, objIsReplaced) {
    function addUniqueKeys(unique, ...keylists) {
      for( const kl of keylists ) {
        if( kl == undefined ) continue;
        for( const k of kl )
          if( !unique.includes(k) )
            unique.push(k);
      }
      return unique;      
    }
    function subtractKeys(unique, subtract) {
      if( subtract == undefined ) return unique;
      for( const s of subtract ) {
        const ix = unique.indexOf(s);
        if( ix >= 0 )
          unique[ix] = undefined;
      }
      return unique.filter(k=>k != undefined);
    }
    const getNestingKeys=objKeys=>{
      const nestingKeys = addUniqueKeys(this.#nestingOptions.include.slice(), this.#nestingOptions.require, this.#includedKeys, objKeys);
      const excludedKeys = subtractKeys(addUniqueKeys(this.#nestingOptions.exclude, this.#excludedKeys), this.#nestingOptions.require);
      return subtractKeys(nestingKeys, excludedKeys);
    };
    
    let nestingKeys = getNestingKeys(objIsReplaced? Object.keys(obj) : getAllPropertyNames(obj));
    if( nestingKeys.length == 0 ) {
      this.#onNoNesting(obj, key, path);
      return;
    }

    const optionsBackup = this.#nestingOptions;
    const adjustedObj = this.#beforeNesting(obj, key, path);

    if( adjustedObj != obj )
      nestingKeys = getNestingKeys(Object.keys(adjustedObj));
    else if( this.#nestingOptions != optionsBackup )
      nestingKeys = getNestingKeys(objIsReplaced? Object.keys(adjustedObj) : getAllPropertyNames(adjustedObj));

    let aborted;
    if( this.#nestingOptions.nesting === false || nestingKeys.length == 0 ) {
      aborted = true;
      this.#onAbortNesting(obj, key, path, [], nestingKeys);
    }
    else {
      aborted = Array.isArray(adjustedObj)
                  ? this.#traverseNestedArray(adjustedObj, key, path, nestingKeys)
                  : this.#traverseNestedObject(adjustedObj, key, path, nestingKeys);
    }
    this.#afterNesting(adjustedObj, key, path, aborted);
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