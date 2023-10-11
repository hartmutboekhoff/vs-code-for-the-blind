const vscode = require('vscode');
const fs = require('fs');
const GenericCustomEditorProvider = require('./GenericCustomEditorProvider');

const RootDir = __dirname + '\\..';

const ModuleCache = {};

class ModuleWrapper {
  #name;
  #directory;
  #relativeDirectory;
  #loaded;
  #error;
  
  constructor(name,dir,relDir,loaded,moduleOrError) {
    this.#name = name;
    this.#directory = dir;
    this.#relativeDirectory = relDir;
    this.#loaded = loaded;
    if( !loaded )
      this.#error = moduleOrError;

    return new Proxy(loaded? moduleOrError : {}, this);
  }
	get(target,property,receiver) {
	  const fromWrapper = prop=>{
	    const value = this[prop];
	    return value instanceof Function
              ? (...args)=>value.apply(this,args)
              : value;
	  }
	  const fromTarget = prop=>{
	    const value = target[prop];
	    return value instanceof Function
	            ? (...args)=>value.apply(target,args)
	            : value;
	  }
	  
	  if( property.startsWith('$') ) {
	    if( property.slice(1) in this )
	      return fromWrapper(property.slice(1));
	    if( property in this )
	      return fromWrapper(property);
	  }
	  return fromTarget(property);
	}

  get name() { return this.#name; }
  get directory() { return this.#directory; }
  get relativeDirectory() { return this.#relativeDirectory; }
  get loaded() { return this.#loaded ; }
  get error() { return this.#error; }
  
  get extension() { return this.#name.split('.').slice(-1)[0]; }
  get plainName() { return this.#name.split('.').slice(0,-1).join('.'); }
  get path() { return buildPath(this.#directory, this.#name); }
  get relativePath() { return buildPath(this.#relativeDirectory, this.#name); }
  
  getKey(rootNS) {
    return [rootNS,
            ...this.relativeDirectory.split(/[\\\/]/), 
            this.plainName
           ].filter(p=>p!='').join('.');
  }
}

function buildPath(...parts) {
	const Separator = '\\';
	
	return parts.map(p=>p.split(/[\\\/]/))
						  .flat(Infinity)
						  .filter(p=>p!=undefined && p!='')
						  .reduce((acc,p)=>{
						  	 switch(p) {
						  	 	case '..':
						  	 		acc.pop();
						  	 	case '.':
						  	 		break;
						  	 	default:
						  	 		acc.push(p);
						  	 }
						  	 return acc;
						  },[])
						  .join(Separator);
}
function wildCardToRegExpPattern(wc) {
  return wc.replaceAll(/([\.\\\/(){}\[\]])/g,'\\$1')
           .replaceAll('?','.')
           .replaceAll('*','.*');
}
function buildExtensionRegExp(extensions) {
  if( Array.isArray(extensions) )
    return new RegExp('^('+extensions.map(e=>wildCardToRegExpPattern(e)).join(')|(')+')$');
  else if( typeof extensions == 'string' )
    return new RegExp('^'+wildCardToRegExpPattern(extensions)+'$');
  else if( typeof extensions == 'object' && extensions.constructor.name == 'RegExp' )
    return extensions;
  else
    return /.*/;
}

function collectFiles(basepath, pattern, recursive) {
  const subDirList = [''];
  const fileList = [];
  
  let dir, file;
  while( subDirList.length > 0 ) {
    const relative = subDirList.shift();
    const fullpath = buildPath(basepath, relative);
    try {
	    dir = fs.opendirSync(fullpath);		
	    while( null != (file = dir.readSync()) ) {
  			if( recursive && file.isDirectory() && !file.name.startsWith('.') )
  			  subDirList.push(buildPath(relative, file.name));
  			else if( file.isFile() && pattern.test(file.name) )
  			  fileList.push({
  			    name:file.name,
  			    //extension: file.name.split('.').slice(-1),
  			    directory: fullpath,
  			    relativeDirectory: relative,
  			  });
  	  }
  	}
  	catch(e) {
  	  console.error(e);
  	}
  	finally {
  	  if( dir != undefined ) {
  	    dir.closeSync();
  	    dir = undefined;
  	  }
  	}
  }
  return fileList;
} 

async function loadRessourceFile(relativepath, encoding='utf8') {
  const path = buildPath(RootDir,relativepath);
  return await fs.readFile(path, {encoding});
}

async function loadModule(path, name, relPath='') {
	try {
		let filepath = buildPath(path, name);
		console.info(`Loading file ${filepath}.`);
		
		let module = ModuleCache[filepath];
		if( module != undefined )
			return module;

		module = await require(filepath);
		console.log('original-module:',module);
		const wrapped = new ModuleWrapper(name, path, relPath, true, module);
		console.log('wrapped-module:',module);
		ModuleCache[filepath] = wrapped;
		return wrapped;
	}
	catch(e) {
		console.error(e);
		return ModuleWrapper(name, path, relPath, false, e);
	}
}	

function verifyContribution(context, type, key) {
  const cmp = {
    commands: v=>v.command==key,
    customEditors: v=>v.viewType==key,
  }[type];
  
  return context.extension.packageJSON.contributes[type]?.find?.(cmp) != undefined;
}
function getClassObject(module) {
  function isClass(c) {
    return typeof c == 'function' && /^\s*class\s+/.test(c.toString());
  }
  
	if( isClass(module) )
	  return { info: 'module', classObject: module };
	else if( isClass(module.default) )
	  return { info: 'module.default', classObject: module.default };
	else if( isClass( module[module.$plainName]) )
	  return { info: `module["${module.$plainName}"]`, classObject: module[module.$plainName] };
	else
	  return undefined;
}
function getFunction(module) {
  function isFunction(f) {
    return typeof f == 'function';
  }
console.log('getfunction module',module);
	if( isFunction(module) )
	  return { info: 'module', function: module };
	else if( isFunction(module.default) )
	  return { info: 'module.default', function: module.default };
	else if( isFunction( module[module.$plainName]) )
	  return { info: `module["${module.$plainName}"]`, function: module[module.$plainName] };
	else
	  return undefined;
}

async function loadModules(relativepath, extensions, recursive) {
  const basepath = buildPath(RootDir,relativepath);
  const pattern = buildExtensionRegExp()

  const filelist = collectFiles(basepath, pattern, recursive);
  const promises = filelist.map(f=>loadModule(f.directory, f.name, f.relativeDirectory));
  
  return Promise.allSettled(promises)
    .then(results=>{
      return results.reduce((acc,r)=>{
        if( r.status == 'rejected' )
          acc.errors.push(r.reason);
        else if( r.value.$loaded == true )
          acc.loaded.push(r.value);
        else
          acc.errors.push(r.value);            
        return acc;
      },{errors:[],loaded:[]})
    });
}

async function loadCommands(context,rootDir,rootNS) {
  const commandModules = await loadModules(rootDir,'*.js',true);

console.log('loading-errors',commandModules.errors);
  commandModules.loaded.forEach(m=>{
    const key = m.$getKey(rootNS);

    if( !verifyContribution(context, 'commands', key) ) {
      console.warn(`Module "${m.$relativePath}" does not match a registered command. Expected key: "${key}"`);
      return;
    }

    const func = getFunction(module);
    if( func == undefined ) {
      console.error(`Could not find function for command "${key}" in module "${m.$relativePath}".`);
      console.log(module);
      return;
    }

	  context.subscriptions.push(vscode.commands.registerCommand(key, func.function));
    console.log(`Registered command "${key}" from ${func.info}`);
  });
}

async function loadCustomEditors(context, rootDir, rootNS) {

  const editorModules = await loadModules(rootDir,'*.js',false);
  editorModules.loaded.forEach(m=>{
    let key = m.$getKey(rootNS);

    if( !verifyContribution(context, 'customEditors', key) ) {
      console.warn(`Module "${m.$relativePath}" does not match a registered custom-editor. Expected key: "${key}"`);
      return;
    }

		const cls = getClassObject(m);
		if( cls == undefined ) {
      console.error(`Could not find entry-point for custom-editor "${key}" in module "${m.$relativePath}".`);
		  return;
		  
		}

    const provider = new GenericCustomEditorProvider(context, cls.classObject);
    context.subscriptions.push(vscode.window.registerCustomEditorProvider(key, provider));
    console.log(`Registered custom-editor "${key}" from ${cls.info}`);
  });
}

module.exports = {
  loadModules,
  loadCommands,
  loadCustomEditors,
  loadRessourceFile,
};
