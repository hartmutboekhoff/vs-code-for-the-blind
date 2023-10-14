const {loadModules, loadJsonData} = require('./loader');
const {Categories, ModuleSelectors, ModuleSelectorMatch} = require('./selectors');

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
  #directories;
  #modules = [];
  #errors = [];
	#categories;
	#modCache = new Cache();
	#setCache = new Cache();

	constructor(name, directories, categories) {
		this.name = name;
		this.#directories = ( directories == undefined || directories.length == 0 )? [`./${name}`] : directories;

		this.#categories = new Categories(categories);
    this.#loadModules().then(()=>this.#status = 'ready');
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
    this.#modules.forEach(m=>m.$selectors = new ModuleSelectors(m, this.#categories));
    this.#errors = loaded.errors;
    console.log(this.#modules.length+' modules were successfully loaded.');
    if( this.#errors.length > 0 )
      console.warn('Some modules could not be loaded:', this.#errors);
	}

  #findAllMatches(selectorObj) {
  	const matches = [];
   	for( const m of this.#modules )
  	  matches.push(...m.$selectors.getMatches(selectorObj));

  	return matches;
  } 
  #findBestMatch(selectorObj) {
  	const matches =	this.#findAllMatches(selectorObj);

  	if( matches.length == 0 ) return undefined;
  	if( matches.length == 1 ) return matches[0].module;

  	matches.sort(ModuleSelectorMatch.compare);

  	// Ambiguities are OK, as long as ambiguous matches refer to the same module
  	for( let i = 1 ; i < matches.length ; i++ ) {
  		if( ModuleSelectorMatch.compare(matches[0], matches[i]) != 0 )
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
  #findMatchSet(selectorObj) {
    const matches = this.#findAllMatches(selectorObj);
    return [...new Set(matches.map(m=>m.module))];
  }  
  
	get(...selectors) {
	  if( this.#status != 'ready' ) 
	    throw 'Factory is not yet loaded!';
	    
		const selectorObj = new SearchSelector(this.#categories, ...selectors);
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
	  if( this.#status != 'ready' ) 
	    throw 'Factory is not yet loaded!';

		const selectorObj = new SearchSelector(this.#categories, ...selectors);
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
