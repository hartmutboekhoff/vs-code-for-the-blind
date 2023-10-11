// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
//import * as vscode from 'vscode';
const vscode = require('vscode');
const {loadModules, loadCommands, loadCustomEditors} = require('./Factory/loader.js');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	console.log('Congratulations, your extension "spark-siteconfig-vscode-plugin" is now active!');
	console.log(context);
//	console.log(__filename);
	//console.log(await loadModules('','*.js',true));

  loadCommands(context, 'commands', 'SparkSiteConfig');
  loadCustomEditors(context, 'custom-editors', 'SparkSiteConfig');
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
};

/////////////////////////////////

  (function() {
  class ModuleWrapper {
    
    constructor(moduleOrError) {
      return new Proxy(moduleOrError, this);
    }
    
  	get(target,property,receiver) {
  	  console.log('getter', this,target,property,receiver);
  	
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

    get name() { return 'name'; }

  }

  function abc(...args) {
    console.log('ABC', ...args);
  }

  const def = new ModuleWrapper(abc);

  abc(1,2,6);
  def(1,2,7);

  abc.$name = 'original'
  console.log(abc,abc.$name);
  console.log(def,def.$name);

  })();
