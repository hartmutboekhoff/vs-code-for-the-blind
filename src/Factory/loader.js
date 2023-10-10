const vscode = require('vscode');
const fs = require('fs');

const RootDir = __dirname + '\\..';

class DynamicModule {
  #name;
  #directory;
  #relativeDirectory;
  #loaded;
  #module;
  #error;
  
  constructor(name,dir,relDir,loaded,moduleOrError) {
    this.#name = name;
    this.#directory = dir;
    this.#relativeDirectory = relDir;
    this.#loaded = loaded;
    if( loaded )
      this.#module = moduleOrError;
    else
      this.error = moduleOrError;
  }
  get name() { return this.#name; }
  get directory() { return this.#directory; }
  get relativeDirectory() { return this.#relativeDirectory; }
  get loaded() { return this.#loaded ; }
  get module() { return this.#module; }
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

async function loadRessourceFile(path) {
  
}

async function loadModule(path, name) {
	try {
		let filepath = buildPath(path, name);
		console.info(`Loading file ${filepath}.`);
		
		return require(filepath);		
	}
	catch(e) {
		console.error(e);
		throw e;
	}
}	

function verifyContribution(context, type, key) {
  const cmp = {
    commands: v=>v.command==key,
    customEditors: v=>v.viewType==key,
  }[type];
  
  return context.extension.packageJSON.contributes[type]?.find?.(cmp) != undefined;
}

async function loadModules(relativepath, extensions, recursive) {
  const basepath = buildPath(RootDir,relativepath);
  const pattern = buildExtensionRegExp()

  const filelist = collectFiles(basepath, pattern, recursive);
  const promises = filelist.map(async f=>{
    try {
      return new DynamicModule(f.name, f.directory, f.relativeDirectory, true, await loadModule(f.directory, f.name));
    }
    catch(e) {
      return new DynamicModule(f.name, f.directory, f.relativeDirectory, false, e);
    }
  });
  return Promise.allSettled(promises)
    .then(results=>{
      return results.reduce((acc,r)=>{
        if( r.status == 'rejected' )
          acc.errors.push(r.reason);
        else if( r.value.loaded == true )
          acc.loaded.push(r.value);
        else
          acc.errors.push(r.value);            
        return acc;
      },{errors:[],loaded:[]})
    });
}

async function loadCommands(context,rootDir,rootNS) {
  const commandModules = await loadModules(rootDir,'*.js',true);

  commandModules.loaded.forEach(m=>{
    const key = m.getKey(rootNS);

    if( !verifyContribution(context, 'commands', key) ) {
      console.warn(`Module "${m.relativePath}" does not match a registered command. Expected key: "${key}"`);
      return;
    }

    let f, msg;
    if( typeof m.module == 'function' ) {
      f = m.module;
      msg = 'module';
    }
    else if( typeof m.module.default == 'function' ) {
      f = m.module.default;
      msg = 'module.default';
    }
    else if( typeof m.module[m.plainName] == 'function' ) {
      f = m.module[m.plainName];
      msg = `module["${m.plainName}"]`;
    }
    else {
      console.error(`Could not find function for command "${key}" in module "${m.relativePath}".`);
      return;
    }

	  context.subscriptions.push(vscode.commands.registerCommand(key, f));
    console.log(`Registered command "${key}" from ${msg}`);
  });
}

async function loadCustomEditors(context, rootDir, rootNS) {
  function isClass(c) {
    return typeof c == 'function' && /^\s*class\s+/.test(c.toString());
  }

  const editorModules = await loadModules(rootDir,'*.js',false);
  editorModules.loaded.forEach(m=>{
    let key = m.getKey(rootNS);
    if( key.endsWith('Provider') )
      key = key.slice(0,-8);

    if( !verifyContribution(context, 'customEditors', key) ) {
      console.warn(`Module "${m.relativePath}" does not match a registered custom-editor. Expected key: "${key}"`);
      return;
    }

		let provider, msg;
		if( isClass(m.module) ) {
		  msg = 'module';
		  const cls = m.module;
		  provider = new cls(context);
		} 
		else if( isClass(m.module.default) ) {
		  msg = 'module.default';
		  const cls = m.module.default;
		  provider = new cls(context);
		}
		else if( isClass( m.module[m.plainName]) ) {
		  msg = `module["${m.plainName}"]`;
		  const cls = m.module[m.plainName];
		  provider = new cls(context);
		}
		else if( typeof m.module.getProvider == 'function' ) {
		  msg = 'module.getProvider()';
		  provider = m.module.getProvider(context);
		}
		else {
		  console.error(``)
		  return;
		}
console.log(provider);		
    context.subscriptions.push(vscode.window.registerCustomEditorProvider(key, provider));
    console.log(`Registered custom-editor "${key}" from ${msg}`);
  });
}

module.exports = {
  loadModules,
  loadCommands,
  loadCustomEditors
};

		


