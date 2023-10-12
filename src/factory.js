const {loadModules, loadJsonData} = require('./loader');

function compareMatch(a,b) {
	for( let i = 0 ; i < a.match.length ; i++ ) {
		if( a.match[i] != b.match[i] ) 
			return b.match[i] - a.match[i];
	}
	return 0;
}

class Cache {
	#cache = {};
	constructor() {	
	}
		
	put(key,data) {
		this.#cache[key] = {data}; // this way we can distinguish undefined keys from undefined values
	};
	get(key) {
		return this.#cache[key];
	}
	clear() {
		this.#cache = {};
	}
/*	
	debugInfo() {
		let dbg = [];
		for( let k in this.#cache ) {
			dbg.push({
				key:k,
				module: this.#cache[k].data == undefined? 
				          '<none>' :
				          !Array.isArray(this.#cache[k].data)? 
				            this.#cache[k].data.name :
				            '['+this.#cache[k].data.map(d=>d.name).join()+']',
			});
		}
		return dbg;
	}
*/
}

class Category {
  #name; #priority; #required;
  
  constructor(name, prio, required=false) {
    this.#name = name;
    this.#priority = prio;
    this.#required = required || false;
  }
  get name() { return this.#name; }
  get priority() { return this.#priority; }
  get required() { return this.#required; }
}

class Selectors {
  #categories;
  #cachekey;
  
  constructor(categories, selectorArgs) {
    this.#categories = categories;
    
    let selectors;
  	if( selectorArgs.length == 0 )
  		throw 'Invalid selector \'undefined\'.';
  	else if( selectorArgs.length > 1 )
  		selectors = selectorArgs;
  	else if( Array.isArray(selectorArgs[0]) )
  		selectors = selectorArgs[0];
  	else if( typeof selectorArgs[0] == 'string' ) 
  		// selector is just one single string
  		selectors = [selectorArgs[0]];
  	else if( typeof selectorArgs[0] == 'object' ) {
  	  for( const c of categories )
  	    this[c.name] = selectorArgs[0][c.name];
  	  return;
  	}
  	else 
  		throw 'Invalid selector of type \'' + typeof selector + '\'.';
  
    if( selectors.length > categories.length )
      throw 'Number of selectors must not be greater than number of categories';

    for( let i = 0 ; i < categories.length ; i++ )
      this[categories[i].name] = selectors[i];
  }
  
  get(ix) {
    return Number.isNaN(+ix)? this[ix] : this[this.#categories[+ix]?.name];
  }
  
  get cacheKey() {
    if( this.#cachekey == undefined )
    	this.#cachekey = this.#categories.reduce((acc,c)=>{
    		let v = this[c.name] != undefined
    		          ? '"'+this[c.name].replace('\\','\\\\').replace('"','\\"')+'"'
    		          : '<NULL>';
    		return `${acc}[@${c.name}:${v}]`;
    	});
  	return this.#cachekey;
  }     
}

/*
class AsyncStatus {
	#obj; 
	#promise; #status;
	#waitpromise; #waitresolve; #waitreject;
	
	constructor(obj) {
		this.#obj = obj;
	}
	get status() {
		if( this.#status != undefined ) return this.#status;
		if( this.#promise == undefined ) return 'new';

		const temp = {};
		return Promise.race([this.#promise,Promise.resolve(temp)])
			.then(r=>r===temp?'pending':this.#status='fullfilled')
			.catch(r=>this.#status='rejected');
	}
	get #wait() {
		return this.#waitpromise ??= new Promise((resolve,reject)=>{
			this.#waitresolve = resolve;
			this.#waitreject = reject;
		});
	}
	get promise() {
		return this.#promise;
	}
	set promise(value) {
		if( this.#promise == undefined ) {
			this.#promise = value;
			this.#promise.then(()=>this.#waitresolve())
			this.#promise.catch(e=>this.#waitreject(e));
		}
	}

	resolve() {
		if( this.promise == undefined )
			this.promise = Promise.resolve();
	}
	reject(reason) {
		if( this.promise == undefined )
			this.promise = Promise.reject(reason);
	}
	onFinish(callback) {
		if( this.promise != undefined ) {
			this.promise.then(()=>callback(this.#obj));
			this.promise.catch(e=>callback(this.#obj,e));
		}
		else {
			this.#wait.then(()=>callback(this.#obj));
			this.#wait.catch(e=>callback(this.#obj,e));
		}
	}
	onSuccess(callback) {
		if( this.promise != undefined ) {
			this.promise.then(()=>callback(this.#obj));
		}
		else {
			this.#wait.then(()=>callback(this.#obj));
		}
	}
	onError(callback) {
		if( this.promise != undefined ) {
			this.promise.catch(e=>callback(this.#obj,e));
		}
		else {
			this.#wait.catch(e=>callback(this.#obj,e));
		}
	}
}
*/

class Factory {
  #status = 'new';
  
  #modules = [];
  #errors = [];
	#categories;
	#modCache = new Cache();
	#setCache = new Cache();

	constructor(name, directories, categories) {
		this.name = name;
		this.directories = ( directories == undefined || directories.length == 0 )? [`./${name}`] : directories;

    this.#loadModules().then(()=>this.#status = 'ready');
		this.#initCategories(categories);
	}
	async #loadModules() {
	  this.#status = 'loading modules';
	  const loaded = await Promise.allSettled(this.directories.map(d=>loadModules(d,'*.js',false)))
	    .then(results=>{
	      return results.reduce((acc,r)=>{
	        if( r.status=='fulfilled' ) {
	          acc.modules.push(...r.value.loaded);
	          acc.errors.push(...r.value.errors);
	        }
	        else {
	          acc.errors.push(r);
	        }
	        return acc;
	      },{errors:[],modules:[]});
	    });
    this.#modules = Array.from(new Set(loaded.modules));
    this.#errors = loaded.errors;
    console.log(this.#modules.length+' modules were successfully loaded.');
    if( this.#errors.length > 0 )
      console.warn('Some modules could not be loaded:', this.#errors);
	}
  #initCategories(categories) {
  	let prio = 0;
  	this.#categories = categories.map(c=>{
  		prio = c.priority ?? prio + 1;
  		return new Category(c.name, prio, c.required);
  	});
  	
  	// do not change original category-order!
  	const sorted = [...this.#categories].sort((a,b)=>a.priority - b.priority);
  	sorted[0].prioIndex = 0;
  	for( let i = 1 ; i < sorted.length ; i++ ) {
  	  sorted[i].prioIndex = sorted[i].priority != sorted[i-1].priority
  	      ? sorted[i-1].prioIndex + 1
  			  : sorted[i-1].prioIndex;
  	}
  }

  #matchSelectors(moduleSelectors, selectors) {
  	const match = Array(this.#categories.length).fill(0);
  	for( const c of this.#categories ) {
  		const modSel = moduleSelectors[c.name];
  		const sel = selectors[c.name];

  		if( modSel == undefined && sel == undefined )
  			++match[c.prioIndex];
  		else if( modSel == undefined || sel == undefined )
  			; // do nothing
  		else if ( sel == modSel ) 
  			++match[c.prioIndex];
  	  else if( Array.isArray(sel) 
  	           && modSel.constructor.name == 'RegExp' 
  	           && sel.reduce((acc,s)=>acc||modSel.test(s),false) )
  	    ++match[c.prioIndex];
  	  else if( Array.isArray(sel) 
  	           && sel.reduce((acc,s)=>acc||s==modSel,false) )
  	    ++match[c.prioIndex];
  		else if ( modSel.constructor.name == 'RegExp' && modSel.test(sel) )
  			++match[c.prioIndex];
  		else
  			return undefined; // not a match
  	}
  	return match;
  }
  #findModuleMatches(module, selectors) {
  	const matches = [];
  	for( const modSel of module.selectors ) {
  		const match = this.#matchSelectors(modSel, selectors);
  		if( match != undefined )
  			matches.push({module, match});
  	}
  	return matches;
  }  
  #findAllMatches(selectors) {
  	const matches = [];
   	for( const m of this.#modules )
   		if( Array.isArray(m.selectors) )
  			matches.push(...this.#findModuleMatches(m, selectors));

  	return matches;
  } 
  #findBestMatch(selectors) {
  	const matches =	this.#findAllMatches(selectors);

  	if( matches.length == 0 ) return undefined;
  	if( matches.length == 1 ) return matches[0].module;

  	matches.sort(compareMatch);

  	// Ambiguities are OK, as long as ambiguous matches refer to the same module
  	for( let i = 1 ; i < matches.length ; i++ ) {
  		if( compareMatch(matches[0], matches[i]) != 0 )
  			return matches[0].module; // this is the best match
  		if( matches[0].module != matches[i].modle ){
  			console.log(0,i,matches[0].module, matches[i].module);
  			console.log(matches[0].module === matches[i].module);
  			console.log(matches[0].module == matches[i].module);
  			throw 'Ambiguous modules';			
  		}
  	}
  	// all matches refer to the same module
  	return matches[0].module;
  }  
  #findMatchSet(sselectors) {
    const matches = this.#findAllMatches(sselectors);
    return [...new Set(matches.map(m=>m.module))];
  }  
  
	get(...selectors) {
	  if( this.#status != 'ready' ) 
	    throw 'Factory is not yet loaded!';
	    
		const selectorObj = new Selectors(this.#categories, selectors);
		const cached = this.#modCache.get(selectorObj.cacheKey);

		if( cached != undefined ) return cached.data;

		try {
			const matchedModule = this.#findBestMatch(selectorObj);
			if( matchedModule == undefined )
				console.warn(`Factory.${this.name}: no match found for selectors ${selectorObj.cacheKey}.`);
			else
				console.debug(`Factory.${this.name}: match for selectors ${selectorObj.cacheKey} found module "${matchedModule.name}"`);
				
			this.#modCache.put(selectorObj.cacheKey, matchedModule);

			return matchedModule;
		}
		catch(e) {
			if( e == 'Ambiguous modules' )
				throw `Ambiguous modules for selector ${selectorObj.cacheKey} in Factory.${this.name}`;
			throw e;		
		}
	} 
	getAll(...selectors) {
		const selectorObj = new Selectors(this.#categories, selectors);
		const cached = this.#setCache.get(selectorObj.cacheKey);

		if( cached != undefined ) return cached.data;

    const matchedSet = this.#findMatchSet(selectorObj);
    this.#setCache.put(selectorObj.cacheKey, matchedSet);
    return matchedSet;
	}
	
}

class FactoryLoader {
	#config; #factories;
	
	constructor(configPath) {
		this.#initialize(configPath ?? '../config/factory-config.json');
	}
	async #initialize(configPath) {
		this.#config = await loadJsonData(configPath);
		this.#factories = this.#config.factories
			.map(({name,moduleDirectories,categories})=>new Factory(name,moduleDirectories,categories))
			.reduce((acc,f)=>(acc[f.name]=f, acc), this);
	}
}

module.exports = new FactoryLoader();
