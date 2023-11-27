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

class Factory {
  #status = 'new';
  #directories;
  #modules = [];
  #errors = [];
	#categories;
	#interfaceDef;
	#modCache = new Cache();
	#setCache = new Cache();
	#diagnostics = {
	  getStatus: ()=>this.#status,
	  getErrors: ()=>this.#errors.map(e=>{
  	    return e.$plainName == undefined? e : {
          name: e.$plainName,
          loaded: e.$loaded,
          path: e.$path,
          selectors: e.$selectors,
          error: e.$error,
  	    };
  	  }),
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
		this.#interfaceDef = interfaceConfig;
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

    this.#errors = loaded.errors;
    this.#modules = Array
      .from(new Set(loaded.modules))
      .map(m=>{
        try {
          m.$selectors = new ModuleSelectors(m, this.#categories);
          m.$interface = this.#createModuleInterface(m);
          return m;
        }
        catch(e) {
          m.$error = e;
          this.#errors.push(m);
          return undefined;
        }
      })
      .filter(m=>m!=undefined);
    
    console.log(`${this.name}-Factory: ${this.#modules.length} modules were successfully loaded.`);
    if( this.#errors.length > 0 )
     console.warn(`${this.name}-Factory: ${this.#errors.length} modules could not be loaded.`, this.#errors);
	}
  #createModuleInterface(module) {
    if( this.#interfaceDef == undefined || Object.keys(this.#interfaceDef).length == 0 )
      return module;

    const moduleInterface = {};
    for( const k in this.#interfaceDef ) {
      const def = this.#interfaceDef[k];
      const propValue = module[def.name??k];
      
      if( def.required == true && propValue == undefined )
        throw `Required property "${def.name??k}" does not exist in module "${module.$name}".`;

      switch( def.wrapper ) {
        case 'constructor-call':
          if( typeof propValue != 'function'
              || !/^(class[\s{]|function[\s(])/.test(propValue.toString()) )
            throw `Property "${def.name??k}" must be constructable in module "${module.$name}".`;
          moduleInterface[k] = (...args)=>new propValue(...args);
          break;

        case 'getter':
          Object.defineProperty(moduleInterface,k,{
            enumerable: true,
            get: ()=>propValue.split('.').reduce((acc,n)=>acc?.[n],module)
          })
          break;
                    
        case 'none':
        default:
          moduleInterface[k] = propValue;
      }
      if( def.isDefault )
        moduleInterface.default ??= moduleInterface[k];
    } 
    return Object.seal(moduleInterface);
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
