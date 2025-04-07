// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
//import * as vscode from 'vscode';
const vscode = require('vscode');
const {loadModules, loadCommands, loadCustomEditors} = require('./loader');
// start loading factories since loading is asynchronous
const notUsedHere = require('./factory'); 


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	//console.log(context);
//	console.log(__filename);
	//console.log(await loadModules('','*.js',true));

  loadCommands(context, 'commands', 'VsCodeForTheBlind');
  loadCustomEditors(context, 'custom-editors', 'VsCodeForTheBlind');
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
};
