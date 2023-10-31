const {loadModules, loadJsonData} = require('./loader');
const {Categories, ModuleSelectors, ModuleMatch, SearchSelector} = require('./selectors');

const factoryDiagnostics = {};

class Cache {
	#cache = {};
	constructor() {	
	}
		
	put(key,data) {
		this.#cache[key] = {data}; // this way we can distinguish undefined keys from undefined values
	}
	get(key) {
		return this.#cache[key];
	}
	clear() {
		this.#cache = {};
	}
	
	getDiagnosticData() {
		let diagnostics = [];
		for( let k in this.#cache ) {
			diagnostics.push({
				key:k,
				match: this.#cache[k].data == undefined
				          ? '<none>' 
				          : !Array.isArray(this.#cache[k].data)
				          ? this.#cache[k].data.$plainName 
				          : '['+this.#cache[k].data.map(d=>d.$plainName).join()+']',
			});
		}
		return diagnostics;
	}
}

let logcounter = 10;

class Factory {
  #status = 'new';
  #directories;
  #modules = [];
  #errors = [];
	#categories;
	#interface;
	#modCache = new Cache();
	#setCache = new Cache();
	#diagnostics = {
	  getStatus: ()=>this.#status,
	  getErrors: ()=>this.#errors,
    getModuleInfos: ()=>this.#modules.map(m=>({
        name:m.$plainName,
        loaded: m.$loaded,
        path: m.$path,
        selectors: m.$selectors,
        error: m.$error,
      })),
	  getCategories: ()=>this.#categories,
	  getModuleCache: ()=>this.#modCache.getDiagnosticData(),
	  getSetCache: ()=>this.#setCache.getDiagnosticData(),
	}

	constructor(name, directories, categories, interfaceConfig) {
		this.name = name;
		this.#directories = ( directories == undefined || directories.length == 0 )? [`./${name}`] : directories;

		this.#categories = new Categories(categories);
		this.#interface = interfaceConfig;
    this.#loadModules().then(()=>this.#status = 'ready');
    
    factoryDiagnostics[this.name] = this.#diagnostics;
	}
	
	async #loadModules() {
	  this.#status = 'loading modules';
	  const loaded = await Promise.allSettled(this.#directories.map(d=>loadModules(d,'*.js',false)))
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
    this.#modules.forEach(m=>{
      m.$selectors = new ModuleSelectors(m, this.#categories);
      m.$interface = this.#createModuleInterface(m);
    });
    this.#errors = loaded.errors;
    console.log(this.#modules.length+' modules were successfully loaded.');
    if( this.#errors.length > 0 )
      console.warn('Some modules could not be loaded:', this.#errors);
	}
  #createModuleInterface(module) {
    if( this.#interface == undefined || this.#interface.length == 0 )
      return module;
    if( this.#interface.length == 1 && this.#interface[0].isDefault == true )
      return module[this.#interface[0].name];
    return this.#interface.reduce((acc,p)=>{
      acc[p.name] = module[p.name];
      if( p.isDefault == true )
        acc['default'] = module[p.name];
      return acc;
    },{});
  }

  #findAllMatches(selectorObj) {
  	const matches = [];
   	for( const m of this.#modules ) {
  	  matches.push(...m.$selectors.getMatches(selectorObj));
  	}
  	return matches;
  } 
  #findBestMatch(selectorObj) {
  	const matches =	this.#findAllMatches(selectorObj);

  	if( matches.length == 0 ) return undefined;
  	if( matches.length == 1 ) return matches[0].module;

  	matches.sort(ModuleMatch.compare);

  	// Ambiguities are OK, as long as ambiguous matches refer to the same module
  	for( let i = 1 ; i < matches.length ; i++ ) {
  		if( ModuleMatch.compare(matches[0], matches[i]) != 0 )
  			return matches[0].module; // this is the best match
  		if( matches[0].module != matches[i].getModle() ){
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

		if( cached != undefined ) return cached.data?.$interface;

		try {
			const matchedModule = this.#findBestMatch(selectorObj);
			if( matchedModule == undefined )
				console.warn(`Factory.${this.name}: no match found for selectors ${selectorObj.cacheKey}.`);
			//else
			//	console.debug(`Factory.${this.name}: match for selectors ${selectorObj.cacheKey} found module "${matchedModule.$name}"`);
				
			this.#modCache.put(selectorObj.cacheKey, matchedModule);
			return matchedModule?.$interface;
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

		if( cached != undefined ) return cached.data.map(m=>m.$interface);

    const matchedSet = this.#findMatchSet(selectorObj);
    this.#setCache.put(selectorObj.cacheKey, matchedSet);
    return matchedSet.map(m=>m.$interface);
	}
	
}

class FactoryLoader {
	#config; 
	#factories;
	
	constructor(configPath) {
	  console.log('Start loading factories.');
		this.#initialize(configPath ?? '../config/factory-config.json');
	}
	
	$getDiagnosticData=()=>{
	  const factories = {};
	  for( const fd in factoryDiagnostics ) {
	    const diag = factoryDiagnostics[fd];
	    factories[fd] = {
	      status: diag.getStatus(),
    	  errors: diag.getErrors(),
        modules: diag.getModuleInfos(),
    	  categories: diag.getCategories(),
    	  moduleCache: diag.getModuleCache(),
    	  setCache: diag.getSetCache(),
	    }
	  }
	  
	  return {
  	  config: this.#config,
  	  factories,
  	};
	}
	
	async #initialize(configPath) {
		this.#config = await loadJsonData(configPath);
		console.log('Factories loaded.');
		this.#factories = this.#config.factories
			.map(cfg=>new Factory(cfg.name, cfg.moduleDirectories, cfg.categories, cfg.interface))
			.forEach(f=>this[f.name]=f);
	}
	
}

module.exports = new FactoryLoader();
