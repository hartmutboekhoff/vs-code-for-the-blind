const vscode = require('vscode');
const {loadModules, loadCommands, loadCustomEditors} = require('./loader');

class ExtensionApiFacade {
  addEventListener(type, listener, options) {
    Object.getOwnPropertyNames(this).forEach(n=>{
      if( this[n] instanceof EventTarget )
        this[n].addEventListener(type, listener, options);
    });
  }
  removeEventHandler(type, listener, options) {
    Object.getOwnPropertyNames(this).forEach(n=>{
      if( this[n] instanceof EventTarget )
        this[n].removeEventListener(type, listener, options);
    });
    
  }
}

const apiInstance = new ExtensionApiFacade();

function appendModuleAPIs(exposedAPIs) {
  for( const k in exposedAPIs ) {
    if( k in apiInstance )
      console.error('Module-API collision. Cannot add exposed API for Module '+k+'. A module API with the same name allready exists.');
    else
      apiInstance[k] = exposedAPIs[k];
  }
}


/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
  appendModuleAPIs(await loadCommands(context, 'commands', 'VsCodeForTheBlind'));
  appendModuleAPIs(await loadCustomEditors(context, 'custom-editors', 'VsCodeForTheBlind'));
  
  return apiInstance;
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
};
